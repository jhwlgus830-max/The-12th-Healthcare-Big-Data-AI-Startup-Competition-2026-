import os
import json
import random
import uuid
from datetime import datetime, timedelta

def generate_demo_data():
    backend_dir = r"d:\The-12th-Healthcare-Big-Data-AI-Startup-Competition-2026-\backend"
    
    # 1. 8인 데모 내담자 정보 정의
    clients = {
        "user-001": {
            "name": "이지수", "age": "20대", "gender": "여성", "occupation": "학생", "region": "서울",
            "email": "jisu@demo.com", "pass": "jisu123", "phone": "010-1111-2222", "contact": "010-9999-8888",
            "concept": "학업 스트레스로 인한 가벼운 우울감과 수면 불규칙 호소. (6개월 이용)",
            "start_score": 9, "end_score": 3, "weeks": 26, "risk": "Low",
            "lime_sentence": "학기말 과제랑 시험이 몰려서 밤마다 잠도 안 오고 가슴이 너무 답답해서 집중이 하나도 안 돼.",
            "lime_probs": {"불안": 35, "피로": 30, "우울감": 15, "일상": 20},
            "lime_weights": [
                {"word": "시험이 몰려서", "weight": 0.065},
                {"word": "잠도 안 오고", "weight": 0.058},
                {"word": "답답해서", "weight": 0.048},
                {"word": "과제랑", "weight": -0.012}
            ]
        },
        "user-002": {
            "name": "김민준", "age": "30대", "gender": "남성", "occupation": "직장인", "region": "경기",
            "email": "minjun@demo.com", "pass": "minjun123", "phone": "010-2222-3333", "contact": "010-8888-7777",
            "concept": "직장 번아웃과 과도한 불안 및 초조함 호소. (1년 이용)",
            "start_score": 14, "end_score": 6, "weeks": 52, "risk": "Medium",
            "lime_sentence": "회사 프로젝트 실수할까 봐 매일 불안해서 미치겠고 가슴이 꽉 막힌 것처럼 답답해 죽을 것 같아.",
            "lime_probs": {"불안": 45, "초조함": 25, "우울감": 20, "일상": 10},
            "lime_weights": [
                {"word": "실수할까 봐", "weight": 0.078},
                {"word": "불안해서", "weight": 0.072},
                {"word": "답답해 죽을", "weight": 0.085},
                {"word": "회사", "weight": -0.008}
            ]
        },
        "user-003": {
            "name": "최서연", "age": "20대", "gender": "여성", "occupation": "프리랜서 디자이너", "region": "인천",
            "email": "seoyeon@demo.com", "pass": "seoyeon123", "phone": "010-3333-4444", "contact": "010-7777-6666",
            "concept": "프리랜서 디자이너. 심각한 인간관계 단절 및 깊은 슬픔, 인지 왜곡 패턴 다수 감지. (1년 이용)",
            "start_score": 22, "end_score": 14, "weeks": 52, "risk": "High",
            "lime_sentence": "인간관계가 완전히 끊어져서 혼자 남겨진 기분이고 깊은 슬픔에서 빠져나올 수 없어.",
            "lime_probs": {"슬픔": 40, "외로움": 35, "절망감": 15, "일상": 10},
            "lime_weights": [
                {"word": "완전히 끊어져서", "weight": 0.088},
                {"word": "혼자 남겨진", "weight": 0.075},
                {"word": "깊은 슬픔에서", "weight": 0.092},
                {"word": "기분이고", "weight": -0.015}
            ]
        },
        "user-005": {
            "name": "윤하은", "age": "40대", "gender": "여성", "occupation": "자영업자", "region": "대전",
            "email": "haeun@demo.com", "pass": "haeun123", "phone": "010-5555-6666", "contact": "010-5555-4444",
            "concept": "40대 식당 자영업자. 식당 운영 스트레스로 인한 가벼운 무기력증을 챗봇 대화로 극복 중. (8개월 이용)",
            "start_score": 8, "end_score": 4, "weeks": 35, "risk": "Low",
            "lime_sentence": "최근에 식당 매출도 줄고 몸도 너무 지쳐서 아무것도 하기 싫고 하루 종일 누워만 있고 싶어.",
            "lime_probs": {"무기력": 40, "피로": 30, "외로움": 15, "일상": 15},
            "lime_weights": [
                {"word": "지쳐서", "weight": 0.055},
                {"word": "하기 싫고", "weight": 0.062},
                {"word": "누워만 있고", "weight": 0.068},
                {"word": "식당", "weight": -0.005}
            ]
        },
        "user-006": {
            "name": "강지원", "age": "10대 이하", "gender": "여성", "occupation": "학생", "region": "광주",
            "email": "jiwon@demo.com", "pass": "jiwon123", "phone": "010-6666-7777", "contact": "010-4444-3333",
            "concept": "학교에서 친구 관계로 외로움과 고립을 겪으며 자해 충동 및 극심한 위기 신호 감지. (6개월 이용)",
            "start_score": 25, "end_score": 19, "weeks": 26, "risk": "Crisis",
            "lime_sentence": "학교에서 친구들이 전부 나를 은근히 따돌려서 매일 외롭고 혼자 남겨진 것 같아서 사라지고 싶어.",
            "lime_probs": {"자살충동": 50, "외로움": 30, "상실감": 15, "일상": 5},
            "lime_weights": [
                {"word": "전부 나를", "weight": 0.045},
                {"word": "따돌려서", "weight": 0.088},
                {"word": "외롭고 혼자", "weight": 0.075},
                {"word": "사라지고 싶어", "weight": 0.125}
            ]
        },
        "user-007": {
            "name": "정예진", "age": "30대", "gender": "여성", "occupation": "주부", "region": "대구",
            "email": "yejin@demo.com", "pass": "yejin123", "phone": "010-7777-8888", "contact": "010-3333-2222",
            "concept": "독박 육아 스트레스로 인한 죄책감과 불면, 식욕 변화 관리 중. (6개월 이용)",
            "start_score": 13, "end_score": 7, "weeks": 26, "risk": "Medium",
            "lime_sentence": "아이를 키우는 게 너무 지치고 화가 나는데 내가 부족한 엄마인 것 같아서 매일 밤 죄책감이 밀려와.",
            "lime_probs": {"죄책감": 40, "피로": 30, "분노": 20, "일상": 10},
            "lime_weights": [
                {"word": "지치고 화가", "weight": 0.065},
                {"word": "부족한 엄마", "weight": 0.072},
                {"word": "죄책감이", "weight": 0.082},
                {"word": "아이를", "weight": -0.010}
            ]
        },
        "user-008": {
            "name": "박현우", "age": "20대", "gender": "남성", "occupation": "기타", "region": "부산",
            "email": "hyunwoo@demo.com", "pass": "hyunwoo123", "phone": "010-8888-9999", "contact": "010-2222-1111",
            "concept": "취업 실패 낙인으로 인한 절망감과 자존감 붕괴. (10개월 이용)",
            "start_score": 19, "end_score": 12, "weeks": 43, "risk": "High",
            "lime_sentence": "계속해서 면접에서 떨어지니까 내가 무능한 실패자처럼 느껴져서 깊은 절망감이 들어.",
            "lime_probs": {"절망감": 45, "자존감저하": 25, "무기력": 20, "일상": 10},
            "lime_weights": [
                {"word": "계속해서", "weight": 0.035},
                {"word": "떨어지니까", "weight": 0.062},
                {"word": "무능한 실패자", "weight": 0.085},
                {"word": "절망감이 들어", "weight": 0.095}
            ]
        },
        "user-009": {
            "name": "임지혁", "age": "50대", "gender": "남성", "occupation": "기타", "region": "울산",
            "email": "jihyuk@demo.com", "pass": "jihyuk123", "phone": "010-9999-0000", "contact": "010-1111-3333",
            "concept": "만성 통증 질환 및 가족 해체로 인한 절망적 극단 위기 상태. (1년 이용)",
            "start_score": 26, "end_score": 21, "weeks": 52, "risk": "Crisis",
            "lime_sentence": "만성 통증이 계속 괴롭히고 가족들도 아무도 나를 찾지 않으니 수면제 먹고 그냥 조용히 끝내고 싶어.",
            "lime_probs": {"자살충동": 55, "우울감": 20, "절망감": 20, "일상": 5},
            "lime_weights": [
                {"word": "괴롭히고", "weight": 0.068},
                {"word": "아무도 나를", "weight": 0.055},
                {"word": "수면제 먹고", "weight": 0.098},
                {"word": "끝내고 싶어", "weight": 0.130}
            ]
        }
    }

    # 파일 읽어서 원본 보존하되 데모 사용자들 엎어쓰기
    users_file = os.path.join(backend_dir, "users.json")
    surveys_file = os.path.join(backend_dir, "surveys.json")
    sessions_file = os.path.join(backend_dir, "chat_sessions.json")
    messages_file = os.path.join(backend_dir, "messages.json")
    journals_file = os.path.join(backend_dir, "journals.json")
    notes_file = os.path.join(backend_dir, "counselor_notes.json")
    plans_file = os.path.join(backend_dir, "safety_plans.json")
    vectors_file = os.path.join(backend_dir, "memory_vectors.json")

    # Load original files if exist, else create empty
    def load_json(path):
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        return []

    users_db = load_json(users_file)
    surveys_db = load_json(surveys_file)
    sessions_db = load_json(sessions_file)
    messages_db = load_json(messages_file)
    journals_db = load_json(journals_file)
    notes_db = load_json(notes_file)
    plans_db = load_json(plans_file)
    vectors_db = load_json(vectors_file)

    # Filter out existing demo clients in raw data to rebuild cleanly
    demo_ids = list(clients.keys())
    
    if isinstance(users_db, dict):
        users_db = [{**v, "id": k} for k, v in users_db.items()]
    users_db = [u for u in users_db if u.get("id") not in demo_ids]
    surveys_db = [s for s in surveys_db if s.get("user_id") not in demo_ids]
    
    # Filter sessions and messages cascade
    demo_sessions = [s.get("id") for s in sessions_db if s.get("user_id") in demo_ids]
    sessions_db = [s for s in sessions_db if s.get("user_id") not in demo_ids]
    messages_db = [m for m in messages_db if m.get("session_id") not in demo_sessions]
    journals_db = [j for j in journals_db if j.get("user_id") not in demo_ids]
    notes_db = [n for n in notes_db if n.get("user_id") not in demo_ids]
    plans_db = [p for p in plans_db if p.get("user_id") not in demo_ids]
    vectors_db = [v for v in vectors_db if v.get("session_id") not in demo_sessions]

    base_time = datetime.now() - timedelta(days=365) # 1년 전부터 시작

    # 2. 8명 각각 데이터 제너레이션
    for uid, info in clients.items():
        # A. users.json 추가
        users_db.append({
            "id": uid,
            "email": info["email"],
            "nickname": info["name"],
            "password": info["pass"]
        })

        # B. surveys.json (PHQ-9 자가진단 이력) - 2주/3주에 한번씩 (UUIDv4 적용)
        total_weeks = info["weeks"]
        steps = max(5, total_weeks // 2)
        score_diff = info["start_score"] - info["end_score"]
        
        for step_idx in range(steps):
            fraction = step_idx / (steps - 1)
            current_score = int(info["start_score"] - (score_diff * fraction) + random.uniform(-1, 1))
            current_score = max(0, min(27, current_score))
            
            created_dt = base_time + timedelta(weeks=(total_weeks * fraction))
            created_str = created_dt.isoformat() + "+09:00"

            p4_screener_score = 0
            p4_ans = ["없음", "없음", "", "전혀 아니다", "없음", ""]
            if info["risk"] == "Crisis":
                p4_screener_score = 1
                p4_ans = ["있음", "있음", "밤마다 위태로운 생각이 든다", "전혀 아니다", "없음", ""]

            surveys_db.append({
                "id": str(uuid.uuid4()), # UUIDv4 적용
                "user_id": uid,
                "phq9_score": current_score,
                "p4_score": p4_screener_score,
                "p4_answers": p4_ans,
                "gender": info["gender"],
                "age_group": info["age"],
                "occupation": info["occupation"],
                "region": info["region"],
                "contact": info["contact"],
                "phone": info["phone"],
                "created_at": created_str
            })

        # C. chat_sessions.json & messages.json (대화 로그 6개월~1년 이력) - UUIDv4 적용
        sess_count = max(3, total_weeks // 6) # 여러개 세션
        for s_idx in range(sess_count):
            sess_id = str(uuid.uuid4()) # UUIDv4 적용
            sess_dt = base_time + timedelta(weeks=(total_weeks * (s_idx / (sess_count - 1))))
            sess_str = sess_dt.isoformat() + "+09:00"

            sessions_db.append({
                "id": sess_id,
                "user_id": uid,
                "initial_persona": 3 if info["risk"] == "Crisis" else 1,
                "status": "completed" if s_idx < sess_count - 1 else "active",
                "created_at": sess_str
            })

            # Messages for this session - UUIDv4 적용
            welcome_msg_id = str(uuid.uuid4())
            messages_db.append({
                "id": welcome_msg_id,
                "session_id": sess_id,
                "role": "assistant",
                "content": f"안녕하세요! 나 우울빼미야. 🦉 오늘 하루도 애썼어. 편안하게 무엇이든 나에게 털어놓아줘.",
                "icon": "🦉",
                "emotion": json.dumps({"primary": "일상", "probabilities": {"일상": 100.0}}),
                "risk_score": 0.05,
                "is_high_risk": False,
                "created_at": (sess_dt - timedelta(minutes=10)).isoformat() + "+09:00"
            })

            # User Core Message (XAI LIME 시나리오 1:1 매치 및 감정 확률 탑재)
            user_msg_id = str(uuid.uuid4()) # UUIDv4 적용
            
            # LIME 확률 데이터
            lime_probs_full = {k: float(v) for k, v in info["lime_probs"].items()}
            # 19가지 감정 골고루 세팅
            for emo in ALL_DEPRESSIVE_EMOTIONS:
                if emo not in lime_probs_full:
                    lime_probs_full[emo] = round(random.uniform(0.1, 1.5), 2)
            
            emotion_detail = {
                "primary": max(info["lime_probs"], key=info["lime_probs"].get),
                "probabilities": lime_probs_full,
                "top3": sorted(info["lime_probs"].items(), key=lambda x: x[1], reverse=True)[:3],
                "all_emotions": [{"emotion": k, "prob": v} for k, v in lime_probs_full.items() if v > 3.0]
            }

            messages_db.append({
                "id": user_msg_id,
                "session_id": sess_id,
                "role": "user",
                "content": info["lime_sentence"],
                "icon": "👤",
                "emotion": json.dumps(emotion_detail, ensure_ascii=False),
                "risk_score": 0.92 if info["risk"] == "Crisis" else (0.75 if info["risk"] == "High" else 0.25),
                "is_high_risk": True if info["risk"] in ["Crisis", "High"] else False,
                "created_at": sess_dt.isoformat() + "+09:00"
            })

            # Bot Sympathy Message
            bot_sympathy_id = str(uuid.uuid4())
            messages_db.append({
                "id": bot_sympathy_id,
                "session_id": sess_id,
                "role": "assistant",
                "content": f"그랬구나... 많이 버겁고 지쳤을 텐데 혼자서 다 감당하느라 얼마나 힘들었을까. 네 곁에 언제나 편하게 기댈 수 있는 우울빼미가 함께할게.",
                "icon": "🦉",
                "emotion": json.dumps({"primary": "일상", "probabilities": {"일상": 95.0, "슬픔": 5.0}}),
                "risk_score": 0.08,
                "is_high_risk": False,
                "created_at": (sess_dt + timedelta(minutes=5)).isoformat() + "+09:00"
            })

            # Memory Vector RAG 적재 (768 차원 및 UUIDv4 적용)
            vectors_db.append({
                "message_id": user_msg_id,
                "session_id": sess_id,
                "content": info["lime_sentence"],
                "embedding": json.dumps([random.uniform(-0.1, 0.1) for _ in range(768)]), # 768차원 적용!
                "metadata": json.dumps({"user_id": uid, "created_at": sess_str})
            })

        # D. journals.json (마음 일기 이력) - 1인당 20건씩 - UUIDv4 적용
        for j_idx in range(20):
            j_dt = base_time + timedelta(days=(365 * (j_idx / 19)))
            j_str = j_dt.isoformat() + "+09:00"
            journals_db.append({
                "id": str(uuid.uuid4()), # UUIDv4 적용
                "user_id": uid,
                "content": f"오늘 하루도 참 숨 가빴다. {info['name']}의 감정 일기 기록. 그래도 우울빼미와 대화하며 마음에 가려졌던 짐을 조금이나마 덜어낸 기분이다. 다시 차분한 템포로 내일을 준비하자.",
                "created_at": j_str
            })

        # F. counselor_notes.json (임상 관리 노트) - 1인당 3건씩 - UUIDv4 적용
        notes_templates = [
            "환자 보고 및 PHQ-9 측정 완료. 정서지원 챗봇 연계 완료 및 긍정 왜곡 피드백 필요.",
            "꾸준한 인지 행동 훈련을 통해 이전 대비 자책하는 당위 진술 빈도가 많이 줄어듦. 긍정적 징후 포착.",
            "임상 개입 모니터링 경과 양호. 앞으로도 규칙적인 감정 환기와 기초 리듬 유지를 최우선 지도 권고."
        ]
        for n_idx, tpl in enumerate(notes_templates):
            n_dt = base_time + timedelta(weeks=(total_weeks * (n_idx / 2.0)))
            n_str = n_dt.isoformat() + "+09:00"
            notes_db.append({
                "id": str(uuid.uuid4()), # UUIDv4 적용
                "user_id": uid,
                "counselor_id": "counselor-01",
                "detail": f"[{info['name']} 내담자 임상 기록] {tpl}",
                "conducted_at": n_str
            })

        # G. safety_plans.json (자살/자해 위기군 전용)
        if info["risk"] == "Crisis":
            if uid == "user-006": # 강지원 (학교 고립, 3단계 진행)
                plans_db.append({
                    "user_id": uid,
                    "current_step": 3,
                    "step1_warning_signs": "친구들의 카톡 답장이 늦거나, 복도에서 혼자 고립감을 느낄 때 가슴이 찢어지게 아프고 손목을 긋고 싶어짐.",
                    "step2_coping_strategies": "헤드폰을 쓰고 볼륨을 키워 차분한 클래식 음악을 듣거나, 자해 가이드라인에 맞춰 차가운 얼음컵을 꽉 쥠.",
                    "step3_social_distraction": "학교 도서관 구석에 가서 조용히 책 냄새를 맡으며 사람 소리 속에 존재하기, 혹은 동네 고양이 카페 방문하기.",
                    "step4_social_support": "",
                    "step5_professional_agencies": "",
                    "step6_safe_environment": ""
                })
            else: # 임지혁 (만성 통증, 5단계 연계)
                plans_db.append({
                    "user_id": uid,
                    "current_step": 5,
                    "step1_warning_signs": "허리 통증이 극심해져서 누워도 잠이 안 오고, 통장에 잔고가 비어가며 자식들이 전화를 안 받을 때 수면제 약통을 쳐다봄.",
                    "step2_coping_strategies": "창문을 활짝 열고 심호흡을 10회 실시하며 따뜻한 보리차를 천천히 음미함.",
                    "step3_social_distraction": "복지관 근처 공원을 한 바퀴 천천히 돌며 동네 주민들이 오가는 풍경을 가만히 관찰함.",
                    "step4_social_support": "아파트 경비 아저씨와 날씨에 대해 짧게 인사를 나누며 인간의 연결성 확보하기.",
                    "step5_professional_agencies": "중앙자살예방센터 핫라인(109) 및 연계된 긴급 의료 상담사에게 즉시 단축 번호 1번 전송.",
                    "step6_safe_environment": ""
                })

    # 3. JSON 파일 저장
    def save_json(path, data):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    save_json(users_file, users_db)
    save_json(surveys_file, surveys_db)
    save_json(sessions_file, sessions_db)
    save_json(messages_file, messages_db)
    save_json(journals_file, journals_db)
    save_json(notes_file, notes_db)
    save_json(plans_file, plans_db)
    save_json(vectors_file, vectors_db)
    
    print("[Premium Demo Gen] All 8 demo clients generated with robust 1-year history datasets!")

if __name__ == "__main__":
    ALL_DEPRESSIVE_EMOTIONS = [
      '우울감', '슬픔', '외로움', '분노', '무기력', 
      '불안', '피로', '절망감', '자살충동', '자존감저하', 
      '자신감저하', '죄책감', '불면', '초조함', '감정조절이상', 
      '상실감', '식욕저하', '식욕증가', '집중력저하'
    ]
    generate_demo_data()
