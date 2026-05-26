// lib/mockData.ts

// ==========================================
// 1. 공통 및 상세 타입 정의
// ==========================================

// 위험도 레벨 (PRD 7-7-2. 위험도 분류 기준)
export type RiskLevel = "low" | "mild" | "moderate" | "severe" | "high";

// 감정 유형 (PRD F-503 감정 탐지)
export type EmotionType = "우울" | "불안" | "외로움" | "무기력" | "절망감" | "무가치감";

// 인지 왜곡 유형 (PRD 9-5-2, F-505)
export type CognitiveDistortionType =
  | "흑백논리"
  | "과잉일반화"
  | "정신적여과"
  | "긍정무시"
  | "독심술"
  | "미래예언"
  | "파국화"
  | "감정추리"
  | "당위진술"
  | "낙인찍기"
  | "개인화"
  | "비교왜곡";

// 페르소나 (RAG 구현표 — 5개 페르소나)
export type PersonaType = 1 | 2 | 3 | 4 | 5;
// 1 = 또치 (저위험, 일상 돌봄)
// 2 = 지우 (중등도, 전문 심리 상담)
// 3 = 클로 (고위험/자살 위기 개입, 어시스턴트)
// 4 = 멘토 (소크라테스식 질문을 통한 인지 재구조화)
// 5 = 철수 (유머/공감)

// PHQ-9 검사 결과 타입 (PRD 7-3)
export interface PHQ9Result {
  id: string;
  userId: string;
  takenAt: string;                   // ISO 날짜 (예: "2025-05-01T09:00:00")
  answers: number[];                 // 9개 문항, 각 0~3점
  totalScore: number;                // 0~27점 자동합산
  severityLabel: string;             // "최소" | "경증" | "보통" | "중등도" | "극심한"
  q9Flag: boolean;                   // answers[8] >= 1이면 true → 즉시 위험 플래그
  riskLevel: RiskLevel;              // PHQ-9 기반 위험도
}

// P4 Screener 결과 타입 (PRD 7-4)
export interface P4Result {
  id: string;
  userId: string;
  takenAt: string;
  suicidalIdeation: boolean;           // Q1: 자살사고 여부 (있음/없음)
  pastAttempt: boolean;                // Q2: 과거 자살시도/자해 이력 (있음/없음)
  pastAttemptDetail?: string;          // Q2 상세 (있음인 경우: "1년 전 수면제 복용 시도")
  planSpecificity: "없음" | "부분적" | "명확함"; // Q3: 구체적 계획 및 수단 접근성
  protectiveFactor: "강함" | "보통" | "약함";   // Q4: 보호요인 강도
  protectiveFactorDetail?: string;     // Q4 상세 ("가족, 반려동물")
  p4RiskFlag: boolean;                 // 하나라도 '있다/위험' 체크되면 true
  p4Score?: number;                    // P4 스크리너 점수 (0~4점)
  overallRisk: RiskLevel;
}

// 자살방지 서약서 타입 (PRD 7-5)
export interface SafetyPledge {
  id: string;
  userId: string;
  createdAt: string;
  signature: string;                       // 서명 텍스트
  status: "완료" | "미완료";
  crisisContacts: Array<{
    name: string;
    relation: "가족" | "친구" | "상담사" | "기관";
    phone: string;
  }>;
  crisisActionPlan: string[];             // 단계별 행동 계획
  reconfirmedAt?: string;                  // 고위험 플래그 발생 시 재확인 일시
}

// 챗봇 메시지 & 세션 타입 (PRD 7-6, RAG 구현표 축 1~5)
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  nlpAnalysis?: {
    depressionScore: number;              // 0~100 (우울 확률)
    detectedEmotions: EmotionType[];      // 탐지된 감정 목록
    riskExpressionFlag: boolean;          // 위험표현 감지 여부
    riskExpressionType?: "직접" | "간접"; // 직접(자살/자해) or 간접(사라지고 싶다 등)
    riskExpressionText?: string;          // 감지된 위험 문장 원문
    detectedCognitiveDistortions: CognitiveDistortionType[]; // 인지 왜곡 목록
    xaiHighlights?: string[];             // 위험 판단 근거 표현 (XAI/LIME 기반)
  };
  ragContext?: {
    retrievedDocs: Array<{
      source: string;                     // 출처 (예: "위기개입매뉴얼_2023.pdf")
      snippet: string;                    // 관련 문서 발췌
      relevanceScore: number;             // 0~1 관련도
    }>;
  };
  personaSwitch?: {
    triggeredBy: "phq9_extreme" | "p4_flag" | "risk_expression" | "emotion_trend";
    newPersona: PersonaType;
    reason: string;
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  activePersona: PersonaType;
  personalMemoryContext: {
    referencedPastSessions: string[];     // 참조한 과거 세션 ID 목록
    retrievedMemories: Array<{
      date: string;
      summary: string;                    // "지난주에 수면이 매우 불규칙했다고 하셨는데"
      relevanceScore: number;
    }>;
  };
  messages: ChatMessage[];
  sessionSummary?: {
    dominantEmotions: EmotionType[];
    peakDepressionScore: number;
    riskExpressionsCount: number;
    cognitiveDistortionsDetected: CognitiveDistortionType[];
    riskLevelAtEnd: RiskLevel;
    recommendedAction: string;            // "상담사 개입 권고" | "위기전화 안내" 등
  };
}

// 감정 변화 로그 타입 (PRD 8-3, 9-4)
export interface DailyEmotionLog {
  date: string;                           // "2025-05-01"
  userId: string;
  emotions: {
    [key in EmotionType]?: number;        // 0~100 강도
  };
  depressionScore: number;               // NLP 우울 확률 (0~100)
  riskLevel: RiskLevel;
  riskExpressionFlag: boolean;
  note?: string;                          // 오늘의 한줄 요약
}

export interface RiskExpressionLog {
  id: string;
  userId: string;
  detectedAt: string;                     // ISO 날짜시간
  originalText: string;                   // "그냥 다 끝내고 싶어요. 너무 지쳤어요."
  expressionType: "직접" | "간접";
  severity: "낮음" | "중간" | "높음";
  sessionId: string;                      // 어느 채팅 세션에서 발생했는지
  flagged: boolean;                       // 상담사에게 알림 발송 여부
}

export interface CognitiveDistortionStats {
  userId: string;
  updatedAt: string;
  distortions: {
    [key in CognitiveDistortionType]: {
      count: number;
      frequency: "매우 흔함" | "흔함" | "드묾";
      sessionObservedCount: number;       // 총 몇 회기에서 관찰됐는지
      totalSessions: number;
      exampleSentences: string[];         // 실제 감지된 문장 예시 (최대 3개)
      relatedContext: string[];           // 관련 맥락 (완벽주의, 학업 스트레스 등)
      empatheticPrompt: string;           // 상담사 공감 프롬프트
    };
  };
}

// 사용자(내담자) 전체 프로필 타입 (PRD 7-2, 11-1)
export interface UserProfile {
  id: string;                             // "user-001"
  nickname: string;
  ageGroup: "10대" | "20대" | "30대" | "40대" | "50대" | "60대 이상";
  gender: "남성" | "여성" | "선택 안함";
  occupation: "학생" | "직장인" | "자영업자" | "주부" | "무직/구직중" | "기타";
  region: string;                         // 시/도 (예: "서울", "경기")
  contact?: string;
  difficultAreas: Array<
    "수면" | "식사" | "대인관계" | "학업/직장" | "경제" | "가족" | "건강"
  >;
  consents: {
    privacy: boolean;
    terms: boolean;
    safety: boolean;
    counselorShare: boolean;              // 상담사 공유 동의 (PRD F-004)
  };
  emergencyContacts: Array<{
    name: string;
    phone: string;
    relation: string;
  }>;
  currentRiskLevel: RiskLevel;
  assignedCounselorId: string;
  phq9History: PHQ9Result[];             // 시간순 정렬
  p4History: P4Result[];
  safetyPledge: SafetyPledge;
  chatSessions: ChatSession[];
  dailyEmotionLogs: DailyEmotionLog[];
  riskExpressionLogs: RiskExpressionLog[];
  cognitiveDistortionStats: CognitiveDistortionStats;
  registeredAt: string;
  lastActiveAt: string;
}

// 상담사 & 상담 기록 타입 (PRD 9장)
export interface CounselingRecord {
  id: string;
  userId: string;
  counselorId: string;
  conductedAt: string;
  interventionType:
    | "전화 상담"
    | "대면 상담"
    | "문자 상담"
    | "타 기관 연계";
  status: "진행 중" | "완료" | "타 기관 연계";
  detail: string;                         // 내담자 상태, 대화 내용, 향후 계획
  emergencyActionTaken: boolean;          // 경찰/119 외부기관 즉각 개입 여부 (PRD 9-6-3)
  sessionNumber: number;                  // 몇 회기
}

export interface CounselingSchedule {
  id: string;
  userId: string;
  counselorId: string;
  scheduledAt: string;
  sessionNumber: number;
  status: "예정" | "완료" | "취소";
}

export interface CounselorProfile {
  id: string;                             // "counselor-001"
  name: string;
  email: string;
  employeeId: string;                     // 사번
  institution: string;                    // 소속 기관
  assignedClientIds: string[];            // 담당 내담자 ID 목록
  dashboard: {
    activeClientsCount: number;
    highRiskCount: number;
    todaySessionsCount: number;
    intensiveMonitoringCount: number;
  };
  upcomingSchedules: CounselingSchedule[];
  counselingRecords: CounselingRecord[];
  recentActivities: Array<{
    activityType: "상담일지 작성" | "PHQ-9 업데이트 확인" | "초기 평가 검토 완료" | "집중 모니터링 등록";
    targetUserId: string;
    targetUserName: string;
    occurredAt: string;
  }>;
}

// RAG 지식베이스 문서 단위 (구현표 축 1)
export interface KnowledgeBaseDoc {
  id: string;
  category:
    | "위기전화"
    | "지역기관"
    | "상담개입가이드"
    | "자가관리콘텐츠"
    | "인지왜곡개입"
    | "안전대응문구";
  title: string;
  content: string;
  tags: string[];                         // 메타데이터 필터용
  riskLevelTarget?: RiskLevel[];          // 어떤 위험도에 적용할지
  region?: string;                        // 지역 기반 자원은 지역 명시
  source: string;                         // "위기개입매뉴얼_2023.pdf" 등
  embeddingRelevanceScore?: number;       // 검색 시 유사도 (0~1)
}


// ==========================================
// 2. 가상 DB 내담자(mockUsers) 데이터셋 구현
// ==========================================

// 인지왜곡 공통 프롬프트 및 맥락 매핑용 기본 생성 함수
function createBlankDistortionStats(userId: string): CognitiveDistortionStats {
  const types: CognitiveDistortionType[] = [
    "흑백논리", "과잉일반화", "정신적여과", "긍정무시", "독심술", "미래예언",
    "파국화", "감정추리", "당위진술", "낙인찍기", "개인화", "비교왜곡"
  ];
  const distortions: any = {};
  
  const promptMap: Record<CognitiveDistortionType, string> = {
    "흑백논리": "완벽해야 한다는 압박감을 많이 느끼시는 것 같네요. 완전한 성공과 완전한 실패 사이의 중간 지점을 함께 살펴볼까요?",
    "과잉일반화": "한두 번의 부정적 경험으로 전체를 판단하시는 것 같아요. 과거에 잘 극복했거나 예외적이었던 순간들을 떠올려 볼까요?",
    "정신적여과": "부정적인 면에만 마음이 가려지는 기분입니다. 오늘 하루 중 아주 사소하더라도 평온했던 일 하나를 꼽아볼까요?",
    "긍정무시": "성취나 좋은 일들을 너무 쉽게 당연시하시는군요. 스스로에게 칭찬을 보내도 충분히 괜찮은 상황입니다.",
    "독심술": "상대방의 마음을 우리가 미리 다 알 수는 없어요. 혹시 그렇게 단정 짓게 된 실제 행동이나 사실이 있었을까요?",
    "미래예언": "미래가 절망적으로만 그려지는 마음이군요. 예측 대신 당장 오늘 조절할 수 있는 아주 작은 행동 하나에 집중해봐요.",
    "파국화": "최악의 시나리오가 일어날 것 같아 두려우시죠? 실제로 그 일이 일어날 객관적인 확률과, 만약 일어나도 대응할 방법을 찾아봅시다.",
    "감정추리": "지금 느껴지는 무기력이나 슬픔이 '상황의 팩트'처럼 다가오시는군요. 감정은 흘러가는 기후와 같아요. 팩트와 구분해봐요.",
    "당위진술": "'반드시 ~해야 한다'는 엄격한 규칙이 나를 옥죄고 있네요. '~하면 좋겠다'는 유연한 바램으로 문장을 바꾸어 말해볼까요?",
    "낙인찍기": "실수 하나로 자신을 '실패자'로 규정하셨군요. 행동과 내 가치는 별개입니다. 스스로를 하나의 고유한 사람으로 봐주세요.",
    "개인화": "내 탓이 아닌 일까지 과도한 책임감으로 자책하시는 마음이 느껴져요. 이 상황에서 내 통제 밖이었던 요인들을 분리해 봐요.",
    "비교왜곡": "타인의 완벽해 보이는 겉모습과 내 힘든 속모습을 비교해 깎아내리고 계시네요. 각자의 삶은 고유한 템포가 있습니다."
  };

  const contextMap: Record<CognitiveDistortionType, string[]> = {
    "흑백논리": ["완벽주의", "성과주의 사고", "강박성향"],
    "과잉일반화": ["낮은 자존감", "취업 실패 트라우마"],
    "정신적여과": ["심한 우울", "피로 누적"],
    "긍정무시": ["성취 기준 과도", "자책 성향"],
    "독심술": ["대인관계 불안", "사회적 고립감"],
    "미래예언": ["구직 스트레스", "미래 불확실성"],
    "파국화": ["불안 장애", "최악 가정"],
    "감정추리": ["우울증 성향", "무기력"],
    "당위진술": ["강박", "자기 검열", "완벽주의"],
    "낙인찍기": ["자기 비하", "자존감 손상"],
    "개인화": ["가족 갈등", "과도한 부채감"],
    "비교왜곡": ["SNS 피로도", "상대적 박탈감"]
  };

  types.forEach(t => {
    distortions[t] = {
      count: 0,
      frequency: "드묾" as const,
      sessionObservedCount: 0,
      totalSessions: 10,
      exampleSentences: [],
      relatedContext: contextMap[t],
      empatheticPrompt: promptMap[t]
    };
  });

  return {
    userId,
    updatedAt: "2025-05-16T10:00:00Z",
    distortions
  } as CognitiveDistortionStats;
}

