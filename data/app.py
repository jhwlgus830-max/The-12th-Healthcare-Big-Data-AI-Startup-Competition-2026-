"""
app.py — Streamlit 정신건강 AI 서비스
=======================================
실행 방법:
  streamlit run app.py

필수 환경변수:
  ANTHROPIC_API_KEY=sk-ant-...   (Claude API 키)

필요 패키지:
  pip install streamlit anthropic torch transformers plotly

폴더 구조:
  프로젝트/
  ├── app.py                          ← 이 파일
  ├── model.py                        ← AI 로직 모듈
  └── saved_models/
      └── KoELECTRA_Dataset2/         ← 학습된 모델 폴더
"""

import os
import streamlit as st
import plotly.graph_objects as go

# ── model.py에서 AI 로직 가져오기 ────────────────
from model import load_model, get_depression_score, get_chatbot_response
from db_schema import init_db, User, Message, EmotionAnalysis
from sqlalchemy.orm import sessionmaker

# DB 초기화 및 세션 생성
engine = init_db()
SessionLocal = sessionmaker(bind=engine)

# ─────────────────────────────────────────────────
# 페이지 기본 설정
# ─────────────────────────────────────────────────
st.set_page_config(
    page_title="마음 온도계",
    page_icon="💙",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ─────────────────────────────────────────────────
# CSS
# ─────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');

html, body, [class*="css"] {
    font-family: 'Noto Sans KR', sans-serif;
}

/* 배경 */
.stApp {
    background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fff4 100%);
}

/* 헤더 */
.main-header {
    text-align: center;
    padding: 2rem 0 1rem;
}
.main-title {
    font-size: 2.4rem;
    font-weight: 700;
    color: #1e3a5f;
    margin-bottom: 0.3rem;
}
.main-subtitle {
    font-size: 1rem;
    color: #6b7280;
}

/* 점수 카드 */
.score-card {
    background: white;
    border-radius: 20px;
    padding: 1.5rem;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    border: 1px solid #e8edf5;
}
.score-number {
    font-size: 3.5rem;
    font-weight: 700;
    line-height: 1;
    color: #1e3a5f;
}
.score-max {
    font-size: 1rem;
    color: #9ca3af;
}
.level-badge {
    font-size: 1.3rem;
    margin-top: 0.5rem;
}

/* 채팅 말풍선 */
.chat-container {
    max-height: 460px;
    overflow-y: auto;
    padding: 1rem;
    background: white;
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    border: 1px solid #e8edf5;
}
.chat-user {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 0.8rem;
}
.chat-user-bubble {
    background: #3b82f6;
    color: white;
    padding: 0.7rem 1.1rem;
    border-radius: 18px 18px 4px 18px;
    max-width: 72%;
    font-size: 0.95rem;
    line-height: 1.5;
    word-break: break-word;
}
.chat-bot {
    display: flex;
    justify-content: flex-start;
    margin-bottom: 0.8rem;
    gap: 0.5rem;
}
.chat-bot-avatar {
    width: 34px;
    height: 34px;
    background: #dbeafe;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
}
.chat-bot-bubble {
    background: #f1f5f9;
    color: #1e293b;
    padding: 0.7rem 1.1rem;
    border-radius: 18px 18px 18px 4px;
    max-width: 72%;
    font-size: 0.95rem;
    line-height: 1.6;
    word-break: break-word;
    white-space: pre-wrap;
}

/* 위기 알림 박스 */
.crisis-box {
    background: #fff5f5;
    border-left: 4px solid #ef4444;
    border-radius: 10px;
    padding: 1rem 1.2rem;
    margin-top: 0.8rem;
    font-size: 0.9rem;
    line-height: 1.7;
    color: #7f1d1d;
}

/* 섹션 타이틀 */
.section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.6rem;
}
</style>
""", unsafe_allow_html=True)


# ─────────────────────────────────────────────────
# 모델 로드 — @st.cache_resource 덕분에 앱 재실행해도
# 모델을 다시 불러오지 않습니다 (1회만 로드)
# ─────────────────────────────────────────────────
@st.cache_resource
def get_model():
    """KoELECTRA 모델을 한 번만 로드합니다."""
    return load_model()


# ─────────────────────────────────────────────────
# 세션 상태 초기화 — 대화 기록, 분석 결과를 유지
# ─────────────────────────────────────────────────
if "db_user_id" not in st.session_state:
    with SessionLocal() as db_session:
        new_user = User(pseudo_name="익명 사용자")
        db_session.add(new_user)
        db_session.commit()
        db_session.refresh(new_user)
        st.session_state.db_user_id = new_user.user_id

if "messages" not in st.session_state:
    # messages: 화면에 표시할 대화 기록
    # [{"role": "user"|"bot", "content": "..."}]
    st.session_state.messages = []

if "api_history" not in st.session_state:
    # api_history: Claude API에 넘길 대화 기록
    # [{"role": "user"|"assistant", "content": "..."}]
    st.session_state.api_history = []

if "last_analysis" not in st.session_state:
    # 가장 최근 감정 분석 결과 (대시보드용)
    st.session_state.last_analysis = None

if "score_history" not in st.session_state:
    # 점수 추이 기록 [(입력 번호, 점수), ...]
    st.session_state.score_history = []


# ─────────────────────────────────────────────────
# 메인 헤더
# ─────────────────────────────────────────────────
st.markdown("""
<div class="main-header">
    <div class="main-title">💙 마음 온도계</div>
    <div class="main-subtitle">오늘 어떤 마음인지 자유롭게 이야기해 보세요.</div>
