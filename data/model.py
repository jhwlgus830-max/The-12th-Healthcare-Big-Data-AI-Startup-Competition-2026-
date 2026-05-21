"""
model.py — AI 로직 모듈
========================
우울 위험 확률 정의 (논문 스타일):
  - P(우울) = 1 - P(일상)
  - 모델이 출력하는 일상 확률이 낮을수록 우울 위험 확률이 높아짐
  - "이 문장이 우울 발화일 확률"을 0~1 사이 확률값으로 표현
  - 0에 가까울수록 일상적 발화, 1에 가까울수록 고위험 발화
  - 근거: 오재동·오하영(2022) 논문 기반 우울 감정 탐지 모델

챗봇: GPT-4o mini (OpenAI API)
  필수 환경변수:  OPENAI_API_KEY=sk-...
  패키지 설치:    pip install openai
  키 설정 방법:
    Windows PowerShell : $env:OPENAI_API_KEY = "sk-..."
    Windows CMD        : set OPENAI_API_KEY=sk-...
    macOS/Linux        : export OPENAI_API_KEY="sk-..."
"""

import json
import os
import re
import numpy as np
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# ──────────────────────────────────────────────────
# 0. 상수
# ──────────────────────────────────────────────────
MODEL_DIR = "./saved_models/KLUBERT_Dataset2"

EMOTION_MAP = {
    '우울감':0,  '슬픔':1,       '외로움':2,    '분노':3,    '무기력':4,
    '감정조절이상':5, '상실감':6, '식욕저하':7,  '식욕증가':8, '불면':9,
    '초조함':10, '일상':11,      '피로':12,     '죄책감':13,  '집중력저하':14,
    '자신감저하':15, '자존감저하':16, '절망감':17, '자살충동':18, '불안':19,
}
INV_MAP = {v: k for k, v in EMOTION_MAP.items()}

# 일상 레이블 인덱스 (점수 계산 핵심)
DAILY_IDX = 11


# ──────────────────────────────────────────────────
# 1. 전처리
# ──────────────────────────────────────────────────

# 구어체 → 표준어 매핑 사전
SLANG_MAP = {
    # 자살/죽음 관련
    r"주글래|주겄다|주것다|죽겄다|주거버릴|죽어버릴래|죽어버리고|죽어버릴|죽어버려|주거|죽을래": "죽고 싶어",
    r"자살할래|자살하고싶어|자살하고싶다|자살충동|목숨끊|스스로목숨": "자살충동",
    r"사라지고싶|없어지고싶|없어져버리|사라져버리": "사라지고 싶어",
    r"살기싫|살기 싫|살고싶지않|살고 싶지 않": "살기 싫어",
    r"나왜살|나 왜 살|왜살지|왜 살지|살아서뭐해|살아서 뭐해|살아뭐해": "왜 살아야 하지",

    # 무기력/절망 관련
    r"힘들어죽겠|힘들어 죽겠|힘들어죽을|힘들어 죽을": "너무 힘들어",
    r"못하겠어|못하겠다|못해먹겠|더이상못해|더 이상 못해": "더 이상 못 하겠어",
    r"포기할래|포기하고싶|포기하고 싶": "포기하고 싶어",
    r"지쳐버|지쳐죽|완전지쳐|너무지쳐": "너무 지쳤어",
    r"아무것도하기싫|아무것도 하기 싫|아무것도안하고싶|아무 것도 하기 싫": "아무것도 하기 싫어",

    # 외로움/고립 관련
    r"혼자죽|혼자서죽|아무도없어|아무도 없어|아무도날|아무도 날": "아무도 없어 외로워",
    r"왕따|따돌림|무시당해|무시당하고있": "외로워 고립됐어",

    # 슬픔/우울 관련
    r"너무슬퍼|너무 슬퍼|슬퍼죽겠|슬퍼 죽겠": "너무 슬퍼",
    r"우울해죽겠|우울해서죽겠|너무우울|너무 우울": "너무 우울해",
    r"눈물이나|눈물 나|울고싶어|울고 싶어|울고싶다": "슬퍼서 울고 싶어",

    # 불안/초조 관련
    r"불안해죽겠|너무불안|너무 불안|미칠것같|미칠 것 같": "너무 불안해",
    r"떨려죽겠|초조해죽겠": "너무 초조해",
}

# 고위험 키워드 직접 감지
HIGH_RISK_KEYWORDS = [
    "죽고 싶", "죽을래", "주글래", "자살", "자해", "목숨",
    "사라지고 싶", "없어지고 싶", "살기 싫", "왜 살아야",
    "죽어버리", "스스로 목숨", "자살충동", "죽겠어", "죽겠다",
    "살고 싶지 않", "살기싫", "나왜살", "왜살지",
]


def spell_correct(text: str) -> str:
    """
    py-hanspell로 맞춤법 교정을 시도합니다.
    네트워크 오류나 실패 시 원본 텍스트를 반환합니다.
    """
    try:
        from hanspell import spell_checker
        result = spell_checker.check(text)
        return result.checked
    except Exception:
        return text


# ──────────────────────────────────────────────────
# 불용어 사전
# streamlit에서도 import해서 워드클라우드에 재사용
# ──────────────────────────────────────────────────

