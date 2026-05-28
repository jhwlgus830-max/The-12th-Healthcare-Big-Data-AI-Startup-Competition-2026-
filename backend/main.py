import sys
import os
import json
import uuid
import numpy as np
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 'data' 폴더를 sys.path에 추가하여 기존 모델 및 페르소나 로터 모듈 로드
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), "data"))

from model import load_model, get_depression_score, get_chatbot_response
from persona_router import route_persona
from database import supabase

# HuggingFace 임베딩 초기화 (Chroma/FAISS RAG 호환 및 배포 메모리 절약 우회)
embedding_model = None

try:
    from langchain_community.embeddings import HuggingFaceEmbeddings
    # saved_models나 transformers가 존재하고 메모리가 충분하면 ko-sroberta 로드
    if os.path.exists(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "saved_models", "KLUBERT_Dataset2")):
        embedding_model = HuggingFaceEmbeddings(
            model_name="jhgan/ko-sroberta-multitask",
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
        print("[DB Server] ko-sroberta-multitask HuggingFace embedding model loaded successfully!")
except Exception as e_embed:
    print(f"[DB Server Warning] Failed to load heavy HuggingFaceEmbeddings: {e_embed}. Activating Lite Mock Embedding Mode...")

class LiteMockEmbeddingModel:
    def embed_query(self, text: str) -> List[float]:
        # Supabase vector(768)와의 하위 호환성을 보장하기 위해 768차원 더미/정적 임시 벡터 생성 (메모리 0MB 사용)
        import random
        random.seed(len(text))
        return [random.uniform(-0.1, 0.1) for _ in range(768)]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self.embed_query(t) for t in texts]

if embedding_model is None:
    embedding_model = LiteMockEmbeddingModel()


app = FastAPI(title="마음 온도계 AI Backend", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://the-12th-healthcare-big-data-ai-sta.vercel.app",
    ],
    allow_origin_regex="https://.*\\.vercel\\.app",  # 모든 Vercel 배포 및 프리뷰 주소 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 글로벌 AI 모델 인스턴스 캐싱
electra_model = None
tokenizer = None
inv_map = None
run_cfg = None
device = None

@app.on_event("startup")
def startup_event():
    global electra_model, tokenizer, inv_map, run_cfg, device
    print("[AI Server] KLUE-BERT model loading...")
    
    # 루트 디렉토리 및 모델 절대 경로 산출
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_dir = os.path.join(root_dir, "saved_models", "KLUBERT_Dataset2")
    
    try:
        # saved_models/KLUBERT_Dataset2 로드
        electra_model, tokenizer, inv_map, run_cfg, device = load_model(model_dir)
        print(f"[AI Server] Model loaded successfully from: {model_dir}")
    except Exception as e:
        print(f"[AI Server] Model load failed at {model_dir}: {e}")
        # 예비 경로 로드 시도
        try:
            fallback_dir = os.path.join(root_dir, "data", "saved_models", "KLUBERT_Dataset2")
            electra_model, tokenizer, inv_map, run_cfg, device = load_model(fallback_dir)
            print(f"[AI Server] Model loaded from fallback path: {fallback_dir}")
        except Exception as ex:
            print(f"[AI Server] Fallback path load failed: {ex}")

# API 스키마 정의
class ChatSendRequest(BaseModel):
    session_id: Optional[str] = None
    user_id: Optional[str] = "anonymous_user"
    content: str
    initial_persona: Optional[int] = 1
    phq9_score: Optional[int] = 0
    phq9_answers: Optional[List[int]] = None
    p4_answers: Optional[List[str]] = None

class MessageResponse(BaseModel):
    role: str
    content: str
    icon: Optional[str] = None
    emotion: Optional[str] = None
    risk_score: float
    is_high_risk: bool

class ChatSendResponse(BaseModel):
    session_id: str
    persona: str
    persona_id: int
    user_message: MessageResponse
    bot_message: MessageResponse

def cosine_similarity(v1, v2):
    v1 = np.array(v1)
    v2 = np.array(v2)
    dot_product = np.dot(v1, v2)
    norm_a = np.linalg.norm(v1)
    norm_b = np.linalg.norm(v2)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)