</div>
""", unsafe_allow_html=True)

st.markdown("---")

# ─────────────────────────────────────────────────
# 레이아웃: 왼쪽(대시보드) + 오른쪽(채팅)
# ─────────────────────────────────────────────────
col_dash, col_chat = st.columns([1, 1.6], gap="large")


# ══════════════════════════════════════════════════
# 왼쪽 컬럼 — 대시보드
# ══════════════════════════════════════════════════
with col_dash:

    # 1. 우울 점수 게이지
    st.markdown('<div class="section-title">📊 우울 위험 점수</div>',
                unsafe_allow_html=True)

    analysis = st.session_state.last_analysis

    if analysis is None:
        # 아직 입력 없음 → 빈 상태
        fig_gauge = go.Figure(go.Indicator(
            mode="gauge+number",
            value=0,
            number={"suffix": "점", "font": {"size": 36, "color": "#9ca3af"}},
            gauge={
                "axis": {"range": [0, 100], "tickwidth": 1,
                         "tickcolor": "#d1d5db"},
                "bar": {"color": "#d1d5db"},
                "bgcolor": "white",
                "steps": [
                    {"range": [0,  15], "color": "#dcfce7"},
                    {"range": [15, 35], "color": "#fef9c3"},
                    {"range": [35, 60], "color": "#ffedd5"},
                    {"range": [60, 100], "color": "#fee2e2"},
                ],
                "threshold": {
                    "line": {"color": "#6b7280", "width": 2},
                    "thickness": 0.75,
                    "value": 0,
                },
            },
            title={"text": "대화를 시작하면 점수가 표시됩니다",
                   "font": {"size": 13, "color": "#9ca3af"}},
        ))
    else:
        score = analysis["score"]
        level = analysis["level"]
        # 점수에 따라 게이지 색상 결정
        bar_color = (
            "#ef4444" if score >= 60 else
            "#f97316" if score >= 35 else
            "#eab308" if score >= 15 else
            "#22c55e"
        )
        fig_gauge = go.Figure(go.Indicator(
            mode="gauge+number",
            value=score,
            number={"suffix": "점", "font": {"size": 40, "color": "#1e3a5f"}},
            gauge={
                "axis": {"range": [0, 100], "tickwidth": 1,
                         "tickcolor": "#d1d5db"},
                "bar": {"color": bar_color},
                "bgcolor": "white",
                "steps": [
                    {"range": [0,  15], "color": "#dcfce7"},
                    {"range": [15, 35], "color": "#fef9c3"},
                    {"range": [35, 60], "color": "#ffedd5"},
                    {"range": [60, 100], "color": "#fee2e2"},
                ],
                "threshold": {
                    "line": {"color": bar_color, "width": 3},
                    "thickness": 0.75,
                    "value": score,
                },
            },
            title={"text": f"{level}", "font": {"size": 18}},
        ))

    fig_gauge.update_layout(
        height=260,
        margin=dict(l=20, r=20, t=40, b=10),
        paper_bgcolor="rgba(0,0,0,0)",
    )
    st.plotly_chart(fig_gauge, use_container_width=True)

    # 위험 등급 범례
    st.markdown("""
    <div style="font-size:0.8rem; color:#6b7280; text-align:center; margin-top:-10px;">
        🟢 양호(0~14) &nbsp;|&nbsp; 🟡 경증(15~34) &nbsp;|&nbsp;
        🟠 중증(35~59) &nbsp;|&nbsp; 🔴 고위험(60+)
    </div>
    """, unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    # 2. 감정 파이차트
    st.markdown('<div class="section-title">💭 감지된 감정 분포</div>',
                unsafe_allow_html=True)

    if analysis is not None:
        probs = analysis["probs"]
        # 상위 6개 감정만 표시 (나머지는 "기타"로 묶음)
        from model import INV_MAP  # 편의상 직접 import — 아래 설명 참고

        sorted_idx = probs.argsort()[::-1]
        top6_idx   = sorted_idx[:6]
        other_prob = probs[sorted_idx[6:]].sum()

        labels = [INV_MAP[i] for i in top6_idx] + (["기타"] if other_prob > 0.005 else [])
        values = [round(float(probs[i]) * 100, 1) for i in top6_idx]
        if other_prob > 0.005:
            values.append(round(float(other_prob) * 100, 1))

        colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981",
                  "#f59e0b", "#ef4444", "#d1d5db"]

        fig_pie = go.Figure(go.Pie(
            labels=labels,
            values=values,
            hole=0.45,
            marker_colors=colors[:len(labels)],
            textinfo="label+percent",
            textfont_size=11,
            hovertemplate="%{label}: %{value:.1f}%<extra></extra>",
        ))
        fig_pie.update_layout(
            height=280,
            margin=dict(l=0, r=0, t=20, b=0),
            paper_bgcolor="rgba(0,0,0,0)",
            showlegend=False,
        )
        st.plotly_chart(fig_pie, use_container_width=True)
    else:
        st.markdown(
            '<div style="color:#9ca3af; font-size:0.9rem; '
            'text-align:center; padding:3rem 0;">대화를 시작하면 감정 분포가 표시됩니다.</div>',
            unsafe_allow_html=True,
        )

    st.markdown("<br>", unsafe_allow_html=True)

    # 3. 점수 추이 라인차트
    st.markdown('<div class="section-title">📈 점수 추이</div>',
                unsafe_allow_html=True)

    if len(st.session_state.score_history) >= 2:
        turns  = [h[0] for h in st.session_state.score_history]
        scores = [h[1] for h in st.session_state.score_history]

        fig_line = go.Figure()
        fig_line.add_trace(go.Scatter(
            x=turns, y=scores,
            mode="lines+markers",
            line=dict(color="#3b82f6", width=2),
            marker=dict(size=7),
            name="우울 점수",
            hovertemplate="입력 %{x}: %{y}점<extra></extra>",
        ))
        fig_line.add_hline(y=60, line_dash="dot", line_color="#ef4444",
                           annotation_text="고위험", annotation_font_size=10)
        fig_line.add_hline(y=35, line_dash="dot", line_color="#f97316",
                           annotation_text="중증", annotation_font_size=10)
        fig_line.update_layout(
            height=200,
            margin=dict(l=0, r=40, t=10, b=30),
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            yaxis=dict(range=[0, 100], gridcolor="#f1f5f9"),
            xaxis=dict(title="입력 번호", gridcolor="#f1f5f9"),
        )
        st.plotly_chart(fig_line, use_container_width=True)
    else:
        st.markdown(
            '<div style="color:#9ca3af; font-size:0.9rem; '
            'text-align:center; padding:1.5rem 0;">2개 이상 입력하면 추이가 표시됩니다.</div>',
            unsafe_allow_html=True,
        )

    # 4. 위기 안내 (고위험일 때만)
    if (analysis is not None and
            ("고위험" in analysis["level"] or "자살충동" in analysis.get("multi", []))):
        st.markdown("""
        <div class="crisis-box">
            🚨 <strong>위기 상담 안내</strong><br>
            지금 많이 힘드신가요? 혼자 감당하지 않아도 됩니다.<br><br>
            ☎ <strong>자살예방상담전화 1393</strong> (24시간, 무료)<br>
            ☎ <strong>정신건강위기상담전화 1577-0199</strong> (24시간)
        </div>
        """, unsafe_allow_html=True)


# ══════════════════════════════════════════════════
# 오른쪽 컬럼 — 채팅
# ══════════════════════════════════════════════════
with col_chat:
    st.markdown('<div class="section-title">💬 대화하기</div>',
                unsafe_allow_html=True)

    # ── 대화창 렌더링 ─────────────────────────────
    chat_html = '<div class="chat-container">'

    if not st.session_state.messages:
        chat_html += """
        <div style="text-align:center; padding:4rem 1rem; color:#9ca3af;">
            <div style="font-size:2rem; margin-bottom:0.8rem;">💙</div>
            <div style="font-size:0.95rem; line-height:1.7;">
                안녕하세요! 저는 마음 온도계입니다.<br>
                오늘 어떤 하루를 보내셨나요?<br>
                편하게 이야기해 주세요.
            </div>
        </div>"""
    else:
        for msg in st.session_state.messages:
            content = msg["content"].replace("\n", "<br>")
            if msg["role"] == "user":
                chat_html += f"""
                <div class="chat-user">
                    <div class="chat-user-bubble">{content}</div>
                </div>"""
            else:
                chat_html += f"""
                <div class="chat-bot">
                    <div class="chat-bot-avatar">💙</div>
                    <div class="chat-bot-bubble">{content}</div>
                </div>"""

    chat_html += "</div>"
    st.markdown(chat_html, unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    # ── 입력창 + 전송 버튼 ────────────────────────
    with st.form(key="chat_form", clear_on_submit=True):
        user_input = st.text_area(
            "메시지 입력",
            placeholder="오늘 어떤 마음인지 자유롭게 적어보세요...",
            height=90,
            label_visibility="collapsed",
        )
        col_btn1, col_btn2 = st.columns([5, 1])
        with col_btn1:
            submit = st.form_submit_button(
                "전송 ➤", use_container_width=True, type="primary")
        with col_btn2:
            reset = st.form_submit_button("초기화", use_container_width=True)

    # ── 초기화 ────────────────────────────────────
    if reset:
        st.session_state.messages      = []
        st.session_state.api_history   = []
        st.session_state.last_analysis = None
        st.session_state.score_history = []
        st.rerun()

    # ── 전송 처리 ─────────────────────────────────
    if submit and user_input.strip():
        # 1) 모델 로드 (캐시되어 있으면 즉시 반환)
        try:
            model, tokenizer, inv_map, run_cfg, device = get_model()
        except Exception as e:
            st.error(f"모델 로드 실패: {e}\n\nsaved_models/KoELECTRA_Dataset2/ 경로를 확인하세요.")
            st.stop()

        # 2) KoELECTRA 감정 분류 + 우울 점수
        analysis = get_depression_score(
            text=user_input.strip(),
            model=model,
            tokenizer=tokenizer,
            device=device,
            inv_map=inv_map,
            max_len=run_cfg.get("max_len", 64),
            threshold=run_cfg.get("multi_threshold", 3.0),
        )

        # 3) Claude API 챗봇 응답
        with st.spinner("답변 생성 중..."):
            try:
                bot_reply = get_chatbot_response(
                    user_text=user_input.strip(),
                    analysis=analysis,
                    conversation_history=st.session_state.api_history,
                )
            except Exception as e:
                bot_reply = f"죄송해요, 응답 생성 중 오류가 발생했어요. ({e})"

        # 4) 상태 업데이트
        # 화면 표시용 대화 기록
        st.session_state.messages.append(
            {"role": "user", "content": user_input.strip()})
        st.session_state.messages.append(
            {"role": "bot", "content": bot_reply})

        # Claude API에 넘길 대화 기록 (role: "user"/"assistant")
        st.session_state.api_history.append(
            {"role": "user", "content": user_input.strip()})
        st.session_state.api_history.append(
            {"role": "assistant", "content": bot_reply})

        # DB 저장 연동
        with SessionLocal() as db_session:
            user_msg = Message(
                user_id=st.session_state.db_user_id,
                role="user",
                persona="default",
                text=user_input.strip()
            )
            db_session.add(user_msg)
            db_session.commit()
            db_session.refresh(user_msg)
            
            bot_msg = Message(
                user_id=st.session_state.db_user_id,
                role="bot",
                persona="default",
                text=bot_reply
            )
            db_session.add(bot_msg)
            
            emotion_rec = EmotionAnalysis(
                msg_id=user_msg.msg_id,
                emotion_probs=analysis["probs"].tolist() if hasattr(analysis["probs"], "tolist") else analysis["probs"],
                top3=analysis["top3"],
                score=analysis["score"],
                level="🔴 고위험" if analysis["score"] >= 0.6 else ("🟠 중증" if analysis["score"] >= 0.35 else ("🟡 경증" if analysis["score"] >= 0.15 else "🟢 양호"))
            )
            db_session.add(emotion_rec)
            db_session.commit()

        # 분석 결과 + 점수 추이
        st.session_state.last_analysis = analysis
        turn = len(st.session_state.score_history) + 1
        st.session_state.score_history.append((turn, analysis["score"]))

        # 5) 페이지 새로고침 → 대화창 + 대시보드 동시 갱신
        st.rerun()

    # ── 분석 결과 요약 (최근 입력) ─────────────────
    if st.session_state.last_analysis:
        a = st.session_state.last_analysis
        st.markdown("---")
        st.markdown('<div class="section-title">🔍 마지막 입력 분석</div>',
                    unsafe_allow_html=True)
        c1, c2, c3 = st.columns(3)
        c1.metric("우울 점수", f"{a['score']}점")
        c2.metric("위험 등급", a['level'])
        c3.metric("주요 감정", a['top3'][0][0] if a['top3'] else "-")

        if a["multi"]:
            st.markdown(
                f"**복합 감정 (임계치 3 초과):** "
                + "  ".join(f"`{e}`" for e in a["multi"]),
            )