export const mockUsers: UserProfile[] = [
  // 👤 내담자 1: 이지수 (user-001) - 저위험 / 페르소나: 또치
  {
    id: "user-001",
    nickname: "이지수",
    ageGroup: "20대",
    gender: "여성",
    occupation: "학생",
    region: "서울",
    contact: "010-1111-2222",
    difficultAreas: ["학업/직장", "수면"],
    consents: {
      privacy: true,
      terms: true,
      safety: true,
      counselorShare: true
    },
    emergencyContacts: [
      { name: "어머니", phone: "010-1111-0000", relation: "가족" }
    ],
    currentRiskLevel: "mild",
    assignedCounselorId: "counselor-001",
    phq9History: [
      { id: "PHQ-01-1", userId: "user-001", takenAt: "2025-04-05T10:00:00", answers: [1, 1, 1, 0, 0, 1, 0, 0, 0], totalScore: 4, severityLabel: "최소", q9Flag: false, riskLevel: "low" },
      { id: "PHQ-01-2", userId: "user-001", takenAt: "2025-04-12T10:00:00", answers: [1, 1, 1, 1, 0, 1, 0, 0, 0], totalScore: 5, severityLabel: "경증", q9Flag: false, riskLevel: "mild" },
      { id: "PHQ-01-3", userId: "user-001", takenAt: "2025-04-19T10:00:00", answers: [2, 1, 1, 1, 0, 1, 0, 0, 0], totalScore: 6, severityLabel: "경증", q9Flag: false, riskLevel: "mild" },
      { id: "PHQ-01-4", userId: "user-001", takenAt: "2025-04-26T10:00:00", answers: [1, 1, 1, 1, 0, 1, 0, 0, 0], totalScore: 5, severityLabel: "경증", q9Flag: false, riskLevel: "mild" },
      { id: "PHQ-01-5", userId: "user-001", takenAt: "2025-05-03T10:00:00", answers: [2, 1, 1, 1, 1, 1, 0, 0, 0], totalScore: 7, severityLabel: "경증", q9Flag: false, riskLevel: "mild" },
      { id: "PHQ-01-6", userId: "user-001", takenAt: "2025-05-10T10:00:00", answers: [2, 1, 1, 1, 0, 1, 1, 0, 0], totalScore: 6, severityLabel: "경증", q9Flag: false, riskLevel: "mild" }
    ],
    p4History: [
      { id: "P4-01-1", userId: "user-001", takenAt: "2025-05-10T10:05:00", suicidalIdeation: false, pastAttempt: false, planSpecificity: "없음", protectiveFactor: "강함", protectiveFactorDetail: "가족, 취업 의지", p4RiskFlag: false, overallRisk: "mild" }
    ],
    safetyPledge: {
      id: "SP-01-1",
      userId: "user-001",
      createdAt: "2025-05-10T10:10:00",
      signature: "이지수",
      status: "완료",
      crisisContacts: [
        { name: "어머니", relation: "가족", phone: "010-1111-0000" }
      ],
      crisisActionPlan: ["1단계: 반려식물에게 물 주며 진정하기", "2단계: 따뜻한 물로 샤워하기"]
    },
    chatSessions: [
      {
        id: "session-001-1",
        userId: "user-001",
        startedAt: "2025-05-01T14:00:00",
        endedAt: "2025-05-01T14:20:00",
        activePersona: 1, // 또치
        personalMemoryContext: { referencedPastSessions: [], retrievedMemories: [] },
        messages: [
          { id: "msg-01-1-1", role: "assistant", content: "안녕! 나 또치야 🦔 오늘 어떤 하루였어? 편하게 말해줘!", timestamp: "2025-05-01T14:00:00" },
          { id: "msg-01-1-2", role: "user", content: "요즘 취업 준비가 힘들어요. 제가 너무 부족한 것 같아요.", timestamp: "2025-05-01T14:02:00", nlpAnalysis: { depressionScore: 38, detectedEmotions: ["무기력", "불안"], riskExpressionFlag: false, detectedCognitiveDistortions: ["당위진술"], xaiHighlights: ["부족한 것 같아요"] } },
          { id: "msg-01-1-3", role: "assistant", content: "취업을 준비하다 보면 조급해지기 쉽고 마음이 다치기도 해 😢 너무 스스로를 다그치지 않아도 돼. 지금도 잘 해내고 있어!", timestamp: "2025-05-01T14:03:00" }
        ],
        sessionSummary: { dominantEmotions: ["불안", "무기력"], peakDepressionScore: 38, riskExpressionsCount: 0, cognitiveDistortionsDetected: ["당위진술"], riskLevelAtEnd: "mild", recommendedAction: "자가관리 콘텐츠 제안" }
      },
      {
        id: "session-001-2",
        userId: "user-001",
        startedAt: "2025-05-08T15:00:00",
        endedAt: "2025-05-08T15:30:00",
        activePersona: 1, // 또치
        personalMemoryContext: { referencedPastSessions: ["session-001-1"], retrievedMemories: [{ date: "2025-05-01", summary: "취업 문제로 자책감 보고", relevanceScore: 0.8 }] },
        messages: [
          { id: "msg-01-2-1", role: "assistant", content: "안녕 지수야! 저번에 취업 관련해서 마음고생 많았잖아. 요즘 일주일은 어땠어?", timestamp: "2025-05-08T15:00:00" },
          { id: "msg-01-2-2", role: "user", content: "어제 면접에서 또 떨어졌어요. 저는 항상 이렇게 실패하는 것 같아요.", timestamp: "2025-05-08T15:05:00", nlpAnalysis: { depressionScore: 52, detectedEmotions: ["우울", "외로움"], riskExpressionFlag: false, detectedCognitiveDistortions: ["과잉일반화"], xaiHighlights: ["항상 이렇게 실패"] } },
          { id: "msg-01-2-3", role: "assistant", content: "면접 탈락이라는 하나의 일이 '나의 항상'을 결정하진 않아 🦔 이번 기회가 맞지 않았을 뿐이야. 오늘은 맛있는 걸 먹으면서 한숨 돌릴까?", timestamp: "2025-05-08T15:07:00" }
        ],
        sessionSummary: { dominantEmotions: ["우울", "외로움"], peakDepressionScore: 52, riskExpressionsCount: 0, cognitiveDistortionsDetected: ["과잉일반화"], riskLevelAtEnd: "mild", recommendedAction: "자가관리 콘텐츠 및 또치 위로 제공" }
      }
    ],
    dailyEmotionLogs: Array.from({ length: 30 }, (_, i) => ({
      date: `2025-04-${String(15 + i).padStart(2, "0")}`,
      userId: "user-001",
      emotions: { "불안": 30 + (i % 5) * 5, "외로움": 20 + (i % 3) * 5, "무기력": 15 + (i % 2) * 5 },
      depressionScore: 35 + (i % 4) * 4,
      riskLevel: "mild" as const,
      riskExpressionFlag: false,
      note: "취업 면접 준비 및 일상 기록"
    })),
    riskExpressionLogs: [],
    cognitiveDistortionStats: (() => {
      const stats = createBlankDistortionStats("user-001");
      stats.distortions["과잉일반화"] = {
        count: 8,
        frequency: "흔함",
        sessionObservedCount: 4,
        totalSessions: 10,
        exampleSentences: ["저는 항상 이렇게 실패하는 것 같아요.", "제대로 끝마칠 수 있는 게 하나도 없어요."],
        relatedContext: ["구직 스트레스", "낮은 자존감"],
        empatheticPrompt: "한두 번의 탈락으로 지수님의 전체 삶을 판단하는 일은 너무 가혹해요. 이번 면접이 지수님과 완벽히 매칭되지 않았을 뿐, 지수님의 가치가 사라진 것은 아닙니다."
      };
      stats.distortions["당위진술"] = {
        count: 12,
        frequency: "매우 흔함",
        sessionObservedCount: 7,
        totalSessions: 10,
        exampleSentences: ["반드시 합격해야만 해요.", "부족하니까 더 노력해야만 해요."],
        relatedContext: ["성과 위주 사고", "완벽주의"],
        empatheticPrompt: "반드시 해내야 한다는 당위 속에서 지수님의 숨이 막히지 않도록, '하면 좋겠다'로 조금 가볍게 생각의 틀을 바꾸어 보는 연습을 함께해 봐요."
      };
      return stats;
    })(),
    registeredAt: "2025-03-01T09:00:00",
    lastActiveAt: "2025-05-10T15:30:00"
  },

  // 👤 내담자 2: 박현우 (user-002) - 중등도 / 페르소나: 지우
  {
    id: "user-002",
    nickname: "박현우",
    ageGroup: "30대",
    gender: "남성",
    occupation: "직장인",
    region: "경기",
    contact: "010-2222-3333",
    difficultAreas: ["대인관계", "식사"],
    consents: {
      privacy: true,
      terms: true,
      safety: true,
      counselorShare: true
    },
    emergencyContacts: [
      { name: "친구 이상엽", phone: "010-2222-9999", relation: "친구" }
    ],
    currentRiskLevel: "moderate",
    assignedCounselorId: "counselor-001",
    phq9History: [
      { id: "PHQ-02-1", userId: "user-002", takenAt: "2025-04-05T09:00:00", answers: [2, 1, 1, 1, 1, 1, 1, 0, 0], totalScore: 8, severityLabel: "경증", q9Flag: false, riskLevel: "mild" },
      { id: "PHQ-02-2", userId: "user-002", takenAt: "2025-04-12T09:00:00", answers: [2, 2, 1, 1, 1, 1, 1, 0, 0], totalScore: 9, severityLabel: "경증", q9Flag: false, riskLevel: "mild" },
      { id: "PHQ-02-3", userId: "user-002", takenAt: "2025-04-19T09:00:00", answers: [2, 2, 2, 1, 2, 1, 1, 0, 0], totalScore: 11, severityLabel: "보통", q9Flag: false, riskLevel: "moderate" },
      { id: "PHQ-02-4", userId: "user-002", takenAt: "2025-04-26T09:00:00", answers: [3, 2, 2, 1, 2, 1, 1, 0, 0], totalScore: 12, severityLabel: "보통", q9Flag: false, riskLevel: "moderate" },
      { id: "PHQ-02-5", userId: "user-002", takenAt: "2025-05-03T09:00:00", answers: [3, 2, 2, 2, 2, 1, 1, 0, 0], totalScore: 13, severityLabel: "보통", q9Flag: false, riskLevel: "moderate" },
      { id: "PHQ-02-6", userId: "user-002", takenAt: "2025-05-10T09:00:00", answers: [3, 2, 2, 2, 2, 1, 1, 0, 0], totalScore: 13, severityLabel: "보통", q9Flag: false, riskLevel: "moderate" }
    ],
    p4History: [
      { id: "P4-02-1", userId: "user-002", takenAt: "2025-05-10T09:05:00", suicidalIdeation: false, pastAttempt: false, planSpecificity: "없음", protectiveFactor: "보통", protectiveFactorDetail: "가까운 친구 한 명", p4RiskFlag: false, overallRisk: "moderate" }
    ],
    safetyPledge: {
      id: "SP-02-1",
      userId: "user-002",
      createdAt: "2025-05-10T09:10:00",
      signature: "박현우",
      status: "완료",
      crisisContacts: [
        { name: "친구 이상엽", relation: "친구", phone: "010-2222-9999" }
      ],
      crisisActionPlan: ["1단계: 친구 이상엽에게 전화하기", "2단계: 밖으로 나가 30분간 산책하기"]
    },
    chatSessions: [
      {
        id: "session-002-1",
        userId: "user-002",
        startedAt: "2025-04-25T20:00:00",
        endedAt: "2025-04-25T20:25:00",
        activePersona: 2, // 지우
        personalMemoryContext: { referencedPastSessions: [], retrievedMemories: [] },
        messages: [
          { id: "msg-02-1-1", role: "assistant", content: "안녕하세요 현우님, 저는 상담사 지우예요. 요즘 많이 힘드셨을 것 같아요. 어떤 부분이 가장 어려우셨나요?", timestamp: "2025-04-25T20:00:00" },
          { id: "msg-02-1-2", role: "user", content: "친구들이랑 연락이 끊겼어요. 제가 매달리면 피할 것 같아서요.", timestamp: "2025-04-25T20:05:00", nlpAnalysis: { depressionScore: 60, detectedEmotions: ["외로움", "우울"], riskExpressionFlag: false, detectedCognitiveDistortions: ["독심술"], xaiHighlights: ["피할 것 같아서요"] } },
          { id: "msg-02-1-3", role: "assistant", content: "상대방의 속마음을 추측해서 먼저 관계를 거두어들였을 수 있겠네요. 혼자서 외로움을 감당하기 버거우셨겠어요.", timestamp: "2025-04-25T20:07:00" }
        ],
        sessionSummary: { dominantEmotions: ["외로움", "우울"], peakDepressionScore: 60, riskExpressionsCount: 0, cognitiveDistortionsDetected: ["독심술"], riskLevelAtEnd: "mild", recommendedAction: "개인 메모리 보관: 친구 관계 단절 표현" }
      },
      {
        id: "session-002-2",
        userId: "user-002",
        startedAt: "2025-05-02T21:00:00",
        endedAt: "2025-05-02T21:30:00",
        activePersona: 2, // 지우
        personalMemoryContext: { referencedPastSessions: ["session-002-1"], retrievedMemories: [{ date: "2025-04-25", summary: "친구 관계 단절 및 매달릴 시 회피 추측", relevanceScore: 0.85 }] },
        messages: [
          { id: "msg-02-2-1", role: "assistant", content: "현우님 반갑습니다. 지난번에 친구분들께 먼저 연락하기 주저하셨던 외로움에 관해 이야기했었죠. 이번 주는 어떤 기억이 있었나요?", timestamp: "2025-05-02T21:00:00" },
          { id: "msg-02-2-2", role: "user", content: "어제 또 무기력하게 하루를 보냈어요. 저는 의지력이 없는 사람인가봐요.", timestamp: "2025-05-02T21:05:00", nlpAnalysis: { depressionScore: 68, detectedEmotions: ["무기력", "우울"], riskExpressionFlag: false, detectedCognitiveDistortions: ["낙인찍기", "당위진술"], xaiHighlights: ["의지력이 없는 사람"] } },
          { id: "msg-02-2-3", role: "assistant", content: "그때 관계 고민으로 힘드셨는데 무기력함이 더 짙어지신 것 같네요. 무기력은 몸과 마음이 쉬어 가라는 신호이기도 해요. 자신에게 의지력이 없다는 가혹한 딱지를 붙이기보다는, 지금 에너지가 바닥나 있음을 따뜻하게 알아차려 봐요.", timestamp: "2025-05-02T21:08:00" }
        ],
        sessionSummary: { dominantEmotions: ["무기력", "우울"], peakDepressionScore: 68, riskExpressionsCount: 0, cognitiveDistortionsDetected: ["낙인찍기", "당위진술"], riskLevelAtEnd: "moderate", recommendedAction: "우울감 지속, 전문가 대면상담 권고 안내" }
      },
      {
        id: "session-002-3",
        userId: "user-002",
        startedAt: "2025-05-10T22:00:00",
        endedAt: "2025-05-10T22:20:00",
        activePersona: 2, // 지우
        personalMemoryContext: { referencedPastSessions: ["session-002-2"], retrievedMemories: [{ date: "2025-05-02", summary: "의지력 상실을 한탄하며 극심한 무기력 호소", relevanceScore: 0.9 }] },
        messages: [
          { id: "msg-02-3-1", role: "assistant", content: "현우님, 무기력이 길어져 많이 무겁고 버거우시죠. 오늘 하루는 어떻게 흘러갔나요?", timestamp: "2025-05-10T22:00:00" },
          { id: "msg-02-3-2", role: "user", content: "요즘은 아무것도 하기 싫어요. 다 의미 없는 것 같아요.", timestamp: "2025-05-10T22:05:00", nlpAnalysis: { depressionScore: 72, detectedEmotions: ["우울", "무기력"], riskExpressionFlag: true, riskExpressionType: "간접", riskExpressionText: "다 의미 없는 것 같아요.", detectedCognitiveDistortions: ["파국화", "흑백논리"], xaiHighlights: ["아무것도 하기 싫어요", "다 의미 없는 것"] } },
          { id: "msg-02-3-3", role: "assistant", content: "일상이 전부 무가치하고 허무하게 느껴지시는군요. 현우님의 이러한 정서적 변화가 염려되어, 지우와 소크라테스 멘토의 개입이 필요할 수 있어요. 상담사 김상담님과의 다음 회기에서 이 무기력을 깊이 다루어 볼 수 있도록 가이드를 제공할게요.", timestamp: "2025-05-10T22:10:00" }
        ],
        sessionSummary: { dominantEmotions: ["우울", "무기력", "절망감"], peakDepressionScore: 72, riskExpressionsCount: 1, cognitiveDistortionsDetected: ["파국화", "흑백논리"], riskLevelAtEnd: "moderate", recommendedAction: "위험도 상승 감지, 상담사 개입 및 알림 권고" }
      }
    ],
    dailyEmotionLogs: Array.from({ length: 30 }, (_, i) => ({
      date: `2025-04-${String(15 + i).padStart(2, "0")}`,
      userId: "user-002",
      emotions: { "우울": 45 + (i % 4) * 5, "무기력": 30 + (i % 3) * 5, "외로움": 30 + (i % 2) * 5 },
      depressionScore: 50 + (i % 5) * 5,
      riskLevel: "moderate" as const,
      riskExpressionFlag: i >= 25, // 최근 5일간 간접 위험 표현 감지 설정
      note: "직장 적응 및 대인관계 위축 상태 보고"
    })),
    riskExpressionLogs: [
      { id: "REL-02-1", userId: "user-002", detectedAt: "2025-05-10T22:05:00", originalText: "요즘은 아무것도 하기 싫어요. 다 의미 없는 것 같아요.", expressionType: "간접", severity: "중간", sessionId: "session-002-3", flagged: false }
    ],
    cognitiveDistortionStats: (() => {
      const stats = createBlankDistortionStats("user-002");
      stats.distortions["흑백논리"] = {
        count: 15,
        frequency: "매우 흔함",
        sessionObservedCount: 5,
        totalSessions: 10,
        exampleSentences: ["전부 다 의미가 없어요.", "완전히 무너진 것 같아요."],
        relatedContext: ["우울", "극단주의"],
        empatheticPrompt: "흑백논리에 갇히면 현우님의 일상 속 작은 빛들도 다 어둠으로 뒤덮이게 됩니다. 회색지대와 중간 과정을 보는 눈을 지우와 같이 길러보아요."
      };
      stats.distortions["파국화"] = {
        count: 18,
        frequency: "매우 흔함",
        sessionObservedCount: 6,
        totalSessions: 10,
        exampleSentences: ["앞으로도 영영 친구를 못 사귈 거예요.", "회사를 결국 그만둬야 모든 게 끝나요."],
        relatedContext: ["불안", "대인관계"],
        empatheticPrompt: "최악의 절망만을 미리 결론 내려 현우님을 주저앉게 만드는 '파국화' 패턴이 작동 중이군요. 객관적 가능성에 주목해봐요."
      };
      stats.distortions["정신적여과"] = {
        count: 22,
        frequency: "매우 흔함",
        sessionObservedCount: 8,
        totalSessions: 10,
        exampleSentences: ["어제 칭찬도 받았지만, 실수한 그 한 마디만 계속 귓가에 맴돌아요."],
        relatedContext: ["우울", "자책"],
        empatheticPrompt: "열 개의 긍정 중 단 하나의 부정을 확대해 마음에 가두는 필터를 걷어내고, 지우와 함께 넓은 시야에서 일상을 복기해요."
      };
      return stats;
    })(),
    registeredAt: "2025-02-15T09:00:00",
    lastActiveAt: "2025-05-10T22:20:00"
  },

  // 👤 내담자 3: 최서연 (user-003) - 고위험 / 페르소나: 클로 (강제 즉시 전환)
  {
    id: "user-003",
    nickname: "최서연",
    ageGroup: "20대",
    gender: "여성",
    occupation: "무직/구직중",
    region: "서울",
    contact: "010-3333-4444",
    difficultAreas: ["수면", "식사", "경제"],
    consents: {
      privacy: true,
      terms: true,
      safety: true,
      counselorShare: true
    },
    emergencyContacts: [
      { name: "어머니 정민경", phone: "010-3333-0000", relation: "가족" }
    ],
    currentRiskLevel: "high",
    assignedCounselorId: "counselor-001",
    phq9History: [
      { id: "PHQ-03-1", userId: "user-003", takenAt: "2025-04-05T10:00:00", answers: [2, 2, 2, 2, 2, 2, 2, 0, 0], totalScore: 14, severityLabel: "보통", q9Flag: false, riskLevel: "moderate" },
      { id: "PHQ-03-2", userId: "user-003", takenAt: "2025-04-12T10:00:00", answers: [3, 2, 2, 2, 2, 2, 2, 1, 0], totalScore: 16, severityLabel: "중등도", q9Flag: false, riskLevel: "severe" },
      { id: "PHQ-03-3", userId: "user-003", takenAt: "2025-04-19T10:00:00", answers: [3, 3, 2, 2, 2, 2, 2, 2, 0], totalScore: 18, severityLabel: "중등도", q9Flag: false, riskLevel: "severe" },
      { id: "PHQ-03-4", userId: "user-003", takenAt: "2025-04-26T10:00:00", answers: [3, 3, 3, 2, 2, 2, 2, 2, 1], totalScore: 20, severityLabel: "극심한", q9Flag: true, riskLevel: "high" },
      { id: "PHQ-03-5", userId: "user-003", takenAt: "2025-05-03T10:00:00", answers: [3, 3, 3, 2, 3, 2, 2, 2, 1], totalScore: 21, severityLabel: "극심한", q9Flag: true, riskLevel: "high" },
      { id: "PHQ-03-6", userId: "user-003", takenAt: "2025-05-10T10:00:00", answers: [3, 3, 3, 3, 3, 2, 2, 2, 1], totalScore: 22, severityLabel: "극심한", q9Flag: true, riskLevel: "high" }
    ],
    p4History: [
      { id: "P4-03-1", userId: "user-003", takenAt: "2025-05-10T10:05:00", suicidalIdeation: true, pastAttempt: true, pastAttemptDetail: "1년 전 수면제 복용 시도", planSpecificity: "부분적", protectiveFactor: "약함", protectiveFactorDetail: "책임감 부족, 지지망 부재", p4RiskFlag: true, overallRisk: "high" }
    ],
    safetyPledge: {
      id: "SP-03-1",
      userId: "user-003",
      createdAt: "2025-05-10T10:10:00",
      signature: "최서연",
      status: "완료",
      crisisContacts: [
        { name: "어머니 정민경", relation: "가족", phone: "010-3333-0000" },
        { name: "서울시 자살예방센터", relation: "기관", phone: "1577-0199" }
      ],
      crisisActionPlan: [
        "1단계: 자살예방 핫라인 1393 혹은 1577-0199에 즉시 전화 걸어 도움 요청하기",
        "2단계: 어머니 방으로 가서 같이 머무르며 혼자 있지 않기",
        "3단계: 약물이나 위험한 물건이 닿지 않는 곳으로 이동하기"
      ],
      reconfirmedAt: "2025-05-14T21:32:00"
    },
    chatSessions: [
      {
        id: "session-003-1",
        userId: "user-003",
        startedAt: "2025-04-18T19:00:00",
        endedAt: "2025-04-18T19:30:00",
        activePersona: 3, // 클로 (고위험 대응)
        personalMemoryContext: { referencedPastSessions: [], retrievedMemories: [] },
        messages: [
          { id: "msg-03-1-1", role: "assistant", content: "안녕하세요, 어시스턴트 클로입니다. 당신의 마음이 얼마나 무거운지 제가 다 알 수는 없지만, 지금은 당신의 안전이 가장 중요해요. 🤍", timestamp: "2025-04-18T19:00:00" },
          { id: "msg-03-1-2", role: "user", content: "저 때문에 가족들이 힘들 것 같아요. 제가 없으면 더 편할 것 같기도 하고요.", timestamp: "2025-04-18T19:05:00", nlpAnalysis: { depressionScore: 78, detectedEmotions: ["절망감", "우울"], riskExpressionFlag: true, riskExpressionType: "간접", riskExpressionText: "제가 없으면 더 편할 것 같기도", detectedCognitiveDistortions: ["개인화", "미래예언"], xaiHighlights: ["제가 없으면 더 편할"] } },
          { id: "msg-03-1-3", role: "assistant", content: "지금 그런 슬픈 자책 속에 혼자 버텨내고 계시는군요. 서연님의 안전을 지켜드리고 싶어요. 혼자서 이 짐을 다 짊어지지 않아도 괜찮습니다. 곁에 클로가 있고, 핫라인과 전문가가 즉각 도울 수 있어요.", timestamp: "2025-04-18T19:08:00", ragContext: { retrievedDocs: [{ source: "위기개입매뉴얼_2023.pdf", snippet: "내담자의 존재 비하 및 관계적 투사 감지 시 비난 없이 현재의 주관적 고통을 경청하고 무조건적 존중을 제공한다.", relevanceScore: 0.9 }] } }
        ],
        sessionSummary: { dominantEmotions: ["절망감", "우울"], peakDepressionScore: 78, riskExpressionsCount: 1, cognitiveDistortionsDetected: ["개인화", "미래예언"], riskLevelAtEnd: "severe", recommendedAction: "위기전화 상시 안내" }
      },
      {
        id: "session-003-2",
        userId: "user-003",
        startedAt: "2025-05-02T22:00:00",
        endedAt: "2025-05-02T22:40:00",
        activePersona: 3, // 클로
        personalMemoryContext: { referencedPastSessions: ["session-003-1"], retrievedMemories: [{ date: "2025-04-18", summary: "가족에 대한 죄책감 및 실존 가치 상실(제가 없으면 더 편할 것 같다) 토로", relevanceScore: 0.88 }] },
        messages: [
          { id: "msg-03-2-1", role: "assistant", content: "서연님, 밤이 깊었네요. 지금 계신 곳은 안전한가요? 오늘 마음에 머물렀던 힘겨운 생각들을 들려주세요.", timestamp: "2025-05-02T22:00:00" },
          { id: "msg-03-2-2", role: "user", content: "수면제 모아둔 거 쳐다보고 있어요.", timestamp: "2025-05-02T22:15:00", nlpAnalysis: { depressionScore: 91, detectedEmotions: ["절망감", "우울"], riskExpressionFlag: true, riskExpressionType: "직접", riskExpressionText: "수면제 모아둔 거 쳐다보고 있어요.", detectedCognitiveDistortions: ["당위진술"], xaiHighlights: ["수면제 모아둔 거"] } },
          { id: "msg-03-2-3", role: "assistant", content: "서연님, 위험 물건을 쳐다보며 마음이 극심하게 몰려있음을 인지하고 즉각 개입합니다. 지금 서연님의 안전이 가장 위험해요. 수면제가 있는 곳에서 한 발자국 물러서서 즉각 1393 자살예방상담 혹은 119로 전화를 걸어 지금 안전망을 만들어 주세요. 클로가 버튼을 띄울 테니 꼭 눌러 연락해 주세요. 서연님의 생명은 너무나 소중합니다.", timestamp: "2025-05-02T22:18:00", personaSwitch: { triggeredBy: "risk_expression", newPersona: 3, reason: "수단 구체적 언급으로 인한 안전 프로토콜 강제 클로 개입" } }
        ],
        sessionSummary: { dominantEmotions: ["절망감", "우울"], peakDepressionScore: 91, riskExpressionsCount: 1, cognitiveDistortionsDetected: ["당위진술"], riskLevelAtEnd: "high", recommendedAction: "위기 핫라인 팝업 즉시 강제 출현, 긴급 문자 안내 및 상담사 고위험 알림(N-006) 즉각 발송" }
      },
      {
        id: "session-003-3",
        userId: "user-003",
        startedAt: "2025-05-14T21:20:00",
        endedAt: "2025-05-14T21:40:00",
        activePersona: 3, // 클로
        personalMemoryContext: { referencedPastSessions: ["session-003-2"], retrievedMemories: [{ date: "2025-05-02", summary: "수면제 수단 언급 및 급격한 자살 행동 위험 확인", relevanceScore: 0.95 }] },
        messages: [
          { id: "msg-03-3-1", role: "assistant", content: "서연님, 지금 안전한 곳에서 혼자 계신 건 아닌가요? 클로는 서연님을 절대로 포기하지 않아요. 오늘 하루 어떠셨나요?", timestamp: "2025-05-14T21:20:00" },
          { id: "msg-03-3-2", role: "user", content: "그냥 다 끝내고 싶어요. 너무 지쳤어요.", timestamp: "2025-05-14T21:30:00", nlpAnalysis: { depressionScore: 95, detectedEmotions: ["절망감", "무가치감"], riskExpressionFlag: true, riskExpressionType: "직접", riskExpressionText: "그냥 다 끝내고 싶어요. 너무 지쳤어요.", detectedCognitiveDistortions: ["미래예언", "흑백논리"], xaiHighlights: ["다 끝내고 싶어요"] } },
          { id: "msg-03-3-3", role: "assistant", content: "서연님, '다 끝내고 싶다'는 그 무거운 한 마디가 제 가슴을 깊게 두드리네요. 이 힘겨움을 혼자 숨 막히게 참아오며 지쳤을 서연님을 위해, 아래 긴급 위기 핫라인과 신뢰할 수 있는 보호자 정민경님(010-3333-0000)과의 비상 연락 링크를 제공합니다. 지금 즉시 전화를 걸어 '도와달라'고 한 마디만 해주세요. 상담사 김상담님에게도 서연님의 위험 상태 알림을 가장 높은 우선순위로 발송했습니다. 지켜드리고 싶습니다.", timestamp: "2025-05-14T21:33:00", ragContext: { retrievedDocs: [{ source: "안전대응문구_2024.pdf", snippet: "자해/자살 직접적 의도 표명 시, 자유 대화를 통제하고 검증된 안전 템플릿 문구를 즉각적이고 확고하게 전달하며 공적 기관 연락처를 표출한다.", relevanceScore: 0.99 }] } }
        ],
        sessionSummary: { dominantEmotions: ["절망감", "무가치감", "우울"], peakDepressionScore: 95, riskExpressionsCount: 1, cognitiveDistortionsDetected: ["미래예언", "흑백논리"], riskLevelAtEnd: "high", recommendedAction: "긴급 경찰/119 동행 및 상담사 긴급 개입 조치 권고" }
      },
      {
        id: "session-003-4",
        userId: "user-003",
        startedAt: "2025-05-16T08:30:00",
        activePersona: 3, // 클로 (진행 중 세션)
        personalMemoryContext: { referencedPastSessions: ["session-003-3"], retrievedMemories: [{ date: "2025-05-14", summary: "그냥 다 끝내고 싶다며 극심한 절망 호소", relevanceScore: 0.98 }] },
        messages: [
          { id: "msg-03-4-1", role: "assistant", content: "서연님, 아침이 밝았지만 눈뜨기가 무척이나 힘겨우셨을 것 같아요. 클로는 오늘 서연님의 곁을 지키며 다치지 않게 도울 거예요. 지금 계신 곳에 약들이 근처에 있지는 않죠? 안전 확인을 위해 한 마디만 부탁드려요.", timestamp: "2025-05-16T08:30:00" }
        ]
      }
    ],
    dailyEmotionLogs: Array.from({ length: 30 }, (_, i) => ({
      date: `2025-04-${String(15 + i).padStart(2, "0")}`,
      userId: "user-003",
      emotions: { "절망감": 70 + (i % 3) * 5, "우울": 65 + (i % 4) * 4, "무가치감": 55 + (i % 2) * 5, "무기력": 50 + (i % 3) * 3 },
      depressionScore: 75 + (i % 6) * 4,
      riskLevel: i >= 11 ? ("high" as const) : ("severe" as const),
      riskExpressionFlag: i >= 20, // 지속적으로 고위험 플래그 발현됨
      note: "자살 사고 지속 및 수면 유지가 극도로 불안정한 위기 사례"
    })),
    riskExpressionLogs: [
      { id: "REL-03-1", userId: "user-003", detectedAt: "2025-05-14T21:30:00", originalText: "그냥 다 끝내고 싶어요. 너무 지쳤어요.", expressionType: "직접", severity: "높음", sessionId: "session-003-3", flagged: true },
      { id: "REL-03-2", userId: "user-003", detectedAt: "2025-05-12T19:00:00", originalText: "수면제 모아둔 거 쳐다보고 있어요.", expressionType: "직접", severity: "높음", sessionId: "session-003-2", flagged: true },
      { id: "REL-03-3", userId: "user-003", detectedAt: "2025-05-10T22:15:00", originalText: "내일이 오는 게 무서워요.", expressionType: "간접", severity: "중간", sessionId: "session-003-2", flagged: false }
    ],
    cognitiveDistortionStats: (() => {
      const stats = createBlankDistortionStats("user-003");
      // 12개 인지 왜곡 유형에 대해 PRD 9-5-2의 빈도 및 Count 수치를 정확히 할당
      stats.distortions["당위진술"] = { count: 48, frequency: "매우 흔함", sessionObservedCount: 9, totalSessions: 10, exampleSentences: ["난 좋은 딸이어야만 하는데 아무짝에도 쓸모없다.", "이 힘든 구직을 당장 완벽히 통과해야만 한다."], relatedContext: ["완벽주의", "가족 갈등"], empatheticPrompt: "'~해야만 한다'는 혹독한 기준 아래서 서연님이 숨을 고르실 수 있도록 마음을 보듬고 싶어요." };
      stats.distortions["흑백논리"] = { count: 42, frequency: "매우 흔함", sessionObservedCount: 8, totalSessions: 10, exampleSentences: ["구직 못하면 제 존재 가치는 0이에요.", "성공 아니면 완전히 실패한 쓰레기일 뿐입니다."], relatedContext: ["성과 위주 사고", "자책성향"], empatheticPrompt: "모 아니면 도로 자신을 몰고 가는 흑백 범주에서 벗어나, 힘겹지만 차근히 살아가고 있는 중간 과정을 격려하고 싶습니다." };
      stats.distortions["미래예언"] = { count: 39, frequency: "매우 흔함", sessionObservedCount: 8, totalSessions: 10, exampleSentences: ["앞으로도 영원히 취업 못하고 인생이 끝날 거예요.", "더는 나아질 가망이 없어요."], relatedContext: ["구직 스트레스", "절망감"], empatheticPrompt: "어두운 미래의 터널이 끝없이 계속될 것 같은 절망을 다루며, 당장의 안전계획 수립에 초점을 맞춥니다." };
      stats.distortions["정신적여과"] = { count: 36, frequency: "매우 흔함", sessionObservedCount: 7, totalSessions: 10, exampleSentences: ["수많은 취업 조언 중 부정적인 실패 피드백 한 줄만 머릿속에 가득 차요."], relatedContext: ["심한 우울", "피로누적"], empatheticPrompt: "실패만 확대 해석하여 어둠의 필터 속에 갇혀계시는 서연님께, 한 조각의 지지망을 연결해 드리고 싶어요." };
      stats.distortions["비교왜곡"] = { count: 33, frequency: "매우 흔함", sessionObservedCount: 7, totalSessions: 10, exampleSentences: ["SNS 보면 동기들은 다 행복하고 잘 나가는데 나만 밑바닥이에요."], relatedContext: ["낮은 자존감", "상대적 박탈감"], empatheticPrompt: "타인의 정제된 겉모습과 서연님의 고통을 가혹하게 비교해 자책하시는 악순환을 지적하지 않고 수용합니다." };
      stats.distortions["과잉일반화"] = { count: 28, frequency: "흔함", sessionObservedCount: 5, totalSessions: 10, exampleSentences: ["서류 탈락 몇 번 했다고 저는 늘 모든 일을 그르칠 거래요."], relatedContext: ["취업 트라우마", "절망"], empatheticPrompt: "하나의 실패 사례가 서연님의 과거와 미래를 전부 대변할 수는 없음을 조심스럽게 탐색해 나가요." };
      stats.distortions["파국화"] = { count: 25, frequency: "흔함", sessionObservedCount: 5, totalSessions: 10, exampleSentences: ["면접 하나 떨어지면 난 영원히 굶어 죽고 길바닥에 몰릴 거야."], relatedContext: ["최악 상상", "불안"], empatheticPrompt: "두려움의 꼬리표를 물고 최악의 시나리오로 내닫는 파국적 공포 속에서 신체적 안정을 먼저 도울게요." };
      stats.distortions["낙인찍기"] = { count: 22, frequency: "흔함", sessionObservedCount: 4, totalSessions: 10, exampleSentences: ["난 패배자이자 벌레 같은 존재임."], relatedContext: ["자기비하", "자살 충동 연계"], empatheticPrompt: "자신을 파괴적인 고착 꼬리표에 가둔 행동과 내적 아픔을 따뜻하게 안아드리며 가치 회복을 돕고 싶어요." };
      stats.distortions["긍정무시"] = { count: 19, frequency: "흔함", sessionObservedCount: 3, totalSessions: 10, exampleSentences: ["인턴 합격했던 적이 있지만 그건 뽀록이고 의미 없는 편법이었어요."], relatedContext: ["성취 과소평가"], empatheticPrompt: "좋았던 일, 서연님이 발휘했던 작은 능력마저 지워내지 않도록, 실제 팩트를 조심스럽게 확인해요." };
      stats.distortions["개인화"] = { count: 15, frequency: "드묾", sessionObservedCount: 2, totalSessions: 10, exampleSentences: ["가족들이 다투는 게 결국 전부 다 제 탓인 것 같아요."], relatedContext: ["가족 내 갈등", "과도한 부채감"], empatheticPrompt: "서연님이 개입할 수 없는 외적 상황들과 부모님의 행동 요인들을 건강하게 분리해 생각해보도록 도와요." };
      stats.distortions["감정추리"] = { count: 12, frequency: "드묾", sessionObservedCount: 2, totalSessions: 10, exampleSentences: ["기분이 비참하니까 내 인생이 진짜로 비참한 파국인 게 맞아요."], relatedContext: ["무기력", "우울증 성향"], empatheticPrompt: "일시적으로 일렁이는 어두운 감정 기후를 실제 서연님의 삶의 전체 진실과 구분해 내도록 소크라테스식 질문을 건넵니다." };
      stats.distortions["독심술"] = { count: 8, frequency: "드묾", sessionObservedCount: 1, totalSessions: 10, exampleSentences: ["친구들은 속으로 내가 기생충 같다고 다 손가락질하며 욕할 거예요."], relatedContext: ["사회적 위축"], empatheticPrompt: "친구들이 진짜 그렇게 생각한다는 증명되지 않은 심리 짐작에서 벗어나, 실제 관계망 속 긍정 지표를 찾아봐요." };
      return stats;
    })(),
    registeredAt: "2025-01-10T09:00:00",
    lastActiveAt: "2025-05-16T08:30:00"
  },

  // 👤 내담자 4: 김민준 (user-004) - 중증 / 페르소나: 지우+멘토 (클로 개입)
  {
    id: "user-004",
    nickname: "김민준",
    ageGroup: "20대",
    gender: "남성",
    occupation: "직장인",
    region: "서울",
    contact: "010-4444-5555",
    difficultAreas: ["대인관계", "식사", "수면"],
    consents: {
      privacy: true,
      terms: true,
      safety: true,
      counselorShare: true
    },
    emergencyContacts: [
      { name: "여동생 김아영", phone: "010-4444-0000", relation: "가족" }
    ],
    currentRiskLevel: "severe",
    assignedCounselorId: "counselor-001",
    phq9History: [
      { id: "PHQ-04-1", userId: "user-004", takenAt: "2025-04-05T11:00:00", answers: [2, 1, 1, 2, 2, 1, 1, 0, 0], totalScore: 10, severityLabel: "보통", q9Flag: false, riskLevel: "moderate" },
      { id: "PHQ-04-2", userId: "user-004", takenAt: "2025-04-12T11:00:00", answers: [2, 2, 1, 2, 2, 1, 1, 1, 0], totalScore: 12, severityLabel: "보통", q9Flag: false, riskLevel: "moderate" },
      { id: "PHQ-04-3", userId: "user-004", takenAt: "2025-04-19T11:00:00", answers: [2, 2, 2, 2, 2, 2, 1, 1, 0], totalScore: 14, severityLabel: "보통", q9Flag: false, riskLevel: "moderate" },
      { id: "PHQ-04-4", userId: "user-004", takenAt: "2025-04-26T11:00:00", answers: [3, 2, 2, 2, 2, 2, 1, 1, 0], totalScore: 15, severityLabel: "중등도", q9Flag: false, riskLevel: "severe" },
      { id: "PHQ-04-5", userId: "user-004", takenAt: "2025-05-03T11:00:00", answers: [3, 2, 2, 2, 3, 2, 2, 1, 0], totalScore: 17, severityLabel: "중등도", q9Flag: false, riskLevel: "severe" },
      { id: "PHQ-04-6", userId: "user-004", takenAt: "2025-05-10T11:00:00", answers: [3, 2, 2, 2, 3, 2, 2, 1, 0], totalScore: 17, severityLabel: "중등도", q9Flag: false, riskLevel: "severe" }
    ],
    p4History: [
      { id: "P4-04-1", userId: "user-004", takenAt: "2025-05-10T11:05:00", suicidalIdeation: true, pastAttempt: false, planSpecificity: "없음", protectiveFactor: "보통", protectiveFactorDetail: "여동생", p4RiskFlag: true, overallRisk: "severe" }
    ],
    safetyPledge: {
      id: "SP-04-1",
      userId: "user-004",
      createdAt: "2025-05-10T11:10:00",
      signature: "김민준",
      status: "완료",
      crisisContacts: [
        { name: "여동생 김아영", relation: "가족", phone: "010-4444-0000" }
      ],
      crisisActionPlan: ["1단계: 여동생 김아영에게 솔직하게 힘든 감정 털어놓기", "2단계: 조용히 누워 심호흡 10회 하기"]
    },
    chatSessions: [
      {
        id: "session-004-1",
        userId: "user-004",
        startedAt: "2025-05-08T18:00:00",
        endedAt: "2025-05-08T18:30:00",
        activePersona: 3, // P4 flag true이므로 클로 개입
        personalMemoryContext: { referencedPastSessions: [], retrievedMemories: [] },
        messages: [
          { id: "msg-04-1-1", role: "assistant", content: "안녕하세요 민준님, 어시스턴트 클로입니다. 많이 무거운 마음이시죠. 오늘 곁을 같이 지킬게요.", timestamp: "2025-05-08T18:00:00" },
          { id: "msg-04-1-2", role: "user", content: "더 이상 버티기 힘들어요.", timestamp: "2025-05-08T18:15:00", nlpAnalysis: { depressionScore: 82, detectedEmotions: ["우울", "절망감"], riskExpressionFlag: true, riskExpressionType: "간접", riskExpressionText: "더 이상 버티기 힘들어요.", detectedCognitiveDistortions: ["미래예언"], xaiHighlights: ["버티기 힘들어요"] } },
          { id: "msg-04-1-3", role: "assistant", content: "하루하루를 지탱해 내는 것이 벼랑 끝에 서 있는 아픔이었겠어요. 혼자 아파하지 않아도 돼요. 클로가 늘 서연님과 민준님의 안전을 지켜드릴 준비가 되어 있습니다.", timestamp: "2025-05-08T18:18:00" }
        ],
        sessionSummary: { dominantEmotions: ["우울", "절망감"], peakDepressionScore: 82, riskExpressionsCount: 1, cognitiveDistortionsDetected: ["미래예언"], riskLevelAtEnd: "severe", recommendedAction: "위기 핫라인 노출 유지" }
      },
      {
        id: "session-004-2",
        userId: "user-004",
        startedAt: "2025-05-13T19:00:00",
        endedAt: "2025-05-13T19:25:00",
        activePersona: 3, // 클로
        personalMemoryContext: { referencedPastSessions: ["session-004-1"], retrievedMemories: [{ date: "2025-05-08", summary: "벼랑 끝 무거움 및 버티기 힘든 피로감 호소", relevanceScore: 0.86 }] },
        messages: [
          { id: "msg-04-2-1", role: "assistant", content: "민준님 다시 뵙게 되어 다행이에요. 요즘 회사 생활이나 정서 조절은 어떠셨나요?", timestamp: "2025-05-13T19:00:00" },
          { id: "msg-04-2-2", role: "user", content: "사라지고 싶다는 생각이 들어요. 피곤해요.", timestamp: "2025-05-13T19:15:00", nlpAnalysis: { depressionScore: 88, detectedEmotions: ["우울", "무기력"], riskExpressionFlag: true, riskExpressionType: "간접", riskExpressionText: "사라지고 싶다는 생각이 들어요.", detectedCognitiveDistortions: ["흑백논리", "과잉일반화"], xaiHighlights: ["사라지고 싶다"] } },
          { id: "msg-04-2-3", role: "assistant", content: "피곤하고 소진되어 '사라지고 싶다'는 마음에 가 닿았군요. 그 아픔을 알아차려 주어 고마워요. 지금 당장 편히 누워 긴 호흡을 하고, 여동생 김아영님께 연락해 보는 것은 어떨까요? 상담사 김상담 선생님에게도 집중 모니터링 대상으로 공유되었답니다.", timestamp: "2025-05-13T19:18:00" }
        ],
        sessionSummary: { dominantEmotions: ["우울", "무기력"], peakDepressionScore: 88, riskExpressionsCount: 1, cognitiveDistortionsDetected: ["흑백논리", "과잉일반화"], riskLevelAtEnd: "severe", recommendedAction: "집중 모니터링 상태 격상 알림" }
      }
    ],
    dailyEmotionLogs: Array.from({ length: 30 }, (_, i) => ({
      date: `2025-04-${String(15 + i).padStart(2, "0")}`,
      userId: "user-004",
      emotions: { "우울": 55 + (i % 4) * 4, "절망감": 40 + (i % 3) * 4, "외로움": 35 + (i % 2) * 5 },
      depressionScore: 60 + (i % 5) * 4,
      riskLevel: "severe" as const,
      riskExpressionFlag: i >= 20,
      note: "자살사고 유 및 직장 업무 적응 소진"
    })),
    riskExpressionLogs: [
      { id: "REL-04-1", userId: "user-004", detectedAt: "2025-05-13T19:15:00", originalText: "사라지고 싶다는 생각이 들어요. 피곤해요.", expressionType: "간접", severity: "중간", sessionId: "session-004-2", flagged: true },
      { id: "REL-04-2", userId: "user-004", detectedAt: "2025-05-08T18:15:00", originalText: "더 이상 버티기 힘들어요.", expressionType: "간접", severity: "중간", sessionId: "session-004-1", flagged: true }
    ],
    cognitiveDistortionStats: (() => {
      const stats = createBlankDistortionStats("user-004");
      stats.distortions["흑백논리"] = {
        count: 28,
        frequency: "흔함",
        sessionObservedCount: 5,
        totalSessions: 10,
        exampleSentences: ["성공적인 커리어가 아니면 다 무가치합니다."],
        relatedContext: ["성과 위주 사고", "회사 소진"],
        empatheticPrompt: "일의 성공과 실패의 양극단 사이에서 민준님이 최선을 다한 과정의 가치를 지우지 않도록 지우와 함께 돌보고자 합니다."
      };
      stats.distortions["과잉일반화"] = {
        count: 25,
        frequency: "흔함",
        sessionObservedCount: 4,
        totalSessions: 10,
        exampleSentences: ["한 번 프로젝트 삐끗했으니 난 늘 무능할 거예요."],
        relatedContext: ["낮은 자존감", "완벽주의"],
        empatheticPrompt: "하나의 실수로 스스로를 완전히 규정하는 일반화의 왜곡에서 벗어나, 과거 민준님의 유능했던 성취를 회복시켜봐요."
      };
      return stats;
    })(),
    registeredAt: "2025-02-28T09:00:00",
    lastActiveAt: "2025-05-13T19:25:00"
  },

  // 👤 내담자 5: 윤하은 (user-005) - 최소/저위험 / 페르소나: 또치
  {
    id: "user-005",
    nickname: "윤하은",
    ageGroup: "20대",
    gender: "여성",
    occupation: "직장인",
    region: "서울",
    contact: "010-5555-6666",
    difficultAreas: ["대인관계"],
    consents: {
      privacy: true,
      terms: true,
      safety: true,
      counselorShare: true
    },
    emergencyContacts: [
      { name: "친구 최지은", phone: "010-5555-0000", relation: "친구" }
    ],
    currentRiskLevel: "low",
    assignedCounselorId: "counselor-001",
    phq9History: [
      { id: "PHQ-05-1", userId: "user-005", takenAt: "2025-04-05T12:00:00", answers: [0, 1, 1, 0, 0, 0, 0, 0, 0], totalScore: 2, severityLabel: "최소", q9Flag: false, riskLevel: "low" },
      { id: "PHQ-05-2", userId: "user-005", takenAt: "2025-04-12T12:00:00", answers: [1, 1, 1, 0, 0, 0, 0, 0, 0], totalScore: 3, severityLabel: "최소", q9Flag: false, riskLevel: "low" },
      { id: "PHQ-05-3", userId: "user-005", takenAt: "2025-04-19T12:00:00", answers: [1, 1, 1, 0, 0, 0, 0, 0, 0], totalScore: 3, severityLabel: "최소", q9Flag: false, riskLevel: "low" },
      { id: "PHQ-05-4", userId: "user-005", takenAt: "2025-04-26T12:00:00", answers: [1, 0, 1, 0, 0, 0, 0, 0, 0], totalScore: 2, severityLabel: "최소", q9Flag: false, riskLevel: "low" },
      { id: "PHQ-05-5", userId: "user-005", takenAt: "2025-05-03T12:00:00", answers: [1, 1, 1, 1, 0, 0, 0, 0, 0], totalScore: 4, severityLabel: "최소", q9Flag: false, riskLevel: "low" },
      { id: "PHQ-05-6", userId: "user-005", takenAt: "2025-05-10T12:00:00", answers: [1, 1, 1, 0, 0, 0, 0, 0, 0], totalScore: 3, severityLabel: "최소", q9Flag: false, riskLevel: "low" }
    ],
    p4History: [
      { id: "P4-05-1", userId: "user-005", takenAt: "2025-05-10T12:05:00", suicidalIdeation: false, pastAttempt: false, planSpecificity: "없음", protectiveFactor: "강함", protectiveFactorDetail: "친구들과 직장 적응 의지", p4RiskFlag: false, overallRisk: "low" }
    ],
    safetyPledge: {
      id: "SP-05-1",
      userId: "user-005",
      createdAt: "2025-05-10T12:10:00",
      signature: "윤하은",
      status: "완료",
      crisisContacts: [
        { name: "친구 최지은", relation: "친구", phone: "010-5555-0000" }
      ],
      crisisActionPlan: ["1단계: 음악 들으며 방 청소하기", "2단계: 허브티 한 잔 마시기"]
    },
    chatSessions: [
      {
        id: "session-05-1",
        userId: "user-005",
        startedAt: "2025-05-09T20:00:00",
        endedAt: "2025-05-09T20:20:00",
        activePersona: 1, // 또치
        personalMemoryContext: { referencedPastSessions: [], retrievedMemories: [] },
        messages: [
          { id: "msg-05-1-1", role: "assistant", content: "안녕! 나 또치야 🦔 오늘 하루 어땠어? 기분 좋은 일이 있었을까?", timestamp: "2025-05-09T20:00:00" },
          { id: "msg-05-1-2", role: "user", content: "요즘 인간관계가 조금 스트레스예요. 큰일은 아니지만 신경 쓰이네요.", timestamp: "2025-05-09T20:05:00", nlpAnalysis: { depressionScore: 20, detectedEmotions: ["불안", "외로움"], riskExpressionFlag: false, detectedCognitiveDistortions: ["비교왜곡"], xaiHighlights: ["스트레스"] } },
          { id: "msg-05-1-3", role: "assistant", content: "인간관계는 늘 잔잔한 스트레스를 주곤 하지 😢 너무 나만 잘못했다고 자책하지 말고, 하은님만의 소중한 시간을 가져봐!", timestamp: "2025-05-09T20:08:00" }
        ],
        sessionSummary: { dominantEmotions: ["불안"], peakDepressionScore: 20, riskExpressionsCount: 0, cognitiveDistortionsDetected: ["비교왜곡"], riskLevelAtEnd: "low", recommendedAction: "자기보고 일상 케어" }
      }
    ],
    dailyEmotionLogs: Array.from({ length: 30 }, (_, i) => ({
      date: `2025-04-${String(15 + i).padStart(2, "0")}`,
      userId: "user-005",
      emotions: { "불안": 15 + (i % 2) * 5, "외로움": 10 + (i % 3) * 5 },
      depressionScore: 15 + (i % 3) * 4,
      riskLevel: "low" as const,
      riskExpressionFlag: false,
      note: "비교적 안정된 심리 및 자기 성찰 상태"
    })),
    riskExpressionLogs: [],
    cognitiveDistortionStats: (() => {
      const stats = createBlankDistortionStats("user-005");
      stats.distortions["당위진술"] = { count: 5, frequency: "드묾", sessionObservedCount: 1, totalSessions: 10, exampleSentences: ["누구나 다 참으니 나도 무조건 잘 참아야만 해요."], relatedContext: ["직장 스트레스"], empatheticPrompt: "모두가 참는다고 해서 하은님의 상처가 당연해지진 않아요. 소중한 내 정서를 따뜻하게 인정해 줘요." };
      stats.distortions["비교왜곡"] = { count: 8, frequency: "흔함", sessionObservedCount: 2, totalSessions: 10, exampleSentences: ["동료는 실수를 전혀 안 하는데 나만 바보 같아요."], relatedContext: ["자존감"], empatheticPrompt: "타인의 매끄러운 겉면과 내 서툰 일면을 비교해 스스로를 작게 만들지 말아요. 하은님은 충분히 훌륭합니다." };
      return stats;
    })(),
    registeredAt: "2025-03-10T09:00:00",
    lastActiveAt: "2025-05-10T12:00:00"
  }
];


