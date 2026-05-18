"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Send, RotateCcw, AlertTriangle, Info } from "lucide-react";
import { userPersonaMessages, checkPersonaSwitchTrigger } from "@/lib/mockData";

export default function UserFlow({ initialPersona = 1, onEndChat, userId = "user-003" }: { initialPersona?: 1 | 2 | 3 | 4 | 5, onEndChat?: () => void, userId?: string }) {
  const [currentPersona, setCurrentPersona] = useState<1 | 2 | 3 | 4 | 5>(initialPersona);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(20);
  const [level, setLevel] = useState("🟢 양호");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [scoreHistory, setScoreHistory] = useState<{ turn: number, score: number }[]>([
    { turn: 1, score: 20 }
  ]);

  const [messages, setMessages] = useState<any[]>([userPersonaMessages[initialPersona][0]]);

  const handlePersonaChange = (p: 1 | 2 | 3 | 4 | 5) => {
    setCurrentPersona(p);
    setMessages([userPersonaMessages[p][0]]);
    setSessionId(null); // 테스트용 페르소나 변경 시 세션 초기화
    setScore(20);
    setLevel("🟢 양호");
    setScoreHistory([{ turn: 1, score: 20 }]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userText = input;
    setInput("");
    setIsLoading(true);

    // 즉시 유저 발화 화면에 추가
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
          initial_persona: currentPersona
        })
      });

      if (!res.ok) {
        throw new Error("서버 응답 오류");
      }

      const data = await res.json();
      
      // 세션 ID가 없었다면 신규 저장
      if (!sessionId) {
        setSessionId(data.session_id);
      }

      // 우울 점수 및 레벨 업데이트
      const rawScore = data.bot_message.risk_score; // 0.0 ~ 1.0
      const percentageScore = Math.round(rawScore * 100);
      setScore(percentageScore);

      // 점수 수준 라벨 결정
      if (rawScore >= 0.60) {
        setLevel("🔴 고위험");
      } else if (rawScore >= 0.35) {
        setLevel("🟠 중증");
      } else if (rawScore >= 0.15) {
        setLevel("🟡 경증");
      } else {
        setLevel("🟢 양호");
      }

      // 차트 추이 데이터 추가
      setScoreHistory(prev => [
        ...prev,
        { turn: prev.length + 1, score: percentageScore }
      ]);

      // 페르소나 변경 (서버가 판단한 페르소나 적용)
      setCurrentPersona(data.persona_id as 1 | 2 | 3 | 4 | 5);

      // AI 답변 추가
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
      // 서버가 꺼져 있거나 오류 발생 시 가상 폴백 처리 (안전 모사)
      const riskKeywords = ["끝내고 싶", "죽고 싶", "자살", "자해", "수면제", "지쳤어요", "사라지고"];
      const isRiskDetected = riskKeywords.some(kw => userText.includes(kw));

      setTimeout(() => {
        if (isRiskDetected) {
          setCurrentPersona(3);
          setMessages(prev => [
            ...prev,
            {
              role: "assistant",
              content: "🚨 [안전 가드레일 로컬 백업 작동] 서버 연결 문제로 오프라인 상태이지만 위기 표현이 감지되었습니다. 1393 자살예방상담전화나 119로 즉시 전화해 주시기를 바랍니다. 당신은 소중한 사람입니다.",
              icon: "🤍"
            }
          ]);
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
      }, 500);
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
      <div className={`w-full rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden transition-colors duration-300 ${
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
            onClick={onEndChat}
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
      </div>
    </div>
  );
}

