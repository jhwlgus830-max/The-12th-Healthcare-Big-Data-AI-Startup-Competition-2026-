"""
이 파일은 [SECTION 7] 상담자 대시보드 데이터 생성을 구현합니다.
상담자 PPT Slide 2~7의 모든 화면에 들어가는 데이터를 백엔드에서 JSON 구조의 Dict로 미리 생성합니다.
"""

from typing import Dict, List, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
import json

from db_schema import (
    User, Message, EmotionAnalysis, RiskExpression, 
    Phq9Estimate, CognitiveDistortion, P4Screener, CognitiveDistortionType
)

class CounselorDashboardBackend:
    def __init__(self, db_session: Session):
        self.db = db_session

    def get_dashboard_main(self, counselor_id: str) -> Dict[str, Any]:
        """7-1. 대시보드 메인 (PPT Slide 2)"""
        # 임시 데이터 + DB 카운트 조합
        total_users = self.db.query(User).count()
        high_risk_users = self.db.query(User).join(Phq9Estimate).filter(
            Phq9Estimate.severity.in_(['중증', '위험'])
        ).distinct().count()
        
        # 최근 위험 발화 발생 내담자 조회
        recent_risks = self.db.query(User.pseudo_name, RiskExpression.severity).join(
            Message, User.user_id == Message.user_id
        ).join(
            RiskExpression, Message.msg_id == RiskExpression.msg_id
        ).filter(RiskExpression.severity == 'high').limit(3).all()

        focus_monitoring = []
        for name, severity in recent_risks:
            focus_monitoring.append({
                "name": name,
                "risk": "고위험" if severity == 'high' else "중증",
                "summary": "최근 고위험 발화 감지 및 위험도 상승"
            })

        if not focus_monitoring:
            focus_monitoring = [
                {"name": "정우성", "risk": "고위험", "summary": "최근 우울 척도 상승, 약물 복용 불규칙 호소"}
            ]

        return {
            "counselor_name": "김상담",
            "active_clients": total_users if total_users > 0 else 42,
            "high_risk_cases": high_risk_users if high_risk_users > 0 else 3,
            "today_sessions": 5,
            "next_appointments": ["14:00 김지훈", "16:00 박지연"],
            "focus_monitoring": focus_monitoring,
            "recent_activities": ["김지훈 님 RAG 바이패스 발동 (1393 노출)", "이영희 님 PHQ-9 검사 완료"]
        }

    def get_client_list(self) -> List[Dict[str, Any]]:
        """7-2. 담당 내담자 통합 목록 (PPT Slide 3)"""
        clients = []
        users = self.db.query(User).all()
        for u in users:
            phq = self.db.query(Phq9Estimate).filter(Phq9Estimate.user_id == u.user_id).order_by(desc(Phq9Estimate.created_at)).first()
            p4 = self.db.query(P4Screener).filter(P4Screener.user_id == u.user_id).order_by(desc(P4Screener.created_at)).first()
            
            risk_level = "낮음"
            if phq and phq.severity in ["중증", "위험"]: risk_level = "높음"
            
            clients.append({
                "client_id": f"CL-{u.user_id}",
                "client_name": u.pseudo_name,
                "risk_level": risk_level,
                "suicide_risk": p4.ideation if p4 else "No",
                "phq9": phq.total_score if phq else "-",
                "p4": "위험" if p4 and p4.ideation == 'yes' else "안전",
                "summary": "대화 이력 분석 완료",
                "last_update": u.joined_at.strftime("%Y-%m-%d") if u.joined_at else ""
            })
            
        # 위험도 정렬 기본값 = 높은 순
        clients.sort(key=lambda x: 1 if x["risk_level"] == "높음" else 0, reverse=True)
        return clients

    def get_client_report(self, user_id: int) -> Dict[str, Any]:
        """7-3. 내담자 리포트 (PPT Slide 4)"""
        user = self.db.query(User).filter(User.user_id == user_id).first()
        if not user: return {}

        phq = self.db.query(Phq9Estimate).filter(Phq9Estimate.user_id == user_id).order_by(desc(Phq9Estimate.created_at)).first()
        p4 = self.db.query(P4Screener).filter(P4Screener.user_id == user_id).order_by(desc(P4Screener.created_at)).first()
        
        # 위험 발화 로그
        risks = self.db.query(RiskExpression, Message.text).join(
            Message, RiskExpression.msg_id == Message.msg_id
        ).filter(Message.user_id == user_id).order_by(desc(RiskExpression.created_at)).limit(5).all()

        risk_logs = []
        for r, text in risks:
            risk_logs.append({
                "datetime": r.created_at.strftime("%Y-%m-%d %H:%M"),
                "text": text,
                "severity": "높음" if r.severity == 'high' else "중간"
            })

        return {
            "client_id": f"CL-{user.user_id}",
            "client_name": user.pseudo_name,
            "age": user.age,
            "gender": user.gender,
            "risk_level": "고위험" if (phq and phq.severity == '위험') or (p4 and p4.ideation == 'yes') else "일반",
            "checkup_summary": {
                "phq9": {
                    "score": phq.total_score if phq else 0,
                    "max": 27,
                    "interpretation": phq.severity if phq else "미검사",
                    "method": phq.method if phq else "none"
                },
                "p4_screener": {
                    "ideation": p4.ideation.capitalize() if p4 else "No",
                    "plan": p4.plan.capitalize() if p4 else "No",
                    "protective_factor": p4.protective_factor.capitalize() if p4 else "Strong"
                }
            },
            "emotion_trend_30d": {
                "dates": ["10-20", "10-23", "10-25", "10-28"],
                "depression": [30, 45, 60, 80],
                "despair": [10, 20, 50, 75],
                "helplessness": [40, 50, 55, 65]
            },
            "risk_expression_log": risk_logs,
            "emotion_distribution_top6": [
                {"emotion": "절망", "pct": 62.1},
                {"emotion": "무기력", "pct": 28.7},
                {"emotion": "외로움", "pct": 3.7},
                {"emotion": "불안", "pct": 2.5},
                {"emotion": "우울", "pct": 2.0},
                {"emotion": "분노", "pct": 1.0}
            ]
        }

    def get_cognitive_distortions_summary(self, user_id: int) -> Dict[str, Any]:
        """7-4. 인지왜곡 종합 빈도 (PPT Slide 5)"""
        distortions = self.db.query(CognitiveDistortion.distortion_type, func.count(CognitiveDistortion.cd_id)).join(
            Message, CognitiveDistortion.msg_id == Message.msg_id
        ).filter(Message.user_id == user_id).group_by(CognitiveDistortion.distortion_type).all()
        
        freq_dict = {d_type.value: count for d_type, count in distortions}
        
        result = []
        for dt in CognitiveDistortionType:
            count = freq_dict.get(dt.value, 0)
            level = "높음" if count >= 5 else ("중간" if count >= 2 else "낮음")
            result.append({
                "type": dt.value,
                "count": count,
                "level": level
            })
            
        return {"distortions": result}

    def get_cognitive_distortion_detail(self, user_id: int, distortion_type_val: str) -> Dict[str, Any]:
        """7-5. 인지왜곡 상세 (PPT Slide 6)"""
        # 타입에 대한 enum 찾기
        dt_enum = next((e for e in CognitiveDistortionType if e.value == distortion_type_val), None)
        if not dt_enum: return {}

        records = self.db.query(CognitiveDistortion.evidence_sentence).join(
            Message, CognitiveDistortion.msg_id == Message.msg_id
        ).filter(
            Message.user_id == user_id,
            CognitiveDistortion.distortion_type == dt_enum
        ).order_by(desc(Message.created_at)).limit(3).all()
        
        quotes = [r[0] for r in records]

        return {
            "type": distortion_type_val,
            "description": "관련된 핵심 개념 설명입니다.",
            "frequency": f"매우 흔함, 전체 세션 중 {len(quotes)}회 관찰됨" if len(quotes) > 0 else "관찰되지 않음",
            "quotes": quotes,
            "tags": ["Perfectionism", "Obsessive Tendencies"],
            "empathy_prompt": f"최근에 {distortion_type_val}적인 생각으로 많이 힘드셨군요. 그 생각의 근원을 같이 천천히 찾아볼까요?"
        }

    def get_intervention_guide(self, user_id: int) -> Dict[str, Any]:
        """7-6. 시스템 추천 개입 가이드 (PPT Slide 7)"""
        # 고위험 여부 체크
        phq = self.db.query(Phq9Estimate).filter(Phq9Estimate.user_id == user_id).order_by(desc(Phq9Estimate.created_at)).first()
        is_urgent = phq and phq.severity in ['중증', '위험']
        
        if is_urgent:
            return {
                "urgent_action_required": True,
                "checklist": [
                    "혼자 있는지 확인 및 주변인 유무 파악",
                    "자살계획의 구체성 및 수단 접근성 확인",
                    "보호자 연락 취함 또는 유관 기관(119, 1393) 연결 검토"
                ],
                "empathy_prompt": "지금 얼마나 힘드신지 제가 다 알 수는 없겠지만, 이 상황을 혼자 견디게 하고 싶지 않아요. 제가 안전하게 도와드릴 수 있도록 지금 어디 계신지 말씀해 주실 수 있을까요?",
                "external_referral_options": ["전화 상담", "방문 상담", "타 기관 연계"]
            }
        else:
            return {
                "urgent_action_required": False,
                "checklist": [
                    "인지왜곡 점진적 수정 (CBT 접근)",
                    "일상 루틴 회복 격려",
                    "다음 상담 일정 예약"
                ],
                "empathy_prompt": "이번 주에 스스로를 잘 돌보셨네요. 앞으로도 작은 성공 경험들을 계속 쌓아가 보아요.",
                "external_referral_options": ["자가 관리 앱 추천", "지역 커뮤니티 프로그램"]
            }