@app.post("/api/chat/send", response_model=ChatSendResponse)
async def send_chat(request: ChatSendRequest, background_tasks: BackgroundTasks):
    global electra_model, tokenizer, inv_map, run_cfg, device
    
    # Lite Mode 혹은 Full Mode 상관없이 inv_map만 준비되어 있으면 구동 가능합니다 (OOM 방지용 Lite Mode 대응)
    if inv_map is None:
        raise HTTPException(status_code=500, detail="감정 분석 맵 정보가 로드되지 않았습니다.")
        
    session_id = request.session_id
    user_id = request.user_id
    content = request.content
    
    # 1. 세션 생성 또는 조회
    if not session_id:
        new_session = supabase.table("chat_sessions").insert({
            "user_id": user_id,
            "initial_persona": request.initial_persona,
            "status": "active"
        }).execute()
        if not new_session.data:
            raise HTTPException(status_code=500, detail="새 세션을 생성하지 못했습니다.")
        session_id = new_session.data[0]["id"]
        
    # 2. 감정/우울 점수 분석 (KLUE-BERT)
    analysis = get_depression_score(
        text=content,
        model=electra_model,
        tokenizer=tokenizer,
        device=device,
        inv_map=inv_map,
        max_len=run_cfg.get("max_len", 64),
        threshold=run_cfg.get("multi_threshold", 3.0),
    )
    
    prob = float(analysis["prob"])  # 0.0 ~ 1.0 (감정 모델이 계산한 일상 확률의 보수)
    top_emotion = analysis["top3"][0][0] if analysis["top3"] else "일상"
    
    # 20가지 감정 softmax 확률 및 logits 전체와 logit > 3.0인 감정들을 확률과 함께 DB에 저장하도록 JSON화
    emotion_detail = {
        "primary": top_emotion,
        "detected": analysis.get("multi", []),
        "prob": prob,
        "top3": analysis["top3"],
        "all_emotions": analysis.get("detected_emotions", []),
        "probs": analysis.get("probs", []),
        "logits": analysis.get("logits", [])
    }
    emotion_value = json.dumps(emotion_detail, ensure_ascii=False)
    
    # 3. 실시간 페르소나 라우팅 로직 연동
    phq9_score = request.phq9_score or 0
    p4_answers = request.p4_answers or []
    
    p4_answers_dict = {}
    if len(p4_answers) >= 4:
        p4_answers_dict = {
            "q1": p4_answers[0],
            "q2": p4_answers[1],
            "q3": p4_answers[2],
            "q4": p4_answers[3]
        }
        
    routed_persona_name = route_persona(phq9_score, p4_answers_dict)
    
    # persona_id 매핑 (프론트엔드 호환용: 1우울빼미, 2지우, 3구조봇, 4멘토, 5우활동)
    persona_map = {
        "🦉 우울빼미": 1,
        "🧑‍⚕️ 상담사 지우": 2,
        "🤖 구조봇": 3,
        "🧑‍⚕️ 우사고": 4,
        "🏃 우활동": 5
    }
    persona_id = persona_map.get(routed_persona_name, 1)
    
    # 경도 자율 선택 구간 (5~9점) 적용
    is_p4_high_risk = False
    if len(p4_answers) >= 4:
        if (p4_answers[0] == "있음" or 
            p4_answers[1] == "있음" or 
            p4_answers[2] in ["약간 그렇다", "매우 그렇다"] or 
            p4_answers[3] == "없음"):
            is_p4_high_risk = True

    # 실시간 입력 메시지 내 고위험 시그널 감지 (초기 설문 점수 외에 대화 중 위기 대처)
    is_realtime_high_risk = False
    if "자살충동" in analysis.get("multi", []):
        is_realtime_high_risk = True
        
    # [RAG 한국형 표준자살예방 생명지킴이 가이드라인 자살 암시 경고신호 기반 탐지 키워드]
    # - 언어적/행동적 고위험 위해/절망/신변정리 직접 감지
    crisis_keywords = [
        "손목", "그어버", "칼로", "뛰어내", "투신", "동반자살", "번개탄", "수면제", "자해",
        "사라지고싶", "없어지고싶", "다끝내고싶", "차라리죽", "죽는게낫", "죽고싶", 
        "세상하직", "마지막인사", "신변정리", "물건정리", "모두끝내", "쓸모가없", "내가다망쳤"
    ]
    normalized_content = content.replace(" ", "")
    if any(ckw in normalized_content for ckw in crisis_keywords):
        is_realtime_high_risk = True

    # 최종 위험 분류 기준 (설문 점수 고위험군 또는 실시간 입력 메시지 고위험 감지 시 구조봇 배정)
    if phq9_score >= 20 or is_p4_high_risk or is_realtime_high_risk:
        persona_id = 3
        routed_persona_name = "🤖 구조봇"
        analysis["phq9_score"] = phq9_score
        analysis["is_p4_high_risk"] = is_p4_high_risk
    else:
        # 비위기 상황일 때는 사용자가 프론트엔드에서 수동 선택한 페르소나(initial_persona)를 최우선으로 일관되게 보장!
        if request.initial_persona in [1, 2, 3, 4, 5]:
            persona_id = request.initial_persona
            rev_persona_map = {
                1: "🦉 우울빼미",
                2: "🧑‍⚕️ 상담사 지우",
                3: "🤖 구조봇",
                4: "🧑‍⚕️ 우사고",
                5: "🏃 우활동"
            }
            routed_persona_name = rev_persona_map[persona_id]
        else:
            # 수동 선택이 없거나 유효하지 않은 경우에만 설문 점수 기반 동적 라우팅 수행
            if phq9_score >= 10:
                persona_id = 2
                routed_persona_name = "🧑‍⚕️ 상담사 지우"
            elif phq9_score >= 5:
                persona_id = 1
                routed_persona_name = "🦉 우울빼미"
            else:
                persona_id = 1
                routed_persona_name = "🦉 우울빼미"
        
    is_high_risk_flag = (persona_id == 3)  # 구조봇 배정 시 고위험 플래그 True
        
    # 4. 이전 대화 기록 로드 (Supabase) - 대화 맥락용
    history_res = supabase.table("messages")\
        .select("role", "content")\
        .eq("session_id", session_id)\
        .order("created_at", desc=False)\
        .limit(10)\
        .execute()
        
    conversation_history = []
    if history_res.data:
        for msg in history_res.data:
            role = "user" if msg["role"] == "user" else "assistant"
            conversation_history.append({"role": role, "content": msg["content"]})
            
    # 5. 초개인화 상담 메모리(Dual Retriever): user_id의 과거 대화 유사도 검색
    past_memories = ""
    try:
        memories_res = supabase.table("memory_vectors").select("*").execute()
        user_memories = []
        if memories_res.data:
            for r in memories_res.data:
                meta = r.get("metadata", {})
                if isinstance(meta, str):
                    try:
                        meta = json.loads(meta)
                    except:
                        meta = {}
                if meta.get("user_id") == user_id:
                    user_memories.append(r)
                    
        if user_memories:
            query_vector = embedding_model.embed_query(content)
            scored_memories = []
            for m in user_memories:
                emb = m.get("embedding")
                if isinstance(emb, str):
                    try:
                        emb = json.loads(emb)
                    except:
                        continue
                if emb and len(emb) == len(query_vector):
                    score_val = cosine_similarity(query_vector, emb)
                    if score_val >= 0.35:  # 유사도 0.35 이상만 매칭
                        scored_memories.append((score_val, m.get("content", "")))
            
            scored_memories.sort(key=lambda x: x[0], reverse=True)
            top_memories = scored_memories[:3]
            pm_list = []
            for s, txt in top_memories:
                if txt.strip() and txt.strip() not in pm_list:
                    pm_list.append(f"- \"{txt.strip()}\" (유사도: {s:.2f})")
            if pm_list:
                past_memories = "\n".join(pm_list)
                print(f"[Dual Retriever] {len(pm_list)}개의 과거 대화 기억을 주입합니다. (User: {user_id})")
    except Exception as me_err:
        print(f"[Dual Retriever Error] 과거 기억 로드 실패: {me_err}")
            
    # 6. GPT-4o mini 공감형 챗봇 응답 생성
    wooulppaemi_prompt_text = "당신은 따뜻하고 귀여운 위로를 건네는 '우울빼미'입니다. 반말을 사용하며 아주 친근하고 다정하게 대답해 주세요."
    try:
      wooulppaemi_path = os.path.join(os.path.dirname(__file__), "..", "persona_prompt", "wooulppaemi_prompt_fixed.txt")
      if os.path.exists(wooulppaemi_path):
        with open(wooulppaemi_path, "r", encoding="utf-8") as pf:
          wooulppaemi_prompt_text = pf.read().strip()
    except Exception as pf_err:
      print(f"[Persona Prompt Loader Warning] 우울빼미 프롬프트 파일 로드 실패: {pf_err}")

    mentor_prompt_text = "당신은 현명하고 따뜻하게 인지 왜곡을 짚어주는 '우사고'입니다. 생각을 전환할 수 있는 소크라테스식 질문을 던져주세요."
    try:
      mentor_path = os.path.join(os.path.dirname(__file__), "..", "persona_prompt", "woosago_prompt_fixed.txt")
      if os.path.exists(mentor_path):
        with open(mentor_path, "r", encoding="utf-8") as pf:
          mentor_prompt_text = pf.read().strip()
    except Exception as pf_err:
      print(f"[Persona Prompt Loader Warning] 우사고 프롬프트 파일 로드 실패: {pf_err}")

    woohwaldong_prompt_text = "당신은 무기력을 돕는 행동 활성화 친구 '우활동'입니다. 아주 구체적이고 부담 없는 아주 작은 첫 행동을 제안해 주세요."
    try:
      woohwaldong_path = os.path.join(os.path.dirname(__file__), "..", "persona_prompt", "woohwaldong_prompt_fixed.txt")
      if os.path.exists(woohwaldong_path):
        with open(woohwaldong_path, "r", encoding="utf-8") as pf:
          woohwaldong_prompt_text = pf.read().strip()
    except Exception as pf_err:
      print(f"[Persona Prompt Loader Warning] 우활동 프롬프트 파일 로드 실패: {pf_err}")

    gujobot_prompt_text = "당신은 위기 극복 안전 가이드 '구조봇'입니다. 침착하고 안전한 대응을 돕기 위해 차분하게 위기상담 전화를 권장해 주세요."
    try:
      gujobot_path = os.path.join(os.path.dirname(__file__), "..", "persona_prompt", "gujobot_prompt_fixed.txt")
      if os.path.exists(gujobot_path):
        with open(gujobot_path, "r", encoding="utf-8") as pf:
          gujobot_prompt_text = pf.read().strip()
    except Exception as pf_err:
      print(f"[Persona Prompt Loader Warning] 구조봇 프롬프트 파일 로드 실패: {pf_err}")

    persona_prompts = {
      1: wooulppaemi_prompt_text,
        2: "당신은 10년 차 경력의 따뜻하고 전문적인 심리 상담사 '지우'입니다. 경청과 긍정적 존중을 담아 정중한 어조로 조언해 주세요.",
        3: gujobot_prompt_text,
        4: mentor_prompt_text,
        5: woohwaldong_prompt_text
    }
    
    # ── [로그인한 사용자의 거주지(region), 성별(gender), 연령대(age_group) 조회] ──
    region = "서울"
    gender = "선택 안함"
    age_group = "20대"
    try:
        survey_res = supabase.table("surveys").select("region", "gender", "age_group").eq("user_id", user_id).order("created_at", desc=True).limit(1).execute()
        if survey_res.data:
            latest = survey_res.data[0]
            if latest.get("region"):
                region = latest["region"]
            if latest.get("gender"):
                gender = latest["gender"]
            if latest.get("age_group"):
                age_group = latest["age_group"]
        else:
            users = load_local_users()
            if user_id in users:
                u = users[user_id]
                if u.get("region"):
                    region = u["region"]
                if u.get("gender"):
                    gender = u["gender"]
                if u.get("age_group"):
                    age_group = u["age_group"]
    except Exception as reg_err:
        print(f"[Backend Chat Error] Failed to resolve user profile for chat. Error: {reg_err}")

    print(f"[DEBUG MAIN] Calling get_chatbot_response with persona_id={persona_id}, region={region}, gender={gender}, age_group={age_group}")
    try:
        bot_reply = get_chatbot_response(
            user_text=content,
            analysis=analysis,
            conversation_history=conversation_history,
            persona_system=persona_prompts.get(persona_id, ""),
            persona_id=persona_id,
            past_memories=past_memories,
            region=region,
            gender=gender,
            age_group=age_group
        )
    except Exception as e:
        bot_reply = f"감정을 깊이 있게 이해하는 도중 잠시 지연이 발생했어요. 조금만 천천히 이야기해 주시겠어요? (오류: {e})"
        
    # 7. 사용자 메시지 DB 저장 (Supabase)
    user_msg = supabase.table("messages").insert({
        "session_id": session_id,
        "role": "user",
        "content": content,
        "icon": "👤",
        "emotion": emotion_value,
        "risk_score": prob,
        "is_high_risk": is_high_risk_flag
    }).execute()
    
    user_msg_data = user_msg.data[0]
    
    # 8. 봇 메시지 DB 저장 (Supabase)
    bot_icon = "🦉" if persona_id == 1 else "👩" if persona_id == 2 else "🚨" if persona_id == 3 else "🎓" if persona_id == 4 else "🏃"
    bot_msg = supabase.table("messages").insert({
        "session_id": session_id,
        "role": "assistant",
        "content": bot_reply,
        "icon": bot_icon,
        "emotion": emotion_value,
        "risk_score": prob,
        "is_high_risk": is_high_risk_flag
    }).execute()
    
    bot_msg_data = bot_msg.data[0]
    
    # 9. RAG용 벡터 임베딩 생성 및 Supabase 인덱싱
    try:
        vector_data = embedding_model.embed_query(content)
        supabase.table("memory_vectors").insert({
            "message_id": user_msg_data["id"],
            "session_id": session_id,
            "content": content,
            "embedding": vector_data,
            "metadata": {
                "user_id": user_id,
                "emotion": top_emotion,
                "risk_score": prob,
                "date": user_msg_data["created_at"]
            }
        }).execute()
        print("[AI Server] Vector indexing complete!")
    except Exception as ve:
        print(f"[AI Server] Vector indexing failed: {ve}")
        
    # 10. 실시간 6단계 안전계획 AI 추출 및 업데이트 등록 (구조봇 3번 세션인 경우)
    if persona_id == 3:
        try:
            background_tasks.add_task(
                extract_and_update_safety_plan,
                user_id,
                conversation_history + [
                    {"role": "user", "content": content},
                    {"role": "assistant", "content": bot_reply}
                ]
            )
        except Exception as e_task:
            print(f"[AI Safety Plan Task Register Warning] {e_task}")

    # 11. 응답 구성
    return ChatSendResponse(
        session_id=session_id,
        persona=routed_persona_name,
        persona_id=persona_id,
        user_message=MessageResponse(
            role="user",
            content=content,
            icon="👤",
            emotion=top_emotion,
            risk_score=prob,
            is_high_risk=is_high_risk_flag
        ),
        bot_message=MessageResponse(
            role="assistant",
            content=bot_reply,
            icon=bot_icon,
            emotion=top_emotion,
            risk_score=prob,
            is_high_risk=is_high_risk_flag
        )
    )

