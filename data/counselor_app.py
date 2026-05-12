"""
이 파일은 [SECTION 7] 및 [SECTION 10]의 상담자 화면 Streamlit 구현입니다.
실행 방법: streamlit run counselor_app.py
"""

import streamlit as st
import plotly.graph_objects as go
from db_schema import init_db
from sqlalchemy.orm import sessionmaker
from counselor_dashboard import CounselorDashboardBackend

# DB 초기화 및 세션
engine = init_db()
SessionLocal = sessionmaker(bind=engine)

def main():
    st.set_page_config(page_title="말랑해도 돼 - 상담자 대시보드", page_icon="🩺", layout="wide")
    
    st.sidebar.title("🩺 말랑해도 돼\n상담자 대시보드")
    pages = [
        "대시보드 메인", 
        "내담자 통합 목록", 
        "내담자 리포트", 
        "인지왜곡 종합 빈도", 
        "인지왜곡 상세 분석", 
        "시스템 추천 개입 가이드"
    ]
    choice = st.sidebar.radio("메뉴 이동", pages)
    
    # DB 세션
    db_session = SessionLocal()
    backend = CounselorDashboardBackend(db_session)
    
    # 데모용 사용자 ID 선택기 (사이드바)
    st.sidebar.markdown("---")
    selected_client_id = st.sidebar.number_input("조회할 내담자 ID (기본: 1)", min_value=1, value=1, step=1)
    
    try:
        if choice == "대시보드 메인":
            st.title("📊 대시보드 메인")
            data = backend.get_dashboard_main("C-001")
            
            c1, c2, c3, c4 = st.columns(4)
            c1.metric("상담자", data["counselor_name"])
            c2.metric("활성 내담자", f"{data['active_clients']}명")
            c3.metric("고위험 케이스", f"{data['high_risk_cases']}건", delta="⚠️주의", delta_color="inverse")
            c4.metric("오늘 세션", f"{data['today_sessions']}건")
            
            st.subheader("집중 모니터링 대상")
            for fm in data["focus_monitoring"]:
                st.error(f"**{fm['name']} ({fm['risk']})** : {fm['summary']}")
                
            c_left, c_right = st.columns(2)
            with c_left:
                st.subheader("다음 예약")
                for appt in data["next_appointments"]:
                    st.write(f"- {appt}")
            with c_right:
                st.subheader("최근 시스템 활동")
                for act in data["recent_activities"]:
                    st.write(f"- {act}")

        elif choice == "내담자 통합 목록":
            st.title("👥 담당 내담자 통합 목록")
            clients = backend.get_client_list()
            if not clients:
                st.info("등록된 내담자가 없습니다.")
            else:
                for c in clients:
                    with st.expander(f"{c['client_name']} ({c['client_id']}) - 위험도: {c['risk_level']}"):
                        st.write(f"**자살위험성 (P4):** {c['suicide_risk']}")
                        st.write(f"**PHQ-9 점수:** {c['phq9']}")
                        st.write(f"**요약:** {c['summary']}")
                        st.write(f"**최근 업데이트:** {c['last_update']}")

        elif choice == "내담자 리포트":
            st.title("📄 내담자 리포트 (위험 신호 감지)")
            data = backend.get_client_report(selected_client_id)
            if not data:
                st.warning("해당 내담자 정보가 없습니다.")
            else:
                st.subheader(f"내담자: {data['client_name']} ({data['client_id']}) | 위험도: {data['risk_level']}")
                
                c1, c2 = st.columns(2)
                with c1:
                    st.write("### 📌 자가검진 요약")
                    phq9 = data["checkup_summary"]["phq9"]
                    st.info(f"**PHQ-9:** {phq9['score']}/{phq9['max']} ({phq9['interpretation']}) - [방식: {phq9['method']}]")
                    p4 = data["checkup_summary"]["p4_screener"]
                    st.warning(f"**P4 자살위험성 평가**\n- 자살사고: {p4['ideation']}\n- 자살계획: {p4['plan']}\n- 보호요인: {p4['protective_factor']}")
                
                with c2:
                    st.write("### 🚨 최근 위험 표현 로그")
                    for log in data["risk_expression_log"]:
                        st.error(f"[{log['datetime']}] {log['text']} (심각도: {log['severity']})")

                st.markdown("---")
                st.write("### 💭 감정 분포 (Top 6)")
                dist = data["emotion_distribution_top6"]
                fig = go.Figure(data=[go.Pie(labels=[d["emotion"] for d in dist], values=[d["pct"] for d in dist], hole=.4)])
                fig.update_layout(margin=dict(t=0, b=0, l=0, r=0), height=300)
                st.plotly_chart(fig, use_container_width=True)

        elif choice == "인지왜곡 종합 빈도":
            st.title("🧠 인지왜곡 종합 빈도")
            data = backend.get_cognitive_distortions_summary(selected_client_id)
            distortions = data["distortions"]
            
            if not distortions:
                st.info("분석된 인지왜곡 데이터가 없습니다.")
            else:
                # 차트 그리기
                labels = [d["type"] for d in distortions]
                counts = [d["count"] for d in distortions]
                fig = go.Figure(data=[go.Bar(x=labels, y=counts, marker_color='indianred')])
                fig.update_layout(title="인지왜곡 유형별 빈도", xaxis_title="유형", yaxis_title="발생 횟수")
                st.plotly_chart(fig, use_container_width=True)
                
                for d in distortions:
                    st.write(f"- **{d['type']}**: {d['count']}회 ({d['level']} 수준)")

        elif choice == "인지왜곡 상세 분석":
            st.title("🔎 인지왜곡 상세 분석")
            # 12종 리스트 (DB 스키마 Enum 기준)
            distortion_types = ['흑백논리', '과잉일반화', '정신적 여과', '긍정 무시', '독심술', '미래예언', '파국화', '감정추리', '당위진술', '낙인찍기', '개인화', '비교왜곡']
            sel_type = st.selectbox("분석할 인지왜곡 유형 선택", distortion_types)
            
            data = backend.get_cognitive_distortion_detail(selected_client_id, sel_type)
            if not data:
                st.info("해당 내담자의 선택한 인지왜곡 유형 데이터가 없습니다.")
            else:
                st.subheader(f"[{data['type']}] 상세 리포트")
                st.write(f"**빈도:** {data['frequency']}")
                st.write(f"**관련 태그:** {', '.join(data['tags'])}")
                
                st.markdown("### 💬 발화 인용구")
                for q in data["quotes"]:
                    st.info(f"\"{q}\"")
                    
                st.markdown("### 💡 공감 프롬프트 추천")
                st.success(data["empathy_prompt"])

        elif choice == "시스템 추천 개입 가이드":
            st.title("🛡️ 시스템 추천 개입 가이드")
            data = backend.get_intervention_guide(selected_client_id)
            
            if data.get("urgent_action_required"):
                st.error("🚨 **긴급 개입이 필요한 내담자입니다!**")
            else:
                st.success("✅ 현재 긴급한 개입은 필요하지 않습니다.")
                
            st.subheader("📝 체크리스트")
            for item in data["checklist"]:
                st.checkbox(item, key=item)
                
            st.subheader("💡 추천 공감 메시지")
            st.info(data["empathy_prompt"])
            
            st.subheader("🔗 외부 기관 연계 옵션")
            for opt in data["external_referral_options"]:
                st.write(f"- {opt}")

    finally:
        db_session.close()

if __name__ == "__main__":
    main()
