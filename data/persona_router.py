"""
이 파일은 [SECTION 6] 동적 페르소나 전환 시스템을 구현합니다.
우울 위험도(score) 및 고위험 키워드 감지 여부에 따라 5가지 페르소나 중 가장 적합한 것을 동적으로 선택합니다.
"""

import random

# 신규 플로우(mermaid-diagram (4).png) 기준의 5가지 페르소나 정의
PERSONA_KEYS = [
    "🦉 우울빼미",
    "🧑‍⚕️ 상담사 지우",
    "🤖 AI 어시스턴트 클로",
    "🧑‍⚕️ 멘토 선생님",
    "😄 개그맨 철수"
]

def route_persona(phq9_score: int, p4_answers: dict) -> str:
    """
    PHQ-9 점수와 P4 스크리너 개별 문항 선택값을 바탕으로 최적의 페르소나를 라우팅합니다.
    
    라우팅 규칙:
    - 고위험 ('고위험'): PHQ-9 점수 >= 20 또는 P4 고위험 기준 중 하나라도 충족 시 -> '어시스턴트 클로' (3)
      * P4 고위험 기준: Q1 == '있음' | Q2 == '있음' | Q3 in ['약간 그렇다', '매우 그렇다'] | Q4 == '없음'
    - 중증 ('중증'): PHQ-9 점수 10~19점 -> '상담사 지우' (2)
    - 경도 ('경도'): PHQ-9 점수 5~9점 -> 사용자 자율 선택 구간 (기본: '우울빼미', '멘토 선생님', '개그맨 철수')
    - 경도 ('경도'): PHQ-9 점수 0~4점 -> '우울빼미' 직접 배정
    """
    is_p4_high_risk = False
    if p4_answers:
        q1 = p4_answers.get("q1")
        q2 = p4_answers.get("q2")
        q3 = p4_answers.get("q3")
        q4 = p4_answers.get("q4")
        
        if (q1 == "있음" or 
            q2 == "있음" or 
            q3 in ["약간 그렇다", "매우 그렇다"] or 
            q4 == "없음"):
            is_p4_high_risk = True

    if phq9_score >= 20 or is_p4_high_risk:
        return "🤖 AI 어시스턴트 클로"
        
    elif phq9_score >= 10:
        return "🧑‍⚕️ 상담사 지우"
        
    elif phq9_score >= 5:
        # 경도 (5~9점): 자율 선택 구간의 기본 배정은 '우울빼미'
        return "🦉 우울빼미"
        
    else:
        # 경도 (0~4점): '우울빼미' 직접 배정
        return "🦉 우울빼미"

