"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Send, RotateCcw, AlertTriangle, Info } from "lucide-react";

export default function UserFlow({ initialPersona = 1, onEndChat }: { initialPersona?: 1 | 2 | 3 | 4 | 5, onEndChat?: () => void }) {
  const [currentPersona, setCurrentPersona] = useState<1 | 2 | 3 | 4 | 5>(initialPersona);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(45);
  const [level, setLevel] = useState("🟠 중증");
  
  const scoreHistory = [
    { turn: 1, score: 20 },
    { turn: 2, score: 35 },
    { turn: 3, score: 45 }
  ];

  const personaMessages = {
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

  const [messages, setMessages] = useState(personaMessages[initialPersona]);

  const handlePersonaChange = (p: 1 | 2 | 3 | 4 | 5) => {
    setCurrentPersona(p);
    setMessages(personaMessages[p]);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    
    // Mock bot response
    setTimeout(() => {
      const botIcon = currentPersona === 1 ? "🦔" : currentPersona === 2 ? "👩" : currentPersona === 3 ? "🎓" : currentPersona === 4 ? "😄" : "🤍";
      setMessages(prev => [...prev, { role: "bot", content: "이해해요. 더 자세히 이야기해주시겠어요? (임시 모의 응답입니다)", icon: botIcon }]);
    }, 1000);
  };

  // Styles based on persona
  const getBannerStyle = () => {
    switch (currentPersona) {
      case 1: return "bg-[#FFFBF0] text-gray-800";
      case 2: return "bg-[#EEF4FF] text-gray-800";
      case 3: return "bg-[#F0F4FF] text-gray-800";
      case 4: return "bg-[#FFF5E6] text-gray-800";
      case 5: return "bg-[#1A2744] text-white";
    }
  };

  const getBubbleStyle = (role: string) => {
    if (role === "user") {
      return "bg-[#6096C8] text-white rounded-tr-sm";
    }
    switch (currentPersona) {
      case 1: return "bg-[#FFF9E6] text-gray-800 rounded-tl-sm";
      case 2: return "bg-[#F0F6FF] text-gray-800 rounded-tl-sm";
      case 3: return "bg-[#EEF2FF] text-gray-800 rounded-tl-sm";
      case 4: return "bg-[#FFF8F0] text-gray-800 rounded-tl-sm";
      case 5: return "bg-[#2A3B5C] text-white rounded-tl-sm border border-gray-700";
    }
  };

  const getPlaceholder = () => {
    if (currentPersona === 5) {
      return "이곳은 안전 가이드 모드입니다. 클로에게 당신의 상태를 짧게 알려주세요";
    }
    return "오늘 어떤 마음인지 자유롭게 적어보세요...";
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex justify-center">
      {/* Chat Area */}
      <div className={`w-full rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden transition-colors duration-300 ${
        currentPersona === 5 ? "bg-[#1A2744]" : "bg-white"
      }`}>
        {/* Test Panel */}
        <div className="bg-gray-100 p-2 flex gap-2 text-xs justify-center items-center overflow-x-auto">
          <span className="font-bold shrink-0">테스트용 페르소나:</span>
          <button onClick={() => handlePersonaChange(1)} className={`px-2 py-1 rounded shadow ${currentPersona === 1 ? "bg-[#6096C8] text-white" : "bg-white text-gray-800"}`}>1. 또치</button>
          <button onClick={() => handlePersonaChange(2)} className={`px-2 py-1 rounded shadow ${currentPersona === 2 ? "bg-[#6096C8] text-white" : "bg-white text-gray-800"}`}>2. 지우</button>
          <button onClick={() => handlePersonaChange(3)} className={`px-2 py-1 rounded shadow ${currentPersona === 3 ? "bg-[#6096C8] text-white" : "bg-white text-gray-800"}`}>3. 멘토</button>
          <button onClick={() => handlePersonaChange(4)} className={`px-2 py-1 rounded shadow ${currentPersona === 4 ? "bg-[#6096C8] text-white" : "bg-white text-gray-800"}`}>4. 철수</button>
          <button onClick={() => handlePersonaChange(5)} className={`px-2 py-1 rounded shadow ${currentPersona === 5 ? "bg-[#6096C8] text-white" : "bg-white text-gray-800"}`}>5. 클로</button>
        </div>

        {/* Banner */}
        <div className={`p-4 border-b border-gray-100 flex justify-between items-center ${getBannerStyle()}`}>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold flex items-center gap-2">
              {currentPersona === 1 && "🦔 고슴도치 또치와 대화 중"}
              {currentPersona === 2 && "👩 상담사 지우와 대화 중"}
              {currentPersona === 3 && "🎓 멘토 선생님과 대화 중"}
              {currentPersona === 4 && "😄 개그맨 철수와 대화 중"}
              {currentPersona === 5 && "🚨 지금은 앱보다 사람과 직접 통화하는 것이 더 안전해요."}
            </h2>
            <p className="text-xs opacity-80">
              {currentPersona === 1 && "경도 · 일상 케어 모드"}
              {currentPersona === 2 && "중등도 · 전문 상담 모드"}
              {currentPersona === 3 && "인지 재구조화 모드"}
              {currentPersona === 4 && "행동 활성화 모드"}
              {currentPersona === 5 && "혼자 감당하지 않아도 됩니다"}
            </p>
          </div>
          <button 
            onClick={onEndChat}
            className="px-3 py-1.5 bg-white text-gray-800 text-xs font-bold rounded-lg shadow-sm hover:bg-gray-50 transition-colors shrink-0"
          >
            대화 종료 및 리포트 보기
          </button>
        </div>

        {/* Alerts for Persona 3 and 4 */}
        {currentPersona === 3 && (
          <div className="bg-[#FEF3C7] text-[#D97706] p-3 text-sm font-bold flex items-center gap-2">
            <span>💡</span>
            <span>대화 중 인지적 왜곡 패턴이 감지되어 멘토 선생님이 함께해요</span>
          </div>
        )}
        {currentPersona === 4 && (
          <div className="bg-[#DCFCE7] text-[#15803D] p-3 text-sm font-bold flex items-center gap-2">
            <span>🌱</span>
            <span>무기력 패턴이 감지되어 철수가 에너지를 불어넣어 드릴게요!</span>
          </div>
        )}

        {/* Fixed Crisis Buttons for Persona 5 */}
        {currentPersona === 5 && (
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
          currentPersona === 5 ? "bg-[#1A2744]" : "bg-white"
        }`}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "bot" && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 shrink-0 ${
                  currentPersona === 5 ? "bg-[#2A3B5C] text-white" : "bg-blue-100 text-blue-600"
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
          currentPersona === 5 ? "bg-[#1A2744] border-gray-700" : "bg-white"
        }`}>
          <form onSubmit={handleSend} className="flex gap-2">
            <button type="button" onClick={() => setMessages([personaMessages[currentPersona][0]])} className={`p-3 rounded-xl transition-colors ${
              currentPersona === 5 ? "text-gray-400 hover:text-gray-200 bg-[#2A3B5C]" : "text-gray-400 hover:text-gray-600 bg-gray-100"
            }`}>
              <RotateCcw size={20} />
            </button>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={getPlaceholder()}
              className={`flex-1 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                currentPersona === 5 
                  ? "bg-[#2A3B5C] border-gray-600 text-white focus:ring-white/50 focus:border-white" 
                  : "bg-gray-50 border border-gray-200 text-gray-800 focus:ring-[#8B7BAD]/50 focus:border-[#8B7BAD]"
              }`}
            />
            <button type="submit" className="px-6 py-3 bg-gradient-to-r from-[#6096C8] to-[#8B7BAD] text-white font-bold rounded-xl hover:shadow-md transition-all flex items-center gap-2 shrink-0">
              전송 <Send size={18} />
            </button>
          </form>
          <p className={`text-xs text-center mt-3 flex items-center justify-center gap-1 ${
            currentPersona === 5 ? "text-gray-500" : "text-gray-400"
          }`}>
            <Info size={14} /> 실제 분석을 위해서는 백엔드 API 연동이 필요합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
