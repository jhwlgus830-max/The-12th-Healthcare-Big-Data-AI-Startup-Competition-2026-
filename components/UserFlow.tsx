"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Send, RotateCcw, AlertTriangle, Info } from "lucide-react";
import { userPersonaMessages, checkPersonaSwitchTrigger } from "@/lib/mockData";

interface UserProfile {
  nickname: string;
  ageGroup: string;
  gender: string;
  occupation: string;
  region: string;
  contact: string;
  phone: string;
}

export default function UserFlow({ 
  initialPersona = 1, 
  onEndChat, 
  userId = "user-003", 
  phq9Score = 0, 
  phq9Answers = null, 
  p4Answers = null, 
  onNavigateToMap,
  profile,
  onUpdateProfile 
}: { 
  initialPersona?: 1 | 2 | 3 | 4 | 5, 
  onEndChat?: (sessionId: string | null) => void, 
  userId?: string, 
  phq9Score?: number, 
  phq9Answers?: number[] | null, 
  p4Answers?: string[] | null, 
  onNavigateToMap?: () => void,
  profile?: UserProfile,
  onUpdateProfile?: (updated: UserProfile) => Promise<void>
}) {
  const [currentPersona, setCurrentPersona] = useState<1 | 2 | 3 | 4 | 5>(initialPersona);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(45);
  const [level, setLevel] = useState("🟠 중증");
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Local Profile Sync for Offline Mode
  const [localProfile, setLocalProfile] = useState<UserProfile>(
    profile || {
      nickname: "임시 사용자",
      ageGroup: "30대",
      gender: "남성",
      occupation: "직장인",
      region: "서울",
      contact: "",
      phone: ""
    }
  );

  useEffect(() => {
    if (profile) {
      setLocalProfile(profile);
    }
  }, [profile]);

  // My Page modal states
  const [showMyPage, setShowMyPage] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editAgeGroup, setEditAgeGroup] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editOccupation, setEditOccupation] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const ageGroups = ["10대", "20대", "30대", "40대", "50대", "60대 이상"];
  const genders = ["남성", "여성", "선택 안함"];
  const occupations = ["학생", "직장인", "자영업자", "주부", "무직/구직중", "기타"];
  const regions = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주", "세종"];

  const handleOpenMyPage = () => {
    setEditNickname(localProfile.nickname);
    setEditAgeGroup(localProfile.ageGroup);
    setEditGender(localProfile.gender);
    setEditOccupation(localProfile.occupation);
    setEditRegion(localProfile.region);
    setEditContact(localProfile.contact || "");
    setEditPhone(localProfile.phone || "");
    setSaveMessage("");
    setShowMyPage(true);
  };

  const isEditProfileValid = 
    editNickname.trim() !== "" &&
    editAgeGroup !== "" &&
    editGender !== "" &&
    editOccupation !== "" &&
    editRegion !== "";

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditProfileValid || isSaving) return;

    setIsSaving(true);
    setSaveMessage("");

    const updated: UserProfile = {
      nickname: editNickname.trim(),
      ageGroup: editAgeGroup,
      gender: editGender,
      occupation: editOccupation,
      region: editRegion,
      contact: editContact.trim(),
      phone: editPhone.trim()
    };

    try {
      if (onUpdateProfile) {
        await onUpdateProfile(updated);
      } else {
        setLocalProfile(updated);
      }
      setSaveMessage("✨ 정보가 성공적으로 수정되었습니다! ✓");
      setTimeout(() => {
        setSaveMessage("");
        setShowMyPage(false);
      }, 1500);
    } catch (error) {
      console.error("Profile save error:", error);
      setSaveMessage("❌ 저장 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const scoreHistory = [
    { turn: 1, score: 20 },
    { turn: 2, score: 35 },
    { turn: 3, score: 45 }
  ];

  const [messages, setMessages] = useState(userPersonaMessages[initialPersona]);

  const handlePersonaChange = (p: 1 | 2 | 3 | 4 | 5) => {
    setCurrentPersona(p);
    setMessages(userPersonaMessages[p]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userText = input.trim();
    setInput("");
    setIsLoading(true);
    
    const riskKeywords = ["끝내고 싶", "죽고 싶", "자살", "자해", "수면제", "사라지고", "약 먹고", "죽어버"];
    const isRiskDetected = riskKeywords.some(kw => userText.includes(kw));

    setMessages(prev => [...prev, { role: "user", content: userText }]);

    try {
      const res = await fetch("http://localhost:8000/api/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          content: userText,
          initial_persona: currentPersona,
          phq9_score: phq9Score,
          phq9_answers: phq9Answers,
          p4_answers: p4Answers
        })
      });

      if (!res.ok) {
        throw new Error("서버 응답 오류");
      }

      const data = await res.json();
      
      if (!sessionId) {
        setSessionId(data.session_id);
      }

      const rawScore = data.bot_message.risk_score;
      const percentageScore = Math.round(rawScore * 100);
      setScore(percentageScore);

      if (rawScore >= 0.60) {
        setLevel("🔴 고위험");
      } else if (rawScore >= 0.35) {
        setLevel("🟠 중증");
      } else if (rawScore >= 0.15) {
        setLevel("🟡 경증");
      } else {
        setLevel("🟢 양호");
      }

      const newPersona = data.persona_id as 1 | 2 | 3 | 4 | 5;

      if ((isRiskDetected || newPersona === 3) && currentPersona !== 3) {
        setShowWarningPopup(true);
        setCurrentPersona(3);
        setTimeout(() => {
          setShowWarningPopup(false);
          setMessages(prev => [
            ...prev,
            {
              role: "assistant",
              content: "🚨 [안전 가드레일 작동] 발화 분석 모듈에서 심각한 심리적 위기 신호가 감지되었습니다. 당신의 안전을 위해 어시스턴트 클로 모드로 강제 긴급 전환합니다. 🤍 지금은 혼자 마음을 견디는 것보다 즉시 전문가나 핫라인의 도움을 받는 것이 가장 안전합니다. 아래 통화 버튼을 꼭 눌러 연계하시고, 주변 사람들에게 당신의 상황을 알려주세요. 클로가 당신 곁을 함께 지키겠습니다.",
              icon: "🤍"
            }
          ]);
        }, 3500);
        setIsLoading(false);
        return;
      }

      setCurrentPersona(newPersona);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: data.bot_message.content,
          icon: data.bot_message.icon
        }
      ]);

    } catch (err) {
      console.error("AI API 통신 오류:", err);
      if (isRiskDetected && currentPersona !== 3) {
        setShowWarningPopup(true);
        setCurrentPersona(3);
        setTimeout(() => {
          setShowWarningPopup(false);
          setMessages(prev => [
            ...prev,
            {
              role: "assistant",
              content: "🚨 [안전 가드레일 작동] 발화 분석 모듈에서 심각한 심리적 위기 신호가 감지되었습니다. 당신의 안전을 위해 어시스턴트 클로 모드로 강제 긴급 전환합니다. 🤍 지금은 혼자 마음을 견디는 것보다 즉시 전문가나 핫라인의 도움을 받는 것이 가장 안전합니다. 아래 통화 버튼을 꼭 눌러 연계하시고, 주변 사람들에게 당신의 상황을 알려주세요. 클로가 당신 곁을 함께 지키겠습니다.",
              icon: "🤍"
            }
          ]);
        }, 3500);
      } else {
        const botIcon = currentPersona === 1 ? "🦔" : currentPersona === 2 ? "👩" : currentPersona === 3 ? "🤍" : currentPersona === 4 ? "🎓" : "😄";
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: "오류가 발생해 답변을 불러오지 못했어요. (백엔드 서버 'python backend/main.py'가 켜져 있는지 확인해 주세요!)",
            icon: botIcon
          }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 페르소나별 스타일 셋업
  const getBannerStyle = () => {
    switch (currentPersona) {
      case 1: return "bg-[#F4ECE1] text-[#3E3A35] border-b border-[#EAE5D9]";
      case 2: return "bg-[#E5ECE7] text-[#2C3E35] border-b border-[#C5D3C7]";
      case 3: return "bg-[#1A2744] text-white border-b border-gray-800";     // 클로 (고위험 대응)
      case 4: return "bg-[#EBE7E0] text-[#3D3A35] border-b border-[#DCD6CC]"; // 멘토 (소크라테스)
      case 5: return "bg-[#F5ECE8] text-[#4A3835] border-b border-[#EADAD5]"; // 철수 (유머)
    }
  };

  const getBubbleStyle = (role: string) => {
    if (role === "user") {
      return "bg-[#1E2D4E] text-[#F8F5F0] rounded-tr-sm";
    }
    switch (currentPersona) {
      case 1: return "bg-[#F5EFE6] text-[#3E3A35] rounded-tl-sm border border-[#EAE5D9]/40";
      case 2: return "bg-[#E3EAE5] text-[#2C3E35] rounded-tl-sm border border-[#C5D3C7]/40";
      case 3: return "bg-[#2A3B5C] text-white rounded-tl-sm border border-gray-700"; // 클로
      case 4: return "bg-[#EAE6DF] text-[#3E3A35] rounded-tl-sm border border-[#DCD6CC]/40"; // 멘토
      case 5: return "bg-[#F3EBE7] text-[#4A3835] rounded-tl-sm border border-[#EADAD5]/40"; // 철수
    }
  };

  const getPlaceholder = () => {
    if (currentPersona === 3) {
      return "이곳은 안전 가이드 모드입니다. 클로에게 당신의 상태를 짧게 알려주세요...";
    }
    return "오늘 어떤 마음인지 자유롭게 적어보세요...";
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex justify-center">
      {/* Chat Area */}
      <div className={`w-full rounded-3xl shadow-[0_12px_40px_rgba(139,123,93,0.06)] border border-[#EAE5D9] flex flex-col overflow-hidden transition-colors duration-300 relative ${
        currentPersona === 3 ? "bg-[#1A2744] border-gray-800" : "bg-[#FAF8F5]"
      }`}>
        {/* Test Panel */}
        <div className="bg-white border-b border-[#EAE5D9] p-2 flex gap-2 text-xs justify-center items-center overflow-x-auto">
          <span className="font-bold text-[#8C7862] shrink-0">테스트용 페르소나:</span>
          <button onClick={() => handlePersonaChange(1)} className={`px-2 py-1 rounded border border-[#EAE5D9] shadow-sm transition-all ${currentPersona === 1 ? "bg-[#1E2D4E] text-white border-[#1E2D4E]" : "bg-white text-gray-800 hover:bg-[#F8F5F0]"}`}>1. 또치 (경증)</button>
          <button onClick={() => handlePersonaChange(2)} className={`px-2 py-1 rounded border border-[#EAE5D9] shadow-sm transition-all ${currentPersona === 2 ? "bg-[#1E2D4E] text-white border-[#1E2D4E]" : "bg-white text-gray-800 hover:bg-[#F8F5F0]"}`}>2. 지우 (중등도)</button>
          <button onClick={() => handlePersonaChange(3)} className={`px-2 py-1 rounded border border-[#EAE5D9] shadow-sm transition-all ${currentPersona === 3 ? "bg-[#1E2D4E] text-white border-[#1E2D4E]" : "bg-white text-gray-800 hover:bg-[#F8F5F0]"}`}>3. 클로 (고위험)</button>
          <button onClick={() => handlePersonaChange(4)} className={`px-2 py-1 rounded border border-[#EAE5D9] shadow-sm transition-all ${currentPersona === 4 ? "bg-[#1E2D4E] text-white border-[#1E2D4E]" : "bg-white text-gray-800 hover:bg-[#F8F5F0]"}`}>4. 멘토 (소크라테스식 질문)</button>
          <button onClick={() => handlePersonaChange(5)} className={`px-2 py-1 rounded border border-[#EAE5D9] shadow-sm transition-all ${currentPersona === 5 ? "bg-[#1E2D4E] text-white border-[#1E2D4E]" : "bg-white text-gray-800 hover:bg-[#F8F5F0]"}`}>5. 철수 (행동)</button>
        </div>

        {/* Banner */}
        <div className={`p-4 border-b border-[#EAE5D9] flex justify-between items-center ${getBannerStyle()}`}>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold flex items-center gap-2">
              {currentPersona === 1 && "🦔 고슴도치 또치와 대화 중"}
              {currentPersona === 2 && "👩 상담사 지우와 대화 중"}
              {currentPersona === 3 && "🚨 지금은 앱보다 사람과 직접 통화하는 것이 더 안전해요."}
              {currentPersona === 4 && "🎓 멘토 선생님과 대화 중"}
              {currentPersona === 5 && "😄 개그맨 철수와 대화 중"}
            </h2>
            <p className="text-xs opacity-80">
              {currentPersona === 1 && "경도 · 일상 케어 모드"}
              {currentPersona === 2 && "중등도 · 전문 상담 모드"}
              {currentPersona === 3 && "혼자 감당하지 않아도 됩니다 · 위기 대응 모드"}
              {currentPersona === 4 && "소크라테스식 질문을 통한 인지 재구조화 모드"}
              {currentPersona === 5 && "행동 활성화 (유머) 모드"}
            </p>
          </div>
          <div className="flex gap-2 shrink-0 items-center">
            {onNavigateToMap && (
              <button 
                type="button"
                onClick={onNavigateToMap}
                className={`px-3 py-1.5 font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1 ${
                  currentPersona === 3 
                    ? "bg-[#EF4444] hover:bg-[#DC2626] text-white border border-red-500/40" 
                    : "bg-[#FAF8F5] hover:bg-[#F5EFE6] text-[#8C7862] hover:text-[#1E2D4E] border border-[#EAE5D9]"
                }`}
              >
                📍 내 주변 센터 찾기
              </button>
            )}
            <button 
              type="button"
              onClick={handleOpenMyPage}
              className={`px-3 py-1.5 font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1 ${
                currentPersona === 3
                  ? "bg-[#2A3B5C] border border-gray-700 text-white hover:bg-[#3B4D6E]"
                  : "bg-white border border-[#EAE5D9] text-gray-800 hover:bg-[#F8F5F0]"
              }`}
            >
              👤 마이페이지
            </button>
            <button 
              onClick={() => onEndChat && onEndChat(sessionId)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-colors shrink-0 ${
                currentPersona === 3
                  ? "bg-[#EF4444] text-white hover:bg-[#DC2626]"
                  : "bg-white border border-[#EAE5D9] text-gray-800 hover:bg-[#F8F5F0]"
              }`}
            >
              대화 종료 및 리포트 보기
            </button>
          </div>
        </div>

        {/* Alerts for Persona 4 and 5 */}
        {currentPersona === 4 && (
          <div className="bg-[#FFF8F0] border-b border-[#EAE5D9] text-[#B45309] p-3 text-sm font-bold flex items-center gap-2">
            <span>💡</span>
            <span>대화 중 인지적 왜곡 패턴이 감지되어 멘토 선생님이 함께해요</span>
          </div>
        )}
        {currentPersona === 5 && (
          <div className="bg-[#F0FDF4] border-b border-[#EAE5D9] text-[#166534] p-3 text-sm font-bold flex items-center gap-2">
            <span>🌱</span>
            <span>무기력 패턴이 감지되어 철수가 에너지를 불어넣어 드릴게요!</span>
          </div>
        )}

        {/* Fixed Crisis Buttons for Persona 3 (클로) */}
        {currentPersona === 3 && (
          <div className="bg-[#2A3B5C] p-4 flex flex-col gap-2">
            <a href="tel:1393" className="bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold py-2.5 px-4 rounded-lg text-sm flex items-center justify-between shadow-md">
              <span>📞 1393 자살예방상담(24시간)</span>
              <span>→</span>
            </a>
            <a href="tel:1577-0199" className="bg-[#1E2D4E] hover:bg-[#2A3B5C] text-white font-bold py-2.5 px-4 rounded-lg text-sm flex items-center justify-between shadow-md">
              <span>📞 1577-0199 정신건강위기상담</span>
              <span>→</span>
            </a>
            <a href="tel:119" className="bg-[#4B5563] hover:bg-[#374151] text-white font-bold py-2.5 px-4 rounded-lg text-sm flex items-center justify-between shadow-md">
              <span>📞 119 응급</span>
              <span>→</span>
            </a>
          </div>
        )}
        
        {/* Chat Messages */}
        <div className={`flex-1 p-6 overflow-y-auto min-h-[400px] max-h-[600px] flex flex-col gap-4 ${
          currentPersona === 3 ? "bg-[#1A2744]" : "bg-[#FAF8F5]"
        }`}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 shrink-0 ${
                  currentPersona === 3 ? "bg-[#2A3B5C] text-white" : "bg-[#EAE5D9] text-[#3E3A35]"
                }`}>
                  {msg.icon || "💙"}
                </div>
              )}
              <div className={`px-4 py-3 rounded-2xl max-w-[75%] shadow-[0_2px_8px_rgba(139,123,93,0.01)] ${getBubbleStyle(msg.role)}`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className={`p-4 border-t border-[#EAE5D9] ${
          currentPersona === 3 ? "bg-[#1A2744] border-gray-700" : "bg-[#FAF8F5]"
        }`}>
          <form onSubmit={handleSend} className="flex gap-2">
            <button type="button" onClick={() => setMessages([userPersonaMessages[currentPersona][0]])} className={`p-3 rounded-xl transition-colors ${
              currentPersona === 3 ? "text-gray-400 hover:text-gray-200 bg-[#2A3B5C]" : "text-gray-400 hover:text-gray-600 bg-white border border-[#EAE5D9] hover:bg-[#F8F5F0]"
            }`}>
              <RotateCcw size={20} />
            </button>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={getPlaceholder()}
              className={`flex-1 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                currentPersona === 3 
                  ? "bg-[#2A3B5C] border-gray-600 text-white focus:ring-white/50 focus:border-white" 
                  : "bg-white border border-[#EAE5D9] text-gray-800 focus:ring-[#8C7862]/30 focus:border-[#8C7862]"
              }`}
            />
            <button type="submit" className="px-6 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold rounded-xl shadow-[0_4px_12px_rgba(245,158,11,0.2)] hover:shadow-[0_6px_16px_rgba(245,158,11,0.3)] transition-all flex items-center gap-2 shrink-0">
              전송 <Send size={18} />
            </button>
          </form>
          <p className={`text-xs text-center mt-3 flex items-center justify-center gap-1 ${
            currentPersona === 3 ? "text-gray-500" : "text-[#8C7862]"
          }`}>
            <Info size={14} /> 실제 분석을 위해서는 백엔드 API 연동이 필요합니다.
          </p>
        </div>

        {/* Real-time Crisis Warning Modal Overlay */}
        {showWarningPopup && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-50 animate-fade-in backdrop-blur-md">
            <div className="bg-[#1A2744] text-white rounded-3xl p-8 max-w-md w-full border border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.3)] flex flex-col items-center text-center gap-4 transform scale-100 transition-transform">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center animate-bounce mb-2">
                <AlertTriangle size={36} />
              </div>
              <h3 className="text-xl font-black text-red-500 tracking-wider">🚨 실시간 안전 경보 작동</h3>
              <p className="text-sm text-gray-200 leading-relaxed font-semibold">
                작성하신 텍스트에서 안전이 심각하게 우려되는 단어(자해/자살 등)가 감지되었습니다. 
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                당신의 생명과 안전을 보듬기 위해, 위기 전문 대응 페르소나인 <span className="text-white font-bold">어시스턴트 클로(Cloe)</span>로 즉각 안전 모드를 발동합니다.
              </p>
              <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-red-500 rounded-full animate-pulse" style={{ width: "100%" }}></div>
              </div>
              <span className="text-[10px] text-gray-400 font-medium">잠시 후 대화창이 붉은 위기대응 모드로 전환됩니다...</span>
            </div>
          </div>
        )}

        {/* My Page (Profile Edit) Modal */}
        {showMyPage && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
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
    </div>
  );
}

