"""
이 파일은 [SECTION 10] 산출물 중 통합 테스트 및 데모 데이터 시드 생성을 수행합니다.
상담자 화면(counselor_app.py)에서 데이터를 확인할 수 있도록 DB에 더미 데이터를 주입합니다.
"""

from db_schema import (
    init_db, User, Message, EmotionAnalysis, RiskExpression, 
    Phq9Estimate, CognitiveDistortion, CognitiveDistortionType, P4Screener
)
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta

def seed_data():
    engine = init_db()
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    # 1. 사용자 생성
    u1 = User(pseudo_name="김지훈", age="20대", gender="남성", occupation="대학생", region="서울")
    u2 = User(pseudo_name="박지연", age="30대", gender="여성", occupation="직장인", region="경기")
    db.add_all([u1, u2])
    db.commit()
    db.refresh(u1)
    db.refresh(u2)

    # 2. 메시지 및 감정/위험 분석 결과 생성 (김지훈 - 고위험)
    msg1 = Message(user_id=u1.user_id, role="user", persona="default", text="그냥 다 끝내고 싶어요. 너무 지쳤어요.")
    db.add(msg1)
    db.commit()
    db.refresh(msg1)

    ea1 = EmotionAnalysis(
        msg_id=msg1.msg_id, 
        emotion_probs=[0.01]*20, # 20차원 더미
        top3=[["절망감", 80.0], ["무기력", 15.0], ["우울감", 5.0]],
        score=0.85, 
        level="🔴 고위험"
    )
    db.add(ea1)
    
    re1 = RiskExpression(
        msg_id=msg1.msg_id, 
        keyword_matched="끝내고 싶어", 
        severity="high", 
        bypass_triggered=True
    )
    db.add(re1)

    # 3. 인지왜곡 데이터 생성
    cd1 = CognitiveDistortion(
        msg_id=msg1.msg_id,
        distortion_type=CognitiveDistortionType.BLACK_AND_WHITE,
        evidence_sentence="그냥 다 끝내고 싶어요. 내 인생은 실패했어요.",
        confidence=0.9
    )
    cd2 = CognitiveDistortion(
        msg_id=msg1.msg_id,
        distortion_type=CognitiveDistortionType.CATASTROPHIZING,
        evidence_sentence="이제 회복할 방법이 영영 없을 거예요.",
        confidence=0.85
    )
    db.add_all([cd1, cd2])

    # 4. PHQ-9 및 P4 Screener 데이터 생성 (김지훈)
    phq1 = Phq9Estimate(
        user_id=u1.user_id,
        q1_score=3, q2_score=3, q3_score=2, q4_score=1, q5_score=2, 
        q6_score=3, q7_score=3, q8_score=2, q9_score=3,
        total_score=22,
        severity="위험",
        method="auto_arag"
    )
    db.add(phq1)

    p4_1 = P4Screener(
        user_id=u1.user_id,
        ideation="yes",
        plan="partially",
        protective_factor="weak"
    )
    db.add(p4_1)

    # 5. 사용자 2 (박지연 - 양호) 데이터 생성
    msg2 = Message(user_id=u2.user_id, role="user", persona="default", text="오늘 회사에서 일이 좀 많았지만 괜찮았어요.")
    db.add(msg2)
    db.commit()
    db.refresh(msg2)

    ea2 = EmotionAnalysis(
        msg_id=msg2.msg_id, 
        emotion_probs=[0.01]*20,
        top3=[["기쁨", 60.0], ["평온", 30.0], ["피로", 10.0]],
        score=0.10, 
        level="🟢 양호"
    )
    db.add(ea2)

    phq2 = Phq9Estimate(
        user_id=u2.user_id,
        q1_score=0, q2_score=0, q3_score=1, q4_score=0, q5_score=0, 
        q6_score=1, q7_score=0, q8_score=0, q9_score=0,
        total_score=2,
        severity="양호",
        method="manual"
    )
    db.add(phq2)

    p4_2 = P4Screener(
        user_id=u2.user_id,
        ideation="no",
        plan="no",
        protective_factor="strong"
    )
    db.add(p4_2)

    db.commit()
    print("데모 데이터 시드 주입이 완료되었습니다!")
    db.close()

if __name__ == "__main__":
    seed_data()