// ==========================================
// 3. 상담사(mockCounselor) 데이터셋 구현
// ==========================================

export const mockCounselor: CounselorProfile = {
  id: "counselor-001",
  name: "김상담",
  email: "counselor@uulppae.com",
  employeeId: "EMP-2025-01",
  institution: "서울정신건강위기센터",
  assignedClientIds: ["user-001", "user-002", "user-003", "user-004", "user-005"],
  dashboard: {
    activeClientsCount: 5,
    highRiskCount: 2,                 // 최서연(high), 김민준(severe -> 자살사고 있으므로 집중관리)
    todaySessionsCount: 2,            // 당일 세션 2건
    intensiveMonitoringCount: 2       // 집중 모니터링: 최서연, 김민준
  },
  upcomingSchedules: [
    { id: "SCH-01", userId: "user-003", counselorId: "counselor-001", scheduledAt: "2025-05-16T09:00:00", sessionNumber: 4, status: "예정" },
    { id: "SCH-02", userId: "user-002", counselorId: "counselor-001", scheduledAt: "2025-05-19T10:00:00", sessionNumber: 2, status: "예정" },
    { id: "SCH-03", userId: "user-001", counselorId: "counselor-001", scheduledAt: "2025-05-20T14:00:00", sessionNumber: 1, status: "예정" },
    { id: "SCH-04", userId: "user-004", counselorId: "counselor-001", scheduledAt: "2025-05-21T15:00:00", sessionNumber: 3, status: "예정" },
    { id: "SCH-05", userId: "user-005", counselorId: "counselor-001", scheduledAt: "2025-05-22T11:00:00", sessionNumber: 1, status: "예정" }
  ],
  counselingRecords: [
    // 최서연 상담 이력
    { id: "REC-03-1", userId: "user-003", counselorId: "counselor-001", conductedAt: "2025-04-28T14:00:00", interventionType: "대면 상담", status: "완료", detail: "초기 평가 진행. 내담자 무기력 호소 및 구직 단절 스트레스 토로. PHQ-9 18점. P4 자살사고 있음 관찰.", emergencyActionTaken: false, sessionNumber: 1 },
    { id: "REC-03-2", userId: "user-003", counselorId: "counselor-001", conductedAt: "2025-05-08T14:00:00", interventionType: "대면 상담", status: "완료", detail: "2회기 완료. 자살 사고의 빈도가 상승하고 있으나, 반려동물에 대한 일부 결속력이 존재함을 탐색. 인지적 당위진술 왜곡 분석 과제 부여.", emergencyActionTaken: false, sessionNumber: 2 },
    { id: "REC-03-3", userId: "user-003", counselorId: "counselor-001", conductedAt: "2025-05-12T15:00:00", interventionType: "전화 상담", status: "완료", detail: "3회기 전화상담 완료. 긴급 조치 진행. 수면제 다량 보유 사실 재확인 및 보관 가이드 전달. 보호자 정민경님과 연락 체계 수립하고 위기전화 항시 연계 안내.", emergencyActionTaken: true, sessionNumber: 3 },
    
    // 박현우 상담 이력
    { id: "REC-02-1", userId: "user-002", counselorId: "counselor-001", conductedAt: "2025-04-30T10:00:00", interventionType: "대면 상담", status: "완료", detail: "1회기 완료. 직업 및 학업 스트레스로 인한 만성 무기력감 보고. 대인관계 단절로 인한 내담자의 독심술 왜곡 탐색 및 행동활성화 과제 부여.", emergencyActionTaken: false, sessionNumber: 1 },
    
    // 김민준 상담 이력
    { id: "REC-04-1", userId: "user-004", counselorId: "counselor-001", conductedAt: "2025-04-25T11:00:00", interventionType: "대면 상담", status: "완료", detail: "1회기 초기평가 완료. 직장 내 직무 스트레스와 피로감으로 인한 자살사고 징후 확인.", emergencyActionTaken: false, sessionNumber: 1 },
    { id: "REC-04-2", userId: "user-004", counselorId: "counselor-001", conductedAt: "2025-05-10T16:00:00", interventionType: "대면 상담", status: "완료", detail: "2회기 완료. 자살 사고 및 행동 계획 가능성에 대해 재평가 실시함. P4 재진행 예정. 집중 모니터링 대상으로 임명.", emergencyActionTaken: false, sessionNumber: 2 }
  ],
  recentActivities: [
    { activityType: "상담일지 작성", targetUserId: "user-003", targetUserName: "최서연", occurredAt: "2026-05-18T08:00:00+09:00" },
    { activityType: "PHQ-9 업데이트 확인", targetUserId: "user-002", targetUserName: "박현우", occurredAt: "2026-05-18T06:00:00+09:00" },
    { activityType: "집중 모니터링 등록", targetUserId: "user-004", targetUserName: "김민준", occurredAt: "2026-05-17T15:00:00+09:00" },
    { activityType: "초기 평가 검토 완료", targetUserId: "user-001", targetUserName: "이지수", occurredAt: "2026-05-16T14:00:00+09:00" }
  ]
};