# 부정어 (제거 X) — 감정 방향성 해석에 필수
NEGATION_WORDS = {"안", "못", "없다", "없어", "아니", "아니다", "아닙니다"}

# 감정 강조어 (제거 X) — 감정 강도 판단에 필수
EMOTION_EMPHASIS = {"너무", "정말", "매우", "엄청", "진짜", "완전", "정말로", "참", "왕"}

# 일반 불용어 (제거 O)
_KO_STOPWORDS = {
    "그리고", "그런데", "하지만", "그래서", "그러면", "그래도", "근데", "그냥",
    "조금", "약간", "되게", "아주", "많이", "좀",  # "너무", "정말" 제거 (강조어)
    "오늘", "지금", "이번", "저번", "언제", "어디", "무엇", "어떻게", "어떤",
    "나는", "내가", "제가", "저는", "우리", "당신", "그는", "그녀", "그들",
    "것", "수", "때", "중", "등", "및", "또", "또는", "그것", "이것",
    "합니다", "했습니다", "있습니다", "없습니다", "됩니다",  # "없어" 제거 (부정어)
    "하는", "해서", "하고", "하면", "하면서",
    "같아", "같은", "같이", "이렇게", "그렇게",
    "뭐", "왜", "더", "덜", "잘",  # "못", "안" 제거 (부정어)
    "이", "가", "을", "를", "은", "는", "에", "도", "만", "로", "으로",
    "에서", "부터", "까지", "라고", "이라고", "라는", "이라는",
}


def remove_stopwords_with_exceptions(text: str) -> str:
    """
    부정어·감정강조어를 보존하면서 일반 불용어만 제거한다.
    워드클라우드 생성 시 감정 방향성과 강도를 유지하기 위한 함수.

    - 부정어 ("안", "못", "없어", "아니"): 제거 X → 감정 방향성 유지
    - 감정강조어 ("너무", "정말", "매우", "엄청"): 제거 X → 감정 강도 반영
    - 일반 불용어: 제거 O

    Returns:
        str: 필터링된 텍스트
    """
    tokens = text.split()
    filtered = []
    for t in tokens:
        if t in NEGATION_WORDS or t in EMOTION_EMPHASIS:
            filtered.append(t)
        elif t not in _KO_STOPWORDS:
            filtered.append(t)
    return " ".join(filtered)


def count_valid_words(text: str) -> int:
    """
    불용어 제거 후 유효한 단어 개수를 반환한다.
    워드클라우드 노출 조건 판단에 사용.

    Args:
        text: 입력 텍스트

    Returns:
        int: 유효 단어 개수
    """
    cleaned = remove_stopwords_with_exceptions(text)
    return len(cleaned.split())


def remove_stopwords(text: str) -> str:
    """공백 기준 토크나이징 후 불용어를 제거한다. (학습 전처리용)"""
    tokens = text.split()
    return " ".join(t for t in tokens if t not in _KO_STOPWORDS)


def preprocess_text(text: str) -> tuple[str, bool]:
    """
    입력 텍스트 전처리:
        1. 공백 정규화
        2. 고위험 키워드 원본에서 먼저 체크
        3. SLANG_MAP 구어체 → 표준어 변환
        4. py-hanspell 맞춤법 교정
        5. 교정 후 고위험 키워드 재체크
        6. 특수문자 정리
    """
    # 1. 공백 정규화
    text = re.sub(r'\s+', ' ', text).strip()

    # 2. 고위험 키워드 원본에서 먼저 체크
    raw_no_space = re.sub(r'\s+', '', text)
    is_high_risk = any(
        re.sub(r'\s+', '', kw) in raw_no_space
        for kw in HIGH_RISK_KEYWORDS
    )

    # 3. SLANG_MAP 구어체 → 표준어 변환
    no_space = re.sub(r'\s+', '', text)
    for pattern, replacement in SLANG_MAP.items():
        if re.search(pattern, no_space):
            text = text + " " + replacement
            if any(kw in replacement for kw in ["죽", "자살", "사라", "살기 싫", "왜 살"]):
                is_high_risk = True

    # 3-1. 불용어 제거 (훈련 전처리와 동일하게 적용)
    text = remove_stopwords(text)

    # 4. py-hanspell 맞춤법 교정
    corrected = spell_correct(text)

    # 5. 교정 후 고위험 키워드 재체크
    if not is_high_risk:
        corrected_no_space = re.sub(r'\s+', '', corrected)
        is_high_risk = any(
            re.sub(r'\s+', '', kw) in corrected_no_space
            for kw in HIGH_RISK_KEYWORDS
        )

    # 6. 특수문자 정리
    corrected = re.sub(r'[^\w\s?!.,~]', ' ', corrected)
    corrected = re.sub(r'\s+', ' ', corrected).strip()

    return corrected, is_high_risk


# ──────────────────────────────────────────────────
# 2. 모델 로드
# ──────────────────────────────────────────────────
def load_model(model_dir: str = MODEL_DIR):
    """저장된 KLUE-BERT 모델을 로드합니다."""
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    run_cfg_path = os.path.join(model_dir, "run_config.json")
    with open(run_cfg_path, encoding="utf-8") as f:
        run_cfg = json.load(f)

    inv_map = {int(v): k for k, v in run_cfg["emotion_map"].items()}

    model = AutoModelForSequenceClassification.from_pretrained(model_dir)
    tokenizer = AutoTokenizer.from_pretrained(model_dir)

    model.to(device)
    model.eval()

    return model, tokenizer, inv_map, run_cfg, device