@app.get("/api/chat/history/{session_id}", response_model=List[MessageResponse])
async def get_history(session_id: str):
    res = supabase.table("messages")\
        .select("role", "content", "icon", "emotion", "risk_score", "is_high_risk")\
        .eq("session_id", session_id)\
        .order("created_at", desc=False)\
        .execute()
        
    if not res.data:
        return []
        
    return [
        MessageResponse(
            role=item["role"],
            content=item["content"],
            icon=item.get("icon"),
            emotion=item.get("emotion"),
            risk_score=float(item.get("risk_score", 0)),
            is_high_risk=item.get("is_high_risk", False)
        ) for item in res.data
    ]

# ──────────────────────────────────────────────────
# 5. 신규 API 엔드포인트: 일기 및 설문 기록 데이터 영구 저장
# ──────────────────────────────────────────────────

class JournalSaveRequest(BaseModel):
    user_id: str
    content: str

class SurveySaveRequest(BaseModel):
    user_id: str
    phq9_answers: List[int]
    p4_answers: List[str]
    gender: Optional[str] = None
    age_group: Optional[str] = None
    occupation: Optional[str] = None
    region: Optional[str] = None
    contact: Optional[str] = None
    phone: Optional[str] = None

class UserProfileUpdateRequest(BaseModel):
    user_id: str
    nickname: str
    gender: str
    age_group: str
    occupation: str
    region: str
    contact: Optional[str] = None
    phone: Optional[str] = None

@app.post("/api/journal/save")
async def save_journal(request: JournalSaveRequest):
    try:
        res = supabase.table("journals").insert({
            "user_id": request.user_id,
            "content": request.content
        }).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="일기 저장에 실패했습니다.")
        return {"status": "success", "data": res.data[0]}
    except Exception as e:
        print(f"[API Server] Journal save error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/survey/save")