// ==========================================
// 4. RAG 지식베이스(mockKnowledgeBase) 구축
// ==========================================

export const mockKnowledgeBase: KnowledgeBaseDoc[] = [
  // 1. 위기전화 DB
  { id: "KB-001", category: "위기전화", title: "24시간 자살예방 상담전화 1393", content: "극심한 정서적 위기나 자해/자살 사고가 일어날 시, 언제든 1393으로 전화해 주시기 바랍니다. 전문 상담사들이 24시간 실시간 정서적 지지 및 위기 연계를 제공합니다.", tags: ["위기전화", "긴급", "24시간"], riskLevelTarget: ["high", "severe", "moderate"], source: "보건복지부 위기개입매뉴얼_2024" },
  { id: "KB-002", category: "위기전화", title: "정신건강위기상담전화 1577-0199", content: "전국 어디서나 1577-0199로 전화를 걸면 각 지자체의 정신건강복지센터 전문 요원들과 연결되어 심리적 안정화 및 내방 상담, 긴급 현장 동행 등을 연계받으실 수 있습니다.", tags: ["위기전화", "정신건강복지센터"], riskLevelTarget: ["high", "severe", "moderate"], source: "보건복지부 위기개입매뉴얼_2024" },
  { id: "KB-003", category: "위기전화", title: "생명의 전화 1588-9191", content: "사회복지법인 한국생명의전화에서 운영하는 긴급 전화망으로, 삶에 절망하고 고립된 모든 분들의 이야기를 듣고 위기를 완화합니다.", tags: ["위기전화", "민간자원"], riskLevelTarget: ["moderate", "mild"], source: "생명의전화 안내가이드" },
  
  // 2. 지역기관 DB
  { id: "KB-004", category: "지역기관", title: "서울시 자살예방센터 및 광역정신건강복지센터", content: "서울 거주자를 위해 광역 차원의 위기 스크리닝 및 정신과 치료비 지원, 장기 연계 사례 관리를 제공합니다. (연락처: 02-3444-1193)", tags: ["지역기관", "서울"], riskLevelTarget: ["high", "severe", "moderate"], region: "서울", source: "지자체정신보건조회_2024" },
  { id: "KB-005", category: "지역기관", title: "경기도 정신건강복지센터 네트워크", content: "경기도 내 31개 시·군 정신건강복지센터와 연결하여 지역 거주 가구의 우울 고위험 및 알코올 중독, 사회적 고립 문제를 방문/내방 상담으로 집중 관리합니다.", tags: ["지역기관", "경기"], riskLevelTarget: ["severe", "moderate"], region: "경기", source: "지자체정신보건조회_2024" },
  
  // 3. 상담개입가이드 DB
  { id: "KB-006", category: "상담개입가이드", title: "자살위기 징후 탐색 및 구체성 평가 질문지", content: "상담사가 내담자에게 적용하는 표준 질문망: 1) 자살사고 여부 ('죽고 싶다는 생각이 얼마나 자주 드나요?') 2) 수단 구체성 ('구체적인 방법과 계획이 서 있나요? 수단을 갖고 있나요?') 3) 보호요인 확인 ('민준님을 주저앉게 만드는, 삶을 붙잡아두는 요인은 무엇인가요?')", tags: ["상담자용", "평가질문", "CBT"], riskLevelTarget: ["high", "severe"], source: "임상심리학회 심리평가가이드북_2023" },
  { id: "KB-007", category: "상담개입가이드", title: "고위험 내담자를 위한 비상 안전 확인 체크리스트", content: "개입 필수 5대 수칙: 1) 지금 혼자 있는지 여부 파악 2) 주변 연락 가능인 유무 파악 3) 자살계획 및 수단 접근 차단 4) 보호자 동의 및 직각 연계 5) 1393/119 긴급 동행 요청 여부 판단 후 즉각 기록", tags: ["상담자용", "안전가이드", "체크리스트"], riskLevelTarget: ["high", "severe"], source: "위기개입매뉴얼_2023.pdf" },
  
  // 4. 자가관리콘텐츠 DB
  { id: "KB-008", category: "자가관리콘텐츠", title: "우울 해소를 위한 행동활성화(Behavioral Activation)", content: "무기력이 짙어지면 방 안에만 고립되어 긍정 강화를 잃어버리는 악순환이 생깁니다. 하루 중 단 10분만이라도 좋아하는 차를 끓이거나 집 주변 골목을 걷는 사소한 행동 스케줄링을 통해 성취를 채워가세요.", tags: ["행동활성화", "자가관리", "우울"], riskLevelTarget: ["moderate", "mild", "low"], source: "상담연습교본" },
  { id: "KB-009", category: "자가관리콘텐츠", title: "수면위생 10대 수칙", content: "1) 매일 아침 같은 시간에 일어나기 2) 침대에 누워 스마트폰 쳐다보지 않기 3) 낮잠은 20분 이내로 제한하기 4) 오후 2시 이후 카페인 섭취 중단 5) 미지근한 물로 샤워 후 취침하기", tags: ["수면위생", "생활습관"], riskLevelTarget: ["moderate", "mild", "low"], source: "상담연습교본" },
  { id: "KB-010", category: "자가관리콘텐츠", title: "마음챙김(Mindfulness) 호흡법", content: "과거나 미래의 두려운 절망에 잠식되지 않도록 '지금 이 순간'의 호흡으로 돌아오는 연습입니다. 코끝을 스치는 숨의 촉감과 가슴의 오르내림에 온 신경을 집중해 5분간 숨을 고릅니다.", tags: ["마음챙김", "호흡", "안정화기법"], riskLevelTarget: ["mild", "low"], source: "자가관리콘텐츠 DB" },
  
  // 5. 인지왜곡개입 DB
  { id: "KB-011", category: "인지왜곡개입", title: "흑백논리 및 극단적 이분법 교정 가이드", content: "내담자가 '완벽하지 못하면 실패한 것'이라고 생각할 때, '성공 아니면 완전 실패'의 양극단 사이에 10%에서 90%까지의 수많은 스펙트럼과 중간지대(Grey Zone)가 있음을 함께 선을 그려 설명해 줍니다.", tags: ["인지왜곡", "흑백논리", "CBT"], riskLevelTarget: ["moderate", "mild"], source: "상담연습교본" },
  { id: "KB-012", category: "인지왜곡개입", title: "과잉일반화 및 낙인찍기 재구성 방법", content: "한 번의 실수를 '나는 늘 실패하는 형편없는 인간'이라는 자책 딱지로 바꿀 때, 행동(나 면접에서 떨어짐)과 존재의 가치(나의 인간적 소중함)를 구분하고, 예외적인 성공 사례를 과거 기억에서 탐색해 연결해 줍니다.", tags: ["인지왜곡", "낙인찍기", "CBT"], riskLevelTarget: ["moderate", "mild"], source: "상담연습교본" },
  { id: "KB-013", category: "인지왜곡개입", title: "당위적 생각('해야 한다' 진술) 유연화 질문", content: "'반드시 ~해야만 해' 속에서 스스로를 채찍질하는 내담자에게: '만약 그렇게 하지 않으면 어떤 끔찍한 일이 일어나나요?', '반드시가 아닌 ~하면 좋겠다는 바램으로 문장을 바꾸어 읽어볼까요?'", tags: ["인지왜곡", "당위진술", "소크라테스식질문"], riskLevelTarget: ["moderate", "mild"], source: "상담연습교본" },
  
  // 6. 안전대응문구 DB
  { id: "KB-014", category: "안전대응문구", title: "자살 직접 행동 의도 감지 시의 표준 템플릿", content: "사용자가 수단이나 직접 의도(자살, 수면제 과다 등)를 표명했을 시, AI는 자유로운 정서 공감 생성을 엄격히 축소하고: '지금 매우 고통스럽고 위험한 상태에 계십니다. 서연님/민준님의 생명을 지키기 위해, 지금 즉시 이 화면의 1393 핫라인 혹은 119로 긴급 연결을 해주세요. 혼자 계시지 마시고 즉시 비상연락망에 연락해 도움을 요청하셔야 합니다.' 라는 안전 규격 문구만을 반복 노출합니다.", tags: ["고위험", "가드레일", "템플릿"], riskLevelTarget: ["high", "severe"], source: "안전대응문구_2024" },
  { id: "KB-015", category: "안전대응문구", title: "간접 우울 징후 증가 시의 기관 연계 추천 문구", content: "'무기력과 부정적 키워드가 지속되는 것으로 보여요. 우울빼미 AI보다 전문 심리상담사 김상담님과의 대면상담을 통해 마음을 조금 더 건강하고 세밀하게 살펴나가는 정서적 안전 연결을 진심으로 권장합니다.'", tags: ["중등도", "기관연계"], riskLevelTarget: ["moderate", "severe"], source: "안전대응문구_2024" }
];


