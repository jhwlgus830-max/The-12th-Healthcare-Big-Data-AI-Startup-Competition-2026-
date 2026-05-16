// lib/mockData.ts

export const counselorInfo = {
  name: "김상담 전문가",
  role: "수석 상담사",
  avatar: "김",
};

export const dashboardStats = [
  { label: "활성 내담자", value: "42명", trend: "↑ 지난주 대비 2명 증가", type: "user", color: "blue" },
  { label: "고위험 사례", value: "3건", trend: "⚠️ 즉시 모니터링 필요", type: "alert", color: "red" },
  { label: "오늘의 상담", value: "5건", trend: "3건 완료 / 2건 대기", type: "calendar", color: "purple" },
];

export const schedules = [
  { 
    id: "S001", 
    clientName: "이수진 내담자", 
    time: "14:00 - 15:00", 
    initial: "이", 
    color: "blue", 
    sessionCount: "4/10회", 
    progress: 40 
  },
  { 
    id: "S002", 
    clientName: "박민수 내담자", 
    time: "16:00 - 17:00", 
    initial: "박", 
    color: "orange", 
    sessionCount: "8/12회", 
    progress: 66 
  },
];

export const monitoringList = [
  { 
    id: "M001", 
    name: "익명 사용자 1", 
    status: "DANGER", 
    desc: "우울 척도(PHQ-9) 급증 (18점 → 24점)", 
    lastActivity: "10분 전", 
    color: "red" 
  },
  { 
    id: "M002", 
    name: "김지은 내담자", 
    status: "WARNING", 
    desc: "부정적 키워드 빈도 증가 (외로움, 자책)", 
    lastActivity: "2시간 전", 
    color: "orange" 
  },
];

export const recentActivities = [
  { id: "A001", title: "이수진 내담자 상담 일지 작성", time: "1시간 전", color: "blue" },
  { id: "A002", title: "박민수 내담자 정보 업데이트", time: "3시간 전", color: "green" },
  { id: "A003", title: "익명 사용자 1 위험 경고 발생", time: "5시간 전", color: "orange" },
];

export const clients = [
  { 
    id: "C001", 
    name: "익명 사용자 1", 
    gender: "여", 
    age: "20대", 
    risk: "High", 
    phq9: 24, 
    p4: 3, 
    summary: "최근 자살충동 및 우울감 수치 급증. 챗봇 대화에서 '살고 싶지 않다'는 표현 빈번하게 감지됨.", 
    updated: "10분 전" 
  },
  { 
    id: "C002", 
    name: "김지은", 
    gender: "여", 
    age: "30대", 
    risk: "Medium", 
    phq9: 15, 
    p4: 1, 
    summary: "무기력감 호소, 3주 연속 상승세. 일상 생활에서의 흥미 상실을 주로 이야기함.", 
    updated: "2시간 전" 
  },
  { 
    id: "C003", 
    name: "박민수", 
    gender: "남", 
    age: "20대", 
    risk: "Low", 
    phq9: 8, 
    p4: 0, 
    summary: "스트레스 및 가벼운 우울감. 대화 빈도가 감소했으나 안정적인 상태 유지 중.", 
    updated: "1일 전" 
  },
  { 
    id: "C004", 
    name: "이수진", 
    gender: "여", 
    age: "40대", 
    risk: "Low", 
    phq9: 5, 
    p4: 0, 
    summary: "안정적인 상태 유지 중. 긍정적인 감정 표현이 늘어났으며 일상 복귀 준비 중.", 
    updated: "3일 전" 
  },
  { 
    id: "C005", 
    name: "김지훈", 
    gender: "남", 
    age: "20대", 
    risk: "High", 
    phq9: 21, 
    p4: 2, 
    summary: "학업 스트레스로 인한 심한 우울감 및 완벽주의적 성향. 최근 무기력증 호소.", 
    updated: "방금 전" 
  },
];