async def save_survey(request: SurveySaveRequest):
    phq9_answers = request.phq9_answers or []
    p4_answers = request.p4_answers or []
    
    if len(phq9_answers) != 9:
        raise HTTPException(status_code=400, detail="PHQ-9 응답은 9개 문항이어야 합니다.")
    if len(p4_answers) != 4:
        raise HTTPException(status_code=400, detail="P4 스크리너 응답은 4개 문항이어야 합니다.")
        
    phq9_score = sum(phq9_answers)
    is_p4_high_risk = (
        p4_answers[0] == "있음" or 
        p4_answers[1] == "있음" or 
        p4_answers[2] in ["약간 그렇다", "매우 그렇다"] or 
        p4_answers[3] == "없음"
    )
    
    if phq9_score >= 20 or is_p4_high_risk:
        severity = "고위험"
    elif phq9_score >= 10:
        severity = "중증"
    else:
        severity = "경증"
        
    try:
        import datetime
        now_str = datetime.datetime.now().isoformat()
        
        insert_data = {
            "user_id": request.user_id,
            "phq9_score": phq9_score,
            "phq9_answers": phq9_answers,
            "p4_answers": p4_answers,
            "is_p4_high_risk": is_p4_high_risk,
            "severity": severity
        }
        if request.gender:
            insert_data["gender"] = request.gender
        if request.age_group:
            insert_data["age_group"] = request.age_group
        if request.occupation:
            insert_data["occupation"] = request.occupation
        if request.region:
            insert_data["region"] = request.region
        if request.contact:
            insert_data["contact"] = request.contact

        # Safe insert to Supabase: try inserting with phone, fallback if column is missing
        res = None
        try:
            insert_data_with_phone = insert_data.copy()
            if request.phone:
                insert_data_with_phone["phone"] = request.phone
            res = supabase.table("surveys").insert(insert_data_with_phone).execute()
        except Exception as e_phone:
            print(f"[Supabase Alert] Insert with phone column failed: {e_phone}. Retrying without phone column...")
            try:
                res = supabase.table("surveys").insert(insert_data).execute()
            except Exception as e_db:
                print(f"[Supabase Alert] Standard insert failed: {e_db}. Relying on local user storage.")
        
        # If Supabase query failed but we saved locally, we can return success anyway to be fully robust
        record_data = res.data[0] if (res and res.data) else {
            "id": "offline_survey_record",
            "user_id": request.user_id,
            "phq9_score": phq9_score,
            "severity": severity,
            "created_at": now_str
        }
        
        last_phq9_date = record_data.get("created_at", now_str)

        # Synchronize local fallback first to guarantee it gets saved locally
        try:
            users = load_local_users()
            if request.user_id in users:
                users[request.user_id].update({
                    "gender": request.gender,
                    "age_group": request.age_group,
                    "occupation": request.occupation,
                    "region": request.region,
                    "contact": request.contact,
                    "emergency_contact": request.contact,
                    "phone": request.phone,
                    "phq9_score": phq9_score,
                    "phq9_answers": phq9_answers,
                    "p4_answers": p4_answers,
                    "service_agreement": True,
                    "last_phq9_date": last_phq9_date
                })
                save_local_users(users)
        except Exception as e_sync:
            print(f"[Fallback Alert] Local user sync error during survey save: {e_sync}")
            
        return {
            "status": "success",
            "data": {
                "phq9_score": phq9_score,
                "is_p4_high_risk": is_p4_high_risk,
                "severity": severity,
                "record": record_data,
                "last_phq9_date": last_phq9_date
            }
        }
    except Exception as e:
        print(f"[API Server] Survey save error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/user/update_profile")
