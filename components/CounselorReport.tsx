"use client";

import { useState, useEffect } from "react";
import { 
  User, Phone, FileText, Edit, BarChart2, PieChart, TrendingUp, AlertTriangle, 
  ChevronRight, Download, Plus, MessageSquare, Info, CheckCircle, Activity, X,
  ShieldAlert, Lock, Clock
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend
} from "recharts";
import { reportData, clients } from "@/lib/mockData";

const COLORS = ["#1E2D4E", "#8B7BAD", "#5B9E7A", "#C4956B", "#C07070", "#EAE5D9"];

interface ReportState {
  client: {
    id: string;
    name: string;
    email: string;
    gender: string;
    age: string;
    occupation: string;
    region: string;
    contact: string;
    registeredAt: string;
    lastActiveAt: string;
  } | null;
  surveyHistory: Array<{ id: string; takenAt: string; phq9: number; p4: number }>;
  riskLogs: Array<{ id: string; detectedAt: string; originalText: string; expressionType: string; severity: string; sessionId: string }>;
  emotionData: {
    dominantEmotions: string[];
    radarData: Array<{ name: string; value: number }>;
  } | null;
  cognitiveDistortions: Record<string, {
    count: number;
    frequency: string;
    sessionObservedCount: number;
    totalSessions: number;
    exampleSentences: string[];
    relatedContext: string[];
    empatheticPrompt: string;
  }> | null;
  journals: Array<{ id: string; content: string; createdAt: string }>;
  counselorNotes: Array<{ id: string; conductedAt: string; detail: string; interventionType: string; status: string }>;
  safetyPlan?: {
    user_id: string;
    current_step: number;
    step1_warning_signs: string;
    step2_coping_strategies: string;
    step3_social_distraction: string;
    step4_social_support: string;
    step5_professional_agencies: string;
    step6_safe_environment: string;
  } | null;
}

