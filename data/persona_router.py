"""
이 파일은 [SECTION 6] 동적 페르소나 전환 시스템을 구현합니다.
우울 위험도(score) 및 고위험 키워드 감지 여부에 따라 5가지 페르소나 중 가장 적합한 것을 동적으로 선택합니다.
"""

import random

# mallang_최종파일.py 171~267줄에 정의된 페르소나 키값들
PERSONA_KEYS = [
    "🦔 고슴도치 또치",   # 라포 형성 (양호/경도)
    "😄 개그맨 철수",      # 라포 형성 (양호/경도)
    "🧑‍⚕️ 상담사 지우",   # MIND 프레임워크 (중증)
    "🧑‍⚕️ 멘토 선생님",   # 소크라테스식 질문 (중증)
    "🤖 AI 어시스턴트 클로" # LLM Bypass / MIND-SAFE 프로토콜 (고위험)
]

def route_persona(score: float, is_high_risk: bool) -> str:
    """
    우울 점수와 고위험 여부를 바탕으로 다음 대화에 사용할 페르소나를 결정합니다.
    
    라우팅 규칙:
    - HIGH_RISK_KEYWORDS 감지 → 즉시 클로 (MIND-SAFE 적용됨)
    - score >= 0.60 (고위험) → 클로
    - 0.35 <= score < 0.60 (중증) → 지우 또는 멘토
    - score < 0.35 (양호/경도) → 또치 또는 철수
    """
    if is_high_risk or score >= 0.60:
        return "🤖 AI 어시스턴트 클로"
    
    elif score >= 0.35:
        # 중증의 경우 상담사 지우나 멘토 선생님 중 랜덤 선택 또는 번갈아가며 사용 (여기서는 랜덤)
        return random.choice(["🧑‍⚕️ 상담사 지우", "🧑‍⚕️ 멘토 선생님"])
        
    else:
        # 양호/경도의 경우 또치나 철수 중 랜덤 선택
        return random.choice(["🦔 고슴도치 또치", "😄 개그맨 철수"])
