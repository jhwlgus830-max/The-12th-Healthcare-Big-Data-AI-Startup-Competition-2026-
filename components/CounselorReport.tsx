"use client";

import { useState, useEffect } from "react";
import { 
  User, Phone, FileText, Edit, BarChart2, PieChart, TrendingUp, AlertTriangle, 
  ChevronRight, Download, Plus, MessageSquare, Info, CheckCircle, Activity, X
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
}

export default function CounselorReport({ clientId }: { clientId?: string | null }) {
  const [subStep, setSubStep] = useState<"overview" | "stats" | "detail">("overview");
  const [selectedDistortionType, setSelectedDistortionType] = useState("흑백논리");
  const [reportState, setReportState] = useState<ReportState | null>(null);
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
      const res = await fetch(`http://localhost:8000/api/counselor/client/${clientId}/report`);
      if (res.ok) {
        const data = await res.json();
        setReportState(data);
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
    }
    setSubStep("overview");
  }, [clientId]);

  const handleSaveNote = async () => {
    if (!noteContent.trim() || !clientId) return;
    setSubmittingNote(true);
    try {
      const res = await fetch("http://localhost:8000/api/counselor/notes", {
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
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
client.risk === 'High' ? 'bg-red-100 text-red-600 border border-red-200 animate-pulse' : 'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                    {client.risk === 'High' ? '고위험' : '저위험'}
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
