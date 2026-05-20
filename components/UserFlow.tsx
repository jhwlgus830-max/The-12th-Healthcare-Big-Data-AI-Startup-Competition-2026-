"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Send, RotateCcw, AlertTriangle, Info } from "lucide-react";
import { userPersonaMessages, checkPersonaSwitchTrigger } from "@/lib/mockData";

export default function UserFlow({ initialPersona = 1, onEndChat, userId = "user-003", phq9Score = 0, phq9Answers = null, p4Answers = null }: { initialPersona?: 1 | 2 | 3 | 4 | 5, onEndChat?: (sessionId: string | null) => void, userId?: string, phq9Score?: number, phq9Answers?: number[] | null, p4Answers?: string[] | null }) {
  const [currentPersona, setCurrentPersona] = useState<1 | 2 | 3 | 4 | 5>(initialPersona);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(45);
  const [level, setLevel] = useState("🟠 중증");
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
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
      case 1: return "bg-[#FFFBF0] text-gray-800";
      case 2: return "bg-[#EEF4FF] text-gray-800";
      case 3: return "bg-[#1A2744] text-white";     // 클로 (고위험 대응)
      case 4: return "bg-[#F0F4FF] text-gray-800"; // 멘토 (소크라테스)
      case 5: return "bg-[#FFF5E6] text-gray-800"; // 철수 (유머)
    }
  };

  const getBubbleStyle = (role: string) => {
    if (role === "user") {
      return "bg-[#6096C8] text-white rounded-tr-sm";
    }
    switch (currentPersona) {
      case 1: return "bg-[#FFF9E6] text-gray-800 rounded-tl-sm";
      case 2: return "bg-[#F0F6FF] text-gray-800 rounded-tl-sm";
      case 3: return "bg-[#2A3B5C] text-white rounded-tl-sm border border-gray-700"; // 클로
      case 4: return "bg-[#EEF2FF] text-gray-800 rounded-tl-sm"; // 멘토
      case 5: return "bg-[#FFF8F0] text-gray-800 rounded-tl-sm"; // 철수
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
      <div className={`w-full rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden transition-colors duration-300 relative ${
        currentPersona === 3 ? "bg-[#1A2744]" : "bg-white"
      }`}>
        {/* Test Panel */}
        <div className="bg-gray-100 p-2 flex gap-2 text-xs justify-center items-center overflow-x-auto">
          <span className="font-bold shrink-0">테스트용 페르소나:</span>
          <button onClick={() => handlePersonaChange(1)} className={`px-2 py-1 rounded shadow ${currentPersona === 1 ? "bg-[#6096C8] text-white" : "bg-white text-gray-800"}`}>1. 또치 (경증)</button>
          <button onClick={() => handlePersonaChange(2)} className={`px-2 py-1 rounded shadow ${currentPersona === 2 ? "bg-[#6096C8] text-white" : "bg-white text-gray-800"}`}>2. 지우 (중등도)</button>
          <button onClick={() => handlePersonaChange(3)} className={`px-2 py-1 rounded shadow ${currentPersona === 3 ? "bg-[#6096C8] text-white" : "bg-white text-gray-800"}`}>3. 클로 (고위험)</button>
          <button onClick={() => handlePersonaChange(4)} className={`px-2 py-1 rounded shadow ${currentPersona === 4 ? "bg-[#6096C8] text-white" : "bg-white text-gray-800"}`}>4. 멘토 (CBT)</button>
          <button onClick={() => handlePersonaChange(5)} className={`px-2 py-1 rounded shadow ${currentPersona === 5 ? "bg-[#6096C8] text-white" : "bg-white text-gray-800"}`}>5. 철수 (행동)</button>
        </div>

        {/* Banner */}
        <div className={`p-4 border-b border-gray-100 flex justify-between items-center ${getBannerStyle()}`}>
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
              {currentPersona === 4 && "인지 재구조화 (CBT) 모드"}
              {currentPersona === 5 && "행동 활성화 (유머) 모드"}
            </p>
          </div>
          <button 
            onClick={() => onEndChat && onEndChat(sessionId)}
            className="px-3 py-1.5 bg-white text-gray-800 text-xs font-bold rounded-lg shadow-sm hover:bg-gray-50 transition-colors shrink-0"
          >
            대화 종료 및 리포트 보기
          </button>
        </div>

        {/* Alerts for Persona 4 and 5 */}
        {currentPersona === 4 && (
          <div className="bg-[#FEF3C7] text-[#D97706] p-3 text-sm font-bold flex items-center gap-2">
            <span>💡</span>
            <span>대화 중 인지적 왜곡 패턴이 감지되어 멘토 선생님이 함께해요</span>
          </div>
        )}
        {currentPersona === 5 && (
          <div className="bg-[#DCFCE7] text-[#15803D] p-3 text-sm font-bold flex items-center gap-2">
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
            <a href="tel:1577-0199" className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-2.5 px-4 rounded-lg text-sm flex items-center justify-between shadow-md">
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
          currentPersona === 3 ? "bg-[#1A2744]" : "bg-white"
        }`}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 shrink-0 ${
                  currentPersona === 3 ? "bg-[#2A3B5C] text-white" : "bg-blue-100 text-blue-600"
                }`}>
                  {msg.icon || "💙"}
                </div>
              )}
              <div className={`px-4 py-3 rounded-2xl max-w-[75%] ${getBubbleStyle(msg.role)}`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className={`p-4 border-t border-gray-100 ${
          currentPersona === 3 ? "bg-[#1A2744] border-gray-700" : "bg-white"
        }`}>
          <form onSubmit={handleSend} className="flex gap-2">
            <button type="button" onClick={() => setMessages([userPersonaMessages[currentPersona][0]])} className={`p-3 rounded-xl transition-colors ${
              currentPersona === 3 ? "text-gray-400 hover:text-gray-200 bg-[#2A3B5C]" : "text-gray-400 hover:text-gray-600 bg-gray-100"
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
                  : "bg-gray-50 border border-gray-200 text-gray-800 focus:ring-[#8B7BAD]/50 focus:border-[#8B7BAD]"
              }`}
            />
            <button type="submit" className="px-6 py-3 bg-gradient-to-r from-[#6096C8] to-[#8B7BAD] text-white font-bold rounded-xl hover:shadow-md transition-all flex items-center gap-2 shrink-0">
              전송 <Send size={18} />
            </button>
          </form>
          <p className={`text-xs text-center mt-3 flex items-center justify-center gap-1 ${
            currentPersona === 3 ? "text-gray-500" : "text-gray-400"
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
      </div>
    </div>
  );
}