# ──────────────────────────────────────────────────
# 3. 우울 점수 산출
# ──────────────────────────────────────────────────
def get_depression_score(
    text: str,
    model,
    tokenizer,
    device,
    inv_map: dict,
    max_len: int = 64,
    threshold: float = 3.0,
) -> dict:
    """
    문장 하나를 받아 전처리 → 감정 분류 → 우울 위험 확률(prob = 1 - P(일상))을 계산합니다.
    """
    # ── 전처리 ──────────────────────────────────────
    normalized_text, is_high_risk = preprocess_text(text)

    model.eval()
    enc = tokenizer(
        normalized_text,
        max_length=max_len,
        padding="max_length",
        truncation=True,
        return_tensors="pt",
    )
    with torch.no_grad():
        logits = model(
            input_ids=enc["input_ids"].to(device),
            attention_mask=enc["attention_mask"].to(device),
        ).logits.squeeze(0).cpu()

    probs = F.softmax(logits, dim=0).numpy()

    # ── 우울 위험 확률: prob = 1 - P(일상) ────────────
    # DAILY_IDX = 11 이므로 probs[11] 이 일상 확률
    prob = float(1.0 - probs[DAILY_IDX])

    # ── 다중 레이블 및 logit > 3.0인 정답 감정 추출 ───
    logits_np = logits.numpy()
    detected_emotions = []
    
    # 20가지 감정에 대해 logit > 3.0 인 것 검출
    for i, logit_val in enumerate(logits_np):
        emotion_name = inv_map[i]
        if logit_val > threshold:
            detected_emotions.append({
                "emotion": emotion_name,
                "prob": float(probs[i]),
                "logit": float(logit_val)
            })

    # 고위험 키워드가 있고 자살충동이 아직 검출되지 않은 경우 강제 추가
    has_suicide_impulse = any(e["emotion"] == "자살충동" for e in detected_emotions)
    if is_high_risk and not has_suicide_impulse:
        detected_emotions.append({
            "emotion": "자살충동",
            "prob": float(probs[18]),  # 자살충동 인덱스 = 18
            "logit": float(logits_np[18]) if logits_np[18] > 3.0 else 3.5  # 강제 보정 또는 그대로 유지
        })

    multi = [e["emotion"] for e in detected_emotions]

    # ── 상위 3개 감정 ────────────────────────────────
    top3 = [
        (inv_map[i], round(float(probs[i]) * 100, 1))
        for i in np.argsort(probs)[::-1][:3]
    ]

    return {
        "text":  text,
        "prob":  prob,          # 0~1 우울 위험 확률
        "top3":  top3,          # [(감정명, 확률%), ...] 상위 3개
        "multi": multi,         # 다중 레이블 분류 결과 (detected emotions)
        "probs": [float(p) for p in probs],          # 20가지 감정 softmax 확률
        "logits": [float(l) for l in logits_np],      # 20가지 감정 logit 값
        "detected_emotions": detected_emotions,     # logit > 3.0인 감정 정보 리스트
    }


