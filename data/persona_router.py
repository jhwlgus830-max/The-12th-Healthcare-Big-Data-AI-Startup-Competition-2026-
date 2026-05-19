"""
이 파일은 [SECTION 6] 동적 페르소나 전환 시스템을 구현합니다.
우울 위험도(score) 및 고위험 키워드 감지 여부에 따라 5가지 페르소나 중 가장 적합한 것을 동적으로 선택합니다.
"""

import random

# 신규 플로우(mermaid-diagram (4).png) 기준의 5가지 페르소나 정의
PERSONA_KEYS = [
    "🦔 또치 (Tochi)",                  # Persona 1: 따뜻하고 아동적인 일상 공감 (저위험 및 자율 선택)
    "👩 상담사 지우 (Jiwoo)",             # Persona 2: 전문 CBT-ACT 심층 상담 (중등도 위험)
    "🤍 어시스턴트 클로 (Cloe)",          # Persona 3: 위기개입 및 안전 서약서 (고위험 - P4 >= 1 또는 PHQ-9 >= 20)
    "🌿 토닥 선생님 (민트 선생님)",        # Persona 4: 소크라테스식 문답 및 인지오류 교정 (자율 선택)
    "🏡 마음치유 챗봇 (가드너 현수)"       # Persona 5: 마음챙김 명상 및 웰니스 일기 (자율 선택)
]

def route_persona(phq9_score: int, p4_score: int, is_safety_threat: bool = False) -> str:
    """
    PHQ-9 점수와 P4 스크리너 점수, 실시간 위기 발화 여부를 바탕으로 최적의 페르소나를 라우팅합니다.
    
    라우팅 규칙:
    - 실시간 위기 발화 위협 감지(is_safety_threat) ➔ 즉시 '어시스턴트 클로'로 강제 전환
    - 1단계 고위험군: P4점수 >= 1 또는 PHQ-9점수 >= 20 ➔ '어시스턴트 클로' (위기대응 및 응급)
    - 2단계 중등도 위험군: P4점수 == 0 이고 PHQ-9점수 10~19점 ➔ '상담사 지우' (전문 심리상담)
    - 3단계 정상 ~ 경도 위험군: P4점수 == 0 이고 PHQ-9점수 5~9점 ➔ 사용자 자율 선택 노드 (기본: '또치', '민트 선생님', '가드너 현수')
    - 4단계 최소 우울: P4점수 == 0 이고 PHQ-9점수 0~4점 ➔ '또치' 직접 배정
    """
    if is_safety_threat or p4_score >= 1 or phq9_score >= 20:
        return "🤍 어시스턴트 클로 (Cloe)"
        
    elif phq9_score >= 10:
        return "👩 상담사 지우 (Jiwoo)"
        
    elif phq9_score >= 5:
        # 정상~경도: 자율 선택에 들어가며 기본값 배정 시 지능적인 3지 선다 지원 가능
        return "🦔 또치 (Tochi)"
        
    else:
        return "🦔 또치 (Tochi)"
