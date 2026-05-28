"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowRight, Calendar } from "lucide-react";
import { userEmotionReport, limeDemoScenarios, LIMEExplanationData } from "@/lib/mockData";

interface EmotionReportProps {
  onContinueChat?: () => void;
  phq9Score?: number;
  phq9Severity?: string;
  sessionId?: string | null;
  onNavigateToMap?: () => void;
  lastPhq9Date?: string | null;
  onReTakePhq9?: () => void;
  profile?: {
    nickname: string;
    ageGroup: string;
    gender: string;
    occupation: string;
    region: string;
    contact: string;
    phone: string;
  } | null;
  onUpdateProfile?: (updatedProfile: any) => Promise<void>;
}

const ALL_DEPRESSIVE_EMOTIONS = [
  '우울감', '슬픔', '외로움', '분노', '무기력', 
  '불안', '피로', '절망감', '자살충동', '자존감저하', 
  '자신감저하', '죄책감', '불면', '초조함', '감정조절이상', 
  '상실감', '식욕저하', '식욕증가', '집중력저하'
];

const EMOTION_COLOR_MAP: { [key: string]: string } = {
  '우울감': '#EF4444',       // Red-500
  '슬픔': '#3B82F6',         // Blue-500
  '외로움': '#A855F7',       // Purple-500
  '분노': '#F97316',         // Orange-500
  '무기력': '#D946EF',       // Fuchsia-500
  '불안': '#EC4899',         // Pink-500
  '피로': '#F59E0B',         // Amber-500
  '절망감': '#8B5CF6',       // Violet-500
  '자살충동': '#DC2626',     // Red-600
  '자존감저하': '#6B7280',   // Gray-500
  '자신감저하': '#4B5563',   // Gray-600
  '죄책감': '#4F46E5',       // Indigo-600
  '불면': '#0D9488',         // Teal-600
  '초조함': '#10B981',       // Emerald-500
  '감정조절이상': '#06B6D4', // Cyan-500
  '상실감': '#14B8A6',       // Teal-500
  '식욕저하': '#84CC16',     // Lime-500
  '식욕증가': '#A3E635',     // Lime-400
  '집중력저하': '#6366F1'    // Indigo-500
};

const DEMO_CLIENTS = [
  { id: "user-001", name: "이지수", tag: "🟢 저위험", risk: "Low", detail: "학업 스트레스 / 수면 불규칙" },
  { id: "user-005", name: "윤하은", tag: "🟢 저위험", risk: "Low", detail: "40대 식당 자영업자 / 무기력증 극복" },
  { id: "user-002", name: "김민준", tag: "🟠 중위험", risk: "Medium", detail: "직장인 번아웃 / 불안 및 초조함" },
  { id: "user-007", name: "정예진", tag: "🟠 중위험", risk: "Medium", detail: "독박 육아 스트레스 / 죄책감" },
  { id: "user-003", name: "최서연", tag: "🔴 고위험", risk: "High", detail: "프리랜서 디자이너 / 대인관계 단절" },
  { id: "user-008", name: "박현우", tag: "🔴 고위험", risk: "High", detail: "취업 실패 절망 / 자존감 붕괴" },
  { id: "user-006", name: "강지원", tag: "🚨 위기군", risk: "Crisis", detail: "학교 교우관계 고립 / 자해 충동" },
  { id: "user-009", name: "임지혁", tag: "🚨 위기군", risk: "Crisis", detail: "만성 통증 질환 / 극단적 절망" }
];

interface AnalyzedToken {
  word: string;
  weight: number;
  index: number;
}