async def update_profile(request: UserProfileUpdateRequest):
    try:
        # 1. Update nickname in custom_users
        try:
            supabase.table("custom_users").update({"nickname": request.nickname}).eq("id", request.user_id).execute()
        except Exception as e_user:
            print(f"[Supabase Alert] custom_users update failed: {e_user}")
            
        # 2. Get latest survey of user to update it, or insert a new one if none exists
        try:
            survey_res = supabase.table("surveys").select("*").eq("user_id", request.user_id).order("created_at", desc=True).limit(1).execute()
            if survey_res.data:
                latest_id = survey_res.data[0]["id"]
                update_data = {
                    "gender": request.gender,
                    "age_group": request.age_group,
                    "occupation": request.occupation,
                    "region": request.region,
                    "contact": request.contact
                }
                try:
                    update_data_with_phone = update_data.copy()
                    if request.phone:
                        update_data_with_phone["phone"] = request.phone
                    supabase.table("surveys").update(update_data_with_phone).eq("id", latest_id).execute()
                except Exception as e_phone:
                    supabase.table("surveys").update(update_data).eq("id", latest_id).execute()
            else:
                # Insert a profile-only survey record
                insert_data = {
                    "user_id": request.user_id,
                    "phq9_score": 0,
                    "phq9_answers": [0]*9,
                    "p4_answers": ["없음"]*4,
                    "is_p4_high_risk": False,
                    "severity": "경증",
                    "gender": request.gender,
                    "age_group": request.age_group,
                    "occupation": request.occupation,
                    "region": request.region,
                    "contact": request.contact
                }
                try:
                    insert_data_with_phone = insert_data.copy()
                    if request.phone:
                        insert_data_with_phone["phone"] = request.phone
                    supabase.table("surveys").insert(insert_data_with_phone).execute()
                except Exception as e_phone:
                    supabase.table("surveys").insert(insert_data).execute()
        except Exception as e_survey:
            print(f"[Supabase Alert] surveys update/insert failed: {e_survey}")
            
        # 3. Sync with local users.json
        users = load_local_users()
        if request.user_id in users:
            users[request.user_id].update({
                "nickname": request.nickname,
                "gender": request.gender,
                "age_group": request.age_group,
                "occupation": request.occupation,
                "region": request.region,
                "contact": request.contact,
                "emergency_contact": request.contact,
                "phone": request.phone
            })
            save_local_users(users)
            
        return {
            "status": "success",
            "profile": {
                "nickname": request.nickname,
                "gender": request.gender,
                "ageGroup": request.age_group,
                "occupation": request.occupation,
                "region": request.region,
                "contact": request.contact,
                "phone": request.phone
            }
        }
    except Exception as e:
        print(f"[API Server] Profile update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class SignupRequest(BaseModel):
    email: str
    password: str
    nickname: str

class LoginRequest(BaseModel):
    email: str
    password: str

LOCAL_USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")

def load_local_users():
    if not os.path.exists(LOCAL_USERS_FILE):
        return {}
    try:
        with open(LOCAL_USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {}

def save_local_users(users):
    try:
        with open(LOCAL_USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[Error] Failed to save local users: {e}")

@app.post("/api/auth/signup")
def signup(request: SignupRequest):
    import uuid
    user_id = f"user-{uuid.uuid4().hex[:8]}"
    
    try:
        res = supabase.table("custom_users").select("*").eq("email", request.email).execute()
        if res.data:
            raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")
            
        new_user = supabase.table("custom_users").insert({
            "id": user_id,
            "email": request.email,
            "password": request.password,
            "nickname": request.nickname
        }).execute()
        
        if new_user.data:
            return {
                "user_id": user_id,
                "email": request.email,
                "nickname": request.nickname,
                "last_phq9_date": None
            }
    except Exception as e:
        print(f"[Fallback Alert] custom_users table not found or query failed. Error: {e}")
        print("Falling back to local users.json file store...")
        
        users = load_local_users()
        for uid, u in users.items():
            if u["email"] == request.email:
                raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")
                
        users[user_id] = {
            "email": request.email,
            "password": request.password,
            "nickname": request.nickname
        }
        save_local_users(users)
        
        return {
            "user_id": user_id,
            "email": request.email,
            "nickname": request.nickname,
            "last_phq9_date": None
        }

@app.post("/api/auth/login")
def login(request: LoginRequest):
    last_phq9_date = None
    try:
        res = supabase.table("custom_users").select("*").eq("email", request.email).execute()
        if res.data:
            user = res.data[0]
            if user["password"] == request.password:
                user_id = user["id"]
                region = "서울"
                has_profile = False
                gender = None
                age_group = None
                occupation = None
                contact = None
                phone = None
                
                try:
                    survey_res = supabase.table("surveys").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(1).execute()
                    if survey_res.data:
                        latest = survey_res.data[0]
                        last_phq9_date = latest.get("created_at")
                        if latest.get("region"):
                            region = latest["region"]
                        gender = latest.get("gender")
                        age_group = latest.get("age_group")
                        occupation = latest.get("occupation")
                        contact = latest.get("contact")
                        phone = latest.get("phone")
                        if gender and age_group and occupation:
                            has_profile = True
                except Exception as ex:
                    print(f"[Login Detail Alert] Failed to fetch region from surveys for user {user_id}. Error: {ex}")
                
                # Check local user fallback as well, in case DB is partially out-of-sync
                try:
                    users = load_local_users()
                    if user_id in users:
                        u = users[user_id]
                        if not last_phq9_date and "last_phq9_date" in u:
                            last_phq9_date = u.get("last_phq9_date")
                        if not has_profile and "gender" in u and "age_group" in u and "occupation" in u:
                            has_profile = True
                            gender = u.get("gender")
                            age_group = u.get("age_group")
                            occupation = u.get("occupation")
                            region = u.get("region", region)
                            contact = u.get("contact", u.get("emergency_contact"))
                            phone = u.get("phone")
                except:
                    pass

                return {
                    "user_id": user_id,
                    "email": user["email"],
                    "nickname": user["nickname"],
                    "region": region,
                    "has_profile": has_profile,
                    "last_phq9_date": last_phq9_date,
                    "profile": {
                        "nickname": user["nickname"],
                        "gender": gender,
                        "ageGroup": age_group,
                        "occupation": occupation,
                        "region": region,
                        "contact": contact or "",
                        "phone": phone or ""
                    } if has_profile else None
                }
            else:
                raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    except Exception as e:
        print(f"[Fallback Alert] custom_users table check failed for login. Error: {e}")
        
    users = load_local_users()
    for uid, u in users.items():
        if u["email"] == request.email:
            if u["password"] == request.password:
                has_profile = "gender" in u and "age_group" in u and "occupation" in u
                return {
                    "user_id": uid,
                    "email": u["email"],
                    "nickname": u["nickname"],
                    "region": u.get("region", "서울"),
                    "has_profile": has_profile,
                    "last_phq9_date": u.get("last_phq9_date"),
                    "profile": {
                        "nickname": u["nickname"],
                        "gender": u.get("gender"),
                        "ageGroup": u.get("age_group"),
                        "occupation": u.get("occupation"),
                        "region": u.get("region"),
                        "contact": u.get("contact", u.get("emergency_contact", "")),
                        "phone": u.get("phone", "")
                    } if has_profile else None
                }
            else:
                raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
                
    raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

# ──────────────────────────────────────────────────
# 6. 신규 API 엔드포인트: 상담사 전용 기능 (실시간 내담자 데이터 연동)
# ──────────────────────────────────────────────────

def compute_p4_score(p4_answers: List[str]) -> int:
    if not p4_answers or len(p4_answers) < 4:
        return 0
    score = 0
    if p4_answers[0] == "있음":
        score += 1
    if p4_answers[1] == "있음":
        score += 1
    if p4_answers[2] in ["약간 그렇다", "매우 그렇다"]:
        score += 1
    if p4_answers[3] == "없음":
        score += 1
    return score

def format_datetime(iso_str):
    if not iso_str:
        return "활동 없음"
    try:
        clean_str = iso_str.replace("Z", "")
        if "." in clean_str:
            clean_str = clean_str.split(".")[0]
        dt = datetime.fromisoformat(clean_str)
        return dt.strftime("%m.%d %H:%M")
    except Exception as e:
        return iso_str

@app.get("/api/counselor/clients")
async def get_counselor_clients():
    try:
        # 1. 모든 실제 사용자 가져오기
        users_res = supabase.table("custom_users").select("*").execute()
        if not users_res.data:
            return []
            
        clients_list = []
        for user in users_res.data:
            user_id = user["id"]
            nickname = user.get("nickname", "알 수 없음")
            email = user.get("email", "")
            
            # 2. 해당 사용자의 최신 설문 정보 가져오기
            surveys_res = supabase.table("surveys").select("*").eq("user_id", user_id).execute()
            latest_survey = None
            if surveys_res.data:
                sorted_surveys = sorted(surveys_res.data, key=lambda x: x.get("created_at", ""), reverse=True)
                latest_survey = sorted_surveys[0]
                
            # 3. 해당 사용자의 일기 정보 가져오기 (요약에 활용)
            journals_res = supabase.table("journals").select("*").eq("user_id", user_id).execute()
            latest_journal = None
            if journals_res.data:
                sorted_journals = sorted(journals_res.data, key=lambda x: x.get("created_at", ""), reverse=True)
                latest_journal = sorted_journals[0]
                
            # 4. 해당 사용자의 최신 세션 최종 활동 시각 계산
            sessions_res = supabase.table("chat_sessions").select("*").eq("user_id", user_id).execute()
            last_active_time = "활동 없음"
            if sessions_res.data:
                sorted_sessions = sorted(sessions_res.data, key=lambda x: x.get("created_at", ""), reverse=True)
                latest_sess = sorted_sessions[0]
                created_at = latest_sess.get("created_at")
                
                # 메세지 최신 시각 조회
                messages_res = supabase.table("messages").select("created_at").eq("session_id", latest_sess["id"]).order("created_at", desc=True).limit(1).execute()
                if messages_res.data:
                    created_at = messages_res.data[0].get("created_at", created_at)
                
                last_active_time = format_datetime(created_at)
                
            # 매핑 구성
            phq9 = 0
            p4 = 0
            risk = "Low"
            gender = "선택 안함"
            age = "20대"
            summary = "자가 진단 및 챗봇 대화 진행 예정"
            
            if latest_survey:
                phq9 = latest_survey.get("phq9_score", 0)
                p4_ans = latest_survey.get("p4_answers", [])
                p4 = compute_p4_score(p4_ans)
                
                # 4단계 위험 분류
                if p4 > 0:
                    risk = "Crisis"
                elif phq9 >= 20:
                    risk = "High"
                elif phq9 >= 10:
                    risk = "Medium"
                else:
                    risk = "Low"
                    
                gender = latest_survey.get("gender", "선택 안함")
                if gender == "남성":
                    gender = "남"
                elif gender == "여성":
                    gender = "여"
                age = latest_survey.get("age_group", "20대")
                
                summary = f"PHQ-9 자가진단 {phq9}점(P4 {p4}점)을 완료한 내담자입니다."
                if latest_journal:
                    j_content = latest_journal.get("content", "")
                    if len(j_content) > 35:
                        summary += f" 최신 일기: \"{j_content[:35]}...\""
                    else:
                        summary += f" 최신 일기: \"{j_content}\""
                elif phq9 >= 20 or p4 >= 1:
                    summary += " 고위험 징후 감지 및 실시간 모니터링이 필요합니다."
            
            clients_list.append({
                "id": user_id,
                "name": nickname,
                "gender": gender,
                "age": age,
                "risk": risk,
                "phq9": phq9,
                "p4": p4,
                "summary": summary,
                "updated": last_active_time
            })
            
        return clients_list
    except Exception as e:
        print(f"[Counselor API Error] clients query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/counselor/client/{user_id}/report")
async def get_counselor_client_report(user_id: str):
    try:
        # 1. 사용자 기본 정보
        users_res = supabase.table("custom_users").select("*").eq("id", user_id).execute()
        if not users_res.data:
            raise HTTPException(status_code=404, detail="내담자를 찾을 수 없습니다.")
        user = users_res.data[0]
        
        # 2. 설문 기록 조회
        surveys_res = supabase.table("surveys").select("*").eq("user_id", user_id).execute()
        latest_survey = None
        survey_history = []
        if surveys_res.data:
            sorted_surveys = sorted(surveys_res.data, key=lambda x: x.get("created_at", ""))
            for idx, s in enumerate(sorted_surveys):
                take_time = format_datetime(s.get("created_at"))
                p4_ans = s.get("p4_answers", [])
                p4_score = compute_p4_score(p4_ans)
                survey_history.append({
                    "id": s.get("id"),
                    "takenAt": take_time,
                    "phq9": s.get("phq9_score", 0),
                    "p4": p4_score
                })
            latest_survey = sorted_surveys[-1]
            
        gender = "선택 안함"
        age = "20대"
        occupation = "학생"
        region = "경기"
        contact = "010-XXXX-XXXX"
        
        if latest_survey:
            gender = latest_survey.get("gender", "선택 안함")
            age = latest_survey.get("age_group", "20대")
            occupation = latest_survey.get("occupation", "학생")
            region = latest_survey.get("region", "경기")
            contact = latest_survey.get("contact", "010-XXXX-XXXX")
            
        client_profile = {
            "id": user_id,
            "name": user.get("nickname", "알 수 없음"),
            "email": user.get("email", ""),
            "gender": gender,
            "age": age,
            "occupation": occupation,
            "region": region,
            "contact": contact,
            "registeredAt": format_datetime(user.get("created_at")) or "방금 전",
            "lastActiveAt": "방금 전"
        }
        
        # 3. 일기 목록 조회
        journals_res = supabase.table("journals").select("*").eq("user_id", user_id).execute()
        journals_list = []
        if journals_res.data:
            sorted_journals = sorted(journals_res.data, key=lambda x: x.get("created_at", ""), reverse=True)
            for j in sorted_journals:
                journals_list.append({
                    "id": j.get("id"),
                    "content": j.get("content", ""),
                    "createdAt": format_datetime(j.get("created_at"))
                })
                
        # 4. 세션 & 대화 목록 조회
        sessions_res = supabase.table("chat_sessions").select("*").eq("user_id", user_id).execute()
        all_user_messages = []
        
        if sessions_res.data:
            for sess in sessions_res.data:
                msgs_res = supabase.table("messages").select("*").eq("session_id", sess["id"]).execute()
                if msgs_res.data:
                    all_user_messages.extend(msgs_res.data)
                    
        all_user_messages = sorted(all_user_messages, key=lambda x: x.get("created_at", ""))
        
        risk_logs = []
        for msg in all_user_messages:
            if msg.get("role") == "user":
                is_high = msg.get("is_high_risk", False)
                risk_score = float(msg.get("risk_score", 0.0))
                content = msg.get("content", "")
                
                is_suicidal_kw = any(kw in content for kw in ["죽고 싶", "자살", "자해", "끝내고 싶", "수면제", "사라지고"])
                
                if is_high or risk_score >= 0.6 or is_suicidal_kw:
                    expr_type = "직접" if (risk_score >= 0.8 or is_suicidal_kw) else "간접"
                    sev = "높음" if (risk_score >= 0.8 or "죽" in content or "수면제" in content) else "중간"
                    risk_logs.append({
                        "id": msg.get("id"),
                        "detectedAt": format_datetime(msg.get("created_at")),
                        "originalText": content,
                        "expressionType": expr_type,
                        "severity": sev,
                        "sessionId": msg.get("session_id")
                    })
                    
        risk_logs = sorted(risk_logs, key=lambda x: x["detectedAt"], reverse=True)[:5]
        
        emotions_sum = {"우울": 0.0, "불안": 0.0, "외로움": 0.0, "무기력": 0.0, "절망감": 0.0, "분노": 0.0}
        emotions_count = 0
        
        for msg in all_user_messages:
            if msg.get("role") == "user":
                em_str = msg.get("emotion")
                if em_str:
                    try:
                        em_data = json.loads(em_str) if isinstance(em_str, str) else em_str
                        probs = em_data.get("probabilities") or em_data.get("probs") or {}
                        
                        if isinstance(probs, list):
                            probs_dict = {k: v for k, v in probs}
                        else:
                            probs_dict = probs
                            
                        for k, v in probs_dict.items():
                            v_val = float(v)
                            if "우울" in k: emotions_sum["우울"] += v_val
                            elif "불안" in k: emotions_sum["불안"] += v_val
                            elif "외롭" in k or "소외" in k: emotions_sum["외로움"] += v_val
                            elif "무기력" in k or "귀찮" in k: emotions_sum["무기력"] += v_val
                            elif "절망" in k or "낙담" in k: emotions_sum["절망감"] += v_val
                            elif "분노" in k or "짜증" in k: emotions_sum["분노"] += v_val
                        emotions_count += 1
                    except Exception as parse_e:
                        pass
                        
        radar_data = []
        phq9_score = latest_survey.get("phq9_score", 0) if latest_survey else 0
        
        if emotions_count > 0:
            for em, total_val in emotions_sum.items():
                avg_val = total_val / emotions_count
                radar_data.append({"name": em, "value": min(100.0, round(avg_val, 1))})
        else:
            base = min(100.0, float(phq9_score * 3.5))
            radar_data = [
                {"name": "우울", "value": min(100.0, round(base, 1))},
                {"name": "무기력", "value": min(100.0, round(base * 0.9, 1))},
                {"name": "불안", "value": min(100.0, round(base * 0.8, 1))},
                {"name": "절망감", "value": min(100.0, round(base * 0.7 if phq9_score >= 15 else base * 0.3, 1))},
                {"name": "외로움", "value": min(100.0, round(base * 0.6, 1))},
                {"name": "분노", "value": min(100.0, round(base * 0.4, 1))}
            ]
            
        dominant_emotions = []
        sorted_radar = sorted(radar_data, key=lambda x: x["value"], reverse=True)
        for s_em in sorted_radar[:3]:
            if s_em["value"] > 10:
                dominant_emotions.append(s_em["name"])
        if not dominant_emotions:
            dominant_emotions = ["우울", "무기력"]
            
        distortion_stats = {}
        distortion_types = ["흑백논리", "과잉일반화", "정신적여과", "긍정무시", "독심술", "미래예언", "파국화", "감정추리", "당위진술", "낙인찍기", "개인화", "비교왜곡"]
        
        prompt_map = {
            "흑백논리": "완벽해야 한다는 압박감을 많이 느끼시는 것 같네요. 완전한 성공과 완전한 실패 사이의 중간 지점을 함께 살펴볼까요?",
            "과잉일반화": "한두 번의 부정적 경험으로 전체를 판단하시는 것 같아요. 과거에 잘 극복했거나 예외적이었던 순간들을 떠올려 볼까요?",
            "정신적여과": "부정적인 면에만 마음이 가려지는 기분입니다. 오늘 하루 중 아주 사소하더라도 평온했던 일 하나를 꼽아볼까요?",
            "긍정무시": "성취나 좋은 일들을 너무 쉽게 당연시하시는군요. 스스로에게 칭찬을 보내도 충분히 괜찮은 상황입니다.",
            "독심술": "상대방의 마음을 우리가 미리 다 알 수는 없어요. 혹시 그렇게 단정 짓게 된 실제 행동이나 사실이 있었을까요?",
            "미래예언": "미래가 절망적으로만 그려지는 마음이군요. 예측 대신 당장 오늘 조절할 수 있는 아주 작은 행동 하나에 집중해봐요.",
            "파국화": "최악의 시나리오가 일어날 것 같아 두려우시죠? 실제로 그 일이 일어날 객관적인 확률과, 만약 일어나도 대응할 방법을 찾아봅시다.",
            "감정추리": "지금 느껴지는 무기력이나 슬픔이 '상황의 팩트'처럼 다가오시는군요. 감정은 흘러가는 기후와 같아요. 팩트와 구분해봐요.",
            "당위진술": "'반드시 ~해야 한다'는 엄격한 규칙이 나를 옥죄고 있네요. '~하면 좋겠다'는 유연한 바램으로 문장을 바꾸어 말해볼까요?",
            "낙인찍기": "실수 하나로 자신을 '실패자'로 규정하셨군요. 행동과 내 가치는 별개입니다. 스스로를 하나의 고유한 사람으로 봐주세요.",
            "개인화": "내 탓이 아닌 일까지 과도한 책임감으로 자책하시는 마음이 느껴져요. 이 상황에서 내 통제 밖이었던 요인들을 분리해 봐요.",
            "비교왜곡": "타인의 완벽해 보이는 겉모습과 내 힘든 속모습을 비교해 깎아내리고 계시네요. 각자의 삶은 고유한 템포가 있습니다."
        }
        
        for dt in distortion_types:
            distortion_stats[dt] = {
                "count": 0,
                "frequency": "드묾",
                "sessionObservedCount": 0,
                "totalSessions": max(1, len(sessions_res.data) if sessions_res.data else 1),
                "exampleSentences": [],
                "relatedContext": ["자가 분석"],
                "empatheticPrompt": prompt_map.get(dt, "")
            }
            
        keywords_map = {
            "흑백논리": ["전부", "다 ", "아무것도", "하나도", "완전히", "100%", "망했다", "실패했다"],
            "과잉일반화": ["항상", "매번", "늘 ", "또 ", "언제나", "절대", "한 번도"],
            "당위진술": ["해야만", "해야 한다", "해야 해", "꼭 해야", "절대로"],
            "개인화": ["내 탓", "나 때문에", "나만", "내 잘못", "죄책감"],
            "미래예언": ["끝났어", "안 될 거야", "망했어", "미래가", "앞으로도", "영영"],
            "낙인찍기": ["실패자", "쓰레기", "부족한 사람", "바보", "모자란"]
        }
        
        for msg in all_user_messages:
            if msg.get("role") == "user":
                content = msg.get("content", "")
                for dt_type, kw_list in keywords_map.items():
                    for kw in kw_list:
                        if kw in content:
                            distortion_stats[dt_type]["count"] += 1
                            if content not in distortion_stats[dt_type]["exampleSentences"]:
                                distortion_stats[dt_type]["exampleSentences"].append(content)
                            break
                            
        for dt in distortion_types:
            c = distortion_stats[dt]["count"]
            if c >= 5:
                distortion_stats[dt]["frequency"] = "매우 흔함"
                distortion_stats[dt]["sessionObservedCount"] = max(1, c // 2)
            elif c >= 2:
                distortion_stats[dt]["frequency"] = "흔함"
                distortion_stats[dt]["sessionObservedCount"] = max(1, c // 2)
            else:
                distortion_stats[dt]["frequency"] = "드묾"
                distortion_stats[dt]["sessionObservedCount"] = c
                
            distortion_stats[dt]["exampleSentences"] = distortion_stats[dt]["exampleSentences"][:3]
            
        counselor_notes = []
        try:
            notes_res = supabase.table("counselor_notes").select("*").eq("user_id", user_id).execute()
            if notes_res.data:
                for note in notes_res.data:
                    counselor_notes.append({
                        "id": note.get("id"),
                        "conductedAt": format_datetime(note.get("created_at")),
                        "detail": note.get("content", ""),
                        "interventionType": "문자 상담",
                        "status": "진행 중"
                    })
        except:
            pass
        notes_file = os.path.join(os.path.dirname(__file__), "counselor_notes.json")
        if os.path.exists(notes_file):
            try:
                with open(notes_file, "r", encoding="utf-8") as f:
                    local_notes = json.load(f)
                    for n in local_notes:
                        if n.get("user_id") == user_id:
                            if not any(x["id"] == n.get("id") for x in counselor_notes):
                                counselor_notes.append({
                                    "id": n.get("id"),
                                    "conductedAt": format_datetime(n.get("created_at")),
                                    "detail": n.get("content", ""),
                                    "interventionType": "문자 상담",
                                    "status": "진행 중"
                                })
            except:
                pass
                
        counselor_notes = sorted(counselor_notes, key=lambda x: x["conductedAt"], reverse=True)
        
        return {
            "client": client_profile,
            "surveyHistory": survey_history,
            "riskLogs": risk_logs,
            "emotionData": {
                "dominantEmotions": dominant_emotions,
                "radarData": radar_data
            },
            "cognitiveDistortions": distortion_stats,
            "journals": journals_list,
            "counselorNotes": counselor_notes,
            "user_messages": all_user_messages
        }
    except Exception as e:
        print(f"[Counselor API Error] report query failed for user {user_id}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class NoteSaveRequest(BaseModel):
    user_id: str
    counselor_id: str = "counselor-001"
    content: str

@app.post("/api/counselor/notes")
async def save_note(request: NoteSaveRequest):
    try:
        res = supabase.table("counselor_notes").insert({
            "user_id": request.user_id,
            "counselor_id": request.counselor_id,
            "content": request.content
        }).execute()
        if res.data:
            return {"status": "success", "data": res.data[0]}
    except Exception as e:
        print(f"[Supabase Fallback Note Save] Error: {e}. Saving to counselor_notes.json...")
        
    file_path = os.path.join(os.path.dirname(__file__), "counselor_notes.json")
    try:
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                notes = json.load(f)
        else:
            notes = []
    except:
        notes = []
        
    new_note = {
        "id": str(uuid.uuid4()),
        "user_id": request.user_id,
        "counselor_id": request.counselor_id,
        "content": request.content,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    notes.append(new_note)
    
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(notes, f, indent=2, ensure_ascii=False)
    except Exception as we:
        print(f"Failed to write counselor_notes.json: {we}")
        
    return {"status": "success", "data": new_note}

@app.get("/api/resources/search")
async def search_resources(region: str = "서울"):
    try:
        # facilities.json 경로 (public 폴더)
        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        facilities_path = os.path.join(root_dir, "public", "facilities.json")
        
        if not os.path.exists(facilities_path):
            print(f"[API Search Error] facilities.json not found at {facilities_path}")
            return {"status": "error", "message": "facilities.json not found."}
            
        with open(facilities_path, "r", encoding="utf-8") as f:
            facilities_data = json.load(f)
            
        # 해당 지역(region)의 모든 기관들을 필터링하여 반환
        # region이 맞거나, address에 region 이름이 들어있는 경우 등으로 매칭율 보완
        results = []
        for facility in facilities_data:
            # region 매칭
            facility_region = facility.get("region", "")
            if not facility_region and "address" in facility:
                # address에서 region 추출 시도
                addr = facility.get("address", "")
                if region in addr:
                    facility_region = region
            
            if facility_region == region:
                results.append({
                    "name": facility.get("name", "기관명 없음"),
                    "category": facility.get("category", "기타"),
                    "address": facility.get("address", "주소 없음"),
                    "homepage": facility.get("homepage", ""),
                    "tel": facility.get("tel", ""),
                    "region": region
                })
                
        return {"status": "success", "data": results}
    except Exception as e:
        print(f"[API Search Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


def extract_and_update_safety_plan(user_id: str, conversation_history: list):
    try:
        from openai import OpenAI
        client = OpenAI()
        
        system_prompt = """당신은 정신건강 임상 인공지능 요약기입니다.
제공되는 사용자(내담자)와 구조봇 간의 대화 내역을 분석하여, Stanley-Brown 자살 위기 대응 6단계 안전 계획(Stanley-Brown 6-Step Safety Protocol)에 해당하는 구체적 내용이 논의되었는지 확인하고 이를 요약 및 추출하십시오.

[안전계획 6단계 정의]
- 1단계: 경고 신호 (Warning signs — 마음이 위험해질 때 떠오르는 부정적 생각, 기분, 신체 반응)
- 2단계: 내적 대처 방법 (Internal coping strategies — 타인의 개입 없이 주의를 분산하기 위해 스스로 할 수 있는 활동)
- 3단계: 사회적 주의 (Social contacts/settings — 위기 상황에서 기분 환기를 위해 방문하거나 접촉할 수 있는 사회적 환경/사람)
- 4단계: 사회적 지원 (Family members or friends — 실제로 위기 상황을 털어놓고 도움을 구할 수 있는 신뢰하는 지인의 이름이나 연락처)
- 5단계: 전문 기관 (Professionals or agencies — 위기 시 전화할 109, 1393 및 담당 상담사/병원 연락처)
- 6단계: 환경 안전 (Making the environment safe — 자신을 해칠 수 있는 수단/위험 도구를 시야에서 차단하거나 치우는 행동)

[중요 지침]
1. 대화 중에서 명확하게 수립되거나 언급된 대처 방안/대상을 찾아서 각 단계별로 핵심만 간결하고 명확하게 한 문장 수준(한글)으로 추출하십시오.
2. 대화에서 아직 논의되지 않았거나 언급되지 않은 단계는 빈 문자열("")로 반환해야 합니다. 절대 임의로 지어내지 마십시오!
3. 현재까지 완성/진행된 가장 높은 단계 번호를 current_step(1~6, 전혀 없으면 1)으로 반환하십시오. 만약 1단계라도 내용이 채워졌다면 완성된 단계를 기준으로 1~6을 책정합니다.
4. 반드시 아래의 JSON 포맷으로만 답변하십시오. JSON 외에 어떤 사설이나 주석도 달지 마십시오.

{
  "current_step": 3,
  "step1_warning_signs": "...",
  "step2_coping_strategies": "...",
  "step3_social_distraction": "...",
  "step4_social_support": "...",
  "step5_professional_agencies": "...",
  "step6_safe_environment": "..."
}"""

        truncated_history = conversation_history[-12:]
        formatted_history = "\n".join([f"{msg['role']}: {msg['content']}" for msg in truncated_history])
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"다음 대화 내역을 바탕으로 6단계 안전계획을 실시간으로 요약 및 추출하십시오:\n\n{formatted_history}"}
            ],
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        
        raw_json = response.choices[0].message.content.strip()
        data = json.loads(raw_json)
        
        insert_data = {
            "user_id": user_id,
            "current_step": int(data.get("current_step", 1)),
            "step1_warning_signs": data.get("step1_warning_signs", ""),
            "step2_coping_strategies": data.get("step2_coping_strategies", ""),
            "step3_social_distraction": data.get("step3_social_distraction", ""),
            "step4_social_support": data.get("step4_social_support", ""),
            "step5_professional_agencies": data.get("step5_professional_agencies", ""),
            "step6_safe_environment": data.get("step6_safe_environment", "")
        }
        
        supabase.table("safety_plans").upsert(insert_data).execute()
        print(f"[AI Safety Plan Extractor] Real-time safety plan extracted and saved successfully for user: {user_id}")
    except Exception as ex:
        print(f"[AI Safety Plan Extractor Error] Failed to extract safety plan: {ex}")


@app.get("/api/counselor/client/{user_id}/safety_plan")
async def get_safety_plan(user_id: str):
    try:
        res = supabase.table("safety_plans").select("*").eq("user_id", user_id).execute()
        if res.data:
            return {"status": "success", "data": res.data[0]}
    except Exception as e:
        print(f"[Supabase Fallback GET Safety Plan] Error: {e}")
        
    file_path = os.path.join(os.path.dirname(__file__), "safety_plans.json")
    if os.path.exists(file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                plans = json.load(f)
                for p in plans:
                    if p.get("user_id") == user_id:
                        return {"status": "success", "data": p}
        except:
            pass
            
    if user_id == "user-003":
        dummy_plan = {
            "user_id": "user-003",
            "current_step": 5,
            "step1_warning_signs": "밤마다 가슴이 답답하고 눈물이 나며 극심한 고립감이 밀려옴. '다 끝내고 싶다'는 생각이 꼬리를 물 때.",
            "step2_coping_strategies": "잔잔한 어쿠스틱 음악 틀기, 침대에서 내려와 발가락 꼼지락하며 바닥 접지하기, 따뜻한 차 한 모금 마시기",
            "step3_social_distraction": "집 근처 경의선 숲길을 10분 동안 산책하기, 단골 북카페에 가서 책 냄새 맡으며 앉아있기",
            "step4_social_support": "대학 동창 단짝 이소희 (010-3333-4444) - 내 우울과 아픔을 편견 없이 들어주는 소중한 친구",
            "step5_professional_agencies": "마포구 정신건강복지센터 (02-716-0600), 자살예방 상담전화 109 (대화 진행 중)",
            "step6_safe_environment": "방 안의 커터칼과 보관 중인 다량의 약봉지를 어머니께 전부 전달해 내 시야와 접근성에서 격리하기"
        }
        return {"status": "success", "data": dummy_plan}
        
    default_plan = {
        "user_id": user_id,
        "current_step": 1,
        "step1_warning_signs": "",
        "step2_coping_strategies": "",
        "step3_social_distraction": "",
        "step4_social_support": "",
        "step5_professional_agencies": "",
        "step6_safe_environment": ""
    }
    return {"status": "success", "data": default_plan}


def migrate_dummy_crisis_data():
    try:
        users_res = supabase.table("custom_users").select("*").eq("id", "user-003").execute()
        if not users_res.data:
            supabase.table("custom_users").insert({
                "id": "user-003",
                "email": "seoyeon@daum.net",
                "nickname": "최서연"
            }).execute()
            print("[Migration] 최서연 예시 사용자 계정 마이그레이션 완료!")

        surveys_res = supabase.table("surveys").select("*").eq("user_id", "user-003").execute()
        if not surveys_res.data:
            supabase.table("surveys").insert({
                "user_id": "user-003",
                "phq9_score": 22,
                "p4_score": 3,
                "p4_answers": ["있음", "있음", "부분적", "약함"],
                "gender": "여",
                "age_group": "20대",
                "region": "서울",
                "created_at": datetime.utcnow().isoformat() + "Z"
            }).execute()
            print("[Migration] 최서연 자가검진 설문 기록 마이그레이션 완료!")

        plans_res = supabase.table("safety_plans").select("*").eq("user_id", "user-003").execute()
        if not plans_res.data:
            supabase.table("safety_plans").insert({
                "user_id": "user-003",
                "current_step": 5,
                "step1_warning_signs": "밤마다 가슴이 답답하고 눈물이 나며 극심한 고립감이 밀려옴. '다 끝내고 싶다'는 생각이 꼬리를 물 때.",
                "step2_coping_strategies": "잔잔한 어쿠스틱 음악 틀기, 침대에서 내려와 발가락 꼼지락하며 바닥 접지하기, 따뜻한 차 한 모금 마시기",
                "step3_social_distraction": "집 근처 경의선 숲길을 10분 동안 산책하기, 단골 북카페에 가서 책 냄새 맡으며 앉아있기",
                "step4_social_support": "대학 동창 단짝 이소희 (010-3333-4444) - 내 우울과 아픔을 편견 없이 들어주는 소중한 친구",
                "step5_professional_agencies": "마포구 정신건강복지센터 (02-716-0600), 자살예방 상담전화 109 (대화 진행 중)",
                "step6_safe_environment": "방 안의 커터칼과 보관 중인 다량의 약봉지를 어머니께 전부 전달해 내 시야와 접근성에서 격리하기"
            }).execute()
            print("[Migration] 최서연 6단계 안전 계획 예시 데이터 마이그레이션 완료!")
            
        users_res6 = supabase.table("custom_users").select("*").eq("id", "user-006").execute()
        if not users_res6.data:
            supabase.table("custom_users").insert({
                "id": "user-006",
                "email": "jiwon@naver.com",
                "nickname": "강지원"
            }).execute()
            
        surveys_res6 = supabase.table("surveys").select("*").eq("user_id", "user-006").execute()
        if not surveys_res6.data:
            supabase.table("surveys").insert({
                "user_id": "user-006",
                "phq9_score": 24,
                "p4_score": 0,
                "p4_answers": ["없음", "없음", "없음", "강함"],
                "gender": "여",
                "age_group": "30대",
                "region": "경기",
                "created_at": datetime.utcnow().isoformat() + "Z"
            }).execute()
            print("[Migration] 강지원 예시 사용자 마이그레이션 완료!")
    except Exception as e:
        print(f"[Migration Warning] Failed to run dummy crisis data migration: {e}")


@app.on_event("startup")
async def startup_event():
    # 기동 시 예시 극단위기군 내담자 데이터 마이그레이션 일괄 실행
    migrate_dummy_crisis_data()