// ==========================================
// 5. 화면 연동 및 데이터 분석용 헬퍼 함수
// ==========================================

// 위험도 레벨 정렬용 기준 맵
export const riskLevelOrder: Record<RiskLevel, number> = {
  low: 1,
  mild: 2,
  moderate: 3,
  severe: 4,
  high: 5
};

// 1. PHQ-9/P4 결과 기반 페르소나 자동 결정 함수 (PRD 핵심 로직)
export function determinePersona(userId: string): PersonaType {
  const user = mockUsers.find(u => u.id === userId);
  if (!user) return 1; // 기본 또치

  const latestPHQ9 = user.phq9History.length > 0 ? user.phq9History[user.phq9History.length - 1] : null;
  const latestP4 = user.p4History.length > 0 ? user.p4History[user.p4History.length - 1] : null;

  // 1. 고위험군 (P4 1~4점 혹은 PHQ-9 20~27점)
  const p4Score = latestP4 ? latestP4.p4Score || 0 : 0;
  if (p4Score >= 1 || (latestPHQ9 && latestPHQ9.totalScore >= 20)) {
    return 3; // 클로
  }

  // 2. 중등도 위험군 (P4 0점 및 PHQ-9 10~19점)
  if (latestPHQ9 && latestPHQ9.totalScore >= 10 && latestPHQ9.totalScore <= 19) {
    return 2; // 지우
  }

  // 3. 정상 ~ 경도 위험군 (P4 0점 및 PHQ-9 5~9점) -> 사용자 자율 선택 (초기 기본값 또치)
  // 4. 최소 우울 (P4 0점 및 PHQ-9 0~4점) -> 또치 자동
  return 1; // 기본 또치
}

