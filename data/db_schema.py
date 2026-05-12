"""
이 파일은 [SECTION 2] 데이터베이스 스키마 설계를 구현합니다.

말랑해도 돼 프로젝트의 8개 핵심 테이블을 정의합니다.
추후 PostgreSQL로 확장 가능하도록 기본 타입(Integer, String, JSON, Float, Boolean, DateTime)을 사용하였습니다.
"""

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, Enum, JSON
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy import create_engine
import datetime
import enum

Base = declarative_base()

class User(Base):
    """익명화된 사용자 정보"""
    __tablename__ = 'users'
    
    user_id = Column(Integer, primary_key=True, autoincrement=True)
    pseudo_name = Column(String(50))
    age = Column(String(20))
    gender = Column(String(20))
    occupation = Column(String(50))
    region = Column(String(50))
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)

class Message(Base):
    """모든 대화 발화 저장"""
    __tablename__ = 'messages'
    
    msg_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id'))
    role = Column(String(10)) # 'user' or 'bot'
    persona = Column(String(50))
    text = Column(String(2000))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class EmotionAnalysis(Base):
    """KLUE-BERT 출력 결과"""
    __tablename__ = 'emotion_analysis'
    
    analysis_id = Column(Integer, primary_key=True, autoincrement=True)
    msg_id = Column(Integer, ForeignKey('messages.msg_id'))
    emotion_probs = Column(JSON) # 20차원 확률 배열
    top3 = Column(JSON)          # 상위 3개 감정
    score = Column(Float)        # 0~1 (우울 위험 확률)
    level = Column(String(20))   # 양호/경도/보통/중증/위험

class RiskExpression(Base):
    """위험 표현 로그 (상담자 PPT Slide 4 근거)"""
    __tablename__ = 'risk_expressions'
    
    risk_id = Column(Integer, primary_key=True, autoincrement=True)
    msg_id = Column(Integer, ForeignKey('messages.msg_id'))
    keyword_matched = Column(String(100))
    severity = Column(String(20)) # high/medium/low
    bypass_triggered = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Phq9Estimate(Base):
    """aRAG 자동 추론 + 수동 입력 모두 저장"""
    __tablename__ = 'phq9_estimates'
    
    est_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id'))
    q1_score = Column(Integer) # 0~3
    q2_score = Column(Integer)
    q3_score = Column(Integer)
    q4_score = Column(Integer)
    q5_score = Column(Integer)
    q6_score = Column(Integer)
    q7_score = Column(Integer)
    q8_score = Column(Integer)
    q9_score = Column(Integer)
    total_score = Column(Integer)
    severity = Column(String(20)) # 양호/경도/보통/중증/위험
    cot_evidence = Column(JSON)
    method = Column(String(20))   # 'manual' / 'auto_arag'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class CognitiveDistortionType(enum.Enum):
    BLACK_AND_WHITE = '흑백논리'
    OVERGENERALIZATION = '과잉일반화'
    MENTAL_FILTER = '정신적 여과'
    DISCOUNTING_POSITIVES = '긍정 무시'
    MIND_READING = '독심술'
    FORTUNE_TELLING = '미래예언'
    CATASTROPHIZING = '파국화'
    EMOTIONAL_REASONING = '감정추리'
    SHOULD_STATEMENTS = '당위진술'
    LABELING = '낙인찍기'
    PERSONALIZATION = '개인화'
    COMPARING = '비교왜곡'

class CognitiveDistortion(Base):
    """인지왜곡 분류 결과 (상담자 PPT Slide 5 근거)"""
    __tablename__ = 'cognitive_distortions'
    
    cd_id = Column(Integer, primary_key=True, autoincrement=True)
    msg_id = Column(Integer, ForeignKey('messages.msg_id'))
    distortion_type = Column(Enum(CognitiveDistortionType))
    evidence_sentence = Column(String(1000))
    confidence = Column(Float)

class P4Screener(Base):
    """자살위험성 평가"""
    __tablename__ = 'p4_screener'
    
    p4_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id'))
    ideation = Column(String(20)) # yes/no/partially
    plan = Column(String(20))     # yes/no/partially
    protective_factor = Column(String(20)) # strong/weak
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class CounselorNote(Base):
    """상담사 기록 (PPT Slide 7)"""
    __tablename__ = 'counselor_notes'
    
    note_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id'))
    counselor_id = Column(String(50))
    intervention_type = Column(String(100))
    note_text = Column(String(2000))
    urgent_action = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

def init_db(db_url="sqlite:///mallang.db"):
    """
    데이터베이스 엔진 생성 및 테이블 초기화
    - 배포 시 PostgreSQL 연결 문자열로 변경 가능
    """
    engine = create_engine(db_url, echo=False)
    Base.metadata.create_all(engine)
    return engine

if __name__ == "__main__":
    init_db()
    print("데이터베이스 초기화가 완료되었습니다.")
