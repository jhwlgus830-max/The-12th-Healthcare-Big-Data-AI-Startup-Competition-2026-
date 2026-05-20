import sys
import os
import json
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 'data' 폴더를 sys.path에 추가하여 기존 모델 및 페르소나 로터 모듈 로드
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), "data"))

from model import load_model, get_depression_score, get_chatbot_response
from persona_router import route_persona
from database import supabase

# HuggingFace 임베딩 초기화 (Chroma/FAISS RAG 호환용)
# Supabase의 vector(768) 스키마에 맞추기 위해 768차원 한국어 최적화 모델 사용
from langchain_community.embeddings import HuggingFaceEmbeddings
embedding_model = HuggingFaceEmbeddings(
    model_name="jhgan/ko-sroberta-multitask",
    model_kwargs={'device': 'cpu'},
    encode_kwargs={'normalize_embeddings': True}
)

app = FastAPI(title="마음 온도계 AI Backend", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
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

@app.post("/api/chat/send", response_model=ChatSendResponse)
async def send_chat(request: ChatSendRequest):
    global electra_model, tokenizer, inv_map, run_cfg, device
    
    if electra_model is None:
        raise HTTPException(status_code=500, detail="감정 분석 모델이 로드되지 않았습니다.")
        
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
    
    score = float(analysis["score"])  # 0.0 ~ 1.0
    top_emotion = analysis["top3"][0][0] if analysis["top3"] else "일상"
    is_high_risk = score >= 0.60 # 고위험 조건
    
    # 다중 감정(multi) 및 상위 감정 확률 세부 구조화
    multi_emotions = analysis.get("multi", [])
    if not multi_emotions:
        multi_emotions = [top_emotion]
        
    emotion_detail = {
        "primary": top_emotion,
        "detected": multi_emotions,
        "probabilities": {emo: prob for emo, prob in analysis["top3"]}
    }
    emotion_value = json.dumps(emotion_detail, ensure_ascii=False)
    
    # 3. 실시간 페르소나 라우팅
    # route_persona: 우울증 점수와 고위험 여부를 바탕으로 페르소나 매핑
    routed_persona_name = route_persona(score, is_high_risk)
    
    # persona_id 매핑 (프론트엔드 호환용: 1또치, 2지우, 3클로, 4멘토, 5철수)
    persona_map = {
        "🦔 고슴도치 또치": 1,
        "🧑‍⚕️ 상담사 지우": 2,
        "🤖 AI 어시스턴트 클로": 3,
        "🧑‍⚕️ 멘토 선생님": 4,
        "😄 개그맨 철수": 5
    }
    persona_id = persona_map.get(routed_persona_name, 1)
    
    # 만약 고위험 판정 시 페르소나는 강제로 3(클로)으로 설정 및 위험 플래그 세팅
    if is_high_risk:
        routed_persona_name = "🤖 AI 어시스턴트 클로"
        persona_id = 3
        
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
            # OpenAI 챗봇 API의 역할 이름에 맞춤 ('user' / 'assistant')
            role = "user" if msg["role"] == "user" else "assistant"
            conversation_history.append({"role": role, "content": msg["content"]})
            
    # 5. GPT-4o mini 공감형 챗봇 응답 생성
    # 페르소나 설명에 따른 시스템 프롬프트 주입
    persona_prompts = {
        1: "당신은 따뜻하고 귀여운 위로를 건네는 '고슴도치 또치'입니다. 반말을 사용하며 아주 친근하고 다정하게 대답해 주세요.",
        2: "당신은 10년 차 경력의 따뜻하고 전문적인 심리 상담사 '지우'입니다. 경청과 긍정적 존중을 담아 정중한 어조로 조언해 주세요.",
        3: "당신은 위기 극복 안전 가이드 '클로'입니다. 침착하고 안전한 대응을 돕기 위해 차분하게 위기상담 전화를 권장해 주세요.",
        4: "당신은 현명하고 따뜻하게 인지 왜곡을 짚어주는 '멘토 선생님'입니다. 생각을 전환할 수 있는 소크라테스식 질문을 던져주세요.",
        5: "당신은 유머러스하고 긍정적인 에너지를 불어넣는 '개그맨 철수'입니다. 활기차고 가벼운 기분 전환 이야기를 나눠주세요."
    }
    
    try:
        bot_reply = get_chatbot_response(
            user_text=content,
            analysis=analysis,
            conversation_history=conversation_history,
            persona_system=persona_prompts.get(persona_id, "")
        )
    except Exception as e:
        bot_reply = f"감정을 깊이 있게 이해하는 도중 잠시 지연이 발생했어요. 조금만 천천히 이야기해 주시겠어요? (오류: {e})"
        
    # 6. 사용자 메시지 DB 저장 (Supabase)
    user_msg = supabase.table("messages").insert({
        "session_id": session_id,
        "role": "user",
        "content": content,
        "icon": "👤",
        "emotion": emotion_value,  # 구조화된 감정값(JSON) 저장
        "risk_score": score,
        "is_high_risk": is_high_risk
    }).execute()
    
    user_msg_data = user_msg.data[0]
    
    # 7. 봇 메시지 DB 저장 (Supabase)
    bot_icon = "🦔" if persona_id == 1 else "👩" if persona_id == 2 else "🤍" if persona_id == 3 else "🎓" if persona_id == 4 else "😄"
    bot_msg = supabase.table("messages").insert({
        "session_id": session_id,
        "role": "assistant",
        "content": bot_reply,
        "icon": bot_icon,
        "emotion": emotion_value,  # 구조화된 감정값(JSON) 저장
        "risk_score": score,
        "is_high_risk": is_high_risk
    }).execute()
    
    bot_msg_data = bot_msg.data[0]
    
    # 8. RAG용 벡터 임베딩 생성 및 Supabase 인덱싱
    try:
        # 발화 텍스트 임베딩 생성 (384차원)
        vector_data = embedding_model.embed_query(content)
        
        # Supabase vector(384)에 맞추어 인덱싱
        supabase.table("memory_vectors").insert({
            "message_id": user_msg_data["id"],
            "session_id": session_id,
            "content": content,
            "embedding": vector_data,
            "metadata": {
                "user_id": user_id,
                "emotion": top_emotion,
                "risk_score": score,
                "date": user_msg_data["created_at"]
            }
        }).execute()
        print("[AI Server] Vector indexing complete!")
    except Exception as ve:
        print(f"[AI Server] Vector indexing failed: {ve}")
        
    # 9. 응답 구성
    return ChatSendResponse(
        session_id=session_id,
        persona=routed_persona_name,
        persona_id=persona_id,
        user_message=MessageResponse(
            role="user",
            content=content,
            icon="👤",
            emotion=top_emotion,
            risk_score=score,
            is_high_risk=is_high_risk
        ),
        bot_message=MessageResponse(
            role="assistant",
            content=bot_reply,
            icon=bot_icon,
            emotion=top_emotion,
            risk_score=score,
            is_high_risk=is_high_risk
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
        # 1. Supabase custom_users 테이블에 시도
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
                "nickname": request.nickname
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
            "nickname": request.nickname
        }

@app.post("/api/auth/login")
def login(request: LoginRequest):
    try:
        # 1. Supabase custom_users 테이블에 시도
        res = supabase.table("custom_users").select("*").eq("email", request.email).execute()
        if res.data:
            user = res.data[0]
            if user["password"] == request.password:
                return {
                    "user_id": user["id"],
                    "email": user["email"],
                    "nickname": user["nickname"]
                }
            else:
                raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    except Exception as e:
        print(f"[Fallback Alert] custom_users table check failed for login. Error: {e}")
        
    # 로컬 파일 검색
    users = load_local_users()
    for uid, u in users.items():
        if u["email"] == request.email:
            if u["password"] == request.password:
                return {
                    "user_id": uid,
                    "email": u["email"],
                    "nickname": u["nickname"]
                }
            else:
                raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
                
    raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