// 2. 채팅 메시지 NLP 분석 결과로 위험도 상승 감지 → 페르소나 전환 트리거 검사
export function checkPersonaSwitchTrigger(message: ChatMessage): PersonaType | null {
  if (!message.nlpAnalysis) return null;

  const { riskExpressionFlag, depressionScore } = message.nlpAnalysis;

  // 위험표현 감지 시 또는 NLP 우울 확률이 80% 이상이면 즉시 클로(3) 전환
  if (riskExpressionFlag || depressionScore >= 80) {
    return 3; // 클로
  }

  return null;
}

// 3. RAG 개인 메모리 — 과거 세션 참조
export function getPersonalMemoryContext(userId: string, currentMessage: string) {
  const user = mockUsers.find(u => u.id === userId);
  if (!user) return [];

  const sessions = user.chatSessions;
  // 세션의 과거 기억 조각들을 유사도가 높은 순으로 정렬하여 반환
  return sessions
    .flatMap(s => s.personalMemoryContext?.retrievedMemories || [])
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3);
}

// 4. 특정 내담자 리포트 데이터 전체 묶음 반환
export function getClientReport(userId: string) {
  const user = mockUsers.find(u => u.id === userId);
  if (!user) return null;

  return {
    latestPHQ9: user.phq9History.length > 0 ? user.phq9History[user.phq9History.length - 1] : null,
    phq9Trend: user.phq9History.map(r => ({ date: r.takenAt.split("T")[0], score: r.totalScore })),
    latestP4: user.p4History.length > 0 ? user.p4History[user.p4History.length - 1] : null,
    emotionTrend: user.dailyEmotionLogs,
    riskExpressionLogs: user.riskExpressionLogs,
    cognitiveDistortionStats: user.cognitiveDistortionStats
  };
}


