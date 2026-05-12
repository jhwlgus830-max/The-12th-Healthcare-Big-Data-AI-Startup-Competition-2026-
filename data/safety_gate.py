"""
이 파일은 [SECTION 8] 안전장치 (MIND-SAFE)를 구현합니다.
모든 기능에 우선하는 Bypass Layer이며, 위기 상황 감지 시 LLM 호출을 차단하고 
안전 위기대응 프로토콜을 수행합니다.
"""

from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from db_schema import RiskExpression, P4Screener
from model import HIGH_RISK_KEYWORDS
import re

# 사전에 정의된 안전 메시지 (LLM 임의 생성 금지)
SAFE_FALLBACK_MESSAGE = """
[시스템 자동 응답]
지금 매우 힘들고 지친 상황이신 것 같습니다. 
이런 마음을 혼자 견디게 하고 싶지 않습니다.
안전을 위해 아래의 전문 상담 기관으로 즉시 연락해 주시기를 간곡히 부탁드립니다.

☎ 자살예방상담전화: 1393 (24시간)
☎ 정신건강위기상담전화: 1577-0199 (24시간)
☎ 보건복지상담센터: 129 (24시간)
"""

class SafetyGate:
    def __init__(self, db_session: Session):
        self.db = db_session

    def check_safety(self, text: str, user_id: int, msg_id: int, analysis: Dict[str, Any]) -> Tuple[bool, str, str]:
        """
        위기 상황인지 판단하고, 위험하다면 bypass 응답과 함께 위험 로그를 기록합니다.
        
        작동 조건:
        1. HIGH_RISK_KEYWORDS 매칭
        2. KLUE-BERT 자살충동 라벨(인덱스 18) 확률 >= 0.3
        3. P4 Screener의 ideation == "Yes"
        
        Returns:
            Tuple[bool, str, str]: (Bypass_Triggered, Bypass_Message, Severity)
        """
        is_high_risk = False
        matched_keyword = ""
        severity = "low"
        
        # 1. HIGH_RISK_KEYWORDS 체크
        text_no_space = re.sub(r'\s+', '', text)
        for kw in HIGH_RISK_KEYWORDS:
            if re.sub(r'\s+', '', kw) in text_no_space:
                is_high_risk = True
                matched_keyword = kw
                severity = "high"
                break
                
        # 2. KLUE-BERT 자살충동 확률 (인덱스 18) 체크
        if not is_high_risk and "probs" in analysis:
            suicide_prob = float(analysis["probs"][18])
            if suicide_prob >= 0.3:
                is_high_risk = True
                matched_keyword = "자살충동 라벨 감지"
                severity = "high"

        # 3. P4 Screener 결과 체크
        if not is_high_risk:
            p4 = self.db.query(P4Screener).filter(
                P4Screener.user_id == user_id
            ).order_by(P4Screener.created_at.desc()).first()
            
            if p4 and p4.ideation == "yes":
                is_high_risk = True
                matched_keyword = "P4 자살사고(yes) 이력"
                severity = "high"

        # DB에 위험 발화 로깅
        if is_high_risk:
            risk_record = RiskExpression(
                msg_id=msg_id,
                keyword_matched=matched_keyword,
                severity=severity,
                bypass_triggered=True
            )
            self.db.add(risk_record)
            self.db.commit()
            
            # 여기서 RAG가 crisis_kb만 검색하도록 유도하는 로직은 
            # 외부(app.py나 통합 엔진)에서 수행하거나, 
            # 이 함수 반환값에 따라 SAFE_FALLBACK_MESSAGE와 함께 처리합니다.
            return True, SAFE_FALLBACK_MESSAGE, severity
            
        return False, "", "low"