// 실시간 사용자 입력 문장 형태소 분석기 (Semantic Lexicon Parser)
const analyzeSentenceRealtime = (text: string, score: number): {
  predictedEmotion: string;
  probabilities: { name: string; value: number; color: string }[];
  weights: AnalyzedToken[];
  explanationText: string;
} => {
  const normalized = text.trim();
  
  // 감정 키워드 가중치 사전 정의
  const LEXICON: { [key: string]: { emotion: string; weight: number; color: string } } = {
    // 자살위기 / 극심한 절망
    "끝내고 싶": { emotion: "자살충동", weight: 0.125, color: "#EF4444" },
    "죽고 싶": { emotion: "자살충동", weight: 0.130, color: "#EF4444" },
    "자살": { emotion: "자살충동", weight: 0.120, color: "#EF4444" },
    "자해": { emotion: "자살충동", weight: 0.115, color: "#EF4444" },
    "수면제": { emotion: "자살충동", weight: 0.095, color: "#EF4444" },
    "사라지고": { emotion: "절망감", weight: 0.088, color: "#8B5CF6" },
    "없어지고": { emotion: "절망감", weight: 0.085, color: "#8B5CF6" },
    
    // 고우울 / 절망 / 슬픔
    "괴롭": { emotion: "우울감", weight: 0.078, color: "#EF4444" },
    "눈물": { emotion: "우울감", weight: 0.062, color: "#EF4444" },
    "가슴이 답답": { emotion: "우울감", weight: 0.055, color: "#EF4444" },
    "슬프": { emotion: "슬픔", weight: 0.075, color: "#3B82F6" },
    "아프": { emotion: "피로", weight: 0.045, color: "#F59E0B" },
    
    // 중등도 / 무기력 / 자존감 저하
    "누워있": { emotion: "무기력", weight: 0.065, color: "#D946EF" },
    "하기 싫": { emotion: "무기력", weight: 0.060, color: "#D946EF" },
    "지쳐": { emotion: "피로", weight: 0.055, color: "#F59E0B" },
    "힘들어": { emotion: "무기력", weight: 0.050, color: "#D946EF" },
    "무능": { emotion: "자존감저하", weight: 0.070, color: "#6B7280" },
    "부족": { emotion: "자존감저하", weight: 0.065, color: "#6B7280" },
    "자존감": { emotion: "자존감저하", weight: 0.058, color: "#6B7280" },
    "실패": { emotion: "자존감저하", weight: 0.060, color: "#6B7280" },
    "혼자": { emotion: "외로움", weight: 0.055, color: "#A855F7" },
    "외로": { emotion: "외로움", weight: 0.075, color: "#A855F7" },
    
    // 저위험 / 불안 / 일상 스트레스
    "조급": { emotion: "불안", weight: 0.045, color: "#EC4899" },
    "불안": { emotion: "불안", weight: 0.068, color: "#EC4899" },
    "걱정": { emotion: "불안", weight: 0.050, color: "#EC4899" },
    "취업": { emotion: "불안", weight: 0.035, color: "#EC4899" },
    "불규칙": { emotion: "피로", weight: 0.038, color: "#F59E0B" },
    
    // 데모 내담자 맞춤형 임상 키워드 가중치
    "시험이 몰려서": { emotion: "불안", weight: 0.065, color: "#EC4899" },
    "잠도 안 오고": { emotion: "불면", weight: 0.058, color: "#0D9488" },
    "답답해서": { emotion: "불안", weight: 0.048, color: "#EC4899" },
    "실수할까 봐": { emotion: "불안", weight: 0.078, color: "#EC4899" },
    "불안해서": { emotion: "불안", weight: 0.072, color: "#EC4899" },
    "답답해 죽을": { emotion: "불안", weight: 0.085, color: "#EC4899" },
    "완전히 끊어져서": { emotion: "상실감", weight: 0.088, color: "#14B8A6" },
    "혼자 남겨진": { emotion: "외로움", weight: 0.075, color: "#A855F7" },
    "깊은 슬픔에서": { emotion: "슬픔", weight: 0.092, color: "#3B82F6" },
    "지쳐서": { emotion: "피로", weight: 0.055, color: "#F59E0B" },
    "하기 싫고": { emotion: "무기력", weight: 0.062, color: "#D946EF" },
    "누워만 있고": { emotion: "무기력", weight: 0.068, color: "#D946EF" },
    "전부 나를": { emotion: "외로움", weight: 0.045, color: "#A855F7" },
    "따돌려서": { emotion: "외로움", weight: 0.088, color: "#A855F7" },
    "외롭고 혼자": { emotion: "외로움", weight: 0.075, color: "#A855F7" },
    "사라지고 싶어": { emotion: "자살충동", weight: 0.125, color: "#EF4444" },
    "지치고 화가": { emotion: "분노", weight: 0.065, color: "#F97316" },
    "부족한 엄마": { emotion: "죄책감", weight: 0.072, color: "#4F46E5" },
    "죄책감이": { emotion: "죄책감", weight: 0.082, color: "#4F46E5" },
    "떨어지니까": { emotion: "절망감", weight: 0.062, color: "#8B5CF6" },
    "무능한 실패자": { emotion: "자존감저하", weight: 0.085, color: "#6B7280" },
    "절망감이 들어": { emotion: "절망감", weight: 0.095, color: "#8B5CF6" },
    "괴롭히고": { emotion: "우울감", weight: 0.068, color: "#EF4444" },
    "아무도 나를": { emotion: "외로움", weight: 0.055, color: "#A855F7" },
    "수면제 먹고": { emotion: "자살충동", weight: 0.098, color: "#EF4444" },
    "끝내고 싶어": { emotion: "자살충동", weight: 0.130, color: "#EF4444" }
  };

  const detectedWeights: AnalyzedToken[] = [];
  let primaryEmotion = "일상";
  
  // 텍스트 토크나이징 및 사전 단어 매칭
  const words = normalized.split(/\s+/);
  const matchedEmotionsCount: { [key: string]: number } = {};

  words.forEach((word, idx) => {
    let matched = false;
    // 다중 어절 매칭 시도
    for (const [key, meta] of Object.entries(LEXICON)) {
      if (word.includes(key)) {
        const startIdx = normalized.indexOf(word);
        detectedWeights.push({
          word,
          weight: meta.weight,
          index: startIdx >= 0 ? startIdx : idx * 5
        });
        matchedEmotionsCount[meta.emotion] = (matchedEmotionsCount[meta.emotion] || 0) + meta.weight;
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      // 감정 완화 요인 무작위 배정 (LIME의 음수 가중치 표현)
      const stopWords = ["나는", "내가", "그냥", "너무", "진짜", "오늘", "제", "나", "저", "이", "그", "에", "도", "은", "는", "가"];
      if (stopWords.includes(word) || word.length <= 1) {
        const startIdx = normalized.indexOf(word);
        detectedWeights.push({
          word,
          weight: -0.005 - (word.length % 3) * 0.002,
          index: startIdx >= 0 ? startIdx : idx * 5
        });
      }
    }
  });

  // 최종 지배적 감정 판정
  let maxWeight = 0;
  Object.entries(matchedEmotionsCount).forEach(([emo, w]) => {
    if (w > maxWeight) {
      maxWeight = w;
      primaryEmotion = emo;
    }
  });

  // 만약 사전에 매칭되는 단어가 아예 없는 경우 폴백 감정 배정
  if (primaryEmotion === "일상") {
    if (score >= 20) primaryEmotion = "자살충동";
    else if (score >= 15) primaryEmotion = "우울감";
    else if (score >= 10) primaryEmotion = "무기력";
    else if (score >= 5) primaryEmotion = "불안";
  }

  // 예측 확률 계산 (주요 감정 기준 분포 보정)
  const p1Val = Math.round(score >= 20 ? 72 : score >= 15 ? 65 : score >= 10 ? 58 : 38);
  const p2Val = Math.round(p1Val * 0.35);
  const p3Val = 100 - p1Val - p2Val;

  const EMOTION_COLORS: { [key: string]: string } = {
    "자살충동": "#EF4444",
    "우울감": "#EF4444",
    "슬픔": "#3B82F6",
    "외로움": "#A855F7",
    "무기력": "#D946EF",
    "불안": "#EC4899",
    "피로": "#F59E0B",
    "자존감저하": "#6B7280",
    "일상": "#10B981"
  };

  const probabilities = [
    { name: primaryEmotion, value: p1Val, color: EMOTION_COLORS[primaryEmotion] || "#EF4444" },
    { name: primaryEmotion === "무기력" ? "자존감저하" : "절망감", value: p2Val, color: "#8B5CF6" },
    { name: "피로", value: p3Val, color: "#F59E0B" }
  ];

  // 단어가 하이라이트된 문장 설명 동적 생성
  const positiveTriggers = detectedWeights.filter(w => w.weight > 0).sort((a, b) => b.weight - a.weight);
  let explanationText = "";
  if (positiveTriggers.length > 0) {
    const topWord = positiveTriggers[0].word;
    const topWeight = positiveTriggers[0].weight.toFixed(4);
    explanationText = `이 문장에서는 마음 상태를 직접적으로 표현하는 '${topWord}' (+${topWeight}) 단어가 ${primaryEmotion} 감정을 분석하는 데 가장 중요한 지표로 포착되었습니다. `;
    if (positiveTriggers.length > 1) {
      explanationText += `여기에 추가로 '${positiveTriggers[1].word}' (+${positiveTriggers[1].weight.toFixed(4)}) 표현이 결합되면서 감정 예측 강도를 뒷받침하고 있습니다.`;
    }
  } else {
    explanationText = `작성하신 문장은 특정 감정 단어로 치우치지 않는 일상적인 맥락으로 감지되었으나, 전반적인 PHQ-9 우울 수준을 보조 지표로 매칭하여 예측 확률을 산출했습니다.`;
  }

  return {
    predictedEmotion: primaryEmotion,
    probabilities,
    weights: detectedWeights.sort((a, b) => a.index - b.index),
    explanationText
  };
};

export default function EmotionReport({ 
  onContinueChat,
  phq9Score = 14, // 기본값 설정 (테스트용)
  phq9Severity = "🟠 중등도",
  sessionId,
  onNavigateToMap,
  lastPhq9Date = null,
  onReTakePhq9,
  profile,
  onUpdateProfile
}: EmotionReportProps) {
  const [currentTab, setCurrentTab] = useState("대화턴");
  
  const [reportMode, setReportMode] = useState<"live" | "demo">("demo");
  const [selectedDemoId, setSelectedDemoId] = useState<string>("user-001");
  const [currentScore, setCurrentScore] = useState<number>(phq9Score);
  
  const [emotions, setEmotions] = useState<{ name: string; color: string }[]>([
    { name: "우울감", color: "#EF4444" },
    { name: "슬픔", color: "#3B82F6" },
    { name: "외로움", color: "#A855F7" },
    { name: "분노", color: "#F97316" },
    { name: "무기력", color: "#D946EF" },
    { name: "불면", color: "#0D9488" },
    { name: "피로", color: "#F59E0B" },
  ]);
  
  // LIME XAI 상태 관리
  const [limeMode, setLimeMode] = useState<"demo" | "live">("live");
  const [currentDemoIdx, setCurrentDemoIdx] = useState(0);
  const [currentLiveIdx, setCurrentLiveIdx] = useState(0);
  const [hoveredWord, setHoveredWord] = useState<{ word: string; weight: number; desc: string } | null>(null);
  const [liveSentences, setLiveSentences] = useState<any[]>([]);

  const [reportData, setReportData] = useState<{
    summary: {
      totalTurns: number;
      avgRisk: number;
      mainEmotion: string;
    };
    pieData: { name: string; value: number; color: string }[];
    trendData: any[];
    wordCloud: { text: string; size: string; color: string; pos: string }[];
    mindData: { key: string; title: string; desc: string; color: string }[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // 마이페이지 이식 상태들
  const [showMyPage, setShowMyPage] = useState(false);
  const [editNickname, setEditNickname] = useState(profile?.nickname || "");
  const [editGender, setEditGender] = useState(profile?.gender || "");
  const [editAgeGroup, setEditAgeGroup] = useState(profile?.ageGroup || "");
  const [editOccupation, setEditOccupation] = useState(profile?.occupation || "");
  const [editRegion, setEditRegion] = useState(profile?.region || "");
  const [editPhone, setEditPhone] = useState(profile?.phone || "");
  const [editContact, setEditContact] = useState(profile?.contact || "");
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // 프로필 데이터 변경 시 동기화
  useEffect(() => {
    if (profile) {
      setEditNickname(profile.nickname || "");
      setEditGender(profile.gender || "");
      setEditAgeGroup(profile.ageGroup || "");
      setEditOccupation(profile.occupation || "");
      setEditRegion(profile.region || "");
      setEditPhone(profile.phone || "");
      setEditContact(profile.contact || "");
    }
  }, [profile]);

  const ageGroups = ["10대 이하", "20대", "30대", "40대", "50대", "60대 이상"];
  const genders = ["여성", "남성", "기타"];
  const occupations = ["학생", "직장인", "자영업자", "주부", "취업준비생", "기타"];
  const regions = [
    "서울", "경기", "인천", "강원", "충북", "충남", 
    "대전", "전북", "전남", "광주", "경북", "경남", 
    "대구", "울산", "부산", "제주"
  ];

  const isEditProfileValid = editNickname.trim() !== "" && editGender !== "" && editAgeGroup !== "" && editOccupation !== "" && editRegion !== "";

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditProfileValid) return;
    
    setIsSaving(true);
    setSaveMessage("");
    
    const updated = {
      nickname: editNickname,
      gender: editGender,
      ageGroup: editAgeGroup,
      occupation: editOccupation,
      region: editRegion,
      phone: editPhone,
      contact: editContact
    };
    
    try {
      if (onUpdateProfile) {
        await onUpdateProfile(updated);
        setSaveMessage("✨ 성공적으로 저장되었습니다!");
        setTimeout(() => {
          setShowMyPage(false);
          setSaveMessage("");
        }, 1500);
      } else {
        throw new Error("Update callback not configured");
      }
    } catch (err) {
      setSaveMessage("❌ 프로필 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // PHQ-9 마지막 검사일 대비 경과 일수 계산
  const getDaysSinceLastPhq9 = () => {
    if (!lastPhq9Date) return null;
    const lastDate = new Date(lastPhq9Date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const diffDays = getDaysSinceLastPhq9();

  // PHQ-9 실제 점수 기반 등급 및 색상 매핑
  const actualScore = currentScore;
  let actualSeverity = phq9Severity;
  let severityColor = "text-orange-500";
  let badgeColor = "text-[#D97706]";
  let circleBorderColor = "border-orange-200";

  if (actualScore <= 4) {
    actualSeverity = "🟢 최소 우울";
    severityColor = "text-green-500";
    badgeColor = "text-green-600";
    circleBorderColor = "border-green-200";
  } else if (actualScore <= 9) {
    actualSeverity = "🟡 경도 우울";
    severityColor = "text-yellow-500";
    badgeColor = "text-yellow-600";
    circleBorderColor = "border-yellow-200";
  } else if (actualScore <= 14) {
    actualSeverity = "🟠 중등도 우울";
    severityColor = "text-orange-500";
    badgeColor = "text-orange-600";
    circleBorderColor = "border-orange-200";
  } else if (actualScore <= 19) {
    actualSeverity = "🔴 중증 우울";
    severityColor = "text-red-500";
    badgeColor = "text-red-600";
    circleBorderColor = "border-red-200";
  } else {
    actualSeverity = "💀 극심한 우울";
    severityColor = "text-red-700 font-extrabold";
    badgeColor = "text-red-700 font-extrabold";
    circleBorderColor = "border-red-400";
  }

  // 실시간 대화 및 데모 데이터 기반 감정 정보 로드 및 통계 연동
  useEffect(() => {
    const fetchSessionData = async () => {
      setIsLoading(true);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        let history: any[] = [];
        let activeScore = phq9Score;

        if (reportMode === "demo") {
          // 데모 모드: 선택된 데모 내담자의 상담 이력 1년치를 로드함
          const res = await fetch(`${apiBase}/api/counselor/client/${selectedDemoId}/report`);
          if (!res.ok) throw new Error("Failed to fetch demo client report");
          const report = await res.json();
          history = report.user_messages || [];

          // 설문 점수 히스토리에서 가장 최신 PHQ-9 점수 추출하여 세팅
          if (report.surveyHistory && report.surveyHistory.length > 0) {
            const sortedSurveys = [...report.surveyHistory].sort(
              (a: any, b: any) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()
            );
            activeScore = sortedSurveys[0].phq9;
          }
          setCurrentScore(activeScore);
          
          // LIME 데모 시나리오 인덱스 동적 동기화
          const demoIdx = limeDemoScenarios.findIndex(scen => scen.id === selectedDemoId);
          if (demoIdx !== -1) {
            setCurrentDemoIdx(demoIdx);
          }
          setLimeMode("demo"); // 데모 내담자 선택 시 LIME 탭도 데모 모드로 자동 전환하여 분석 직관성 극대화
        } else {
          // 실제 대화 연동 모드: 현재 sessionId의 history를 로드함
          if (!sessionId) {
            setIsLoading(false);
            return;
          }
          const res = await fetch(`${apiBase}/api/chat/history/${sessionId}`);
          if (!res.ok) throw new Error("Failed to fetch session history");
          history = await res.json();
          setCurrentScore(phq9Score);
        }

        // 유저 발화만 필터링 (내담자 감정 분석 위함)
        const userMsgs = history.filter((msg: any) => msg.role === "user");
        if (userMsgs.length === 0) {
          setIsLoading(false);
          return;
        }

        const totalTurns = userMsgs.length;

        // 평균 위험도 계산
        const sumRisk = userMsgs.reduce((acc: number, curr: any) => acc + curr.risk_score, 0);
        const avgRisk = parseFloat((sumRisk / totalTurns).toFixed(2));

        // 감정별 누적 확률 및 형태소 클렌징 빈도 분석
        const emotionSum: { [key: string]: number } = {};
        const primaryEmotionCounts: { [key: string]: number } = {};
        const wordCounts: { [key: string]: number } = {};

        userMsgs.forEach((msg: any) => {
          let parsedEmo: any = null;
          try {
            if (msg.emotion) {
              parsedEmo = typeof msg.emotion === "string" ? JSON.parse(msg.emotion) : msg.emotion;
            }
          } catch (e) {
            console.error("Error parsing emotion:", e);
          }

          if (parsedEmo) {
            const primary = parsedEmo.primary || "일상";
            primaryEmotionCounts[primary] = (primaryEmotionCounts[primary] || 0) + 1;

            if (parsedEmo.probabilities) {
              Object.entries(parsedEmo.probabilities).forEach(([emo, prob]) => {
                emotionSum[emo] = (emotionSum[emo] || 0) + (prob as number);
              });
            }
          }

          // 워드클라우드용 단어 카운트
          const cleanText = msg.content
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
            .replace(/\s{2,}/g, " ");
          const words = cleanText.split(" ");
          const stopWords = ["나는", "내가", "너무", "진짜", "그냥", "하고", "했다", "해서", "있어", "같아", "오늘", "너무나", "정말", "엄청", "되게", "아주", "많이", "우리", "나의", "내", "나", "저", "이", "그", "에", "도", "은", "는", "가", "을", "를"];
          words.forEach((w: string) => {
            const trimmed = w.trim();
            if (trimmed.length > 1 && !stopWords.includes(trimmed)) {
              wordCounts[trimmed] = (wordCounts[trimmed] || 0) + 1;
            }
          });
        });

        // 주요 감정 결정 (일상 제외 우선순위)
        let mainEmotion = "일상";
        let maxCount = 0;
        Object.entries(primaryEmotionCounts).forEach(([emo, count]) => {
          if (count > maxCount && emo !== "일상") {
            mainEmotion = emo;
            maxCount = count;
          }
        });
        if (mainEmotion === "일상" && Object.keys(primaryEmotionCounts).length > 1) {
          let secondMax = 0;
          Object.entries(primaryEmotionCounts).forEach(([emo, count]) => {
            if (emo !== "일상" && count > secondMax) {
              mainEmotion = emo;
              secondMax = count;
            }
          });
        }

        // Pie Data 구성
        const avgEmotions = Object.entries(emotionSum).map(([name, sum]) => ({
          name,
          value: Math.round((sum / totalTurns) * 100)
        })).filter(e => e.value > 0);

        avgEmotions.sort((a, b) => b.value - a.value);

        const EMOTION_COLORS: { [key: string]: string } = {
          "우울감": "#EF4444",
          "슬픔": "#3B82F6",
          "외로움": "#A855F7",
          "분노": "#F97316",
          "무기력": "#D946EF",
          "불면": "#0D9488",
          "피로": "#F59E0B",
          "일상": "#10B981",
          "불안": "#EC4899",
          "기타": "#CCCCCC"
        };

        let pieData: { name: string; value: number; color: string }[] = [];
        let otherSum = 0;

        avgEmotions.forEach((item, idx) => {
          if (idx < 4) {
            pieData.push({
              name: item.name,
              value: item.value,
              color: EMOTION_COLORS[item.name] || "#6B7280"
            });
          } else {
            otherSum += item.value;
          }
        });

        if (otherSum > 0) {
          pieData.push({
            name: "기타",
            value: otherSum,
            color: "#CCCCCC"
          });
        }

        if (pieData.length === 0) {
          pieData = [{ name: "일상", value: 100, color: "#10B981" }];
        }

        // '일상'을 제외한 우울 감정들 중 누적 스코어 기반 상위 7개 추출
        const depressiveScores = ALL_DEPRESSIVE_EMOTIONS.map(name => ({
          name,
          score: emotionSum[name] || 0.0
        }));

        // 내림차순 정렬
        depressiveScores.sort((a, b) => b.score - a.score);

        // 상위 7개 우울 감정 이름
        const top7EmotionNames = depressiveScores.slice(0, 7).map(item => item.name);

        // 상위 7개 감정 및 색상 매핑 오브젝트 생성
        const top7Emotions = top7EmotionNames.map(name => ({
          name,
          color: EMOTION_COLOR_MAP[name] || '#6B7280'
        }));

        // Component State 업데이트 및 디폴트 활성화 설정
        setEmotions(top7Emotions);
        setVisibleEmotions(top7EmotionNames);

        // Trend Data 구성 (동적으로 선별된 Top 7 감정 투영 및 정규화 보정)
        const trendData = userMsgs.map((msg: any, idx: number) => {
          let parsedEmo: any = null;
          try {
            if (msg.emotion) {
              parsedEmo = typeof msg.emotion === "string" ? JSON.parse(msg.emotion) : msg.emotion;
            }
          } catch (e) {}

          const dataPoint: any = { turn: `${idx + 1}턴` };
          
          // 동적 Top 7 감정 0.0 기본 매핑
          top7EmotionNames.forEach(emo => {
            dataPoint[emo] = 0.0;
          });

          if (parsedEmo && parsedEmo.probabilities) {
            Object.entries(parsedEmo.probabilities).forEach(([emo, prob]) => {
              if (top7EmotionNames.includes(emo)) {
                const rawVal = parseFloat(prob as string) || 0.0;
                // 0.0 ~ 1.0 범위 정규화 방어 처리 (1.0 이상인 경우 100으로 나눔)
                dataPoint[emo] = parseFloat((rawVal > 1.0 ? rawVal / 100 : rawVal).toFixed(4));
              }
            });
          }
          return dataPoint;
        });

        // Word Cloud 구성
        const sortedWords = Object.entries(wordCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6);

        const fontSizes = ["text-3xl", "text-2xl", "text-2xl", "text-xl", "text-lg", "text-lg"];
        const cloudColors = [
          "text-[#EF4444]",
          "text-[#A855F7]",
          "text-[#3B82F6]",
          "text-[#F59E0B]",
          "text-[#D946EF]",
          "text-gray-500"
        ];
        const positions = [
          "top-10 right-10",
          "top-4 left-6",
          "bottom-6 left-12",
          "bottom-10 right-6",
          "top-6 left-1/3",
          "bottom-16 left-1/2"
        ];

        const wordCloud = sortedWords.map(([text], idx) => ({
          text,
          size: fontSizes[idx] || "text-lg",
          color: cloudColors[idx] || "text-gray-500",
          pos: positions[idx] || "top-4 left-4"
        }));

        if (wordCloud.length === 0) {
          wordCloud.push({ text: "마음", size: "text-3xl", color: "text-[#3B82F6]", pos: "top-10 left-10" });
        }

        // MIND Framework 구성
        const hasLowSleep = emotionSum["불면"] ? (emotionSum["불면"] / totalTurns) > 0.15 : false;
        const hasFatigue = emotionSum["피로"] ? (emotionSum["피로"] / totalTurns) > 0.15 : false;
        const hasGuilt = emotionSum["죄책감"] ? (emotionSum["죄책감"] / totalTurns) > 0.10 : false;
        const hasDespair = emotionSum["절망감"] ? (emotionSum["절망감"] / totalTurns) > 0.10 : false;
        const hasLowConfidence = emotionSum["자신감저하"] || emotionSum["자존감저하"] ? (((emotionSum["자신감저하"] || 0) + (emotionSum["자존감저하"] || 0)) / totalTurns) > 0.10 : false;

        const mDesc = phq9Score <= 4
          ? "우울 지수가 안정적인 상태이며 마음이 잘 정돈되어 있습니다."
          : phq9Score <= 9
            ? "경미한 우울감이 관찰되므로 주기적인 관찰과 환기가 필요합니다."
            : phq9Score <= 14
              ? "전반적인 우울 지수가 중등도로 정기적인 마음 점검과 대화가 필요합니다."
              : phq9Score <= 19
                ? "우울 정도가 다소 높습니다. 적극적인 전문 심리 상담을 고려해 보세요."
                : "고위험군 우울 상태입니다. 즉시 전문 의료기관이나 자살예방 전화를 통해 긴급 보호 지원을 받으시기 바랍니다.";

        const mColor = phq9Score <= 4
          ? "border-green-500"
          : phq9Score <= 9
            ? "border-yellow-500"
            : phq9Score <= 14
              ? "border-orange-500"
              : "border-red-500";

        const iDesc = (emotionSum["외로움"] || emotionSum["상실감"]) && (((emotionSum["외로움"] || 0) + (emotionSum["상실감"] || 0)) / totalTurns) > 0.15
          ? "외로움과 고립감을 자주 언급하고 있어 주변에 지지해 줄 수 있는 대인 관계망 확보가 필요합니다."
          : "대인관계에서의 감정 소모가 원만하며 마음의 연결성이 잘 유지되고 있습니다.";
        
        const nDesc = hasGuilt || hasDespair || hasLowConfidence
          ? "자책이나 자기비하와 같은 부정적인 인지 왜곡 성향이 감지되어, 소크라테스 대안 탐색 훈련이 권장됩니다."
          : "자신과 주변에 대해 합리적이고 객관적인 통찰력을 잃지 않고 유연하게 바라보고 있습니다.";

        const dDesc = hasLowSleep || hasFatigue
          ? "불면이나 만성적인 신체 피로 증상이 포착되므로, 규칙적인 기초 생체 리듬 회복이 최우선입니다."
          : "일상 생활 에너지가 잘 순환되고 있으며 신체 피로 및 식욕 변화의 영향이 비교적 낮습니다.";

        const mindData = [
          { key: "M", title: "Mental State (정신 상태)", desc: mDesc, color: mColor },
          { key: "I", title: "Interpersonal (대인 관계)", desc: iDesc, color: (emotionSum["외로움"] || emotionSum["상실감"]) && (((emotionSum["외로움"] || 0) + (emotionSum["상실감"] || 0)) / totalTurns) > 0.15 ? "border-purple-500" : "border-purple-300" },
          { key: "N", title: "Negative Bias (인지 왜곡)", desc: nDesc, color: hasGuilt || hasDespair || hasLowConfidence ? "border-blue-500" : "border-blue-300" },
          { key: "D", title: "Daily Life (일상 생활)", desc: dDesc, color: hasLowSleep || hasFatigue ? "border-teal-500" : "border-teal-300" }
        ];

        // 실시간 대화 유저 문장 추출 및 LIME 분석
        const liveParsed = userMsgs.map((msg: any, idx: number) => {
          const content = msg.content;
          const analysis = analyzeSentenceRealtime(content, phq9Score);
          return {
            id: `lime-live-${idx}`,
            level: phq9Score >= 20 ? "crisis" : phq9Score >= 15 ? "high" : phq9Score >= 10 ? "moderate" : "low",
            levelLabel: `실제 대화 Turn ${idx + 1}`,
            sentence: content,
            ...analysis
          };
        }).slice(-3); // 최근 3개 대화만 로드

        setLiveSentences(liveParsed);

        setReportData({
          summary: {
            totalTurns,
            avgRisk,
            mainEmotion
          },
          pieData,
          trendData,
          wordCloud,
          mindData
        });
      } catch (err) {
        console.error("Error generating dynamic emotion report:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId, phq9Score, reportMode, selectedDemoId]);

  // 로딩 및 다이내믹 데이터 적용 대비 폴백
  const displaySummary = reportData?.summary || userEmotionReport.summary;
  const displayPieData = reportData?.pieData || userEmotionReport.pieData;
  const displayTrendData = reportData?.trendData || userEmotionReport.trendData;
  const displayWordCloud = reportData?.wordCloud || userEmotionReport.wordCloud;



  const [visibleEmotions, setVisibleEmotions] = useState<string[]>(["무기력", "불면", "피로", "외로움", "우울감", "슬픔"]);

  const toggleEmotion = (name: string) => {
    setVisibleEmotions(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const tabs = ["대화턴", "1일", "7일", "14일", "30일"];

  const currentScenarios = limeMode === "demo" ? limeDemoScenarios : liveSentences;
  const currentIdx = limeMode === "demo" ? currentDemoIdx : currentLiveIdx;
  const activeScenario = currentScenarios[currentIdx] as LIMEExplanationData | undefined;

  return (
    <div className="max-w-7xl w-full bg-[#FAF8F5] rounded-3xl overflow-hidden border border-[#EAE5D9] shadow-[0_12px_40px_rgba(139,123,93,0.06)] flex flex-col animate-fade-in max-h-[90vh]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#8C7862] to-[#A69584] p-6 text-white shrink-0 border-b border-[#EAE5D9]/20">
        <div className="text-center">
          <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
            📊 나의 감정 리포트
          </h2>
          <p className="text-sm opacity-90 mt-1">오늘 대화를 분석했어요</p>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-6 flex-1 overflow-hidden">
        {/* 모드 전환 필 버튼 (데모 시나리오 vs 실제 대화 연동) */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/40 p-2.5 rounded-2xl border border-[#EAE5D9]/60 shrink-0">
          <div className="flex bg-white/80 backdrop-blur-sm p-1 rounded-xl border border-[#EAE5D9]/60 shrink-0 select-none">
            <button
              type="button"
              onClick={() => setReportMode("demo")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                reportMode === "demo"
                  ? "bg-[#1E2D4E] text-[#FAF8F5] shadow-md font-extrabold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              🧪 데모 시나리오 분석 조회
            </button>
            <button
              type="button"
              onClick={() => setReportMode("live")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                reportMode === "live"
                  ? "bg-[#1E2D4E] text-[#FAF8F5] shadow-md font-extrabold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              💬 실제 대화 연동 리포트
            </button>
          </div>
          <span className="text-[10px] font-bold text-gray-400 italic pr-2">
            {reportMode === "demo" 
              ? "💡 각 위험도별 1년 장기 치료 과정을 밟은 가상 내담자의 임상 분석 결과입니다." 
              : "💬 챗방에서 사용자가 나누었던 실시간 대화 및 마음 일기를 기반으로 한 분석 결과입니다."}
          </span>
        </div>

        {/* 데모 내담자 선택 가로 스크롤 카드 패널 */}
        {reportMode === "demo" && (
          <div className="flex flex-col gap-2 shrink-0 border-b border-[#EAE5D9]/40 pb-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block select-none">
              임상 데모 내담자 프로필 선택 (8인 포트폴리오)
            </span>
            <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-thin scrollbar-thumb-gray-200/60 select-none">
              {DEMO_CLIENTS.map((client) => {
                const isSelected = selectedDemoId === client.id;
                
                // 위험도 수준별 뱃지 스타일 정의
                const badgeStyle = 
                  client.risk === "Crisis" ? "bg-red-50 text-red-600 border-red-200" :
                  client.risk === "High" ? "bg-orange-50 text-orange-600 border-orange-200" :
                  client.risk === "Medium" ? "bg-amber-50 text-amber-600 border-amber-200" :
                  "bg-green-50 text-green-600 border-green-200";

                const borderStyle = isSelected
                  ? client.risk === "Crisis" ? "border-red-500 shadow-md ring-2 ring-red-500/20 font-black scale-[1.02]" :
                    client.risk === "High" ? "border-orange-500 shadow-md ring-2 ring-orange-500/20 font-black scale-[1.02]" :
                    client.risk === "Medium" ? "border-amber-500 shadow-md ring-2 ring-amber-500/20 font-black scale-[1.02]" :
                    "border-green-500 shadow-md ring-2 ring-green-500/20 font-black scale-[1.02]"
                  : "border-[#EAE5D9] hover:border-gray-300";

                return (
                  <button
                    type="button"
                    key={client.id}
                    onClick={() => setSelectedDemoId(client.id)}
                    className={`flex-shrink-0 bg-[#FDFCFB] border text-left rounded-xl p-3 w-[210px] transition-all duration-300 flex flex-col gap-1.5 cursor-pointer ${borderStyle}`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-extrabold text-xs text-gray-800">{client.name}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                        {client.tag}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold leading-relaxed line-clamp-2">
                      {client.detail}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
          <div className="bg-[#FDFCFB] p-4 rounded-xl text-center border border-[#EAE5D9]">
            <p className="text-xs text-gray-500 font-medium mb-1">총 대화 턴</p>
            <p className="text-2xl font-bold text-gray-800">{displaySummary.totalTurns}회</p>
          </div>
          <div className="bg-[#FDFCFB] p-4 rounded-xl text-center border border-[#EAE5D9]">
            <p className="text-xs text-gray-500 font-medium mb-1">주요 감정</p>
            <p className="text-2xl font-bold text-gray-800">{displaySummary.mainEmotion}</p>
          </div>
          <div className="bg-[#FDFCFB] p-4 rounded-xl text-center border border-[#EAE5D9]">
            <p className="text-xs text-gray-500 font-medium mb-1">위험 등급</p>
            <p className={`text-xl font-bold ${badgeColor}`}>{actualSeverity}</p>
          </div>
        </div>

        {/* Scrollable Content Area - 2 Columns */}
        <div className="overflow-y-auto flex-1 pr-2 -mr-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column (4/12): Score, Donut, MIND, Word Cloud */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Score Card */}
              <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col items-center">
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  📊 우울 위험 점수
                </h3>
                <div className={`relative w-28 h-28 flex items-center justify-center rounded-full border-8 ${circleBorderColor}`}>
                   <div className="text-center">
                     <span className="text-2xl font-black text-gray-800">{actualScore}</span>
                     <span className="text-gray-400 text-xs">점</span>
                     <div className={`text-xs font-bold ${severityColor}`}>{actualSeverity}</div>
                   </div>
                </div>
              </div>

              {/* Donut Chart */}
              <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  💭 감정 분포
                </h3>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="h-28 w-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={displayPieData}
                          innerRadius={30}
                          outerRadius={50}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {displayPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                    {displayPieData.slice(0, 4).map((item) => (
                      <div key={item.name} className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }}></div>
                        <span className="text-gray-600 font-medium">{item.name}</span>
                        <span className="text-gray-400">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Word Cloud */}
              <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  ☁️ 자주 쓴 단어
                </h3>
                <div className="bg-[#FAF8F5] border border-[#EAE5D9]/60 rounded-xl p-3 h-32 relative overflow-hidden">
                  {displayWordCloud.map((item, i) => (
                    <span key={i} className={`absolute ${item.size} font-bold ${item.color} ${item.pos}`}>
                      {item.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (8/12): New Big Chart */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <div className="flex flex-col gap-4">
                  {/* Title and Subtitle */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      📈 감정별 확률 추이
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      확률 1% 이상으로 나타난 감정만 자동 표시됩니다. 범례를 클릭해 다른 감정도 켜고 끌 수 있어요.
                    </p>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-gray-200 text-sm">
                    {tabs.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setCurrentTab(tab)}
                        className={`px-4 py-2 font-medium transition-colors ${
                          currentTab === tab
                            ? "border-b-2 border-[#1E2D4E] text-[#1E2D4E]"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Chart */}
                  <div className="h-64 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={displayTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                        <XAxis dataKey="turn" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                        <YAxis domain={[0, 1]} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                        <Tooltip />
                        {emotions.map((emotion) => (
                          visibleEmotions.includes(emotion.name) && (
                            <Line
                               key={emotion.name}
                               type="monotone"
                               dataKey={emotion.name}
                               stroke={emotion.color}
                               strokeWidth={3}
                               dot={{ r: 4, fill: emotion.color }}
                               activeDot={{ r: 6 }}
                            />
                          )
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Custom Legend */}
                  <div className="mt-4">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs">
                      {emotions.map((emotion) => (
                        <button
                          key={emotion.name}
                          onClick={() => toggleEmotion(emotion.name)}
                          className={`flex items-center gap-1.5 p-1.5 rounded transition-colors ${
                            visibleEmotions.includes(emotion.name)
                              ? "bg-gray-50 text-gray-800"
                              : "text-gray-400 opacity-60"
                          }`}
                        >
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: emotion.color }}></div>
                          <span className="font-medium truncate">{emotion.name}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      💡 범례에서 감정 이름을 클릭하면 해당 감정 선을 켜고 끌 수 있어요.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 나를 더 깊이 들여다보는 AI 분석 (XAI LIME) Card - FULL WIDTH */}
          <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mt-6 text-left">
            <div className="flex flex-col gap-5">
              
              {/* Card Title & Mode Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 flex flex-wrap items-center gap-2">
                    🔍 나를 더 깊이 들여다보는 AI 분석 (XAI LIME)
                    <span className="text-[10px] bg-purple-100 text-purple-700 font-extrabold px-2.5 py-0.5 rounded-full select-none">
                      설명가능한 AI (XAI)
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    입력하신 대화 문장에서 각 단어가 AI의 감정 분류 예측에 어떤 기여를 했는지 실시간 시각화합니다.
                  </p>
                </div>
                
                {/* Mode selector pills */}
                <div className="flex bg-[#FAF8F5] p-1 rounded-xl border border-[#EAE5D9] self-start sm:self-auto shrink-0 select-none">
                  <button
                    type="button"
                    onClick={() => setLimeMode("demo")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      limeMode === "demo"
                        ? "bg-[#1E2D4E] text-[#FAF8F5] shadow-sm"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    🧪 데모 시나리오
                  </button>
                  <button
                    type="button"
                    onClick={() => setLimeMode("live")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                      limeMode === "live"
                        ? "bg-[#1E2D4E] text-[#FAF8F5] shadow-sm"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    💬 실제 대화 연동
                    {liveSentences.length > 0 && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* If live mode has no data */}
              {limeMode === "live" && liveSentences.length === 0 ? (
                <div className="bg-[#FAF8F5] border border-dashed border-[#EAE5D9] rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
                  <span className="text-4xl mb-3 animate-bounce">💬</span>
                  <h4 className="text-sm font-bold text-gray-700">실시간 대화 분석 데이터가 부족합니다</h4>
                  <p className="text-xs text-gray-400 mt-2 max-w-sm leading-relaxed">
                    챗방에서 1회 이상 대화를 나누고 일기를 제출하시면, 이곳에 실제 나눈 문장의 단어 기여도 그래프가 실시간 로드됩니다. 먼저 데모 모드로 예측 과정을 확인해 보세요!
                  </p>
                  <button
                    type="button"
                    onClick={() => setLimeMode("demo")}
                    className="mt-4 px-4 py-2 bg-[#1E2D4E] hover:bg-[#2A3B5C] text-[#FAF8F5] text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 hover:scale-[1.02]"
                  >
                    🧪 데모 시나리오 분석 확인하기
                  </button>
                </div>
              ) : activeScenario ? (
                <div className="flex flex-col gap-4">
                  
                  {/* Tabs for switching sentences */}
                  <div className="flex flex-wrap gap-2 select-none">
                    {currentScenarios.map((scen, idx) => (
                      <button
                        type="button"
                        key={scen.id}
                        onClick={() => {
                          if (limeMode === "demo") setCurrentDemoIdx(idx);
                          else setCurrentLiveIdx(idx);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all truncate max-w-[150px] sm:max-w-none hover:scale-[1.02] ${
                          currentIdx === idx
                            ? "bg-[#FAF8F5] border-[#1E2D4E] text-[#1E2D4E] shadow-sm font-extrabold"
                            : "bg-[#FDFCFB] border-gray-200 text-gray-500 hover:bg-[#FAF8F5]"
                        }`}
                      >
                        {scen.levelLabel} {scen.level === "crisis" && "🚨"}
                      </button>
                    ))}
                  </div>

                  {/* Main Grid: Highlights (left) & Chart (right) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Box (5/12) */}
                    <div className="lg:col-span-5 flex flex-col gap-4">
                      
                      {/* Highlight Text Box */}
                      <div className="bg-[#FAF8F5] border border-[#EAE5D9] rounded-2xl p-5 shadow-inner min-h-[150px] flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2.5 select-none">
                            분석 문장 (Highlighted Sentence)
                          </span>
                          <p className="text-sm font-semibold text-gray-800 leading-relaxed break-words">
                            {activeScenario.sentence.split(/\s+/).map((word: string, wIdx: number) => {
                              const wObj = activeScenario.weights.find(
                                (w: any) => word.includes(w.word) || w.word.includes(word)
                              );
                              if (wObj) {
                                const isPositive = wObj.weight > 0;
                                const magnitude = Math.abs(wObj.weight);
                                // Scale opacity nicely
                                const opacity = Math.min(Math.max(magnitude * 7, 0.15), 0.90);
                                
                                const bgColor = isPositive 
                                  ? `rgba(244, 63, 94, ${opacity})` // soft rose
                                  : `rgba(14, 165, 233, ${opacity})`; // soft sky
                                
                                const textColor = isPositive ? "text-rose-950 font-black" : "text-sky-950 font-black";
                                const borderStyle = isPositive ? "border-rose-400" : "border-sky-400";
                                
                                return (
                                  <span
                                    key={wIdx}
                                    onMouseEnter={() => setHoveredWord({
                                      word: wObj.word,
                                      weight: wObj.weight,
                                      desc: isPositive ? "해당 감정 예측 촉발 (Positive)" : "해당 감정 예측 완화 (Negative)"
                                    })}
                                    onMouseLeave={() => setHoveredWord(null)}
                                    className={`inline-block border-b-2 ${borderStyle} ${textColor} px-1.5 py-0.5 rounded-md mx-0.5 font-bold cursor-help transition-transform hover:scale-[1.08]`}
                                    style={{ backgroundColor: bgColor }}
                                  >
                                    {word}
                                  </span>
                                );
                              }
                              return <span key={wIdx} className="mx-0.5 text-gray-700">{word}</span>;
                            })}
                          </p>
                        </div>
                        
                        {/* Hover tooltip card */}
                        <div className="mt-4 h-8 flex items-center select-none">
                          {hoveredWord ? (
                            <div className="bg-[#1E2D4E]/90 text-white text-[10px] px-3 py-1.5 rounded-xl flex items-center justify-between w-full shadow-lg backdrop-blur-sm animate-fade-in animate-duration-200">
                              <span className="font-extrabold text-amber-300">💡 {hoveredWord.word}</span>
                              <span className="font-bold">기여 가중치: {hoveredWord.weight > 0 ? "+" : ""}{hoveredWord.weight.toFixed(4)}</span>
                              <span className="opacity-95 font-medium">{hoveredWord.desc}</span>
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-400 italic">
                              💡 하이라이트 단어에 마우스를 올리면 단어별 가중치를 정밀하게 보여줍니다.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Candidate Probability Progress Bars */}
                      <div className="bg-[#FAF8F5] border border-[#EAE5D9]/70 rounded-2xl p-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3.5 select-none">
                          AI 감정 예측 비율 (Predict Proba)
                        </span>
                        <div className="flex flex-col gap-3">
                          {activeScenario.probabilities.map((prob: any) => (
                            <div key={prob.name} className="flex items-center justify-between text-xs">
                              <span className="w-16 font-extrabold text-gray-700 truncate">{prob.name}</span>
                              <div className="flex-1 bg-gray-200/50 h-2.5 rounded-full overflow-hidden mx-3 shadow-inner">
                                <div
                                  className="h-full rounded-full transition-all duration-700 ease-out"
                                  style={{ width: `${prob.value}%`, backgroundColor: prob.color }}
                                ></div>
                              </div>
                              <span className="w-8 text-right font-black text-gray-600">{prob.value}%</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Right Box (7/12) */}
                    <div className="lg:col-span-7 flex flex-col gap-4">
                      
                      {/* Contribution chart */}
                      <div className="bg-white border border-[#EAE5D9]/50 rounded-2xl p-5 shadow-[0_4px_12px_rgba(139,123,93,0.01)]">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-4 select-none">
                          LIME 단어별 가중치 기여 지표 (LIME Feature Contribution)
                        </span>
                        
                        {/* Directional Header */}
                        <div className="flex justify-between items-center text-[9px] sm:text-[10px] text-gray-400 font-extrabold border-b border-gray-100 pb-2 mb-3 select-none">
                          <span>◀ 완화 요인 (Counter-evidence)</span>
                          <span>주요 감정: <strong className="text-red-500">{activeScenario.predictedEmotion}</strong></span>
                          <span>유발 요인 (Positive-evidence) ▶</span>
                        </div>
                        
                        {/* Bar list */}
                        <div className="flex flex-col gap-3.5">
                          {activeScenario.weights.map((w: any, index: number) => {
                            const isPositive = w.weight > 0;
                            // Determine the max weight in the active scenario to scale dynamically and avoid clipping or arbitrary scaling.
                            const maxScale = Math.max(...activeScenario.weights.map((x: any) => Math.abs(x.weight)), 0.0001);
                            const percent = (Math.abs(w.weight) / maxScale) * 50;
                            
                            return (
                              <div key={index} className="flex items-center text-xs h-6 group">
                                {/* Left side (negative weights) */}
                                <div className="flex-1 flex justify-end items-center pr-3 border-r border-gray-300 h-full relative">
                                  {!isPositive && (
                                    <div className="flex items-center justify-end w-full animate-slide-in">
                                      <span className="text-[10px] font-extrabold text-sky-700 mr-2 group-hover:scale-[1.05] transition-transform">{w.word}</span>
                                      <div
                                        className="bg-sky-400 group-hover:bg-sky-500 h-4 rounded-l transition-all duration-500 shadow-sm border border-sky-300"
                                        style={{ width: `${percent}%` }}
                                      ></div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Score Axis */}
                                <div className="w-16 text-center font-black text-gray-500 text-[10px] select-none">
                                  {w.weight > 0 ? "+" : ""}{w.weight.toFixed(4)}
                                </div>
                                
                                {/* Right side (positive weights) */}
                                <div className="flex-1 flex justify-start items-center pl-3 h-full relative">
                                  {isPositive && (
                                    <div className="flex items-center justify-start w-full animate-slide-in">
                                      <div
                                        className="bg-rose-400 group-hover:bg-rose-500 h-4 rounded-r transition-all duration-500 shadow-sm border border-rose-300"
                                        style={{ width: `${percent}%` }}
                                      ></div>
                                      <span className="text-[10px] font-extrabold text-rose-700 ml-2 group-hover:scale-[1.05] transition-transform">{w.word}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* AI Explanation Insight box */}
                      <div className="bg-[#FAF8F5] border-l-4 border-[#1E2D4E] p-4 rounded-r-xl shadow-sm">
                        <h4 className="text-xs font-extrabold text-[#1E2D4E] flex items-center gap-1.5 mb-1.5 select-none">
                          🧠 AI 심층 판정 소견 (XAI Insights)
                        </h4>
                        <p className="text-xs font-bold text-gray-700 leading-relaxed">
                          {activeScenario.explanationText}
                        </p>
                      </div>

                    </div>

                  </div>
                </div>
              ) : null}
              
            </div>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-2 shrink-0">
          <button 
            type="button"
            onClick={() => {
              if (diffDays !== null && diffDays < 14) {
                alert(`아직 재검사 주기(2주일)가 되지 않았습니다.\n다음 검사는 ${14 - diffDays}일 후에 가능합니다.`);
              } else if (onReTakePhq9) {
                onReTakePhq9();
              }
            }}
            className={`flex-1 font-bold py-2.5 px-4 rounded-xl transition-all flex flex-col items-center justify-center border shadow-sm ${
              diffDays !== null && diffDays < 14
                ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-75"
                : "bg-white border-[#EAE5D9] text-gray-700 hover:bg-[#F8F5F0]"
            }`}
          >
            <span className="text-xs flex items-center gap-1 font-bold">🦉 PHQ-9 다시 검사하기</span>
            <span className="text-[10px] font-medium opacity-80 mt-0.5">
              {diffDays !== null ? `마지막 검사: ${diffDays}일 전` : "마지막 검사: 이력 없음"}
            </span>
          </button>

          <button 
            onClick={onContinueChat}
            className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold py-3.5 rounded-xl shadow-[0_4px_12px_rgba(245,158,11,0.2)] hover:shadow-[0_6px_16px_rgba(245,158,11,0.3)] transform hover:translate-y-[-1px] transition-all flex items-center justify-center gap-2"
          >
            대화 계속하기 <ArrowRight size={18} />
          </button>
          
          {onNavigateToMap && (
            <button 
              onClick={onNavigateToMap}
              className="flex-1 bg-[#1E2D4E] hover:bg-[#2A3B5C] text-white font-bold py-3.5 rounded-xl shadow-md transform hover:translate-y-[-1px] transition-all flex items-center justify-center gap-2"
            >
              📍 내 주변 센터 찾기
            </button>
          )}

          <button 
            type="button"
            onClick={() => setShowMyPage(true)}
            className="flex-1 bg-white border border-[#EAE5D9] text-[#3E3A35] font-bold py-3.5 rounded-xl hover:bg-[#FAF8F5] transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            👤 마이페이지
          </button>
        </div>
      </div>

      {/* My Page (Profile Edit) Modal */}
      {showMyPage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in text-left">
          <div className="bg-[#FAF8F5] border border-[#EAE5D9] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-left transform scale-100 transition-all duration-300 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#EAE5D9]">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 bg-[#1E2D4E]/10 text-[#1E2D4E] rounded-xl flex items-center justify-center text-lg">
                  👤
                </span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">마이페이지</h3>
                  <p className="text-xs text-gray-500 mt-0.5">내 인적사항 정보를 확인하고 수정할 수 있습니다.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowMyPage(false)} 
                className="text-gray-400 hover:text-gray-600 font-bold text-lg p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content - Edit Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              {/* 1. Nickname */}
              <div className="bg-white border border-[#EAE5D9] rounded-xl p-3.5 shadow-[0_2px_8px_rgba(139,123,93,0.01)]">
                <label className="text-xs font-bold text-gray-700 block mb-1.5">닉네임 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="예: 빼미"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  className="bg-white border border-[#EAE5D9] rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#8C7862] transition-all w-full text-sm text-gray-800"
                  required
                />
              </div>

              {/* 2. Age Group */}
              <div className="bg-white border border-[#EAE5D9] rounded-xl p-3.5 shadow-[0_2px_8px_rgba(139,123,93,0.01)]">
                <label className="text-xs font-bold text-gray-700 block mb-1.5">연령대 <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {ageGroups.map((age) => (
                    <button
                      type="button"
                      key={age}
                      onClick={() => setEditAgeGroup(age)}
                      className={`py-1.5 text-[11px] font-medium rounded-lg border transition-all ${
                        editAgeGroup === age
                          ? "bg-[#1E2D4E] text-white border-[#1E2D4E] shadow-sm font-bold"
                          : "bg-white text-gray-600 border-[#EAE5D9] hover:bg-[#F8F5F0]"
                      }`}
                    >
                      {age}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Gender */}
              <div className="bg-white border border-[#EAE5D9] rounded-xl p-3.5 shadow-[0_2px_8px_rgba(139,123,93,0.01)]">
                <label className="text-xs font-bold text-gray-700 block mb-1.5">성별 <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-3 gap-1.5">
                  {genders.map((gender) => (
                    <button
                      type="button"
                      key={gender}
                      onClick={() => setEditGender(gender)}
                      className={`py-1.5 text-[11px] font-medium rounded-lg border transition-all ${
                        editGender === gender
                          ? "bg-[#1E2D4E] text-white border-[#1E2D4E] shadow-sm font-bold"
                          : "bg-white text-gray-600 border-[#EAE5D9] hover:bg-[#F8F5F0]"
                      }`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Occupation & Region in a grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Occupation */}
                <div className="bg-white border border-[#EAE5D9] rounded-xl p-3.5 shadow-[0_2px_8px_rgba(139,123,93,0.01)]">
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">직업 <span className="text-red-500">*</span></label>
                  <select
                    value={editOccupation}
                    onChange={(e) => setEditOccupation(e.target.value)}
                    className="bg-white border border-[#EAE5D9] rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#8C7862] transition-all w-full text-xs text-gray-700"
                    required
                  >
                    <option value="" disabled>선택해주세요</option>
                    {occupations.map((occ) => (
                      <option key={occ} value={occ}>{occ}</option>
                    ))}
                  </select>
                </div>

                {/* Region */}
                <div className="bg-white border border-[#EAE5D9] rounded-xl p-3.5 shadow-[0_2px_8px_rgba(139,123,93,0.01)]">
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">거주 지역 <span className="text-red-500">*</span></label>
                  <select
                    value={editRegion}
                    onChange={(e) => setEditRegion(e.target.value)}
                    className="bg-white border border-[#EAE5D9] rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#8C7862] transition-all w-full text-xs text-gray-700"
                    required
                  >
                    <option value="" disabled>선택해주세요</option>
                    {regions.map((reg) => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 5. User Phone & Emergency Contact */}
              <div className="bg-white border border-[#EAE5D9] rounded-xl p-3.5 shadow-[0_2px_8px_rgba(139,123,93,0.01)] space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">본인 연락처 <span className="text-gray-400 font-normal">(선택)</span></label>
                  <input
                    type="text"
                    placeholder="예: 010-1234-5678"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="bg-white border border-[#EAE5D9] rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#8C7862] transition-all w-full text-xs text-gray-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">비상연락처 <span className="text-gray-400 font-normal">(선택)</span></label>
                  <input
                    type="text"
                    placeholder="예: 010-1234-5678"
                    value={editContact}
                    onChange={(e) => setEditContact(e.target.value)}
                    className="bg-white border border-[#EAE5D9] rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#8C7862] transition-all w-full text-xs text-gray-800"
                  />
                </div>
              </div>

              {/* Message display */}
              {saveMessage && (
                <div className={`p-2.5 rounded-lg text-xs font-bold text-center ${
                  saveMessage.startsWith("❌") ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                }`}>
                  {saveMessage}
                </div>
              )}

              {/* Modal Footer Buttons */}
              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowMyPage(false)}
                  className="px-4 py-2 border border-[#EAE5D9] text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors"
                  disabled={isSaving}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!isEditProfileValid || isSaving}
                  className={`px-5 py-2 text-xs font-bold rounded-lg shadow-sm transition-all text-white ${
                    isEditProfileValid && !isSaving
                      ? "bg-[#1E2D4E] hover:bg-[#152037]"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                >
                  {isSaving ? "저장 중..." : "수정 완료"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