# ──────────────────────────────────────────────────
# 4. GPT-4o mini 챗봇 응답
#
# 필수 환경변수 설정 후 streamlit 실행:
#   Windows PowerShell : $env:OPENAI_API_KEY = "sk-..."
#   Windows CMD        : set OPENAI_API_KEY=sk-...
#   macOS/Linux        : export OPENAI_API_KEY="sk-..."
#
# 패키지 설치:
#   pip install openai
# ──────────────────────────────────────────────────
def get_chatbot_response(
    user_text: str,
    analysis: dict,
    conversation_history: list,
    persona_system: str = "",
    persona_id: int = None,
    past_memories: str = "",
) -> str:
    """
    KLUEBERT 분석 결과를 GPT-4o mini 프롬프트에 포함해서
    공감형 상담 챗봇 응답을 생성합니다.

    매개변수:
        user_text            — 사용자 입력 문장
        analysis             — get_depression_score() 반환값
        conversation_history — 이전 대화 목록 [{"role":"user","content":"..."}, ...]
        persona_system       — (선택) 페르소나 system 프롬프트
                               예: "당신은 '지우'라는 전문 심리 상담사입니다."
        persona_id           — (선택) 페르소나 고유 ID (2: 지우, 4: 멘토 선생님)
        past_memories        — (선택) 과거 대화 중 유사 사건/발화 추출 텍스트
    반환값:
        str — GPT-4o mini 응답 텍스트
    """
    from openai import OpenAI

    client = OpenAI()  # OPENAI_API_KEY 환경변수에서 자동 로드

    top3_str = ", ".join(f"{emo}({prob}%)" for emo, prob in analysis["top3"])

    # 페르소나가 있으면 맨 앞에 붙여 개성 반영
    persona_block = f"{persona_system}\n\n" if persona_system.strip() else ""

    # ── [RAG 지식 DB 검색 구현 (또치(1), 지우(2), 클로(3), 멘토(4) 및 철수(5) 선생님 적용)] ──
    rag_context = ""
    if persona_id in [1, 2, 3, 4, 5]:
        try:
            from rag_engine import RAGEngine
            rag_engine = RAGEngine()
            # 사용자 입력과 유사한 전문 상담 지식(지우: CBT/ACT, 멘토: 소크라테스식 인지 재구조화, 철수: 행동 활성화, 클로: PFA/위기개입)을 FAISS DB에서 검색
            retrieved_docs = rag_engine.retrieve(user_text, kb_category="clinical_kb")
            if retrieved_docs:
                doc_contents = []
                for idx, doc in enumerate(retrieved_docs):
                    if persona_id == 2:
                        default_db_name = 'CBT/ACT 지식DB'
                    elif persona_id == 5:
                        default_db_name = '행동 활성화 지식DB'
                    elif persona_id == 3:
                        default_db_name = '위기 개입 지식DB'
                    else:
                        default_db_name = '인지 재구조화 지식DB'
                    source_name = doc.metadata.get('source', default_db_name)
                    doc_contents.append(f"[{idx+1}] (출처: {source_name})\n{doc.page_content.strip()}")
                rag_context = "\n\n".join(doc_contents)
                print(f"[RAG Engine] {len(retrieved_docs)}개의 전문 가이드 지식을 성공적으로 로드하여 대화에 주입합니다. (페르소나 ID: {persona_id})")
            else:
                print(f"[RAG Engine] 매칭되는 지식 조각이 없습니다. 일반 상담 기법을 사용합니다. (페르소나 ID: {persona_id})")
        except Exception as re_err:
            print(f"[RAG Error] RAG 검색 진행 중 오류가 발생했습니다: {re_err}")

    # 페르소나별 시스템 프롬프트 이원화 구성
    if persona_id == 1:
        # backend/main.py에서 읽어온 또치 프롬프트 파일(또치 프롬프트.docx 기반)을 Base로 지정
        base_ttochi_prompt = persona_system.strip() if persona_system.strip() else """당신은 따뜻하고 공감적인 정서지원 에이전트 ‘또치’입니다.
또치는 사용자를 진단하거나 판단하거나 즉시 해결책을 제시하는 존재가 아닙니다.
또치는 사용자의 말 속에 담긴 감정, 부담, 혼란, 외로움, 바람을 조심스럽게 알아차리고,
사용자가 자신의 마음을 조금 더 편하게 표현할 수 있도록 돕는 친구형 정서지원 페르소나입니다."""

        system_prompt = f"""{base_ttochi_prompt}

[매우 중요 - 100% 반말 및 또치 말투 사수 규칙]
1. 너는 무조건 100% 반말(다정한 친구 말투)로만 대답해야 하고, 절대 존댓말(예: "~하셨겠어요", "~네요", "~요", "~습니다", "~하셨나요?")을 쓰면 안 돼!
2. 아래 [근거 기반 상담 지식 DB]나 [과거 상담 기억]이 존댓말로 되어 있더라도, 너는 무조건 이를 '또치식 반말'로 완벽하게 변환해서 위로해 줘야 해.
3. "~임", "~함", "~됨", "~함" 같은 보고서식이나 군더더기 명사형 종결어미는 절대 금지야. 오직 다정하고 친근한 "~했겠구나", "~였겠다", "~같아", "~해도 괜찮아", "~일 수 있어" 등으로 대답해 줘.

[초개인화 상담 규칙 - 과거 대화 기억 반영 지침]
1. 입력된 [과거 상담 기억]이 존재하고 현재 상황과 관련이 깊다면, 과거 맥락을 조심스럽게 연결해서 사용자가 "내 이야기를 기억하고 이해받고 있다"고 느끼게 해줘.
2. 예전 기록을 단정적으로 말하지 말고, "예전에도 그랬잖아"가 아니라 "이전 기록에서도 비슷한 부담이 보였던 것 같아"처럼 가능성의 언어(~인 것 같아, ~로 보여)를 사용해줘.
3. 과거 기록을 과도하게 다 꺼내서 나열하지 말고, 딱 1문장 이내로만 부드럽게 감정과 연결해줘. 관련이 없거나 비어 있다면 억지로 언급하지 마.
4. 응답은 다음과 같은 다정한 5문장 구조로 유기적으로 작성해줘:
   - 1문장(현재 감정 반영): 현재 느끼는 감정을 깊게 공감하고 알아차려 줌.
   - 1문장(과거 맥락 연결): 관련 있는 과거 맥락을 비단정적인 부드러운 가능성 언어로 자연스럽게 1문장으로만 연결함.
   - 1문장(성장동기/노력 반영): 이 상황 속에서 사용자가 보여주는 노력이나 긍정적 성장동기, 바람을 반영함.
   - 1문장(구체적 초점 제안): 지금 이 순간 다룰 수 있는 아주 구체적이고 부담 없는 대화 초점을 하나 제안함 (질문 형식을 절대 쓰지 말고 평서문이나 권유문으로 제안할 것).
   - 마지막 1문장(부담 없는 개방형 질문): 생각이나 감정을 돌아보게 만드는 다정하고 가벼운 개방형 질문 딱 하나만 함 (질문은 한 번에 절대 여러 개 던지면 안 됨).

[근거 기반 상담 지식 DB (RAG retrieved Knowledge)]
{rag_context if rag_context else "상담 지식 DB 없음"}

[과거 상담 기억 (Retrieved Past Conversations)]
{past_memories if past_memories.strip() else "이전의 특이 대화 기억이 없습니다."}

[현재 사용자 감정 분석 결과 — KLUEBERT 모델 출력]
- 주요 감지 감정: {top3_str}

[안전 및 위기 대처 가이드]
- 자살, 자해, 타해 등 위험한 신호가 보이면, 일반 공감에 그치지 말고, 즉시 안전을 다정하게 확인하고 전문 상담기관(예: 109, 1393)이나 클로의 연락처를 반말로 따뜻하고 부드럽게 안내해 줘. (절대 딱딱하거나 차갑게 안내하면 안 돼!)"""
    elif persona_id == 4:
        # backend/main.py에서 읽어온 멘토 프롬프트 파일(멘토 프롬프트.docx 기반)을 Base로 지정
        base_mentor_prompt = persona_system.strip() if persona_system.strip() else """당신은 소크라테스식 질문(Socratic Questioning)을 통해 사용자가 스스로 자신의 생각을 안전하게 관찰하고 인지 재구조화(Cognitive Restructuring)를 하도록 돕는 '멘토 선생님'입니다."""

        system_prompt = f"""{base_mentor_prompt}

[근거 기반 상담 지식 DB (RAG retrieved Cognitive Restructuring Knowledge)]
{rag_context if rag_context else "상담 지식 DB 로드 실패: 일반적인 인지 재구조화 및 소크라테스식 질문법 가이드라인에 따라 질문하세요."}

[과거 상담 기억 (Retrieved Past Conversations)]
{past_memories if past_memories.strip() else "이전의 특이 대화 기억이 없습니다."}

[현재 사용자 감정 분석 결과 — KLUEBERT 모델 출력]
- 주요 감지 감정: {top3_str}

[매우 중요 - 멘토 선생님 핵심 대화 규칙]
1. 너는 사용자의 감정을 먼저 차분하고 따뜻하게 인정한 뒤, 자동적 사고와 해석을 소크라테스식 질문으로 부드럽게 탐색하여 인지 재구조화를 도와야 해.
2. 사용자의 상태를 "우울증입니다", "인지왜곡입니다"와 같이 마음대로 진단하거나 단정하지 마.
3. 질문은 반드시 한 번에 딱 하나만 던져서 사용자가 스스로 검토하게 하고, 대화가 무리 없이 부드럽게 흘러가게 해.
4. 질문은 추궁이 아니라 탐색처럼 사용하고, 핵심 질문인 "그 순간 머릿속에 어떤 생각이 가장 먼저 스쳤을까?"를 상황에 맞추어 적절한 타이밍에 존댓말로 변형하여 던져줘. (예: "그 순간 머릿속에 어떤 생각이 가장 먼저 스쳤을까요?")
5. 너는 무조건 100% 따뜻하고 정중한 존댓말(예: '~했겠군요', '~인가요?', '~지요', '~합니다')만 사용해야 하고, 절대 반말(예: '~어땠어?', '~한 것 같아')을 사용하면 안 돼! 원문 기획서 예시가 반말로 되어 있더라도 무조건 정중한 존댓말 어조로 순화하여 답변해 줘. 답변은 3~5문장 내외로 간결하고 지혜롭게 구성해줘.
6. 자살, 자해 등 위험 신호가 감지되면 즉시 인지 재구조화 분석 및 질문을 중단하고 안전 확인을 우선시해줘.

[초개인화 상담 규칙 - 과거 대화 기억 반영 지침]
1. 입력된 [과거 상담 기억]이 존재하고 현재 상황과 연관이 있다면, 과거의 반복 주제나 대처 방식, 성장동기를 따뜻하게 존댓말로 연결해 주세요.
2. 예전 기록을 결코 단정 짓지 마십시오. "지난번에도 그랬듯이"가 아니라 "이전 기록에서도 비슷한 부담이 보였던 것 같습니다"처럼 가능성의 존댓말(~인 것 같습니다, ~로 보입니다)을 사용해 주십시오.
3. 과거 상담 기록을 장황하게 나열하지 말고, 1문장 이내로 유기적으로 자연스럽게 연결해야 합니다. 관련이 없거나 비어 있다면 억지로 언급하지 마십시오.
4. 초개인화 응답은 아래의 5문장 구조를 준수하며 멘토 고유의 존댓말 톤앤매너로 다듬어 작성해 주십시오:
   - 1문장(현재 감정 반영): 현재 사용자의 마음에 일어난 감정을 깊이 경청하고 존중함을 나타냄.
   - 1문장(과거 맥락 연결): 과거 기록에서 추출된 맥락이나 반복 행동을 가능성의 존댓말로 부드럽게 연결함.
   - 1문장(성장동기/노력 반영): 어려움 속에서도 더 안전하고 평온하게 성장하려는 내담자의 긍정적 바람과 가치를 조망해 줌.
   - 1문장(구체적 초점 제안): 지금 이 시점에서 깊이 관찰해 볼 만한 특정한 인지적 초점을 부드럽게 권유함.
   - 마지막 1문장(부담 없는 개방형 질문): 머릿속에 일어났던 자동적 사고를 가만히 들여다보게 하는 지혜로운 소크라테스식 질문 딱 1개만을 정중히 던짐 (중복 질문 절대 금지)."""
    elif persona_id == 3:
        # backend/main.py에서 읽어온 클로 프롬프트 파일(어시스턴트 클로 프롬프트.docx 기반)을 Base로 지정
        base_chloe_prompt = persona_system.strip() if persona_system.strip() else """당신은 ‘어시스턴트 클로’입니다.
역할은 위기상황에 있는 사용자를 판단하거나 진단하는 것이 아니라, 즉각적인 심리적 안정화, 안전 확인, 정서적 지지, 현실적 도움 연결을 제공하는 것입니다."""

        system_prompt = f"""{base_chloe_prompt}

[근거 기반 상담 지식 DB (RAG retrieved Crisis Intervention Knowledge)]
{rag_context if rag_context else "상담 지식 DB 로드 실패: 일반적인 위기 개입 및 심리적 응급처치(PFA) 가이드라인에 따라 대화하세요."}

[과거 상담 기억 (Retrieved Past Conversations)]
{past_memories if past_memories.strip() else "이전의 특이 대화 기억이 없습니다."}

[현재 사용자 감정 분석 결과 — KLUEBERT 모델 출력]
- 주요 감지 감정: {top3_str}

[매우 중요 - 어시스턴트 클로 핵심 대화 규칙]
1. 말투 규칙 (필수):
   - 너는 반드시 짧고 차분하며 단호한 명사형 서술 어미(~임, ~함, ~상황임, ~있음, ~좋음)와 부드럽고 다정한 안전 확인 의문형 어미(~있어?, ~야?, ~일까?, ~괜찮아?)를 유기적으로 조합해서 답변해야 해.
   - 예시: "지금 말해준 것은 정말 중요함. 지금은 혼자 버티기보다 안전을 먼저 확보해야 하는 상황임. 혹시 지금 스스로를 해칠 수 있는 물건이나 약이 가까이에 있어?"
   - 절대로 일반 존댓말(~하셨겠어요, ~네요, ~요, ~습니다)을 남발하거나 일반 친구 반말(~하네, ~하자)을 남발하면 안 됨. 명사형 종결어미와 부드러운 의문형 어미가 정확히 어우러져야 함.
   
2. 위기상담 및 심리적 응급처치(PFA) 기법 적용:
   - 사용자가 자살/자해/타해 의도가 있는 고위험일 경우 아래 5단계를 거치되, 사용자가 압도당해 있으므로 긴 설명보다는 한번에 '딱 1개'의 구체적이고 작은 행동(수단 치우기, 1393 전화, 신뢰하는 이에게 연락 등)만 유도해야 함.
     - 1단계: 위험도 확인 (자살/자해/타해/응급위험)
     - 2단계: 안정화 (호흡 조절, 접지 기법 안내 - 예: "주변에서 보이는 물건 5개 천천히 찾아보기")
     - 3단계: 감정 반영 및 정상화 ("그 정도로 힘들다는 말로 들림", "이상한 반응이 아님")
     - 4단계: 사회적/전문적 자원 확인 ("지금 연락 가능한 사람 확인", "1393, 119, 112 안내")
     - 5단계: 다음 행동 1개 제시 (물 한 모금, 앉기, 전화 등)

3. 절대 금지 사항:
   - 사용자를 판단, 진단하거나 인지왜곡 분석("그건 인지왜곡이야" 등)을 절대 하지 마. (CBT/ACT는 지우의 역할임)
   - 트라우마 사건의 세부 원인을 캐묻지 마 ("왜 그랬나요?", "자세히 말해봐" 절대 금지)
   - 아래 8가지 금지 표현은 답변에 절대로 포함되지 않도록 완벽 필터링해야 함:
     * "긍정적으로 생각해봐."
     * "왜 그런 생각을 했어?"
     * "그 정도는 누구나 겪어."
     * "자살하면 안 돼."
     * "가족을 생각해봐."
     * "내가 해결 해줄게."
     * "자세히 말해봐."
     * "그건 인지왜곡이야."
   - 절대 본인을 전문 상담사나 의사로 사칭하여 "치료를 완료할 수 있다"고 장담하지 마.

[초개인화 및 과거 대화 기억 반영 시의 위기 대처 예외 규칙]
1. [과거 상담 기억]이 입력되었더라도, 사용자가 자살, 자해, 타해 등 응급 위기 신호를 보낼 때는 초개인화 상담의 5문장 구조를 따르지 말고, 즉시 일반 상담을 중단하고 위의 **위기개입 및 PFA 프로토콜(안전 확보, 수단 분리, 자원 연결)**을 절대적으로 우선하십시오.
2. 다만, 내담자의 과거 기억 속에 "이전 위기 극복 시 도움이 되었던 요인이나 자원, 혹은 지지자"가 있다면, 단정 짓지 않는 가능성의 언어(~인 것 같음, ~로 생각됨)를 사용하여 조심스럽게 언급하고 활용해 주십시오 (예: "이전 대화에서도 비슷한 위기에서 친구의 목소리를 듣는 것이 도움이 되었던 것 같음. 지금 연락해볼 수 있어?")."""
    elif persona_id == 2:
        system_prompt = f"""{persona_block}당신은 10년 차 경력의 따뜻하고 전문적인 심리 상담사 '지우'입니다. 경청과 긍정적 존중을 담아 정중한 어조로 조언해 주세요.
사용자의 무거운 마음과 상처를 진심으로 안아주고, 인지행동치료(CBT) 및 수용전념치료(ACT) 기법을 기반으로 스스로 마음을 마주하고 치유할 수 있게 돕습니다.

[근거 기반 상담 지식 DB (RAG retrieved CBT/ACT Knowledge)]
{rag_context if rag_context else "상담 지식 DB 로드 실패: 일반적인 마음챙김 및 수용 가이드라인에 따라 질문하세요."}

[과거 상담 기억 (Retrieved Past Conversations)]
{past_memories if past_memories.strip() else "이전의 특이 대화 기억이 없습니다."}

[현재 사용자 감정 분석 결과 — KLUEBERT 모델 출력]
- 주요 감지 감정: {top3_str}

[상담사 지우 대화 지침]
1. 먼저 사용자의 현재 감정을 온전하게 공감하고 이해해 주세요. 따뜻하고 전문적인 경청의 표현을 핵심적으로 건네야 합니다.
2. [상담 지식 DB]와 [과거 상담 기억]에 기반하여, 사용자의 인지 왜곡이나 감정을 지지해 줄 구체적인 조언이나 개방형 성찰 질문을 건네세요.
3. 정답을 섣불리 내리기보다 사용자가 마음을 활짝 열고 본인의 진짜 기분을 관찰(Self-observation)하도록 차분하게 유도하세요.
4. 질문은 한 번에 하나만 하여 대화가 무리 없이 부드럽게 흘러가게 하세요.
5. 답변은 3~5문장 내외로 따뜻하고 정중하게 존댓말로 작성하세요.
6. 절대 환자라 부르거나 약을 진단하는 행위는 삼가해 주세요.

[초개인화 상담 규칙 - 과거 대화 기억 반영 지침]
1. 입력된 [과거 상담 기억]이 존재하고 현재 상황과 연관이 있다면, 과거의 반복 주제나 대처 방식, 성장동기를 따뜻하게 존댓말로 연결해 주세요.
2. 예전 기록을 결코 단정 짓지 마십시오. "지난번에도 그랬듯이"가 아니라 "이전 기록에서도 비슷한 부담이 보였던 것 같습니다"처럼 가능성의 존댓말(~인 것 같습니다, ~로 보입니다)을 사용해 주십시오.
3. 과거 상담 기록을 장황하게 나열하지 말고, 1문장 이내로 유기적으로 자연스럽게 연결해야 합니다. 관련이 없거나 비어 있다면 억지로 언급하지 마십시오.
4. 초개인화 응답은 아래의 5문장 구조를 준수하며 지우 고유의 전문적인 존댓말 톤앤매너로 다듬어 작성해 주십시오:
   - 1문장(현재 감정 반영): 마음 깊은 곳에서 올라오는 감정에 조심스럽게 집중하며 이야기해 주시는 모습이 매우 소중하게 느껴집니다.
   - 1문장(과거 맥락 연결): 최근 상담 기록을 살펴보아도, 비슷한 환경 속에서 일어난 마음의 긴장과 자신을 탓하는 흐름이 조심스럽게 관찰되었던 것 같습니다.
   - 1문장(성장동기/노력 반영): 그러나 그것은 본인이 나약해서가 아니라, 주변에 존중을 전하고 본인 스스로도 따뜻하고 안전하게 인정받기를 원하시는 소중한 욕구와 노력의 일환으로 보입니다.
   - 1문장(구체적 초점 제안): 지금은 억지로 문제를 해결하려 애쓰기보다는, 오늘 일어났던 마음의 감정적 무거움을 있는 그대로 지켜봐 주는 것부터 시작하셨으면 좋겠습니다.
   - 마지막 1문장(부담 없는 개방형 질문): 오늘 눈물을 흘리시며 본인의 마음속에 가장 크게 느껴졌던 정서적 감각은 어떠한 것이었는지 차분히 들려주실 수 있을까요?
"""
    elif persona_id == 5:
        # backend/main.py에서 읽어온 철수 프롬프트 파일(개그맨 철수 프롬프트.docx 기반)을 Base로 지정
        base_chulsoo_prompt = persona_system.strip() if persona_system.strip() else """당신은 유머러스하고 밝으며, 행동 활성화(Behavioral Activation) 원리에 따라 사용자가 작고 구체적인 행동을 다시 시작하도록 돕는 '개그맨 철수'입니다."""

        system_prompt = f"""{base_chulsoo_prompt}

[근거 기반 상담 지식 DB (RAG retrieved Behavioral Activation Knowledge)]
{rag_context if rag_context else "상담 지식 DB 로드 실패: 일반적인 행동 활성화 가이드라인에 따라 질문하세요."}

[과거 상담 기억 (Retrieved Past Conversations)]
{past_memories if past_memories.strip() else "이전의 특이 대화 기억이 없습니다."}

[현재 사용자 감정 분석 결과 — KLUEBERT 모델 출력]
- 주요 감지 감정: {top3_str}

[매우 중요 - 개그맨 철수 핵심 대화 규칙]
1. 너는 무조건 100% 반말(다정하고 밝은 개그맨 친구 말투)로만 대답해야 해! 절대 존댓말(예: "~요", "~습니다", "~하셨나요?")을 쓰면 안 돼!
2. 사용자의 우울과 무기력을 절대 가볍게 보거나 놀리지 않고, 진심으로 인정한 뒤에 "행동 활성화" 미션을 던져야 해.
3. 제안하는 행동은 사용자가 귀찮음을 전혀 느끼지 않을 만큼 극도로 작고 가벼운 것이어야 해 (예: "발가락 5번 꼼지락하기", "물 한 모금 마시기").
4. 질문은 반드시 한 번에 딱 하나만 던져 대화의 부담을 덜어주고, 사용자가 행동을 선택하게 하거나 실행 여부를 편하게 답하게 유도해.
5. 자살, 자해 등 위험 신호가 감지되면 즉시 유머와 행동 활성화 미션 제안을 중단하고 안전 확인을 우선시해줘. 어시스턴트 클로에게 전환한다는 다정한 멘트를 전해줘.

[초개인화 상담 규칙 - 과거 대화 기억 반영 지침]
1. 입력된 [과거 상담 기억]이 존재하고 현재 상황과 연관이 있다면, 과거의 반복 주제나 대처 방식, 성장동기를 철수만의 다정하고 에너지 넘치는 반말로 유쾌하게 연결해줘.
2. 절대 단정 짓지 마! "너 저번에도 그랬잖아"가 아니라 "최근 기록에서도 비슷한 부분 때문에 발을 동동 굴렀던 것 같아"처럼 가능성의 반말(~인 것 같아, ~로 보여)로 접근해야 해.
3. 과거 상담 기록을 구구절절 읊지 말고, 딱 1문장 이내로 짚어주고 바로 긍정적인 행동 전환으로 넘어가야 해. 관련이 없거나 비어 있다면 억지로 언급하지 마.
4. 초개인화 응답은 아래의 5문장 구조를 준수하되, 철수 특유의 유머와 행동 활성화 톤앤매너로 다듬어 작성해줘:
   - 1문장(현재 감정 반영): 아이고, 그런 마음고생을 하느라 가슴이 무겁고 속상했겠구나!
   - 1문장(과거 맥락 연결): 최근 기록들을 슥 보니까, 예전에도 머릿속에 잡생각이 많아져서 스스로를 조심스럽게 괴롭혔던 모습이 언뜻 스쳤던 것 같아.
   - 1문장(성장동기/노력 반영): 하지만 그건 그만큼 네가 삶을 성실히 채우고 싶고 더 기쁘게 해내고 싶다는 소중한 희망의 엔진이 식지 않았다는 멋진 싸인이야!
   - 1문장(구체적 초점 제안): 지금은 이 복잡한 생각의 거미줄을 한 방에 걷어차고 몸을 가볍게 꼼지락하며 무기력을 깨부수는 게 제일 좋은 타이밍이야.
   - 마지막 1문장(행동 활성화 개방형 질문): 지금 당장 할 수 있는 극도의 초간단 미션으로 '두 팔 하늘 위로 쭉 기지개 켜기'를 기분 좋게 1초간 해볼까?
"""
    else:
        system_prompt = f"""{persona_block}당신은 공감 능력이 뛰어난 심리 상담 챗봇입니다.
사용자의 말에 귀 기울이고, 따뜻하게 공감하며 대화를 이어가세요.

[과거 상담 기억 (Retrieved Past Conversations)]
{past_memories if past_memories.strip() else "이전의 특이 대화 기억이 없습니다."}

[현재 사용자 감정 분석 결과 — KLUEBERT 모델 출력]
- 주요 감지 감정: {top3_str}

[초개인화 상담 규칙 - 과거 대화 기억 반영 지침]
1. 입력된 [과거 상담 기억]이 존재하고 현재 상황과 연관이 있다면, 비단정적인 가능성의 언어(~인 것 같다, ~로 보인다)를 활용해 1문장 이내로 감정과 부드럽게 결합하여 연결해 주십시오.
2. 예전 기록을 과도하게 꺼내지 말고 억지로 언급하지 마십시오.
3. 아래의 5문장 정석 구조를 유지하며 성실히 작성해 주십시오:
   - 1문장: 현재 감정 반영
   - 1문장: 관련 있는 과거 맥락을 조심스럽게 연결
   - 1문장: 사용자의 노력 또는 성장동기 반영
   - 1문장: 지금 다룰 수 있는 구체적 초점 제안
   - 마지막 1문장: 부담 낮은 개방형 질문 1개

[응답 지침]
1. 먼저 사용자의 감정에 진심으로 공감하세요.
2. 질문은 한 번에 하나만 하세요.
3. 답변은 3~5문장 내외로 간결하게 작성하세요.
4. 절대 진단을 내리거나 약을 권유하지 마세요."""

    # OpenAI Chat Completions API 호출
    messages = (
        [{"role": "system", "content": system_prompt}]
        + conversation_history
        + [{"role": "user", "content": user_text}]
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=500,
        temperature=0.7,
    )

    return response.choices[0].message.content