export default function CounselorReport({ clientId }: { clientId?: string | null }) {
  const [subStep, setSubStep] = useState<"overview" | "stats" | "detail" | "conceptualization">("overview");
  const [conceptualizationTab, setConceptualizationTab] = useState<"CBT" | "DBT">("CBT");
  const [selectedDistortionType, setSelectedDistortionType] = useState("흑백논리");
  const [reportState, setReportState] = useState<ReportState | null>(null);
  const [safetyPlan, setSafetyPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Note Modal state
  const [isOpenNoteModal, setIsOpenNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  const isRealUser = !!(
    clientId && 
    !clientId.startsWith("C0") && 
    clientId !== "user-001" && 
    clientId !== "user-002" && 
    clientId !== "user-003" && 
    clientId !== "user-004"
  );

  async function fetchReportData() {
    if (!isRealUser || !clientId) return;
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiBase}/api/counselor/client/${clientId}/report`);
      if (res.ok) {
        const data = await res.json();
        setReportState(data);
      }
      
      // 6단계 안전계획 실시간 패칭
      const planRes = await fetch(`${apiBase}/api/counselor/client/${clientId}/safety_plan`);
      if (planRes.ok) {
        const planData = await planRes.json();
        if (planData.status === "success") {
          setSafetyPlan(planData.data);
        }
      }
    } catch (err) {
      console.error("실시간 리포트 상세조회 실패:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isRealUser) {
      fetchReportData();
    } else {
      setReportState(null);
      // user-003(최서연) 예시인 경우, 더미 safetyPlan을 셋팅해 줍니다.
      if (clientId === "user-003") {
        setSafetyPlan({
          user_id: "user-003",
          current_step: 5,
          step1_warning_signs: "밤마다 가슴이 답답하고 눈물이 나며 극심한 고립감이 밀려옴. '다 끝내고 싶다'는 생각이 꼬리를 물 때.",
          step2_coping_strategies: "잔잔한 어쿠스틱 음악 틀기, 침대에서 내려와 발가락 꼼지락하며 바닥 접지하기, 따뜻한 차 한 모금 마시기",
          step3_social_distraction: "집 근처 경의선 숲길을 10분 동안 산책하기, 단골 북카페에 가서 책 냄새 맡으며 앉아있기",
          step4_social_support: "대학 동창 단짝 이소희 (010-3333-4444) - 내 우울과 아픔을 편견 없이 들어주는 소중한 친구",
          step5_professional_agencies: "마포구 정신건강복지센터 (02-716-0600), 자살예방 상담전화 109 (대화 진행 중)",
          step6_safe_environment: "방 안의 커터칼과 보관 중인 다량의 약봉지를 어머니께 전부 전달해 내 시야와 접근성에서 격리하기"
        });
      } else {
        setSafetyPlan(null);
      }
    }
    setSubStep("overview");
  }, [clientId]);

  const handleSaveNote = async () => {
    if (!noteContent.trim() || !clientId) return;
    setSubmittingNote(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiBase}/api/counselor/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: clientId,
          counselor_id: "counselor-001",
          content: noteContent
        })
      });
      if (res.ok) {
        setNoteContent("");
        setIsOpenNoteModal(false);
        // Refresh report data to reflect the new note immediately
        await fetchReportData();
      }
    } catch (err) {
      console.error("노트 저장 실패:", err);
    } finally {
      setSubmittingNote(false);
    }
  };

  // Resolve client info: fallback to mock data if not real user
  const client = isRealUser && reportState?.client
    ? {
        id: reportState.client.id,
        name: reportState.client.name,
        gender: reportState.client.gender === "남" ? "남" : "여",
        age: reportState.client.age,
        risk: reportState.surveyHistory.some(s => s.phq9 >= 20 || s.p4 >= 1) ? "High" : "Low",
        phq9: reportState.surveyHistory.length > 0 ? reportState.surveyHistory[reportState.surveyHistory.length - 1].phq9 : 0,
        p4: reportState.surveyHistory.length > 0 ? reportState.surveyHistory[reportState.surveyHistory.length - 1].p4 : 0,
        summary: reportState.journals.length > 0 
          ? `최신 일기: "${reportState.journals[0].content.slice(0, 35)}..."` 
          : "자가 진단 및 챗봇 대화 진행 완료",
        updated: reportState.client.lastActiveAt
      }
    : (clients.find(c => c.id === clientId) || clients.find(c => c.id === "C005") || clients[0]);

  // 1. Line Chart Data Mapping
  const trendData: Array<{ name: string; 우울: number; 절망?: number; 무기력?: number; 자살사고?: number }> = isRealUser && reportState
    ? reportState.surveyHistory.map(s => ({
        name: s.takenAt.split(" ")[0].slice(5), // MM.DD
        "우울": s.phq9,
        "자살사고": s.p4 * 6 // scale for visualization
      }))
    : reportData.trendData;

  // 2. Risk Logs Mapping
  const mappedRiskLogs = isRealUser && reportState
    ? reportState.riskLogs.map(log => ({
        date: log.detectedAt.split(" ")[0].slice(5) + " " + log.detectedAt.split(" ")[1],
        source: log.expressionType === "직접" ? "직접 검출" : "간접 검출",
        content: log.originalText,
        severity: log.severity
      }))
    : reportData.riskLogs;

  // 3. Emotion Distribution Mapping
  const emotionData = isRealUser && reportState?.emotionData
    ? reportState.emotionData.radarData.map(r => ({
        name: r.name,
        value: r.value
      }))
    : reportData.emotionData;

  // 4. Distortion Stats Table Mapping
  const distortionStats = isRealUser && reportState?.cognitiveDistortions
    ? Object.entries(reportState.cognitiveDistortions).map(([type, d]) => {
        let level = "낮음";
        let color = "bg-green-500";
        let percent = 10;
        if (d.frequency === "매우 흔함") {
          level = "높음";
          color = "bg-red-500";
          percent = 85;
        } else if (d.frequency === "흔함") {
          level = "중간";
          color = "bg-blue-500";
          percent = 50;
        }
        
        let feature = "";
        if (type === "흑백논리") feature = "완벽하지 않으면 실패라고 보는 이분법적 사고";
        else if (type === "과잉일반화") feature = "단일 사건을 보편적인 법칙으로 성급하게 일반화";
        else if (type === "당위진술") feature = "~해야만 한다는 엄격한 내면의 의무 규칙";
        else if (type === "개인화") feature = "자신과 상관없는 부정적 사건을 내 탓으로 여김";
        else if (type === "미래예언") feature = "근거 없이 최악의 결과가 일어날 것이라 예언";
        else if (type === "낙인찍기") feature = "실수나 단점을 근거로 자신에게 부정적 낙인을 찍음";
        else feature = "상황에 대한 역기능적 부정적 사고 왜곡";
        
        return {
          type,
          feature,
          level,
          percent,
          count: d.count,
          color
        };
      })
    : reportData.distortionStats;

  // 5. Selected Distortion Detail Mapping
  const activeDistortion = isRealUser && reportState?.cognitiveDistortions && reportState.cognitiveDistortions[selectedDistortionType]
    ? reportState.cognitiveDistortions[selectedDistortionType]
    : null;

  const detectedPhrases = activeDistortion
    ? activeDistortion.exampleSentences
    : reportData.detectedPhrases;

  const empatheticPrompt = activeDistortion
    ? activeDistortion.empatheticPrompt
    : `"${client.name}님, 완벽하게 해내지 못했다는 생각 때문에 속상하시군요. 하지만 100점이 아니라고 해서 0점인 것은 아니에요. 오늘 ${client.name}님이 노력한 부분들은 분명히 가치가 있어요."`;

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Sub Navigation */}
      <div className="flex gap-2 bg-[#FAF8F5] p-1.5 rounded-xl shadow-sm border border-[#EAE5D9] w-fit">
        <button 
          onClick={() => setSubStep("overview")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${subStep === "overview" ? "bg-[#1E2D4E] text-[#FAF8F5] shadow-md" : "text-[#8C7862] hover:bg-[#FAF8F5]"}`}
        >
          리포트 개요
        </button>
        <button 
          onClick={() => setSubStep("stats")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${subStep === "stats" ? "bg-[#1E2D4E] text-[#FAF8F5] shadow-md" : "text-[#8C7862] hover:bg-[#FAF8F5]"}`}
        >
          인지 왜곡 통계
        </button>
        <button 
          onClick={() => setSubStep("detail")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${subStep === "detail" ? "bg-[#1E2D4E] text-[#FAF8F5] shadow-md" : "text-[#8C7862] hover:bg-[#FAF8F5]"}`}
        >
          인지 왜곡 상세
        </button>
        <button 
          onClick={() => setSubStep("conceptualization")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${subStep === "conceptualization" ? "bg-[#1E2D4E] text-[#FAF8F5] shadow-md" : "text-[#8C7862] hover:bg-[#FAF8F5]"}`}
        >
          사례개념화
        </button>
      </div>

      {/* --- View 1: Overview --- */}
      {subStep === "overview" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
          {/* Header & Profile */}
          <div className="bg-[#FAF8F5] p-6 rounded-2xl shadow-[0_4px_20px_rgba(139,123,93,0.03)] border border-[#EAE5D9] flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#F5EFE6] rounded-full flex items-center justify-center text-[#1E2D4E] border border-[#EAE5D9]">
                <User size={32} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                    client.risk === 'Crisis' ? 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse' :
                    client.risk === 'High' ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' :
                    client.risk === 'Medium' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    {client.risk === 'Crisis' ? '🚨 극단위기' : client.risk === 'High' ? '고위험' : client.risk === 'Medium' ? '중위험' : '저위험'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{client.age} · {client.gender === '남' ? '남성' : '여성'} · 배정일: 2026.05.10</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-[#F59E0B] text-white rounded-xl text-sm font-bold hover:bg-[#D97706] transition-colors shadow-sm">
                <Phone size={16} /> 비상 연락처
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#EAE5D9] text-[#8C7862] rounded-xl text-sm font-bold hover:bg-[#FAF8F5] transition-colors shadow-sm">
                <FileText size={16} /> 개입 가이드 보기
              </button>
              <button 
                onClick={() => {
                  if (!isRealUser) {
                    alert("실제 연동된 내담자의 리포트에서만 상담 기록을 백엔드에 영구 보존할 수 있습니다. (데모 기록 모달을 엽니다)");
                  }
                  setIsOpenNoteModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1E2D4E] text-[#FAF8F5] rounded-xl text-sm font-bold hover:bg-[#1E2D4E]/90 transition-colors shadow-sm"
              >
                <Edit size={16} /> 상담 기록하기
              </button>
            </div>
          </div>

          {client.risk === "Low" ? (
            /* --- 경도 우울 내담자 전용 활동 요약 리포트 --- */
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: 웰니스 활동 요약 카드 */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  {/* 검사 요약 & 감정 일기 작성 상태 */}
                  <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)] flex flex-col gap-5">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b border-[#EAE5D9]/60 pb-3">
                      <CheckCircle size={18} className="text-[#5B9E7A]" /> 웰니스 활동 요약
                    </h3>
                    
                    <div className="space-y-4">
                      {/* PHQ-9 */}
                      <div className="p-4 bg-green-50/60 rounded-xl border border-green-100 flex justify-between items-center">
                        <div>
                          <p className="text-xs text-green-700 font-bold mb-0.5">PHQ-9 (우울 자가진단)</p>
                          <p className="text-lg font-bold text-gray-900">{client.phq9} / 27</p>
                        </div>
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                          경미한 상태
                        </span>
                      </div>

                      {/* 감정 일기 작성 상태 */}
                      {(() => {
                        const hasJournal = isRealUser 
                          ? (reportState?.journals && reportState.journals.length > 0)
                          : (client.id === "user-005");
                        return (
                          <div className="p-4 bg-[#F5EFE6]/40 rounded-xl border border-[#EAE5D9]/60 flex justify-between items-center">
                            <div>
                              <p className="text-xs text-[#8C7862] font-bold mb-0.5">데일리 감정 일기 작성</p>
                               <p className="text-sm font-semibold text-gray-700">우울빼미 챗봇 연동 기록</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasJournal ? (
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                              ) : null}
                              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                                hasJournal 
                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                  : 'bg-gray-50 text-gray-400 border-gray-200'
                              }`}>
                                {hasJournal ? '예 (완료)' : '아니오 (미완료)'}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* 회기 전/후 정서 변화 게이지 */}
                  <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)]">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 pb-3 border-b border-[#EAE5D9]/60">
                      <Activity size={18} className="text-[#8B7BAD]" /> 회기 전/후 정서 변화
                    </h3>
                    <div className="space-y-5">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-gray-500 mb-1.5">
                          <span>회기 전 우울/불안 정서</span>
                          <span className="text-red-500 font-bold">68%</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#C07070]" style={{ width: '68%' }}></div>
                        </div>
                      </div>
                      <div className="flex justify-center items-center py-1">
                        <span className="text-xs bg-[#FAF8F5] border border-[#EAE5D9] px-2.5 py-0.5 rounded-full font-bold text-[#8C7862]">
                          우울 수치 46%p 대폭 하강 📉
                        </span>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-bold text-gray-500 mb-1.5">
                          <span>회기 후 우울/불안 정서</span>
                          <span className="text-green-600 font-bold">22%</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#5B9E7A]" style={{ width: '22%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: 1~6회기 우울 지표 감소 추세 Line Chart */}
                <div className="lg:col-span-7 bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)] flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <TrendingUp size={18} className="text-[#1E2D4E]" /> 감정 변화 추세 (1~6회기 경과)
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">우울빼미 챗봇 연동 및 상담 세션 통합 우울 추세 지표</p>
                  </div>
                  <div className="h-64 bg-white p-4 rounded-xl border border-[#EAE5D9]/40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { name: "1회기", 우울: 65 },
                        { name: "2회기", 우울: 48 },
                        { name: "3회기", 우울: 32 },
                        { name: "4회기", 우울: 25 },
                        { name: "5회기", 우울: 18 },
                        { name: "6회기", 우울: 12 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#999" }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#999" }} domain={[0, 80]} />
                        <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                        <Line type="monotone" dataKey="우울" stroke="#5B9E7A" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 p-3 bg-green-50/50 border border-green-100 rounded-xl text-xs text-green-800 leading-relaxed font-medium">
                    ✨ <strong>상담 임상 소견:</strong> 인지왜곡 교정과 웰니스 일기 기록이 아주 성공적으로 자리 잡았습니다. 6회기에 걸쳐 PHQ-9 수준의 우울 지표가 <strong>65에서 12로 급격히 완화</strong>되었으며, 예방 중심의 유지 관리가 가능합니다.
                  </div>
                </div>
              </div>

              {/* Bottom Row: Emotion Distribution & Notes */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Emotion Distribution */}
                <div className="lg:col-span-5 bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)]">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <PieChart size={18} className="text-[#1E2D4E]" /> 감정 분포 (실시간 대화 분석)
                  </h3>
                  <div className="flex items-center bg-white p-4 rounded-xl border border-[#EAE5D9]/40">
                    <div className="w-1/2 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={emotionData}
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {emotionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 pl-4">
                      <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">가장 많이 감지된 감정</p>
                      <ul className="space-y-2">
                        {emotionData.slice(0, 3).map((item, i) => (
                          <li key={i} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: COLORS[i % COLORS.length] }}></span> {item.name}</span>
                            <span className="font-bold text-gray-800">{item.value}%</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Counselor Notes */}
                <div className="lg:col-span-7 bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)] flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-[#EAE5D9]/60 pb-3">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <FileText size={18} className="text-[#6096C8]" /> 상담사 개입 일지 (Counselor Notes)
                    </h3>
                    <button 
                      onClick={() => {
                        if (!isRealUser) {
                          alert("실제 연동된 내담자의 리포트에서만 상담 기록을 백엔드에 영구 보존할 수 있습니다. (데모 기록 모달을 엽니다)");
                        }
                        setIsOpenNoteModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E2D4E] text-white rounded-lg text-xs font-bold hover:bg-[#2D4A7A] transition-colors"
                    >
                      <Plus size={14} /> 일지 추가
                    </button>
                  </div>
                  
                  <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                    {isRealUser && reportState ? (
                      reportState.counselorNotes.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">아직 기록된 개입 일지가 없습니다. 위의 버튼을 눌러 첫 일지를 작성해 보세요. 📝</p>
                      ) : (
                        reportState.counselorNotes.map((note) => (
                          <div key={note.id} className="p-4 bg-white rounded-xl border border-[#EAE5D9] text-sm">
                            <div className="flex justify-between text-xs text-gray-400 font-bold mb-1.5">
                              <span>유형: {note.interventionType} | 진행 상태: {note.status}</span>
                              <span>기록일시: {note.conductedAt}</span>
                            </div>
                            <p className="text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">{note.detail}</p>
                          </div>
                        ))
                      )
                    ) : (
                      /* Mock counselor notes for Low */
                      <div className="p-4 bg-white rounded-xl border border-[#EAE5D9] text-sm">
                        <div className="flex justify-between text-xs text-gray-400 font-bold mb-1.5">
                          <span>유형: 웰니스 라이프 코칭 | 진행 상태: 완료</span>
                          <span>기록일시: 2026.05.18 10:00</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed font-medium">경미한 학업 스트레스로 인한 일시적 울적함 보고. 우울빼미 챗봇을 통한 데일리 멘탈 웰니스 가이드를 성실히 준수함. 감정 일기에 긍정 정서 기록 빈도가 눈에 띄게 상승하고 있어 종결 회기를 논의함.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* --- 기존 고위험/중위험/극단위기군 뷰 --- */
            <div className="flex flex-col gap-6">
              {/* Visualization Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Test Summary */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)]">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <CheckCircle size={18} className="text-[#F59E0B]" /> 검사 요약
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                        <p className="text-xs text-red-600 font-bold mb-1">PHQ-9 (우울 자가진단)</p>
                        <p className="text-lg font-bold text-gray-900">{client.phq9} / 27 <span className="text-sm font-medium text-red-600 ml-2">
                          {client.phq9 >= 20 ? "심한 우울 상태" : client.phq9 >= 15 ? "중등도 우울 상태" : "경미한 상태"}
                        </span></p>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                        <p className="text-xs text-orange-600 font-bold mb-3">P4 Screener (자살 위험)</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">자살 사고</span>
                            <span className={`font-bold ${client.p4 >= 1 ? "text-red-600 animate-pulse" : "text-green-600"}`}>
                              {client.p4 >= 1 ? "Yes" : "No"}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">계획성 (P4 점수)</span>
                            <span className={`font-bold ${client.p4 >= 2 ? "text-red-600" : "text-orange-600"}`}>
                              {client.p4 >= 2 ? "High Risk" : client.p4 >= 1 ? "Partially" : "None"}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">총 스크리너 점수</span>
                            <span className="font-bold text-gray-800">{client.p4} / 4점</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emotion Trend */}
                <div className="lg:col-span-8 bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)]">
                  <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <TrendingUp size={18} className="text-[#1E2D4E]" /> 감정 변화 추세 (누적 진단 이력)
                  </h3>
                  <div className="h-64 bg-white p-4 rounded-xl border border-[#EAE5D9]/40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#999" }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#999" }} />
                        <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                        <Legend iconType="circle" />
                        <Line type="monotone" dataKey="우울" stroke="#C07070" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="자살사고" stroke="#8B7BAD" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Bottom Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Risk Log */}
                <div className="lg:col-span-7 bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)]">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-red-500 animate-pulse" /> 위험 표현 로그 (실시간 감지)
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {mappedRiskLogs.length === 0 ? (
                      <p className="text-sm text-[#8C7862] text-center py-8">감지된 자살/자해 고위험 위험 표현이 없습니다.</p>
                    ) : (
                      mappedRiskLogs.map((log, i) => (
                        <div key={i} className="p-3 bg-[#FFF5F5] rounded-xl flex justify-between items-center border border-red-200/50">
                          <div className="flex-1 mr-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold text-gray-400">{log.date}</span>
                              <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded-md font-bold">{log.source}</span>
                            </div>
                            <p className="text-sm text-gray-800 font-semibold leading-relaxed">"{log.content}"</p>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${log.severity === "높음" ? "bg-red-100 text-red-700 animate-pulse" : "bg-orange-100 text-orange-700"}`}>{log.severity}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Emotion Distribution */}
                <div className="lg:col-span-5 bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)]">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <PieChart size={18} className="text-[#1E2D4E]" /> 감정 분포 (실시간 대화 분석)
                  </h3>
                  <div className="flex items-center bg-white p-4 rounded-xl border border-[#EAE5D9]/40">
                    <div className="w-1/2 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={emotionData}
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {emotionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 pl-4">
                      <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">가장 많이 감지된 감정</p>
                      <ul className="space-y-2">
                        {emotionData.slice(0, 3).map((item, i) => (
                          <li key={i} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: COLORS[i % COLORS.length] }}></span> {item.name}</span>
                            <span className="font-bold text-gray-800">{item.value}%</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Counselor Intervention Notes */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <FileText size={18} className="text-[#6096C8]" /> 상담사 개입 일지 (Counselor Notes)
                  </h3>
                  <button 
                    onClick={() => {
                      if (!isRealUser) {
                        alert("실제 연동된 내담자의 리포트에서만 상담 기록을 백엔드에 영구 보존할 수 있습니다. (데모 기록 모달을 엽니다)");
                      }
                      setIsOpenNoteModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E2D4E] text-white rounded-lg text-xs font-bold hover:bg-[#2D4A7A] transition-colors"
                  >
                    <Plus size={14} /> 일지 추가
                  </button>
                </div>
                
                <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                  {isRealUser && reportState ? (
                    reportState.counselorNotes.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">아직 기록된 개입 일지가 없습니다. 위의 버튼을 눌러 첫 일지를 작성해 보세요. 📝</p>
                    ) : (
                      reportState.counselorNotes.map((note) => (
                        <div key={note.id} className="p-4 bg-[#F7F9FC] rounded-xl border border-gray-100 text-sm">
                          <div className="flex justify-between text-xs text-gray-400 font-bold mb-1.5">
                            <span>유형: {note.interventionType} | 진행 상태: {note.status}</span>
                            <span>기록일시: {note.conductedAt}</span>
                          </div>
                          <p className="text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">{note.detail}</p>
                        </div>
                      ))
                    )
                  ) : (
                    /* Mock counselor notes */
                    <div className="p-4 bg-[#F7F9FC] rounded-xl border border-gray-100 text-sm">
                      <div className="flex justify-between text-xs text-gray-400 font-bold mb-1.5">
                        <span>유형: 대면 심층 상담 | 진행 상태: 완료</span>
                        <span>기록일시: 2026.05.15 14:30</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed font-medium">PHQ-9 점수 23점으로 매우 극심한 상태 확인. 챗봇 대화 중 "수면제" 언급이 나타나 보호자 및 학교 보건실 긴급 연락 취함. 현재 학업 강박 및 부모님 기대에 대한 극심한 스트레스 호소함. 흑백논리적 사고 패턴 교정을 위해 3회기 개입 필요 판단.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- View 2: Stats --- */}
      {subStep === "stats" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
          <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)] flex justify-between items-center flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">인지 왜곡 종합 빈도 분석</h2>
                <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#EAE5D9] text-[#1E2D4E] text-xs font-bold rounded-full">분석 활성</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">내담자: {client.name} ({client.id}) · 분석 기간: 2026.05.10 ~ 현재</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-[#EAE5D9] text-[#8C7862] rounded-xl text-sm font-bold hover:bg-[#FAF8F5] transition-colors">
                <Download size={16} /> PDF 내보내기
              </button>
<button 
                onClick={() => {
                  if (!isRealUser) {
                    alert("실제 연동된 내담자의 리포트에서만 상담 기록을 백엔드에 영구 보존할 수 있습니다. (데모 기록 모달을 엽니다)");
                  }
                  setIsOpenNoteModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#1E2D4E] text-[#FAF8F5] rounded-xl text-sm font-bold hover:bg-[#1E2D4E]/90 transition-colors shadow-sm"
              >
                <Plus size={16} /> 상담 노트 추가
              </button>
            </div>
          </div>

          <div className="bg-[#FAF8F5] rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)] overflow-hidden">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-[#F5EFE6]/40 border-b border-[#EAE5D9]/60">
                  <th className="p-4 text-xs font-bold text-[#8C7862] uppercase">유형</th>
                  <th className="p-4 text-xs font-bold text-[#8C7862] uppercase">핵심 특징</th>
                  <th className="p-4 text-xs font-bold text-[#8C7862] uppercase">빈도 수준</th>
                  <th className="p-4 text-xs font-bold text-[#8C7862] uppercase text-center">빈도 (Count)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5D9]/40">
                {distortionStats.map((item, i) => (
                  <tr 
                    key={i} 
                    className="hover:bg-[#FAF8F5] transition-colors group cursor-pointer" 
                    onClick={() => {
                      setSelectedDistortionType(item.type);
                      setSubStep("detail");
                    }}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{item.type}</span>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-[#1E2D4E] transition-colors" />
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{item.feature}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-[#F5EFE6] rounded-full overflow-hidden min-w-[100px]">
                          <div className={`h-full ${item.color.replace('bg-blue-600', 'bg-[#1E2D4E]').replace('bg-indigo-600', 'bg-[#8B7BAD]').replace('bg-green-600', 'bg-[#5B9E7A]').replace('bg-red-600', 'bg-[#C07070]').replace('bg-yellow-500', 'bg-[#F59E0B]')}`} style={{ width: `${item.percent}%` }}></div>
                        </div>
                        <span className={`text-xs font-bold ${item.level === "높음" ? "text-red-500" : item.level === "중간" ? "text-orange-500" : "text-green-600"}`}>
                          {item.level}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center font-bold text-gray-800">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- View 3: Detail --- */}
      {subStep === "detail" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-[#1E2D4E] font-bold mb-1 cursor-pointer" onClick={() => setSubStep("stats")}>
                <ChevronRight className="rotate-180" size={14} /> 목록으로 돌아가기
              </div>
              <h2 className="text-3xl font-bold text-gray-900">{selectedDistortionType} <span className="text-lg font-normal text-gray-400 ml-2">{client.name} 님의 분석 결과</span></h2>
            </div>
            <div className="flex gap-2">
              <button className="p-2 border border-[#EAE5D9] text-[#8C7862] rounded-xl hover:bg-[#FAF8F5] bg-white transition-colors">
                <Download size={20} />
              </button>
<button 
                onClick={() => {
                  if (!isRealUser) {
                    alert("실제 연동된 내담자의 리포트에서만 상담 기록을 백엔드에 영구 보존할 수 있습니다. (데모 기록 모달을 엽니다)");
                  }
                  setIsOpenNoteModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#1E2D4E] text-[#FAF8F5] rounded-xl text-sm font-bold hover:bg-[#1E2D4E]/90 transition-colors"
              >
                <Plus size={16} /> 노트 추가
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Core Concept */}
            <div className="bg-[#FAF8F5] p-8 rounded-3xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)] flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Info size={20} className="text-[#F59E0B]" /> 핵심 개념
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {selectedDistortionType === "흑백논리" 
                    ? "흑백논리는 이분법적 사고라고도 불리며, 상황이나 대상을 '전부 아니면 전무(All-or-Nothing)'의 관점으로 바라보는 왜곡된 사고 패턴입니다. 완벽하지 않으면 실패라고 단정 짓거나, 중립적인 영역을 인정하지 않는 특징이 있습니다."
                    : selectedDistortionType === "과잉일반화"
                      ? "과잉일반화는 단 한두 번의 특수한 사건이나 부정적인 경험만을 근거로 삼아, 그것이 모든 상황에 항상 적용될 것이라고 성급하게 광범위한 결론을 내리는 왜곡된 사고 성향입니다."
                      : selectedDistortionType === "당위진술"
                        ? "당위진술은 자신 혹은 타인에 대해 '반드시 ~해야만 한다' 혹은 '~해서는 절대로 안 된다'라는 지나치게 완고하고 엄격한 도덕적 의무 규칙을 설정하여, 그것을 강요하고 자책하는 형태의 왜곡입니다."
                        : selectedDistortionType === "개인화"
                          ? "개인화는 실제로는 자신과 전혀 상관이 없거나 자신이 전적으로 책임질 수 없는 주변의 부정적인 외적 사건들을 과도하게 연결지어 '모두 내 잘못이고 내 탓이다'라고 섣부르게 자책하는 사고 방식입니다."
                          : selectedDistortionType === "미래예언"
                            ? "미래예언은 객관적이고 충분한 근거 없이 앞으로 다가올 미래 상황에 대해 오로지 비관적이고 부정적인 예측(예: '난 영영 실패할 거야', '결국 망할 거야')만을 확실한 사실처럼 단정 짓는 왜곡입니다."
                            : selectedDistortionType === "낙인찍기"
                              ? "낙인찍기는 실수를 했을 때 자신의 특정 행동만을 분리하여 반성하는 대신, '나는 실패자다', '나는 구제불능 쓰레기다'와 같이 극단적이고 모욕적인 꼬리표를 자신에게 통째로 덧씌우는 강박적 왜곡입니다."
                              : "이 인지 왜곡 유형은 객관적인 사실보다 상황에 대한 감정적인 상태나 단편적인 요소를 극대화하여 나를 얽매는 자동적이고 역기능적인 인지적 도식입니다."}
                </p>
              </div>
              <div className="mt-8 p-6 bg-green-50 rounded-2xl border border-green-100">
                <p className="text-xs text-green-700 font-bold mb-2 flex items-center gap-1">
                  <MessageSquare size={14} /> 공감 프롬프트 제안
                </p>
                <p className="text-sm text-gray-700 italic">
                  {empatheticPrompt}
                </p>
              </div>
            </div>

            {/* Frequency */}
            <div className="bg-[#FAF8F5] p-8 rounded-3xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)] flex flex-col items-center justify-center text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">빈도 분석</h3>
              <p className="text-4xl font-black text-red-500 mb-2">{activeDistortion ? activeDistortion.frequency : "매우 흔함"}</p>
              <p className="text-gray-500 mb-8">
                {activeDistortion 
                  ? `최근 ${activeDistortion.totalSessions}회 세션 중 ${activeDistortion.sessionObservedCount}회 관찰됨` 
                  : "최근 10회 세션 중 8회 관찰됨"}
              </p>
              
              <div className="w-full max-w-xs">
                <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                  <span>낮음</span>
                  <span>매우 높음</span>
                </div>
                <div className="w-full h-4 bg-[#F5EFE6] rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-red-500 transition-all duration-500" 
                    style={{ 
                      width: activeDistortion 
                        ? `${(activeDistortion.sessionObservedCount / activeDistortion.totalSessions) * 100}%` 
                        : "85%" 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Detected Phrases */}
            <div className="bg-[#FAF8F5] p-8 rounded-3xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)]">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <MessageSquare size={20} className="text-[#1E2D4E]" /> 드러나는 문장 (탐지 로그)
              </h3>
              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {detectedPhrases.length === 0 ? (
                  <p className="text-sm text-[#8C7862] text-center py-8">이번 유형으로 탐지된 내담자 대화 기록이 없습니다.</p>
                ) : (
                  detectedPhrases.map((text, i) => (
                    <div key={i} className="p-4 bg-white rounded-2xl border border-[#EAE5D9] flex gap-3">
                      <span className="text-[#F59E0B] font-bold">"</span>
                      <p className="text-sm text-gray-700 font-medium leading-relaxed">{text}</p>
                      <span className="text-[#F59E0B] font-bold self-end">"</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Related Context */}
            <div className="bg-[#FAF8F5] p-8 rounded-3xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)]">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Activity size={20} className="text-[#1E2D4E]" /> 관련 맥락 및 성향
              </h3>
              <div className="flex flex-wrap gap-3">
                {activeDistortion && activeDistortion.relatedContext ? (
                  activeDistortion.relatedContext.map((chip, i) => (
                    <div key={i} className="px-4 py-2.5 bg-[#F5EFE6] text-[#1E2D4E] rounded-full border border-[#EAE5D9] text-sm font-bold flex items-center gap-2">
                      <span>🧠</span> {chip}
                    </div>
                  ))
                ) : (
                  reportData.relatedContext.map((chip, i) => (
                    <div key={i} className="px-4 py-2.5 bg-[#F5EFE6] text-[#1E2D4E] rounded-full border border-[#EAE5D9] text-sm font-bold flex items-center gap-2">
                      <span>{chip.icon}</span> {chip.label}
                    </div>
                  ))
                )}
              </div>
              <div className="mt-8">
                <h4 className="text-sm font-bold text-[#8C7862] mb-4 uppercase tracking-wider">주요 연관 분석</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {client.name}님의 경우 챗봇 실시간 대화 데이터에서 감지된 인지적 왜곡 빈도를 분석한 결과, **{selectedDistortionType}** 왜곡 패턴이 두드러지게 관찰되고 있습니다. 평소 인지하지 못했던 역기능적 자동사고에 스스로 얽매여 부정적 감정이 심화되는 악순환을 교정하는 3단계 심리 개입 워크시트가 추천됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- View 4: Conceptualization (CBT & DBT) --- */}
      {subStep === "conceptualization" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">사례개념화 리포트 <span className="text-lg font-normal text-gray-400 ml-2">{client.name} 님의 인지행동분석</span></h2>
              <p className="text-sm text-gray-500 mt-1 font-medium">임상적 증상과 정서 왜곡 유발 도식을 체계적으로 구조화한 전문 분석표입니다.</p>
            </div>
            
            {/* CBT / DBT 서브 탭바 */}
            <div className="flex gap-1.5 bg-[#FAF8F5] p-1 rounded-xl shadow-sm border border-[#EAE5D9] w-fit">
              <button 
                onClick={() => setConceptualizationTab("CBT")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${conceptualizationTab === "CBT" ? "bg-[#1E2D4E] text-[#FAF8F5]" : "text-[#8C7862] hover:bg-[#FAF8F5]"}`}
              >
                CBT 사례개념화
              </button>
              <button 
                onClick={() => setConceptualizationTab("DBT")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${conceptualizationTab === "DBT" ? "bg-[#1E2D4E] text-[#FAF8F5]" : "text-[#8C7862] hover:bg-[#FAF8F5]"}`}
              >
                DBT 사례개념화
              </button>
            </div>
          </div>

          {conceptualizationTab === "CBT" ? (
            /* ================= CBT 사례개념화 전용 뷰 ================= */
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* CBT 계층형 4단계 구조보드 */}
              <div className="lg:col-span-3 flex flex-col gap-5">
                {/* 1단계: 핵심 신념 */}
                <div className="bg-[#FAF8F5] p-6 rounded-2xl border-l-[6px] border-l-[#8C7862] border border-[#EAE5D9] shadow-sm">
                  <span className="px-2 py-0.5 bg-[#8C7862] text-white rounded-md text-[10px] font-bold uppercase tracking-wider">1단계: 핵심 신념 (Core Beliefs)</span>
                  <h4 className="text-lg font-black text-gray-900 mt-2">"나는 무가치하고 사랑받을 자격이 없다."</h4>
                  <p className="text-sm text-gray-600 leading-relaxed mt-2.5 font-medium">
                    취업과 대외적 성공이 아니면 나의 내재적 가치는 제로에 수렴한다는 역기능적 내면 도식이 뚜렷합니다. 완벽하지 못한 자신에 대한 극도의 무가치감이 깔려 있습니다.
                  </p>
                </div>

                {/* 2단계: 중간 신념 */}
                <div className="bg-[#FAF8F5] p-6 rounded-2xl border-l-[6px] border-l-[#C4956B] border border-[#EAE5D9] shadow-sm">
                  <span className="px-2 py-0.5 bg-[#C4956B] text-white rounded-md text-[10px] font-bold uppercase tracking-wider">2단계: 중간 신념 (Intermediate Beliefs / 태도·규칙)</span>
                  <h4 className="text-lg font-black text-gray-900 mt-2">"완벽한 스펙을 쌓지 못하면 남들에게 철저한 낙오자로 낙인찍힐 것이다."</h4>
                  <p className="text-sm text-gray-600 leading-relaxed mt-2.5 font-medium">
                    스스로에게 가혹한 당위성 규칙을 부과합니다. "늘 완벽하고 강해야 하며 흐트러짐 없는 모습만을 보여야만 사회에서 생존할 수 있다"는 비합리적 가정 아래 엄청난 불안감을 겪고 있습니다.
                  </p>
                </div>

                {/* 3단계: 자동적 사고 */}
                <div className="bg-[#FAF8F5] p-6 rounded-2xl border-l-[6px] border-l-[#1E2D4E] border border-[#EAE5D9] shadow-sm">
                  <span className="px-2 py-0.5 bg-[#1E2D4E] text-white rounded-md text-[10px] font-bold uppercase tracking-wider">3단계: 상황별 자동사고 (Automatic Thoughts)</span>
                  <h4 className="text-lg font-black text-gray-900 mt-2">"어제 면접에서 답변 하나를 절었으니 이번 채용은 완전히 망했고 모든 기회가 사라졌다."</h4>
                  <p className="text-sm text-gray-600 leading-relaxed mt-2.5 font-medium">
                    작은 실수 하나를 파국화(Catastrophizing)하여 극단적 패배주의로 확장시킵니다. 팩트(단순 질문 보완)보다 감정적 단정(실패자)을 팩트처럼 느끼는 전형적인 인지 오류입니다.
                  </p>
                </div>

                {/* 4단계: 행동적 대안 */}
                <div className="bg-[#FAF8F5] p-6 rounded-2xl border-l-[6px] border-l-green-600 border border-[#EAE5D9] shadow-sm">
                  <span className="px-2 py-0.5 bg-green-600 text-white rounded-md text-[10px] font-bold uppercase tracking-wider">4단계: 행동적 대안 및 개입 방안 (Alternatives)</span>
                  <h4 className="text-lg font-black text-gray-900 mt-2">대안적 인지 정립 및 우울빼미 챗봇 연계 행동 활성화</h4>
                  <ul className="text-sm text-gray-600 leading-relaxed mt-2.5 font-medium list-disc pl-5 space-y-1.5">
                    <li>인지 재구성: "단 하나의 실수가 인생 전체의 실패를 의미하지는 않는다"는 유연한 생각 훈련.</li>
                    <li>행동 활성화: 하루 20분 가벼운 동네 산책 및 햇빛 쬐기, 스마트폰을 끄고 우울빼미 챗봇과의 기분 기록 대화에만 15분 몰입.</li>
                    <li>현실 검증: 면접관이 미소를 짓거나 부드럽게 고개를 끄덕였던 긍정적 단서들을 일지에 강제로 기록하여 편향 극복.</li>
                  </ul>
                </div>
              </div>

              {/* 우측 지우 페르소나의 임상 소견 */}
              <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[#EAE5D9] shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-black text-[#1E2D4E] mb-4 flex items-center gap-1.5 border-b border-[#EAE5D9] pb-2">
                    🧠 Jiwoo 페르소나 임상 소견
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                    지우 페르소나 상담사는 본 내담자의 극단적 인지적 경직성에 집중하고 있습니다. 
                    완벽주의적 도식이 일상 행동을 억제하며 무기력을 초래하는 악순환을 깨기 위해, 
                    비합리적인 신념을 하향 화살표 기법(Downward Arrow)으로 점검하였습니다. 
                    챗봇 로그에서 나타나는 "전부 내 탓이다", "꼭 해냈어야 했다"와 같은 표현은 
                    과도한 개인화와 당위적 신념을 명백히 보여줍니다. 
                    앞으로 6회기 동안 점진적 현실 검증과 활동 이행도를 체크해 나가겠습니다.
                  </p>
                </div>
                <div className="mt-6 p-4 bg-[#1E2D4E] text-[#FAF8F5] rounded-2xl text-xs font-bold flex flex-col gap-1.5">
                  <p>✔ 주 상담사: 지우(Jiwoo) 페르소나</p>
                  <p>✔ 치료 기법: CBT (인지행동치료)</p>
                  <p>✔ 다음 목표: 자동사고 기록지 일일 검토</p>
                </div>
              </div>

            </div>
          ) : (
            /* ================= DBT 사례개념화 전용 뷰 ================= */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* 변증법적 딜레마 카드 */}
              <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[#EAE5D9] shadow-sm">
                <h3 className="text-base font-black text-gray-800 mb-4 flex items-center gap-1.5 border-b border-[#EAE5D9] pb-2">
                  ⚖ 변증법적 딜레마 (Dialectical Dilemmas)
                </h3>
                <div className="space-y-5.5 mt-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-bold text-gray-600">
                      <span>정서적 취약성 대 자가-무효화</span>
                      <span className="text-red-500">85% (매우 높음)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: "85%" }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-normal">극도로 감정에 민감하게 즉각 반응하면서도, 스스로의 감정을 사소화하고 억누르는 모순이 크게 관찰됩니다.</p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-bold text-gray-600">
                      <span>능동적 패시브 대 보기좋은 유능성</span>
                      <span className="text-orange-500">60% (높음)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400 rounded-full" style={{ width: "60%" }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-normal">외관상으로는 완벽하고 아무 문제 없이 유능해 보이나, 위기 시 정서적 이완을 위해 극도로 무력한 태도로 침잠합니다.</p>
                  </div>
                </div>
              </div>

              {/* 고통감내 기술 보드 */}
              <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[#EAE5D9] shadow-sm">
                <h3 className="text-base font-black text-gray-800 mb-4 flex items-center gap-1.5 border-b border-[#EAE5D9] pb-2">
                  🧊 고통감내 TIPP 기법 이행표
                </h3>
                <div className="space-y-3.5 mt-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-green-200">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-bold">T (Temperature)</span>
                      <span className="font-semibold">찬물 세안 및 냉찜질</span>
                    </div>
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-md font-bold text-[10px]">완료 🧊</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-green-200">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-bold">I (Intense Exercise)</span>
                      <span className="font-semibold">버피 테스트 30회</span>
                    </div>
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-md font-bold text-[10px]">완료 🏃</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-green-200">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-bold">P (Paced Breathing)</span>
                      <span className="font-semibold">4-7-8 릴렉스 호흡</span>
                    </div>
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-md font-bold text-[10px]">완료 🧘</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200 text-gray-400">
                    <div className="flex items-center gap-2">
                      <span>P (Paired Relaxation)</span>
                      <span>점진적 전신 이완법</span>
                    </div>
                    <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded-md font-bold text-[10px]">미수행 ⏳</span>
                  </div>
                </div>
              </div>

              {/* 마음챙김 핵심 훈련 카드 */}
              <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[#EAE5D9] shadow-sm">
                <h3 className="text-base font-black text-gray-800 mb-4 flex items-center gap-1.5 border-b border-[#EAE5D9] pb-2">
                  🧘 마음챙김 (Mindfulness) 핵심 훈련
                </h3>
                <div className="space-y-4.5 mt-3">
                  <div className="flex gap-2.5">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-[#1E2D4E] text-[#FAF8F5] text-xs font-bold">1</span>
                    <div>
                      <h4 className="text-xs font-black text-gray-900">관찰하기 (Observe)</h4>
                      <p className="text-[10px] text-gray-500 leading-normal mt-0.5">판단이나 도피 없이 지금 가슴을 짓누르는 불안과 우울이라는 정서적 흐름을 물결 구름처럼 물러서서 응시하기.</p>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-[#1E2D4E] text-[#FAF8F5] text-xs font-bold">2</span>
                    <div>
                      <h4 className="text-xs font-black text-gray-900">설명하기 (Describe)</h4>
                      <p className="text-[10px] text-gray-500 leading-normal mt-0.5">"나는 이제 쓸모없다"는 자동사고 대신 "내 가슴에 지금 불안과 억눌린 자책감이 느껴지고 있는 상태다"로 팩트 분리 묘사하기.</p>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-[#1E2D4E] text-[#FAF8F5] text-xs font-bold">3</span>
                    <div>
                      <h4 className="text-xs font-black text-gray-900">참여하기 (Participate)</h4>
                      <p className="text-[10px] text-gray-500 leading-normal mt-0.5">현재 시점에 온전히 마음을 쏟아 우울빼미 챗봇과의 상담 및 정서 일기 작성 등의 유용한 활동 속으로 자연스럽게 동참하기.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Intervention Note Modal */}
      {isOpenNoteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-gray-100 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                📝 {client.name} 내담자 개입 일지 작성
              </h3>
              <button 
                onClick={() => {
                  setNoteContent("");
                  setIsOpenNoteModal(false);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">상담 내용 및 개입 요약</label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="내담자의 상태 변화, 주요 호소 문제, 이번 회기 개입 지침 등을 입력하세요..."
                rows={6}
                className="w-full p-4 bg-[#F7F9FC] border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6096C8] text-sm text-gray-700 placeholder-gray-400 resize-none"
              />
            </div>
            
            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => {
                  setNoteContent("");
                  setIsOpenNoteModal(false);
                }}
                className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveNote}
                disabled={submittingNote || !noteContent.trim()}
                className={`px-5 py-2 rounded-xl text-sm font-bold text-white shadow-md transition-all ${
                  submittingNote || !noteContent.trim()
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-[#1E2D4E] hover:bg-[#2D4A7A]"
                }`}
              >
                {submittingNote ? "저장 중..." : "개입 일지 저장 💾"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