export const reportData = {
  trendData: [
    { name: "1일", 우울: 60, 절망: 40, 무기력: 50 },
    { name: "5일", 우울: 65, 절망: 45, 무기력: 55 },
    { name: "10일", 우울: 75, 절망: 60, 무기력: 70 },
    { name: "15일", 우울: 70, 절망: 55, 무기력: 65 },
    { name: "20일", 우울: 80, 절망: 70, 무기력: 75 },
    { name: "25일", 우울: 85, 절망: 75, 무기력: 80 },
    { name: "30일", 우울: 90, 절망: 80, 무기력: 85 },
  ],
  emotionData: [
    { name: "우울", value: 40 },
    { name: "불안", value: 25 },
    { name: "슬픔", value: 15 },
    { name: "무기력", value: 10 },
    { name: "분노", value: 10 },
  ],
  distortionStats: [
    { type: "흑백논리", feature: "극단적으로 판단", level: "높음", color: "bg-red-500", count: 42, percent: 85 },
    { type: "과잉일반화", feature: "한 번 실패 → 항상 실패", level: "높음", color: "bg-red-500", count: 35, percent: 70 },
    { type: "임의적 추론", feature: "근거 없이 결론 도출", level: "중간", color: "bg-blue-500", count: 28, percent: 55 },
    { type: "파국화", feature: "최악의 상황만 가정", level: "중간", color: "bg-blue-500", count: 22, percent: 45 },
    { type: "정신적 여과", feature: "부정적인 것에만 집중", level: "중간", color: "bg-blue-500", count: 18, percent: 35 },
    { type: "의미 확대/축소", feature: "실수는 크게, 장점은 작게", level: "낮음", color: "bg-green-500", count: 12, percent: 25 },
    { type: "감정적 추론", feature: "감정을 사실로 믿음", level: "낮음", color: "bg-green-500", count: 10, percent: 20 },
    { type: "해야 한다 진술", feature: "엄격한 기준 강요", level: "낮음", color: "bg-green-500", count: 8, percent: 15 },
    { type: "낙인찍기", feature: "자신/타인에게 꼬리표", level: "낮음", color: "bg-green-500", count: 5, percent: 10 },
    { type: "개인화", feature: "모든 것을 내 탓으로", level: "낮음", color: "bg-green-500", count: 4, percent: 8 },
    { type: "독심술", feature: "타인의 생각을 짐작", level: "낮음", color: "bg-green-500", count: 3, percent: 6 },
    { type: "지레짐작", feature: "미래를 부정적으로 예언", level: "낮음", color: "bg-green-500", count: 2, percent: 4 },
  ],
  riskLogs: [
    { date: "2026.05.15 14:20", content: "그냥 다 끝내고 싶어요. 아무도 나를 이해 못 해요.", severity: "높음", source: "챗봇" },
    { date: "2026.05.14 09:15", content: "내일이 안 왔으면 좋겠어요. 숨 쉬는 것도 힘들어요.", severity: "높음", source: "챗봇" },
    { date: "2026.05.13 22:40", content: "내가 없어지면 모두가 편해질 것 같아요.", severity: "중간", source: "챗봇" },
  ],
  detectedPhrases: [
    "어차피 완벽하지 못할 거면 시작도 안 하는 게 나아요.",
    "한 번 실수하면 저는 그냥 실패자인 것 같아요.",
    "내 주변 사람들은 다 행복한데 나만 불행해요.",
    "모두가 나를 싫어하는 게 분명해요."
  ],
  relatedContext: [
    { label: "완벽주의", icon: "⭐" },
    { label: "강박성향", icon: "🧠" },
    { label: "심한 우울", icon: "💧" },
    { label: "학업 스트레스", icon: "📚" },
    { label: "낮은 자존감", icon: "📉" },
    { label: "성과 위주 사고", icon: "🏆" }
  ],
};

export const userPersonaMessages = {
  1: [
    { role: "bot", content: "안녕! 나 또치야 🦔 오늘 어떤 하루였어? 편하게 말해줘!", icon: "🦔" },
    { role: "user", content: "그냥 뭔가 의욕이 없어서..." },
    { role: "bot", content: "의욕이 없을 땐 정말 모든 게 귀찮아지지 😢 밥은 잘 먹고 있어?", icon: "🦔" }
  ],
  2: [
    { role: "bot", content: "안녕하세요, 저는 상담사 지우예요. 요즘 많이 힘드셨을 것 같아요. 어떤 부분이 가장 어려우셨나요?", icon: "👩" },
    { role: "user", content: "잠도 못 자고 아무것도 하기 싫어요" },
    { role: "bot", content: "수면과 의욕 저하가 함께 나타나고 있군요. 언제부터 이런 상태가 시작됐나요?", icon: "👩" }
  ],
  3: [
    { role: "bot", content: "방금 '난 항상 실패해'라고 하셨는데, 그렇게 생각하게 된 구체적인 근거가 있나요? 정말 단 한 번도 잘 된 적이 없었을까요? 한번 같이 생각해봐요.", icon: "🎓" },
    { role: "user", content: "음... 그렇진 않은 것 같기도 하고요" },
    { role: "bot", content: "그렇죠. 그 기억을 좀 더 이야기해줄 수 있어요?", icon: "🎓" }
  ],
  4: [
    { role: "bot", content: "오늘 하루 종일 누워만 있었다고?! 그럼 지금 당장 일어나서 창문 열고 숨 한 번만 크게 쉬어봐! 딱 3초만!", icon: "😄" },
    { role: "user", content: "ㅋㅋ 뭐예요 갑자기" },
    { role: "bot", content: "어? 웃었잖아! 됐어, 성공! 😄 이제 신발만 신어봐, 나머지는 내가 책임질게", icon: "😄" }
  ],
  5: [
    { role: "bot", content: "안녕하세요, 어시스턴트 클로입니다. 당신의 마음이 얼마나 무거운지 제가 다 알 수는 없지만, 지금은 당신의 안전이 가장 중요해요. 🤍", icon: "🤍" },
    { role: "bot", content: "혹시 위 버튼을 눌러 상담전화를 해보셨나요? 전화가 어렵다면 가족이나 친구에게 '나 요즘 많이 힘들어'라고 말해보세요. 가까운 정신건강복지센터 링크를 확인해 드릴 수도 있어요.", icon: "🤍" }
  ]
};

