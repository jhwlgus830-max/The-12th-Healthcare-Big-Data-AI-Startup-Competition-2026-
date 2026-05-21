"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import OwlLogo from "./OwlLogo";
import { 
  ArrowRight, 
  Brain, 
  UserCheck, 
  ShieldAlert, 
  Send, 
  Heart, 
  BookOpen, 
  BarChart3, 
  Activity, 
  Sparkles,
  Moon
} from "lucide-react";

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollPct, setScrollPct] = useState(0);

  // Journal interactive state
  const [journalText, setJournalText] = useState("");
  const [journalFeedback, setJournalFeedback] = useState("");

  // Chat interactive state
  const [messages, setMessages] = useState<Array<{ sender: "bot" | "user"; text: string }>>([
    {
      sender: "bot",
      text: "안녕하세요, 우울빼미입니다. 밤잠을 설칠 만큼 마음이 무거운 오늘, 당신의 이야기를 가만히 들려주실 수 있나요?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  // PHQ-9 sliders state
  const [phq9Q1, setPhq9Q1] = useState(1);
  const [phq9Q2, setPhq9Q2] = useState(2);
  const [phq9Q3, setPhq9Q3] = useState(2);

  const phq9Total = phq9Q1 + phq9Q2 + phq9Q3;

  // Star canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Array<{ x: number; y: number; radius: number; alpha: number; speed: number }> = [];
    const maxStars = 80;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Init stars
    for (let i = 0; i < maxStars; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5,
        alpha: Math.random(),
        speed: 0.02 + Math.random() * 0.03,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const opacity = 1 - scrollPct;
      if (opacity > 0.05) {
        for (let i = 0; i < maxStars; i++) {
          const s = stars[i];
          s.alpha += s.speed;
          if (s.alpha > 1 || s.alpha < 0) {
            s.speed = -s.speed;
          }
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(248, 245, 240, ${s.alpha * opacity})`;
          ctx.fill();
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [scrollPct]);

  // Scroll listener for background color interpolation
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const pct = Math.min(scrollY / (viewportHeight * 0.7), 1);
      setScrollPct(pct);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Compute interpolated color: Navy #0F172A (15, 23, 42) -> Ivory #F8F5F0 (248, 245, 240)
  const r = Math.round(15 + (248 - 15) * scrollPct);
  const g = Math.round(23 + (245 - 23) * scrollPct);
  const b = Math.round(42 + (240 - 42) * scrollPct);
  const backgroundColor = `rgb(${r}, ${g}, ${b})`;

  // Text color state
  const isLightMode = scrollPct > 0.5;

  const handleSendChat = () => {
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");

    setTimeout(() => {
      let botResponse = "소중한 속마음을 털어놓아 주어 감사해요. 그 일이 당신에게 무척이나 큰 짐이 되었겠어요. 오늘 밤은 머릿속 복잡한 생각들을 잠시 접어두고, 제게 기대어 편안한 숨을 나누어 보세요.";
      
      if (userMsg.includes("우울") || userMsg.includes("슬퍼")) {
        botResponse = "당신의 우울한 마음에 가만히 날개를 드리워 따뜻하게 안아주고 싶어요. 그 고요함 속에 머무는 온기와 위로가 닿기를 바랍니다.";
      } else if (userMsg.includes("불안") || userMsg.includes("잠")) {
        botResponse = "두 눈을 감아도 불안이 파도처럼 밀려온다면, 지금 당신 곁의 이 차분한 공기에 귀 기울여보세요. 우울빼미가 든든하게 당신을 지켜보고 있습니다.";
      }

      setMessages((prev) => [...prev, { sender: "bot", text: botResponse }]);
    }, 800);
  };

  const handleChatKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendChat();
    }
  };

  const handleSubmitJournal = () => {
    if (!journalText.trim()) return;

    setJournalFeedback(
      "오늘 당신의 기록 속에서 불안의 조각들을 읽어보았어요. 실수란 성장의 순간에 피할 수 없는 흔적일 뿐이랍니다. 당신의 잘못이 아니니 너무 자책하지 말아요. 우울빼미가 오늘 밤만큼은 고요히 날개를 펴고 곁을 지키며 포근한 잠을 응원할게요."
    );
  };

  return (
    <div 
      ref={containerRef}
      style={{ backgroundColor, color: isLightMode ? "#0F172A" : "#F8F5F0" }}
      className="min-h-screen font-sans transition-colors duration-300 relative w-full overflow-x-hidden selection:bg-amber-500 selection:text-white"
    >
      {/* Stars background */}
      <canvas 
        ref={canvasRef} 
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-1" 
        style={{ opacity: 1 - scrollPct }}
      />

      {/* Header Nav */}
      <header 
        className={`w-full py-5 fixed top-0 z-50 backdrop-blur-md border-b transition-all duration-300 ${
          isLightMode 
            ? "border-slate-200/50 bg-[#F8F5F0]/80" 
            : "border-white/5 bg-[#0F172A]/40"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 select-none">
            <OwlLogo size={36} variant={isLightMode ? "ivory" : "night"} />
            <span className={`font-bold text-xl tracking-tight transition-colors duration-300 ${isLightMode ? "text-[#0F172A]" : "text-white"}`}>
              우울빼미
            </span>
          </div>

          <button 
            onClick={onStart}
            className="bg-[#F59E0B] hover:bg-[#ea580c] text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-[0_4px_15px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.5)] hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200"
          >
            시작하기
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center relative px-6 pt-32 pb-20 max-w-7xl mx-auto z-10">
        {/* Glow */}
        <div 
          style={{ opacity: 1 - scrollPct }}
          className="absolute w-[400px] h-[400px] bg-gradient-radial from-amber-500/15 to-transparent top-1/4 filter blur-3xl pointer-events-none animate-pulse duration-10000 z-0"
        />

        {/* Floating Moon and Owl */}
        <div 
          className="relative w-40 h-40 mb-8 flex justify-center items-center transition-opacity duration-300"
          style={{ opacity: 1 - scrollPct }}
        >
          <div className="absolute w-36 h-36 rounded-full shadow-[-15px_15px_0_0_#FDBA24] -rotate-[35deg] opacity-90 filter drop-shadow-[0_0_12px_rgba(253,186,36,0.4)]" />
          <OwlLogo size={96} variant="night" className="animate-bounce-slow" />
        </div>

        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-5 bg-gradient-to-br from-[#F8F5F0] via-[#F8F5F0] to-[#FDBA24] bg-clip-text text-transparent opacity-0 translate-y-5 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          우울빼미
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-[620px] leading-relaxed mb-10 opacity-0 translate-y-5 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          밤에도 당신의 마음을 지켜보는 AI 심리 케어 솔루션
        </p>

        <div className="opacity-0 translate-y-5 animate-fade-in mb-24" style={{ animationDelay: "0.6s" }}>
          <button 
            onClick={onStart}
            className="bg-gradient-to-r from-[#F59E0B] to-[#f97316] text-white font-bold text-lg px-12 py-4 rounded-full shadow-[0_10px_25px_rgba(245,158,11,0.35),_0_0_20px_rgba(245,158,11,0.1)] hover:scale-[1.03] hover:-translate-y-[1px] active:scale-100 active:translate-y-0 transition-all duration-200 flex items-center gap-2"
          >
            시작하기 <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Cards Grid (Glassmorphism) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl opacity-0 translate-y-8 animate-fade-in" style={{ animationDelay: "0.8s" }}>
          <div className="bg-white/5 border border-white/8 backdrop-blur-xl rounded-3xl p-8 hover:translate-y-[-8px] hover:bg-white/8 hover:border-white/15 transition-all duration-300 shadow-2xl relative group overflow-hidden">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
              <Brain className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-white">과학적 진단</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              PHQ-9 자가 검진 도구를 기반으로 현재 우울 위험도를 정밀하게 분석하고 감지합니다.
            </p>
          </div>

          <div className="bg-white/5 border border-white/8 backdrop-blur-xl rounded-3xl p-8 hover:translate-y-[-8px] hover:bg-white/8 hover:border-white/15 transition-all duration-300 shadow-2xl relative group overflow-hidden">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-white">맞춤 페르소나</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              우울 스펙트럼 위험도에 맞춰 심야 시간대에 어울리는 특화 AI 상담사가 자동 매칭됩니다.
            </p>
          </div>

          <div className="bg-white/5 border border-white/8 backdrop-blur-xl rounded-3xl p-8 hover:translate-y-[-8px] hover:bg-white/8 hover:border-white/15 transition-all duration-300 shadow-2xl relative group overflow-hidden">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
              <ShieldAlert className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-white">안전 보장</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              고위험 징후 연속 감지 시 24시간 안심 연락망 및 오프라인 심리 센터 연계를 보장합니다.
            </p>
          </div>
        </div>
      </section>

      {/* Transition Section */}
      <section className="py-24 text-center px-6 z-10 relative">
        <p className={`text-2xl md:text-3xl font-light max-w-3xl mx-auto leading-relaxed transition-colors duration-500 ${
          isLightMode ? "text-slate-500" : "text-slate-300"
        }`}>
          "어둡고 불안하던 밤을 뒤로하고,<br />
          이제 따뜻하게 정돈된 회복의 공간으로 걸어 들어갑니다."
        </p>
      </section>

      {/* Main Service Section (Ivory Mode) */}
      <section className={`py-24 px-6 max-w-7xl mx-auto z-10 relative transition-all duration-500 ${
        isLightMode ? "opacity-100 translate-y-0" : "opacity-40 translate-y-10"
      }`}>
        <div className="mb-14 text-left">
          <div className="text-xs font-black text-amber-500 tracking-widest uppercase mb-2">Emotional Routine</div>
          <h2 className="text-4xl font-extrabold tracking-tight">마음을 돌보는 차분한 공간</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column */}
          <div className="flex flex-col gap-8">
            {/* Journal Card */}
            <div className="bg-white border border-slate-200/40 rounded-3xl p-8 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 text-slate-900 shadow-md">
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="text-xl">✍️</span> 감정 기록 일기
                </h3>
                <span className="text-xs font-bold text-[#F59E0B] bg-[#F59E0B]/10 px-3 py-1 rounded-full">
                  회복 Routine
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                오늘 하루 당신의 마음에 무겁게 고여 있던 어떤 생각도 좋습니다. 자유롭게 글로 써보며 비워내 보세요.
              </p>
              <textarea 
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                className="w-full h-28 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-[#F59E0B] focus:bg-white transition-all text-slate-800"
                placeholder="여기에 감정을 기록해보세요... (예: 오늘 발표에서 실수해서 위축되고 불안해요)"
              />
              <button 
                onClick={handleSubmitJournal}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl mt-3 transition-colors text-sm"
              >
                일기 작성 완료
              </button>

              {journalFeedback && (
                <div className="mt-4 p-4 bg-[#F59E0B]/5 border-l-4 border-[#F59E0B] rounded-r-xl text-xs text-slate-700 leading-relaxed animate-fade-in">
                  <strong className="block mb-1 text-slate-900">🦉 우울빼미의 따뜻한 한마디:</strong>
                  {journalFeedback}
                </div>
              )}
            </div>

            {/* Diagnostics Simulation */}
            <div className="bg-white border border-slate-200/40 rounded-3xl p-8 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 text-slate-900 shadow-md">
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="text-xl">📊</span> 실시간 우울 검사 시뮬레이터
                </h3>
                <span className="text-xs font-bold text-[#F59E0B] bg-[#F59E0B]/10 px-3 py-1 rounded-full">
                  자가 진단
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                최근 2주 동안 아래 증상들을 겪었던 빈도를 조절해 점수를 계산해 보세요 (0: 없음 ~ 3: 매일).
              </p>

              <div className="flex flex-col gap-5">
                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-2">Q1. 기분이 가라앉거나 우울하거나 희망이 없다고 느꼈다.</div>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="0" 
                      max="3" 
                      value={phq9Q1}
                      onChange={(e) => setPhq9Q1(parseInt(e.target.value))}
                      className="flex-1 accent-[#F59E0B]"
                    />
                    <span className="text-xs font-bold text-slate-900 w-10 text-right">{phq9Q1}점</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-2">Q2. 평소 하던 일에 대한 흥미가 없어지거나 즐거움을 느끼지 못했다.</div>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="0" 
                      max="3" 
                      value={phq9Q2}
                      onChange={(e) => setPhq9Q2(parseInt(e.target.value))}
                      className="flex-1 accent-[#F59E0B]"
                    />
                    <span className="text-xs font-bold text-slate-900 w-10 text-right">{phq9Q2}점</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-2">Q3. 잠들기가 어렵거나 자주 깼다. (혹은 너무 많이 잤다)</div>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="0" 
                      max="3" 
                      value={phq9Q3}
                      onChange={(e) => setPhq9Q3(parseInt(e.target.value))}
                      className="flex-1 accent-[#F59E0B]"
                    />
                    <span className="text-xs font-bold text-slate-900 w-10 text-right">{phq9Q3}점</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 mt-6 flex justify-between items-center border border-slate-100">
                <span className="text-sm font-bold text-slate-800">자가진단 예상 합산 점수:</span>
                <span className="text-xl font-extrabold text-[#F59E0B]">{phq9Total}점</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-8">
            {/* Chat Box */}
            <div className="bg-white border border-slate-200/40 rounded-3xl p-8 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 text-slate-900 shadow-md">
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="text-xl">💬</span> 따뜻한 감정 동반자 AI 채팅
                </h3>
                <span className="text-xs font-bold text-[#F59E0B] bg-[#F59E0B]/10 px-3 py-1 rounded-full">
                  AI 상담사
                </span>
              </div>

              <div className="h-64 overflow-y-auto flex flex-col gap-3 pr-2 mb-4">
                {messages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === "bot" 
                        ? "bg-slate-100 text-slate-800 self-start rounded-bl-none" 
                        : "bg-slate-900 text-white self-end rounded-br-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatKey}
                  placeholder="당신의 마음을 한 번 건네보세요..." 
                  className="flex-1 border border-slate-200 bg-slate-50 p-3 rounded-xl text-xs outline-none focus:border-[#F59E0B] focus:bg-white text-slate-800 transition-all"
                />
                <button 
                  onClick={handleSendChat}
                  className="bg-[#F59E0B] hover:bg-[#ea580c] text-white px-5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                >
                  전송 <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Weekly Report Graph */}
            <div className="bg-white border border-slate-200/40 rounded-3xl p-8 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 text-slate-900 shadow-md">
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="text-xl">📈</span> 감정 안정 추이 리포트
                </h3>
                <span className="text-xs font-bold text-[#F59E0B] bg-[#F59E0B]/10 px-3 py-1 rounded-full">
                  Weekly Report
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                지난 7일간 기록하셨던 일기의 텍스트 감정 분석을 통해 산출된 심리 안정 추이입니다.
              </p>

              <div className="w-full h-40 flex items-end justify-between px-2 pt-6 border-b border-slate-100 relative">
                {[
                  { day: "월", val: "75%" },
                  { day: "화", val: "60%" },
                  { day: "수", val: "82%" },
                  { day: "목", val: "45%" },
                  { day: "금", val: "90%" },
                  { day: "토", val: "70%" },
                  { day: "일", val: "85%" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 w-[12%]">
                    <span className="text-[10px] font-bold text-slate-800 mb-1">{item.val}</span>
                    <div 
                      style={{ height: item.val }} 
                      className="w-full bg-gradient-to-t from-amber-500/50 to-[#F59E0B] rounded-t-lg transition-all duration-1000"
                    />
                    <span className="text-[11px] font-bold text-slate-400 mt-1">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer 
        className={`border-t py-12 text-center text-xs transition-colors duration-500 ${
          isLightMode 
            ? "bg-[#F8F5F0] border-slate-200/50 text-slate-500" 
            : "bg-[#0F172A] border-white/5 text-slate-400"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <p className="font-extrabold text-sm mb-3 flex items-center justify-center gap-1.5">
            <Moon className="w-4 h-4 text-amber-500 fill-amber-500/20" /> 우울빼미 AI 심리 케어 플랫폼
          </p>
          <p className="max-w-xl mx-auto leading-relaxed mb-6">
            본 서비스는 전문 의료인의 진료 및 의학적 처방을 대신하지 않으며, 일상적인 자가 예방 및 정서 안정을 위한 보조적 심리 케어 서비스입니다.
          </p>
          <p className="opacity-60">© 2026 우울빼미 (Mind-Safe). All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