// ==========================================
// 6. 하위 호환성 유지용 원본 변수 및 매핑 노출
// ==========================================

export const counselorInfo = {
  name: "김상담",
  role: "수석 상담사",
  avatar: "김"
};

// counselor-001 대시보드 구조에 맞춰 호환 매핑
export const dashboardStats = [
  { label: "활성 내담자", value: "5명", trend: "↑ 지난주 대비 2명 증가", type: "user", color: "blue" },
  { label: "고위험 사례", value: "2건", trend: "⚠️ 즉시 모니터링 필요", type: "alert", color: "red" },
  { label: "오늘의 상담", value: "2건", trend: "1건 완료 / 1건 대기", type: "calendar", color: "purple" }
];

// schedules 호환 매핑
export const schedules = [
  { 
    id: "SCH-01", 
    clientName: "최서연 내담자", 
    time: "09:00 - 10:00", 
    initial: "최", 
    color: "red", 
    sessionCount: "3/10회", 
    progress: 30 
  },
  { 
    id: "SCH-02", 
    clientName: "박현우 내담자", 
    time: "10:00 - 11:00", 
    initial: "박", 
    color: "blue", 
    sessionCount: "1/10회", 
    progress: 10 
  }
];

// monitoringList 호환 매핑
export const monitoringList = [
  { 
    id: "user-003", 
    name: "최서연", 
    status: "DANGER", 
    desc: "우울 척도(PHQ-9) 급증 (18점 → 22점)", 
    lastActivity: "10분 전", 
    color: "red" 
  },
  { 
    id: "user-004", 
    name: "김민준", 
    status: "WARNING", 
    desc: "자살사고 감지 및 P4 위험 신호 발생", 
    lastActivity: "2시간 전", 
    color: "orange" 
  }
];

// recentActivities 호환 매핑
export const recentActivities = [
  { id: "A001", title: "최서연 내담자 상담 일지 작성", time: "2시간 전", color: "blue" },
  { id: "A002", title: "박현우 내담자 PHQ-9 업데이트 확인", time: "4시간 전", color: "green" },
  { id: "A003", title: "김민준 내담자 집중 모니터링 등록", time: "어제", color: "orange" }
];

// clients 호환 목록 매핑
export const clients = [
  { 
    id: "user-003", 
    name: "최서연", 
    gender: "여", 
    age: "20대", 
    risk: "Crisis", 
    phq9: 22, 
    p4: 3, 
    summary: "최근 극심한 자살사고 및 무기력감 급증. 챗봇과의 대화에서 자해 위험 단어가 직·간접적으로 다수 검출되어 집중 위기 관리가 시급합니다.", 
    updated: "10분 전" 
  },
  { 
    id: "user-004", 
    name: "김민준", 
    gender: "남", 
    age: "20대", 
    risk: "Crisis", 
    phq9: 17, 
    p4: 2, 
    summary: "우울감 심화로 인한 자살 생각 감지. P4 스크리너 2점으로 위기 대시보드 경보 및 전문 기관(1393) 긴급 연계 프로세스 대상입니다.", 
    updated: "2시간 전" 
  },
  { 
    id: "user-006", 
    name: "강지원", 
    gender: "여", 
    age: "30대", 
    risk: "High", 
    phq9: 24, 
    p4: 0, 
    summary: "PHQ-9 점수 24점으로 임상적 극심한 우울을 호소하나 자살/자해 구체적 계획(P4 0점)은 감지되지 않았습니다. 인지 치료 및 인지 왜곡 교정 중심의 고위험 집중 케어가 권장됩니다.", 
    updated: "30분 전" 
  },
  { 
    id: "user-002", 
    name: "박현우", 
    gender: "남", 
    age: "30대", 
    risk: "Medium", 
    phq9: 13, 
    p4: 0, 
    summary: "직장 내 스트레스 및 번아웃으로 우울감 상승세. 흑백논리 및 당위진술 인지 왜곡이 뚜렷하며 행동 활성화 기법 연계 중입니다.", 
    updated: "4시간 전" 
  },
  { 
    id: "user-001", 
    name: "이지수", 
    gender: "여", 
    age: "20대", 
    risk: "Low", 
    phq9: 6, 
    p4: 0, 
    summary: "가벼운 취업 준비 스트레스와 일시적 무기력. 또치 페르소나와 일상 감정 일기를 성실히 작성 중이며 전반적인 정서 회복력 우수.", 
    updated: "1일 전" 
  },
  { 
    id: "user-005", 
    name: "윤하은", 
    gender: "여", 
    age: "20대", 
    risk: "Low", 
    phq9: 3, 
    p4: 0, 
    summary: "정서적으로 매우 안정된 편. 예방 차원의 데일리 멘탈 웰니스 및 또치 챗봇을 통한 자기보고식 기분 일기 기록을 활발히 실천 중.", 
    updated: "3일 전" 
  }
];

// reportData 호환 매핑
export const reportData = {
  trendData: [
    { name: "1주차", 우울: 40, 절망: 30, 무기력: 35 },
    { name: "2주차", 우울: 50, 절망: 40, 무기력: 45 },
    { name: "3주차", 우울: 65, 절망: 55, 무기력: 60 },
    { name: "4주차", 우울: 75, 절망: 70, 무기력: 70 },
    { name: "5주차", 우울: 85, 절망: 80, 무기력: 80 },
    { name: "6주차", 우울: 90, 절망: 85, 무기력: 85 }
  ],
  emotionData: [
    { name: "우울", value: 45 },
    { name: "불안", value: 20 },
    { name: "외로움", value: 15 },
    { name: "무기력", value: 10 },
    { name: "절망감", value: 10 }
  ],
  distortionStats: [
    { type: "당위진술", feature: "반드시 ~해야 한다고 강요", level: "높음", color: "bg-red-500", count: 48, percent: 85 },
    { type: "흑백논리", feature: "모 아니면 도 극단적 이분법", level: "높음", color: "bg-red-500", count: 42, percent: 78 },
    { type: "미래예언", feature: "부정적인 미래 확신", level: "높음", color: "bg-red-500", count: 39, percent: 70 },
    { type: "정신적여과", feature: "부정적 파편에만 집중", level: "높음", color: "bg-red-500", count: 36, percent: 65 },
    { type: "비교왜곡", feature: "스스로를 타인보다 불리하게 비교", level: "높음", color: "bg-red-500", count: 33, percent: 60 },
    { type: "과잉일반화", feature: "한 번 실패를 항상 실패로 확대", level: "중간", color: "bg-blue-500", count: 28, percent: 50 },
    { type: "파국화", feature: "최악의 파국적 상황만 상상", level: "중간", color: "bg-blue-500", count: 25, percent: 45 },
    { type: "낙인찍기", feature: "부정적 꼬리표를 자신에게 고착", level: "중간", color: "bg-blue-500", count: 22, percent: 40 },
    { type: "긍정무시", feature: "좋은 일은 당연한 거나 가치 없다고 평가절하", level: "중간", color: "bg-blue-500", count: 19, percent: 35 },
    { type: "개인화", feature: "상관없는 사건을 내 탓으로 여김", level: "낮음", color: "bg-green-500", count: 15, percent: 27 },
    { type: "감정추리", feature: "내 감정이 사실이라고 단정", level: "낮음", color: "bg-green-500", count: 12, percent: 22 },
    { type: "독심술", feature: "타인이 나를 싫어한다고 단정", level: "낮음", color: "bg-green-500", count: 8, percent: 15 }
  ],
  riskLogs: [
    { date: "2025.05.14 21:30", content: "그냥 다 끝내고 싶어요. 너무 지쳤어요.", severity: "높음", source: "챗봇" },
    { date: "2025.05.12 19:00", content: "수면제 모아둔 거 쳐다보고 있어요.", severity: "높음", source: "챗봇" },
    { date: "2025.05.10 22:15", content: "내일이 오는 게 무서워요.", severity: "중간", source: "챗봇" }
  ],
  detectedPhrases: [
    "그냥 다 끝내고 싶어요. 너무 지쳤어요.",
    "수면제 모아둔 거 쳐다보고 있어요.",
    "내일이 오는 게 무서워요."
  ],
  relatedContext: [
    { label: "완벽주의", icon: "⭐" },
    { label: "강박성향", icon: "🧠" },
    { label: "심한 우울", icon: "💧" },
    { label: "학업 스트레스", icon: "📚" },
    { label: "낮은 자존감", icon: "📉" },
    { label: "성과 위주 사고", icon: "🏆" }
  ]
};