export const userEmotionReport = {
  summary: {
    totalTurns: 12,
    avgRisk: 0.42,
    mainEmotion: "무기력",
    riskLevel: "🟠 중등도",
    score: 45
  },
  trendData: [
    { turn: 1, 우울감: 0.0, 슬픔: 0.0, 외로움: 0.0, 분노: 0.0, 무기력: 1.0, 불면: 0.0, 피로: 0.0 },
    { turn: 2, 우울감: 0.15, 슬픔: 0.15, 외로움: 0.2, 분노: 0.0, 무기력: 0.45, 불면: 0.0, 피로: 0.0 },
    { turn: 3, 우울감: 0.05, 슬픔: 0.05, 외로움: 0.05, 분노: 0.0, 무기력: 0.6, 불면: 0.05, 피로: 0.25 },
    { turn: 4, 우울감: 0.2, 슬픔: 0.0, 외로움: 0.0, 분노: 0.0, 무기력: 0.1, 불면: 0.6, 피로: 0.02 },
  ],
  pieData: [
    { name: "무기력", value: 35, color: "#D946EF" },
    { name: "우울감", value: 25, color: "#EF4444" },
    { name: "슬픔", value: 15, color: "#3B82F6" },
    { name: "외로움", value: 10, color: "#A855F7" },
    { name: "불안", value: 10, color: "#C07070" },
    { name: "기타", value: 5, color: "#D0D0D0" },
  ],
  mindData: [
    { key: "A", title: "정서", desc: "무기력, 슬픔 감지", color: "border-[#D946EF]" },
    { key: "B", title: "행동", desc: "활동 감소, 수면 이상", color: "border-[#0D9488]" },
    { key: "C", title: "인지", desc: "'난 아무것도 못해' 패턴", color: "border-[#8B7BAD]" },
    { key: "D", title: "욕구", desc: "인정받고 싶은 욕구", color: "border-[#C4956B]" },
  ],
  wordCloud: [
    { text: "힘들어", size: "text-2xl", color: "text-[#5B82B5]", pos: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" },
    { text: "무기력", size: "text-lg", color: "text-[#8B7BAD]", pos: "top-1/4 left-1/4" },
    { text: "혼자", size: "text-sm", color: "text-[#D97706]", pos: "bottom-1/4 right-1/4" },
    { text: "잠", size: "text-sm", color: "text-[#EF4444]", pos: "top-1/4 right-1/3" },
    { text: "회사", size: "text-xs", color: "text-[#10B981]", pos: "bottom-1/3 left-1/4" },
    { text: "우울", size: "text-xs", color: "text-[#6366F1]", pos: "top-2/3 left-1/3" },
  ]
};

export const phq9ResultConfig = {
  low: {
    label: "🟡 낮음 · 경도 위험",
    image: "/고슴도치 또치.png",
    subtitle: "고슴도치 또치가 함께할게요!",
    desc: "지금은 일상적인 돌봄이 필요한 상태예요.\n또치와 편하게 이야기 나눠봐요 🌿",
    buttonText: "또치와 대화 시작 →",
    persona: 1,
    bgColor: "bg-[#FFFBF0]",
    badgeColor: "bg-[#FFF3C4] text-[#D97706]",
    textColor: "text-gray-800"
  },
  medium: {
    label: "🟠 중등도 위험",
    image: "/상담사 지우.png",
    subtitle: "상담사 지우가 함께할게요",
    desc: "전문적인 심리 상담이 필요한 상태예요.\n지우와 함께 마음을 깊이 살펴볼게요.",
    buttonText: "지우와 대화 시작 →",
    persona: 2,
    bgColor: "bg-[#EEF4FF]",
    badgeColor: "bg-[#DBEAFE] text-[#1D4ED8]",
    textColor: "text-gray-800"
  },
  high: {
    label: "🔴 고위험 · 즉각 도움 필요",
    image: "/어시스턴트 클로.png",
    subtitle: "지금은 AI보다 사람의 직접적인 도움이 필요해요",
    desc: "당신의 안전을 위해 위기 대응 모드로 전환합니다. 어시스턴트 클로가 긴급 지원 절차를 안내하고 곁을 지켜드릴게요.",
    buttonText: "클로와 안전 가이드 시작하기 →",
    persona: 5,
    bgColor: "bg-[#1A2744]",
    badgeColor: "bg-[#EF4444] text-white",
    textColor: "text-white"
  }
};