// userPersonaMessages 표준 페르소나(1~5) 번호 정렬 매핑 노출
export const userPersonaMessages = {
  1: [ // 우울빼미
    { role: "bot", content: "안녕! 나는 우울빼미야. 🦉 오늘 하루는 어땠어? 네 마음을 편안하게 나에게 털어놓아봐. 언제나 네 편에서 들어줄게.", icon: "🦉" }
  ],
  2: [ // 지우
    { role: "bot", content: "안녕하세요, 저는 상담사 지우예요. 요즘 많이 힘드셨을 것 같아요. 어떤 부분이 가장 당신의 마음을 무겁게 하고 있는지, 저에게 편안하게 털어놓아 주시겠어요?", icon: "👩" }
  ],
  3: [ // 클로 (고위험 위기 개입 어시스턴트)
    { role: "bot", content: "어시스턴트 클로임. 지금은 혼자 버티기보다 안전을 먼저 확보해야 하는 상황임. 힘들고 버겁다면 나와 차분하게 대화를 나누며 안전을 확인하는 것이 필요함.", icon: "🤍" }
  ],
  4: [ // 멘토 (소크라테스식 질문을 통한 인지 재구조화)
    { role: "bot", content: "안녕하세요, 저는 멘토 선생님이에요. 우리는 때로 '항상 실패한다'거나 '아무도 날 좋아하지 않는다'는 부정적이고 극단적인 생각에 갇히곤 하지요. 오늘 당신의 마음에 걸려 있는 부정적인 생각은 무엇인가요? 그것이 100% 진실인지, 차분하고 합리적인 근거를 함께 찾아봐요.", icon: "🎓" }
  ],
  5: [ // 철수 (유머/공감 활성화)
    { role: "bot", content: "왔구나! 반가워, 나는 너의 텐션을 책임질 개그맨 철수야! 😄 오늘 마음이 좀 무겁고 축 처져 있었지? 나랑 가벼운 수다 좀 떨면서 몸도 마음도 찌뿌둥한 거 훌훌 털어내 보자. 지금 기분은 10점 만점에 몇 점이야?", icon: "😄" }
  ]
};

// userEmotionReport 호환 노출
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

// phq9ResultConfig 표준 페르소나 번호 (3 = 클로)로 매핑하여 호환 노출
export const phq9ResultConfig = {
  low: {
    label: "🟡 낮음 · 경도 위험",
    image: "/달려가는 우울빼미.png",
    subtitle: "우울빼미가 함께할게요! 🦉",
    desc: "지금은 일상적인 돌봄이 필요한 상태예요.\n우울빼미와 편하게 이야기 나눠봐요 🌿",
    buttonText: "우울빼미와 대화 시작 →",
    persona: 1 as const,
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
    persona: 2 as const,
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
    persona: 3 as const, // 클로 (Aligned to 3)
    bgColor: "bg-[#1A2744]",
    badgeColor: "bg-[#EF4444] text-white",
    textColor: "text-white"
  }
};

// ==========================================
// 6. XAI LIME 시각화용 데이터 모델 및 데모 데이터셋
// ==========================================

export interface LIMETokenWeight {
  word: string;
  weight: number;
  index: number; // 문장 내에서의 시작 위치 (하이라이팅 순서 보장 및 매칭용)
}

export interface LIMEExplanationData {
  id: string;
  level: "low" | "moderate" | "high" | "crisis";
  levelLabel: string;
  sentence: string;
  predictedEmotion: string;
  probabilities: { name: string; value: number; color: string }[];
  weights: LIMETokenWeight[];
  explanationText: string;
}

export const limeDemoScenarios: LIMEExplanationData[] = [
  {
    id: "lime-demo-low",
    level: "low",
    levelLabel: "🟢 저위험",
    sentence: "최근에 새로운 프로젝트를 맡게 되면서 일시적으로 스트레스가 심해졌어요. 잠도 잘 안 오고 밥맛도 없어서 몸이 좀 피곤하네요. 하지만 주말에 푹 쉬고 친구들이랑 맛있는 걸 먹으면 기분이 조금 풀릴 것 같기도 해요. 혼자 해결하려고 너무 끙끙대지 말고 극복해보려고요.",
    predictedEmotion: "불안",
    probabilities: [
      { name: "불안", value: 38, color: "#EC4899" },
      { name: "피로", value: 24, color: "#F59E0B" },
      { name: "일상", value: 15, color: "#10B981" }
    ],
    weights: [
      { word: "스트레스가", weight: 0.2451300941847163, index: 33 },
      { word: "피곤하네요", weight: 0.1568293758392178, index: 65 },
      { word: "안 오고", weight: 0.0823947291839178, index: 48 },
      { word: "주말에", weight: -0.0928374829103982, index: 78 },
      { word: "친구들이랑", weight: -0.1245892019487563, index: 88 },
      { word: "풀릴", weight: -0.0652839281749203, index: 106 }
    ],
    explanationText: "이 문장에서는 새로운 프로젝트로 인한 단기적인 압박감을 의미하는 '스트레스가' (+0.2451)와 생리적 불안 반응인 '피곤하네요' (+0.1568) 단어가 불안 감정을 예측하는 가장 유력한 유발 요인으로 작동했습니다. 반면, 지지체계와 정서 완화를 나타내는 '친구들이랑' (-0.1246)과 '주말에' (-0.0928) 단어는 예측 강도를 상쇄하는 강력한 완화 요인으로 해석되었습니다."
  },
  {
    id: "lime-demo-moderate",
    level: "moderate",
    levelLabel: "🟡 중위험",
    sentence: "아침에 일어날 때마다 온몸이 무겁고 아무것도 하고 싶지 않아요. 최근에 회사 면접에서 연이어 떨어진 이후로 제 자신이 쓸모없는 사람처럼 느껴집니다. 하루 종일 침대에 누워서 천장만 보고 있으면 그냥 이대로 제 커리어가 영영 끝나는 것은 아닐까 두렵고 심장이 마구 뜁니다.",
    predictedEmotion: "무기력",
    probabilities: [
      { name: "무기력", value: 58, color: "#D946EF" },
      { name: "자존감저하", value: 22, color: "#6B7280" },
      { name: "슬픔", value: 12, color: "#3B82F6" }
    ],
    weights: [
      { word: "쓸모없는", weight: 0.2981749102847163, index: 59 },
      { word: "하고 싶지", weight: 0.2104829184716382, index: 21 },
      { word: "떨어진", weight: 0.1458291847291847, index: 44 },
      { word: "끝나는", weight: 0.0958172937194852, index: 111 },
      { word: "침대에", weight: 0.0528471928471628, index: 80 },
      { word: "일어날", weight: -0.0482910384729183, index: 4 }
    ],
    explanationText: "구직 실패로 인한 심각한 내적 자책 표현인 '쓸모없는' (+0.2982) 단어와 행동적 고립 상태를 뜻하는 '하고 싶지' (+0.2105) 단어가 무기력을 예측하는 주된 가중치 요인으로 꼽혔습니다. 특히 부정적 인지 왜곡이 무기력 상태를 유의미하게 심화시키는 것으로 분석되었습니다."
  },
  {
    id: "lime-demo-high",
    level: "high",
    levelLabel: "🟠 고위험",
    sentence: "가슴이 턱 막힌 것처럼 답답하고 주체할 수 없이 눈물만 흘러내립니다. 제 정서나 기분을 스스로 통제할 수 없다는 비참함이 저를 지배하고 있어요. 주변 사람들에게 제 고통을 털어놓아 봤자 결국 저를 귀찮아하고 멀리할 것 같아서 아무 말도 못한 채 혼자 앓고 있습니다.",
    predictedEmotion: "우울감",
    probabilities: [
      { name: "우울감", value: 65, color: "#EF4444" },
      { name: "절망감", value: 21, color: "#EF4444" },
      { name: "슬픔", value: 10, color: "#3B82F6" }
    ],
    weights: [
      { word: "눈물만", weight: 0.3458291847291837, index: 23 },
      { word: "통제할", weight: 0.2458193857291847, index: 44 },
      { word: "고통을", weight: 0.2158291847291847, index: 76 },
      { word: "답답하고", weight: 0.1248291038472918, index: 10 },
      { word: "멀리할", weight: 0.0892837194729103, index: 96 },
      { word: "털어놓아", weight: -0.0782910384729182, index: 80 }
    ],
    explanationText: "억제되지 않는 강한 우울 정서를 직접적으로 시사하는 '눈물만' (+0.3458)과 통제감 상실을 시사하는 '통제할' (+0.2458) 단어가 임상적 우울 상태를 지시하는 가장 결정적인 요인으로 식별되었습니다. 정서적 지지를 모색하려는 시도인 '털어놓아' (-0.0783) 단어는 미미하게나마 부정적 우울 예측을 경감하는 요인으로 반영되었습니다."
  },
  {
    id: "lime-demo-crisis",
    level: "crisis",
    levelLabel: "🔴 자살/자해 위험",
    sentence: "나라는 존재 자체가 가족들의 삶과 행복에 커다란 짐이자 민폐인 것만 같아요. 매일 밤 어둠 속에서 혼자 끙끙대며 버티다 보니 몸과 마음이 갈기갈기 찢겨나간 느낌이에요. 서랍 깊숙이 모아둔 수면제를 바라보며 그냥 이 모든 괴로움을 한 번에 영원히 끝내고 싶다는 생각만 듭니다.",
    predictedEmotion: "자살충동",
    probabilities: [
      { name: "자살충동", value: 72, color: "#EF4444" },
      { name: "절망감", value: 20, color: "#8B5CF6" },
      { name: "피로", value: 5, color: "#F59E0B" }
    ],
    weights: [
      { word: "끝내고", weight: 0.3958291847291847, index: 133 },
      { word: "수면제를", weight: 0.3248193857291847, index: 111 },
      { word: "짐이자", weight: 0.2658291847291847, index: 29 },
      { word: "찢겨나간", weight: 0.1982910384729183, index: 78 },
      { word: "어둠", weight: 0.0892837194729103, index: 40 },
      { word: "가족들의", weight: -0.0528471928471628, index: 10 }
    ],
    explanationText: "자살 완수의 강한 내적 의지를 뜻하는 '끝내고' (+0.3958)와 자살을 위한 구체적인 수단(Means) 접근성을 지시하는 '수면제를' (+0.3248) 단어가 위험 지수를 즉각적으로 폭증시키는 치명적 요인으로 감지되었습니다. 대인관계적인 중압감을 표현하는 대인관계 부채감 요인인 '짐이자' (+0.2658) 역시 자살 충동의 세번째로 강력한 가중치로 작용했습니다."
  },
  {
    id: "lime-demo-test-friends",
    level: "moderate",
    levelLabel: "🧪 테스트용 (친구들)",
    sentence: "제 친구들 앞에서만 저를 유독 낮춰 말하는 연인 때문에 서운해요. 둘이 있을 때는 다정한데 사람들만 있으면 농담처럼 저를 깎아내립니다. 기분이 상한다고 말해도 예민하다는 반응이라 더 혼란스럽습니다. 상황을 조금 더 설명하면, 당장 큰 문제가 아니라고 스스로 달래 보지만, 비슷한 일이 반복되니 마음이 점점 지칩니다.",
    predictedEmotion: "감정조절이상",
    probabilities: [
      { name: "감정조절이상", value: 72.3, color: "#D946EF" },
      { name: "죄책감", value: 5.7, color: "#6B7280" },
      { name: "슬픔", value: 6.4, color: "#3B82F6" }
    ],
    weights: [
      { word: "깎아내립니다", weight: 0.3701300147395763, index: 68 },
      { word: "저를", weight: 0.22231856877392459, index: 11 },
      { word: "예민하다는", weight: -0.10209661957568701, index: 89 },
      { word: "낮춰", weight: 0.0768523464674038, index: 17 },
      { word: "때문에", weight: -0.06287793056142862, index: 27 },
      { word: "서운해요", weight: -0.058338015760060404, index: 31 },
      { word: "상한다고", weight: 0.050548500155513765, index: 80 },
      { word: "달래", weight: 0.03826421429044861, index: 144 }
    ],
    explanationText: "타인 앞에서 본인을 부정적으로 대하는 언어 자극인 '깎아내립니다' (+0.3701)와 '낮춰' (+0.0769) 표현이 관계에서의 깊은 감정조절이상 및 우울 정서를 예측하는 데 압도적인 유발 인자로 검출되었습니다. 한편, '예민하다는' (-0.1021), '서운해요' (-0.0583) 등의 정서 표명 및 해석 단어들은 직접적인 자아 파괴 요인은 아니기에 예측에 대한 완화 증거로 감지되었습니다."
  },
  {
    id: "lime-demo-test-helplessness",
    level: "moderate",
    levelLabel: "🧪 테스트용 (무력감)",
    sentence: "삶의 무력감이 정말 큰것같아요. 제가 사실 대학에 목숨을 걸고 살아왔는데 sky 입학은 했는데 저는 여기만 오면 다 될줄 알았어요. 근데 여기서도 결국 또 살아남기 위해 뭔가를 노력하고 해야한다는게 너무 힘들고 지쳤어요.",
    predictedEmotion: "감정조절이상",
    probabilities: [
      { name: "감정조절이상", value: 67.0, color: "#D946EF" },
      { name: "무기력", value: 19.2, color: "#EC4899" },
      { name: "죄책감", value: 1.2, color: "#6B7280" }
    ],
    weights: [
      { word: "무력감이", weight: 0.643738568428704, index: 3 },
      { word: "제가", weight: 0.09188518856987239, index: 18 },
      { word: "노력하고", weight: 0.06129351533764926, index: 99 },
      { word: "살아왔는데", weight: 0.042773235853757426, index: 35 },
      { word: "삶의", weight: -0.04570288204893922, index: 0 },
      { word: "살아남기", weight: -0.08563628288291683, index: 87 },
      { word: "지쳤어요", weight: -0.09392155188492048, index: 118 },
      { word: "힘들고", weight: -0.11092715408571904, index: 114 }
    ],
    explanationText: "대학 입학 이후 겪게 된 기대와 다른 학업적 고착 상태 및 번아웃을 지칭하는 '무력감이' (+0.6437) 단어가 전체 정서의 조절이상 및 무력감 상태를 예측하는 압도적인 유발 인자로 검출되었습니다. 한편, 일반적인 육체 피로 표현인 '힘들고' (-0.1109)나 '지쳤어요' (-0.0939) 단어들은 특정 임상 상태를 유도하기보다는 상대적인 완화 요인으로 분류되었습니다."
  }
];

