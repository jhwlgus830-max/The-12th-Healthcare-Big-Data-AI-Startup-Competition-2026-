"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EmotionReport from "../components/EmotionReport";
import UserFlow from "../components/UserFlow";
import CounselorPortal from "../components/CounselorPortal";
import CounselorDashboard from "../components/CounselorDashboard";
import CounselorReport from "../components/CounselorReport";
import CounselorGuide from "../components/CounselorGuide";
import CounselorSettings from "../components/CounselorSettings";
import { phq9ResultConfig } from "@/lib/mockData";


export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<"onboarding" | "select" | "login" | "consent" | "profile" | "phq9" | "p4" | "pledge" | "result" | "report" | "chat" | "journal" | "counselor_dashboard" | "counselor_clients" | "counselor_report" | "counselor_guide" | "counselor_settings">("onboarding");
  const [role, setRole] = useState<"user" | "counselor" | null>(null);
  const [initialPersona, setInitialPersona] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [diaryText, setDiaryText] = useState("");
  const [journalWarning, setJournalWarning] = useState("");

  // Consent states
  const [agreements, setAgreements] = useState({
    privacy: false,
    terms: false,
    safety: false,
    counselorShare: false,
    ageVerify: false,
  });
  const [showPrivacyDetail, setShowPrivacyDetail] = useState(false);
  const [showTermsDetail, setShowTermsDetail] = useState(false);
  const [showSafetyDetail, setShowSafetyDetail] = useState(false);
  const [showCounselorDetail, setShowCounselorDetail] = useState(false);
  const [showAgeDetail, setShowAgeDetail] = useState(false);

  const allAgreed = agreements.privacy && agreements.terms && agreements.safety && agreements.counselorShare && agreements.ageVerify;

  const handleAllAgree = (checked: boolean) => {
    setAgreements({
      privacy: checked,
      terms: checked,
      safety: checked,
      counselorShare: checked,
      ageVerify: checked,
    });
  };

  const handleCheck = (key: keyof typeof agreements, checked: boolean) => {
    setAgreements((prev) => ({ ...prev, [key]: checked }));
  };

  // PHQ-9 states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phq9Answers, setPhq9Answers] = useState<(number | null)[]>(Array(9).fill(null));

  const phq9Questions = [
    "기분이 가라앉거나 우울하거나 희망이 없다고 느꼈다",
    "평소 하던 일에 대한 흥미가 없어지거나 즐거움을 느끼지 못했다",
    "잠들기가 어렵거나 자주 깼다 (혹은 너무 많이 잤다)",
    "평소보다 식욕이 줄었다 (혹은 평소보다 많이 먹었다)",
    "다른 사람들이 눈치 챌 정도로 평소보다 말과 행동이 느려졌다 (혹은 너무 안절부절 못해서 가만히 앉아있을 수 없다)",
    "피곤하고 기운이 없었다",
    "내가 잘못했거나, 실패했다는 생각이 들었다 (혹은 자신과 가족을 실망시켰다고 생각했다)",
    "신문을 읽거나 TV를 보는 것과 같은 일상적인 일에도 집중할 수가 없었다",
    "차라리 죽는 것이 더 낫겠다고 생각했다 (혹은 자해할 생각을 했다)",
  ];

  const phq9Options = [
    { label: "없음", score: 0 },
    { label: "2-6일", score: 1 },
    { label: "7-12일", score: 2 },
    { label: "거의 매일", score: 3 },
  ];

  // P4 states
  const [p4Answers, setP4Answers] = useState({
    q1: "",
    q2: "",
    q2_text: "",
    q3: "",
    q4: "",
    q4_text: "",
  });

  const isP4Valid = 
    p4Answers.q1 !== "" &&
    p4Answers.q2 !== "" &&
    (p4Answers.q2 === "없음" || (p4Answers.q2 === "있음" && p4Answers.q2_text.trim() !== "")) &&
    p4Answers.q3 !== "" &&
    p4Answers.q4 !== "" &&
    (p4Answers.q4 === "없음" || (p4Answers.q4 === "있음" && p4Answers.q4_text.trim() !== ""));

  // Pledge states
  const [signature, setSignature] = useState("");

  // Profile states
  const [profile, setProfile] = useState({
    nickname: "",
    ageGroup: "",
    gender: "",
    occupation: "",
    region: "",
    contact: "",
  });

  const isProfileValid = 
    profile.nickname.trim() !== "" && 
    profile.ageGroup !== "" && 
    profile.gender !== "" && 
    profile.occupation !== "" && 
    profile.region !== "";

  const handleProfileChange = (key: keyof typeof profile, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const ageGroups = ["10대", "20대", "30대", "40대", "50대", "60대 이상"];
  const genders = ["남성", "여성", "선택 안함"];
  const occupations = ["학생", "직장인", "자영업자", "주부", "무직/구직중", "기타"];
  const regions = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주", "세종"];

  const today = new Date();
  const formattedDate = `${today.getFullYear()}년 ${String(today.getMonth() + 1).padStart(2, "0")}월 ${String(today.getDate()).padStart(2, "0")}일`;

  const handleAuth = async () => {
    setAuthError("");
    if (!email || !password || (isSignUp && !nickname)) {
      setAuthError("모든 필드를 입력해주세요.");
      return;
    }

    try {
      if (role === "counselor") {
        setLoggedInUser({
          userId: "counselor-001",
          nickname: "상담사 지우",
          email: email
        });
        setStep("counselor_dashboard");
        return;
      }

      const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/login";
      const payload = isSignUp ? { email, password, nickname } : { email, password };

      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "인증에 실패했습니다.");
      }

      const data = await res.json();
      setLoggedInUser({ userId: data.user_id, nickname: data.nickname, email: data.email });
      setProfile(prev => ({ ...prev, nickname: data.nickname }));
      localStorage.setItem("mallang_user", JSON.stringify({ userId: data.user_id, nickname: data.nickname, email: data.email }));
      setStep("consent");
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const getP4Score = () => {
    let score = 0;
    if (p4Answers.q1 === "있음") score += 1;
    if (p4Answers.q2 === "있음") score += 1;
    if (p4Answers.q3 === "매우 그렇다" || p4Answers.q3 === "약간 그렇다") score += 1;
    if (p4Answers.q4 === "없음") score += 1;
    return score;
  };

  const p4Score = getP4Score();
  const totalScore = phq9Answers.reduce<number>((acc, curr) => (acc || 0) + (curr || 0), 0);

  const isHighRisk = p4Score >= 1 || totalScore >= 20;
  const isModerateRisk = !isHighRisk && totalScore >= 10 && totalScore <= 19;
  const isUserSelection = !isHighRisk && totalScore >= 5 && totalScore <= 9;
  const isLowRisk = !isHighRisk && totalScore >= 0 && totalScore <= 4;

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center p-4 font-sans text-gray-800">
      {/* Onboarding */}
      {step === "onboarding" && (
        <div className="max-w-4xl w-full flex flex-col items-center gap-8 animate-fade-in">
          {/* Central Main Card */}
          <div className="bg-white rounded-3xl p-10 shadow-[0_20px_50px_-20px_rgba(96,150,200,0.15)] flex flex-col items-center text-center max-w-lg w-full transform hover:scale-[1.02] transition-transform duration-300">
            <span className="text-7xl mb-4 animate-bounce-slow">🫧</span>
            <h1 className="text-4xl font-bold text-gray-900 mb-1">말랑해도 돼</h1>
            <p className="text-[#6096C8] font-bold text-sm tracking-widest mb-6">MIND-SAFE</p>
            <p className="text-gray-600 whitespace-pre-line leading-relaxed">
              {"임상 지식 기반 AI 정신건강 솔루션\n당신의 마음 곁에 항상 함께할게요 💙"}
            </p>
          </div>

          {/* Bottom Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
            <div className="bg-white rounded-2xl p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow flex flex-col items-center text-center border border-gray-50">
              <span className="text-3xl mb-3">🔍</span>
              <h3 className="font-bold text-gray-900 mb-1">과학적 진단</h3>
              <p className="text-xs text-gray-500 leading-relaxed">PHQ-9 기반 정확한 우울 위험도 측정</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow flex flex-col items-center text-center border border-gray-50">
              <span className="text-3xl mb-3">🤖</span>
              <h3 className="font-bold text-gray-900 mb-1">맞춤 페르소나</h3>
              <p className="text-xs text-gray-500 leading-relaxed">위험도에 따라 AI 상담사가 자동 연결</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow flex flex-col items-center text-center border border-gray-50">
              <span className="text-3xl mb-3">🛡️</span>
              <h3 className="font-bold text-gray-900 mb-1">안전 보장</h3>
              <p className="text-xs text-gray-500 leading-relaxed">고위험 감지 시 즉시 전문가 연결</p>
            </div>
          </div>

          {/* Bottom Buttons */}
          <div className="flex flex-col items-center gap-4 mt-2">
            <button
              onClick={() => setStep("select")}
              className="bg-gradient-to-r from-[#5B82B5] to-[#8B7BAD] text-white font-bold py-3.5 px-12 rounded-full shadow-[0_10px_20px_-5px_rgba(139,123,173,0.3)] hover:shadow-[0_12px_25px_-5px_rgba(139,123,173,0.4)] transform hover:translate-y-[-1px] transition-all duration-200 flex items-center gap-2 text-lg"
            >
              시작하기 →
            </button>
            <button className="text-sm text-gray-500 hover:text-gray-700 underline-offset-4 hover:underline transition-colors">
              이미 계정이 있으신가요? 로그인
            </button>
          </div>
        </div>
      )}

      {/* Select Role */}
      {step === "select" && (
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-[0_20px_50px_-20px_rgba(96,150,200,0.15)] flex flex-col items-center text-center animate-fade-in">
          <span className="text-5xl mb-4">🚪</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">로그인 유형을 선택해주세요</h2>
          <p className="text-sm text-gray-500 mb-8">당신에게 맞는 포털로 안내해 드릴게요</p>
          
          <div className="flex flex-col gap-4 w-full">
            <button
              onClick={() => {
                setRole("user");
                setStep("login");
              }}
              className="bg-[#F7F9FC] hover:bg-[#EBF1F9] text-gray-800 font-bold py-4 px-6 rounded-2xl border border-gray-100 transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">👤</span>
                <span>개인 사용자</span>
              </div>
              <span className="text-xl text-gray-400 group-hover:text-[#6096C8] transition-colors">→</span>
            </button>
            <button
              onClick={() => {
                setRole("counselor");
                setStep("login");
              }}
              className="bg-[#F7F9FC] hover:bg-[#EBF1F9] text-gray-800 font-bold py-4 px-6 rounded-2xl border border-gray-100 transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🩺</span>
                <span>상담사 포털</span>
              </div>
              <span className="text-xl text-gray-400 group-hover:text-[#8B7BAD] transition-colors">→</span>
            </button>
          </div>
          
          <button
            onClick={() => setStep("onboarding")}
            className="mt-8 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← 이전으로 돌아가기
          </button>
        </div>
      )}

      {/* Login */}
      {step === "login" && (
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-[0_20px_50px_-20px_rgba(96,150,200,0.15)] flex flex-col items-center text-center animate-fade-in">
          <span className="text-5xl mb-4">{role === "user" ? "💙" : "💜"}</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {role === "user" ? "사용자 로그인" : "상담사 로그인"}
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            {role === "user" ? "마음의 이야기를 들려주세요" : "전문가용 관리 화면입니다"}
          </p>
          
          <div className="flex flex-col gap-4 w-full">
            <div className="text-left w-full">
              <label className="text-xs font-bold text-gray-500 ml-1">이메일</label>
              <input
                type="text"
                placeholder="example@mallang.com"
                className="bg-[#F7F9FC] border border-gray-100 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#6096C8] transition-all w-full mt-1"
              />
            </div>
            <div className="text-left w-full">
              <label className="text-xs font-bold text-gray-500 ml-1">비밀번호</label>
              <input
                type="password"
                placeholder="••••••••"
                className="bg-[#F7F9FC] border border-gray-100 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#6096C8] transition-all w-full mt-1"
              />
            </div>
            <button
              onClick={() => {
                if (role === "user") {
                  setStep("consent");
                } else {
                  setStep("counselor_dashboard");
                }
              }}
              className="bg-gradient-to-r from-[#5B82B5] to-[#8B7BAD] text-white font-bold py-3.5 rounded-xl mt-4 shadow-md hover:shadow-lg transform hover:translate-y-[-1px] transition-all duration-200"
            >
              로그인
            </button>
          </div>
          
          <button
            onClick={() => setStep("select")}
            className="mt-8 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← 이전으로 돌아가기
          </button>
        </div>
      )}

      {/* Consent */}
      {step === "consent" && (
        <div className="max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-[0_20px_50px_-20px_rgba(96,150,200,0.15)] flex flex-col animate-fade-in">
          <div className="bg-gradient-to-r from-[#5B82B5] to-[#8B7BAD] p-6 text-white text-center">
            <h2 className="text-xl font-bold flex items-center justify-center gap-2">
              📋 서비스 이용 안내
            </h2>
            <p className="text-sm opacity-90 mt-1">안전한 서비스 이용을 위해 아래 내용을 확인해 주세요</p>
          </div>

          <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
            <div className="bg-[#FFFBF0] border-l-4 border-orange-400 p-4 rounded-r-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-orange-500 font-bold">⚠️</span>
                <h3 className="font-bold text-gray-900 text-sm">본 서비스는 의료 진단을 대체하지 않습니다</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                AI 상담은 정서적 지원을 목적으로 하며, 전문 의료인의 진단 및 치료를 대신할 수 없습니다. 위기 상황 시에는 반드시 전문 기관의 도움을 받으세요.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={agreements.privacy}
                      onChange={(e) => handleCheck("privacy", e.target.checked)}
                      className="w-5 h-5 accent-[#6096C8] rounded focus:ring-[#6096C8]"
                    />
                    <div>
                      <p className="font-bold text-sm text-gray-900">개인정보 수집 및 이용 동의 (필수)</p>
                      <p className="text-xs text-gray-500">대화 내용은 암호화되어 안전하게 보관됩니다</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPrivacyDetail(!showPrivacyDetail)}
                    className="text-xs text-[#6096C8] hover:underline"
                  >
                    {showPrivacyDetail ? "닫기 ∧" : "내용 보기 ∨"}
                  </button>
                </div>
                {showPrivacyDetail && (
                  <div className="mt-4 text-xs text-gray-600 bg-[#F7F9FC] p-3 rounded-lg animate-fade-in">
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="font-bold p-2 w-24 align-top">일반 정보</td>
                          <td className="p-2">닉네임, 이메일, 생년월일 (목적: 서비스 이용 및 맞춤화)</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="font-bold p-2 text-orange-600 align-top">민감 정보 (중요)</td>
                          <td className="p-2">PHQ-9/P4 결과, 자살방지 서약서, 챗봇 대화 내용, 감정 리포트 (목적: 우울 위험도 측정 및 고위험군 선별, AI 상담 제공)</td>
                        </tr>
                        <tr>
                          <td className="font-bold p-2 align-top">보유 기간</td>
                          <td className="p-2">서비스 탈퇴 시 즉시 파기</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={agreements.terms}
                      onChange={(e) => handleCheck("terms", e.target.checked)}
                      className="w-5 h-5 accent-[#6096C8] rounded focus:ring-[#6096C8]"
                    />
                    <div>
                      <p className="font-bold text-sm text-gray-900">서비스 이용약관 동의 (필수)</p>
                      <p className="text-xs text-gray-500">AI 상담 서비스 이용 규칙 및 이용자 권리 안내</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTermsDetail(!showTermsDetail)}
                    className="text-xs text-[#6096C8] hover:underline"
                  >
                                        {showTermsDetail ? "닫기 ∧" : "내용 보기 ∨"}
                  </button>
                </div>
                {showTermsDetail && (
                  <div className="mt-4 text-xs text-gray-600 bg-[#F7F9FC] p-3 rounded-lg leading-relaxed animate-fade-in">
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="font-bold p-2 w-24 align-top text-gray-800">제1조 (목적)</td>
                          <td className="p-2 text-gray-700">본 약관은 '말랑해도 돼'가 제공하는 AI 기반 정서적 지원 및 예방형 심리케어 서비스의 이용 조건을 규정합니다.</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="font-bold p-2 w-24 align-top text-gray-800">제2조 (한계)</td>
                          <td className="p-2 text-gray-700">본 서비스의 AI 챗봇 대화 및 분석 결과는 의학적 진단이나 전문 치료를 대체할 수 없으며, 예방 및 보조 도구로만 활용됩니다.</td>
                        </tr>
                        <tr>
                          <td className="font-bold p-2 w-24 align-top text-gray-800">제3조 (의무)</td>
                          <td className="p-2 text-gray-700">상담사나 AI 시스템에 대한 자해 방법 질문, 언어폭력, 악의적 시스템 마비 시도 시 이용이 제한될 수 있습니다.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={agreements.safety}
                      onChange={(e) => handleCheck("safety", e.target.checked)}
                      className="w-5 h-5 accent-[#6096C8] rounded focus:ring-[#6096C8]"
                    />
                    <div>
                      <p className="font-bold text-sm text-gray-900">안전 안내 확인 (필수)</p>
                      <p className="text-xs text-gray-500">위기 상황 발생 시 신속한 구호를 위한 긴급 연락망 및 기관 연계 안내입니다.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSafetyDetail(!showSafetyDetail)}
                    className="text-xs text-[#6096C8] hover:underline"
                  >
                                        {showSafetyDetail ? "닫기 ∧" : "내용 보기 ∨"}
                  </button>
                </div>
                {showSafetyDetail && (
                  <div className="mt-4 text-xs text-gray-600 bg-[#F7F9FC] p-3 rounded-lg leading-relaxed animate-fade-in">
                    사용자의 답변에서 자해 및 타해 위험이 감지될 경우, 사용자의 안전을 위해 등록된 비상 연락처 또는 유관 기관(1393 등)에 정보가 제공될 수 있음에 동의합니다.
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={agreements.counselorShare}
                      onChange={(e) => handleCheck("counselorShare", e.target.checked)}
                      className="w-5 h-5 accent-[#6096C8] rounded focus:ring-[#6096C8]"
                    />
                    <div>
                      <p className="font-bold text-sm text-gray-900">상담사 공유 동의 (필수)</p>
                      <p className="text-xs text-gray-500">안전한 심리 케어와 연계 상담을 위해 담당 상담사 포털에 내담자 데이터가 공유됩니다.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCounselorDetail(!showCounselorDetail)}
                    className="text-xs text-[#6096C8] hover:underline"
                  >
                                        {showCounselorDetail ? "닫기 ∧" : "내용 보기 ∨"}
                  </button>
                </div>
                {showCounselorDetail && (
                  <div className="mt-4 text-xs text-gray-600 bg-[#F7F9FC] p-3 rounded-lg animate-fade-in">
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="font-bold p-2 w-24 align-top">공유 목적</td>
                          <td className="p-2">내담자 위험도 실시간 모니터링, 상담 전 리포트 생성, 맞춤형 개입 가이드 적용</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="font-bold p-2 align-top">공유 항목</td>
                          <td className="p-2">PHQ-9점수, P4 결과, 자살방지 서약서 서명 및 내용, 챗봇 대화 로그 내 위험표현 및 인지 왜곡 빈도</td>
                        </tr>
                        <tr>
                          <td className="font-bold p-2 align-top">보유 기간</td>
                          <td className="p-2">서비스 탈퇴 시 또는 담당 상담사 배정 종료 시 즉시 파기</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={agreements.ageVerify}
                      onChange={(e) => handleCheck("ageVerify", e.target.checked)}
                      className="w-5 h-5 accent-[#6096C8] rounded focus:ring-[#6096C8]"
                    />
                    <div>
                      <p className="font-bold text-sm text-gray-900">만 14세 이상 이용가 및 청소년 정책 확인 (필수)</p>
                      <p className="text-xs text-gray-500">만 14세 이상 이용 가능자임을 확인하며, 청소년 고위험군 예방 방침에 동의합니다.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAgeDetail(!showAgeDetail)}
                    className="text-xs text-[#6096C8] hover:underline"
                  >
                                        {showAgeDetail ? "닫기 ∧" : "내용 보기 ∨"}
                  </button>
                </div>
                {showAgeDetail && (
                  <div className="mt-4 text-xs text-gray-600 bg-[#F7F9FC] p-3 rounded-lg leading-relaxed animate-fade-in">
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="p-2 text-gray-700">만 14세 미만의 아동은 본 서비스를 이용할 수 없습니다.</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-gray-700">만 19세 미만 청소년 사용자의 경우, 자해 및 자살 고위험군 플래그가 연속 감지되거나 극심한 위기 상황 판단 시 청소년상담복지센터 및 보호자(법정대리인) 측으로 긴급 연계 정책이 우선 적용될 수 있습니다.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2 border-t border-gray-100 pt-4">
              <input
                type="checkbox"
                checked={allAgreed}
                onChange={(e) => handleAllAgree(e.target.checked)}
                className="w-6 h-6 accent-[#6096C8] rounded focus:ring-[#6096C8]"
              />
              <label className="font-bold text-sm text-gray-900">
                위 항목에 모두 동의하며 서비스를 시작합니다
              </label>
            </div>

            <button
              onClick={() => {
                if (allAgreed) {
                  setStep("profile");
                }
              }}
              disabled={!allAgreed}
              className={`font-bold py-3.5 rounded-xl mt-2 transition-all duration-200 w-full flex items-center justify-center gap-2 ${allAgreed
                ? "bg-[#6096C8] hover:bg-[#5085B7] text-white shadow-md hover:shadow-lg transform hover:translate-y-[-1px]"
                : "bg-[#D1D5DB] text-white cursor-not-allowed"
                }`}
            >
              다음 단계로 →
            </button>

            <button
              onClick={() => setStep("login")}
              className="mt-6 text-sm text-gray-500 hover:text-gray-700 transition-colors self-center"
            >
              ← 이전으로 돌아가기
            </button>
          </div>
        </div>
      )}

      {/* Profile Input */}
      {step === "profile" && (
        <div className="max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-[0_20px_50px_-20px_rgba(96,150,200,0.15)] flex flex-col animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#5B82B5] to-[#8B7BAD] p-6 text-white relative">
            <div className="text-center">
              <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                👤 기본 정보 입력
              </h2>
              <p className="text-sm opacity-90 mt-1">맞춤 케어를 위해 간단한 정보를 알려주세요</p>
            </div>
            <span className="absolute top-6 right-6 text-sm font-bold opacity-80">1/4단계</span>
          </div>

          <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
            {/* Card 1: Nickname */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <label className="text-sm font-bold text-gray-700 block mb-2">닉네임 (앱에서 불릴 이름)</label>
              <input
                type="text"
                placeholder="예: 말랑이"
                value={profile.nickname}
                onChange={(e) => handleProfileChange("nickname", e.target.value)}
                className="bg-[#F7F9FC] border border-gray-100 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#8B7BAD] transition-all w-full"
              />
            </div>

            {/* Card 2: Age Group */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <label className="text-sm font-bold text-gray-700 block mb-2">연령대</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {ageGroups.map((age) => (
                  <button
                    key={age}
                    onClick={() => handleProfileChange("ageGroup", age)}
                    className={`py-2 text-xs font-medium rounded-lg transition-colors ${profile.ageGroup === age
                      ? "bg-[#6096C8] text-white"
                      : "bg-[#F7F9FC] text-gray-600 hover:bg-[#EBF1F9]"
                      }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>

            {/* Card 3: Gender */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <label className="text-sm font-bold text-gray-700 block mb-2">성별</label>
              <div className="grid grid-cols-3 gap-2">
                {genders.map((gender) => (
                  <button
                    key={gender}
                    onClick={() => handleProfileChange("gender", gender)}
                    className={`py-2 text-xs font-medium rounded-lg transition-colors ${profile.gender === gender
                      ? "bg-[#6096C8] text-white"
                      : "bg-[#F7F9FC] text-gray-600 hover:bg-[#EBF1F9]"
                      }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>

            {/* Card 4: Occupation */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <label className="text-sm font-bold text-gray-700 block mb-2">직업</label>
              <select
                value={profile.occupation}
                onChange={(e) => handleProfileChange("occupation", e.target.value)}
                className="bg-[#F7F9FC] border border-gray-100 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#8B7BAD] transition-all w-full text-sm text-gray-600"
              >
                <option value="" disabled>선택해주세요</option>
                {occupations.map((occ) => (
                  <option key={occ} value={occ}>{occ}</option>
                ))}
              </select>
            </div>

            {/* Card 5: Region */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <label className="text-sm font-bold text-gray-700 block mb-2">거주 지역 (공공서비스 연계용)</label>
              <select
                value={profile.region}
                onChange={(e) => handleProfileChange("region", e.target.value)}
                className="bg-[#F7F9FC] border border-gray-100 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#8B7BAD] transition-all w-full text-sm text-gray-600"
              >
                <option value="" disabled>선택해주세요</option>
                {regions.map((reg) => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
            </div>

            {/* Card 6: Contact */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <label className="text-sm font-bold text-gray-700 block mb-1">비상연락처 (선택)</label>
              <p className="text-xs text-gray-500 mb-2">위기 상황 시 알림을 보낼 연락처예요</p>
              <input
                type="text"
                placeholder="예: 010-1234-5678"
                value={profile.contact}
                onChange={(e) => handleProfileChange("contact", e.target.value)}
                className="bg-[#F7F9FC] border border-gray-100 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#8B7BAD] transition-all w-full"
              />
            </div>

            {/* Next Button */}
            <button
              onClick={() => {
                if (isProfileValid) {
                  setStep("phq9");
                }
              }}
              disabled={!isProfileValid}
              className={`font-bold py-3.5 rounded-xl mt-2 transition-all duration-200 w-full flex items-center justify-center gap-2 ${isProfileValid
                ? "bg-[#6096C8] hover:bg-[#5085B7] text-white shadow-md hover:shadow-lg transform hover:translate-y-[-1px]"
                : "bg-[#D1D5DB] text-white cursor-not-allowed"
                }`}
            >
              다음: PHQ-9 자가진단 →
            </button>

            <button
              onClick={() => setStep("consent")}
              className="mt-6 text-sm text-gray-500 hover:text-gray-700 transition-colors self-center"
            >
              ← 이전으로 돌아가기
            </button>
          </div>
        </div>
      )}

      {/* PHQ-9 Survey */}
      {step === "phq9" && (
        <div className="max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-[0_20px_50px_-20px_rgba(96,150,200,0.15)] flex flex-col animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#5B82B5] to-[#8B7BAD] p-6 text-white relative">
            <div className="text-center">
              <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                📋 PHQ-9 우울 자가진단
              </h2>
              <p className="text-sm opacity-90 mt-1">지난 2주 동안 아래 문제들로 얼마나 불편했나요?</p>
            </div>
            <span className="absolute top-6 right-6 text-sm font-bold opacity-80">2/4단계</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-100 h-2">
            <div 
              className="bg-[#6096C8] h-full transition-all duration-300" 
              style={{ width: `${((currentQuestionIndex + 1) / 9) * 100}%` }}
            ></div>
          </div>
          <div className="text-right text-xs text-gray-500 px-6 mt-2">
            {currentQuestionIndex + 1} / 9 완료
          </div>

          <div className="p-6 flex flex-col gap-6">
            {/* Question Card */}
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col items-center text-center gap-4">
              <div className="w-10 h-10 bg-[#6096C8] text-white rounded-full flex items-center justify-center font-bold">
                Q{currentQuestionIndex + 1}
              </div>
              <p className="text-lg font-bold text-gray-900 leading-relaxed">
                {phq9Questions[currentQuestionIndex]}
              </p>
            </div>

            {/* Answer Buttons */}
            <div className="flex flex-col gap-3">
              {phq9Options.map((option) => {
                const isSelected = phq9Answers[currentQuestionIndex] === option.score;
                return (
                  <button
                    key={option.score}
                    onClick={() => {
                      const newAnswers = [...phq9Answers];
                      newAnswers[currentQuestionIndex] = option.score;
                      setPhq9Answers(newAnswers);
                    }}
                    className={`p-4 rounded-xl text-left font-bold text-sm transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-[#6096C8] text-white shadow-md"
                        : "bg-white border border-[#E5EEF7] text-gray-600 hover:bg-[#F7F9FC]"
                    }`}
                  >
                    <span>{option.label} · {option.score}점</span>
                    {isSelected && <span>✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-2">
              <button
                onClick={() => {
                  if (currentQuestionIndex > 0) {
                    setCurrentQuestionIndex(currentQuestionIndex - 1);
                  } else {
                    setStep("profile");
                  }
                }}
                className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                ← 이전
              </button>
              <button
                onClick={() => {
                  if (currentQuestionIndex < 8) {
                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                  } else {
                    setStep("p4");
                  }
                }}
                disabled={phq9Answers[currentQuestionIndex] === null}
                className={`flex-1 font-bold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                  phq9Answers[currentQuestionIndex] !== null
                    ? "bg-[#6096C8] hover:bg-[#5085B7] text-white shadow-md hover:shadow-lg transform hover:translate-y-[-1px]"
                    : "bg-[#D1D5DB] text-white cursor-not-allowed"
                }`}
              >
                {currentQuestionIndex === 8 ? "다음: P4 Screener →" : "다음 →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* P4 Screener */}
      {step === "p4" && (
        <div className="max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-[0_20px_50px_-20px_rgba(96,150,200,0.15)] flex flex-col animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#5B82B5] to-[#8B7BAD] p-6 text-white relative">
            <div className="text-center">
              <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                🔍 P4 심층 스크리닝
              </h2>
              <p className="text-sm opacity-90 mt-1">조금 더 구체적인 상태를 확인할게요</p>
            </div>
            <span className="absolute top-6 right-6 text-sm font-bold opacity-80">3/4단계</span>
          </div>

          <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
            {/* Notice Box */}
            <div className="bg-[#EEF4FF] border-l-4 border-[#6096C8] p-4 rounded-r-xl">
              <p className="text-sm text-gray-700 leading-relaxed">
                아래 질문들은 더 정확한 맞춤 케어를 위한 질문이에요.<br />
                솔직하게 답해주실수록 더 잘 도와드릴 수 있어요 💙
              </p>
            </div>

            {/* Card 1 */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-sm font-bold text-gray-900 mb-3">1. 이전에 당신을 위험에 빠뜨리는 행동을 한 적이 있습니까?</p>
              <div className="grid grid-cols-2 gap-3">
                {["없음", "있음"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setP4Answers({ ...p4Answers, q1: opt })}
                    className={`py-2.5 text-sm font-bold rounded-lg transition-colors ${
                      p4Answers.q1 === opt
                        ? "bg-[#6096C8] text-white"
                        : "bg-[#F7F9FC] text-gray-600 hover:bg-[#EBF1F9]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-sm font-bold text-gray-900 mb-3">2. 당신 자신을 정말 해칠 방법에 대해 지금도 생각을 하고 있습니까?</p>
              <div className="grid grid-cols-2 gap-3">
                {["없음", "있음"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setP4Answers({ ...p4Answers, q2: opt })}
                    className={`py-2.5 text-sm font-bold rounded-lg transition-colors ${
                      p4Answers.q2 === opt
                        ? "bg-[#6096C8] text-white"
                        : "bg-[#F7F9FC] text-gray-600 hover:bg-[#EBF1F9]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {p4Answers.q2 === "있음" && (
                <div className="mt-3 animate-fade-in">
                  <label className="text-xs font-bold text-gray-500 block mb-1">2-1. 있다면, 어떤 식으로 생각하셨나요? (자유롭게 적어주세요)</label>
                  <textarea
                    placeholder="여기에 적어주세요"
                    value={p4Answers.q2_text}
                    onChange={(e) => setP4Answers({ ...p4Answers, q2_text: e.target.value })}
                    className="bg-[#F7F9FC] border border-gray-100 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#8B7BAD] transition-all w-full text-sm h-20"
                  />
                </div>
              )}
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-sm font-bold text-gray-900 mb-3">3. 생각하는 것과 생각을 행동에 옮기는 것은 큰 차이가 있습니다. 앞으로 한 달 내에는 어느 때라도 당신 자신을 해치거나 당신의 삶을 끝내겠다는 그 생각을 행동으로 옮길 것 같습니까?</p>
              <div className="grid grid-cols-3 gap-2">
                {["전혀 아니다", "약간 그렇다", "매우 그렇다"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setP4Answers({ ...p4Answers, q3: opt })}
                    className={`py-2.5 text-xs font-bold rounded-lg transition-colors ${
                      p4Answers.q3 === opt
                        ? "bg-[#6096C8] text-white"
                        : "bg-[#F7F9FC] text-gray-600 hover:bg-[#EBF1F9]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-sm font-bold text-gray-900 mb-3">4. 당신 자신을 해치려는 당신의 행동을 멈추게 하거나 하지 못하게 막는 것이 있습니까?</p>
              <div className="grid grid-cols-2 gap-3">
                {["없음", "있음"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setP4Answers({ ...p4Answers, q4: opt })}
                    className={`py-2.5 text-sm font-bold rounded-lg transition-colors ${
                      p4Answers.q4 === opt
                        ? "bg-[#6096C8] text-white"
                        : "bg-[#F7F9FC] text-gray-600 hover:bg-[#EBF1F9]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {p4Answers.q4 === "있음" && (
                <div className="mt-3 animate-fade-in">
                  <label className="text-xs font-bold text-gray-500 block mb-1">4-1. 있다면, 무엇입니까? (예: 가족, 신앙, 반려동물 등 자유롭게 적어주세요)</label>
                  <textarea
                    placeholder="여기에 적어주세요"
                    value={p4Answers.q4_text}
                    onChange={(e) => setP4Answers({ ...p4Answers, q4_text: e.target.value })}
                    className="bg-[#F7F9FC] border border-gray-100 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#8B7BAD] transition-all w-full text-sm h-20"
                  />
                </div>
              )}
            </div>

            {/* Next Button */}
            <button
              onClick={() => {
                if (isP4Valid) {
                  setStep("pledge");
                }
              }}
              disabled={!isP4Valid}
              className={`font-bold py-3.5 rounded-xl mt-2 transition-all duration-200 w-full flex items-center justify-center gap-2 ${
                isP4Valid
                  ? "bg-[#6096C8] hover:bg-[#5085B7] text-white shadow-md hover:shadow-lg transform hover:translate-y-[-1px]"
                  : "bg-[#D1D5DB] text-white cursor-not-allowed"
              }`}
            >
              다음: 서약서 작성 →
            </button>

            <button
              onClick={() => setStep("phq9")}
              className="mt-6 text-sm text-gray-500 hover:text-gray-700 transition-colors self-center"
            >
              ← 이전으로 돌아가기
            </button>
          </div>
        </div>
      )}

      {/* Pledge Screen */}
      {step === "pledge" && (
        <div className="max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-[0_20px_50px_-20px_rgba(96,150,200,0.15)] flex flex-col animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#5B82B5] to-[#8B7BAD] p-6 text-white relative">
            <div className="text-center">
              <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                생명존중(자살방지) 안전 서약서
              </h2>
              <p className="text-sm opacity-90 mt-1">당신의 안전을 위한 약속을 함께 해요</p>
            </div>
            <span className="absolute top-6 right-6 text-sm font-bold opacity-80">4/4단계</span>
          </div>

          <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
            {/* Main Pledge Card */}
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col items-center gap-4">
              <span className="text-5xl">💙</span>
              <h3 className="text-lg font-bold text-gray-900">나는 나 자신과 약속합니다</h3>
              
              <div className="flex flex-col gap-3 text-sm text-gray-700 w-full">
                <div className="flex gap-2">
                  <span className="text-[#6096C8]">✓</span>
                  <p>나는 절대로 자살하지 않을 것이며, 자해나 자살을 시도하지도 않을 것을 서약합니다. 나는 자살하고 싶은 생각이 들면 반드시 (가족, 친구, 상담자, 성직자)에게 먼저 말할 것입니다. 만일 이 사람들을 만날 수 없으면 전화를 하거나 주위 사람에게 도움을 청하겠습니다.</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-[#6096C8]">✓</span>
                  <p>나는 충분한 휴식과 수면을 취하고 잘 먹을 것을 서약합니다.</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-[#6096C8]">✓</span>
                  <p>나는 자살 할 수 있는 모든 도구를 없앨 것을 서약합니다.</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-[#6096C8]">✓</span>
                  <p className="whitespace-pre-line">{"나는 조금이라도 기분이 이상하면 반드시\n\n📞자살예방상담전화 109\n📞한국생명의전화 1588-9191\n\n로 전화를 걸거나 어떠한 수단을 써서라도 알리겠습니다. 이 사실을 알리기 전에는 절대로 아무런 행동을 하지 않을 것을 서약합니다."}</p>
                </div>
              </div>
            </div>

            {/* Signature Area */}
            <div className="flex flex-col gap-4">
              <div className="text-center text-sm font-bold text-gray-600">
                {formattedDate}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Client Signature */}
                <div className="bg-[#F7F9FC] border border-dashed border-gray-300 rounded-xl p-4 flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500">내담자 서명</label>
                  <input
                    type="text"
                    placeholder="닉네임 또는 성명"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    className="bg-transparent border-b border-gray-300 focus:outline-none focus:border-[#8B7BAD] transition-all py-1 text-center font-serif italic text-lg text-gray-800"
                  />
                </div>
                
                {/* Counselor Signature */}
                <div className="bg-[#F7F9FC] border border-dashed border-gray-300 rounded-xl p-4 flex flex-col gap-2 items-center justify-center relative overflow-hidden">
                  <label className="text-xs font-bold text-gray-500 absolute top-4 left-4">상담자 서명</label>
                  <div className="text-sm font-bold text-gray-400 mt-4">
                    말랑해도 돼 서비스 운영팀
                  </div>
                  {/* Mock Seal */}
                  <div className="absolute right-4 bottom-4 w-10 h-10 border-2 border-red-400 rounded-full flex items-center justify-center text-red-400 font-bold text-xs transform rotate-12 opacity-80">
                    인
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => {
                if (signature.trim() !== "") {
                  setStep("result");
                }
              }}
              disabled={signature.trim() === ""}
              className={`font-bold py-3.5 rounded-xl mt-2 transition-all duration-200 w-full flex items-center justify-center gap-2 ${
                signature.trim() !== ""
                  ? "bg-gradient-to-r from-[#5B82B5] to-[#8B7BAD] text-white shadow-md hover:shadow-lg transform hover:translate-y-[-1px]"
                  : "bg-[#D1D5DB] text-white cursor-not-allowed"
              }`}
            >
              서약하고 시작하기 💙
            </button>

            <button
              onClick={() => setStep("p4")}
              className="mt-6 text-sm text-gray-500 hover:text-gray-700 transition-colors self-center"
            >
              ← 이전으로 돌아가기
            </button>
          </div>
        </div>
      )}

      {/* Result Screen */}
      {step === "result" && (
        <div className={`max-w-3xl w-full rounded-3xl overflow-hidden shadow-[0_20px_50px_-20px_rgba(96,150,200,0.15)] flex flex-col animate-fade-in ${
          isHighRisk ? "bg-[#1A2744] text-white" : "bg-white text-gray-800"
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-[#5B82B5] to-[#8B7BAD] p-6 text-white text-center">
            <h2 className="text-xl font-bold flex items-center justify-center gap-2">
              당신의 마음 검사 결과입니다
            </h2>
          </div>

          <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[75vh]">
            {/* Score Selector for Testing */}
            <div className={`p-3 rounded-xl flex flex-wrap gap-2 text-xs justify-center items-center shadow-inner ${isHighRisk ? "bg-[#2A3B5C]" : "bg-gray-50"}`}>
              <span className="font-bold mr-1">🧪 시나리오 테스트용 점수 강제 세팅:</span>
              <button onClick={() => { setPhq9Answers(Array(9).fill(0)); setP4Answers({ q1: "없음", q2: "없음", q2_text: "", q3: "전혀 아니다", q4: "있음", q4_text: "" }); }} className="px-2.5 py-1 bg-white text-gray-700 rounded-lg shadow-sm hover:bg-gray-100 hover:scale-[1.05] transition-all font-semibold">🟢 0~4점 (저위험 또치)</button>
              <button onClick={() => { setPhq9Answers([1,2,1,2,0,0,1,0,0]); setP4Answers({ q1: "없음", q2: "없음", q2_text: "", q3: "전혀 아니다", q4: "있음", q4_text: "" }); }} className="px-2.5 py-1 bg-white text-gray-700 rounded-lg shadow-sm hover:bg-gray-100 hover:scale-[1.05] transition-all font-semibold">🟡 5~9점 (자율 선택)</button>
              <button onClick={() => { setPhq9Answers([2,2,2,2,2,2,0,0,2]); setP4Answers({ q1: "없음", q2: "없음", q2_text: "", q3: "전혀 아니다", q4: "있음", q4_text: "" }); }} className="px-2.5 py-1 bg-white text-gray-700 rounded-lg shadow-sm hover:bg-gray-100 hover:scale-[1.05] transition-all font-semibold">🔵 10~19점 (지우 상담)</button>
              <button onClick={() => { setPhq9Answers(Array(9).fill(3)); setP4Answers({ q1: "있음", q2: "있음", q2_text: "위기", q3: "매우 그렇다", q4: "없음", q4_text: "없음" }); }} className="px-2.5 py-1 bg-white text-gray-700 rounded-lg shadow-sm hover:bg-gray-100 hover:scale-[1.05] transition-all font-semibold">🔴 P4 1+ 또는 PHQ 20+ (고위험 클로)</button>
            </div>

            {/* 1. 고위험군 (High Risk - Cloe) */}
            {isHighRisk && (
              <div className="bg-[#2A3B5C] border border-gray-700 rounded-2xl p-6 flex flex-col items-center text-center gap-5 shadow-lg">
                <span className="bg-[#EF4444] text-white px-4 py-1.5 rounded-full text-xs font-black animate-pulse shadow-md">
                  🚨 고위험 · 즉각 위기 개입 필요
                </span>
                <div>
                  <h3 className="text-2xl font-black">PHQ-9 {totalScore}점 · P4 {p4Score}점</h3>
                  <p className="text-sm text-gray-300 mt-2 leading-relaxed">
                    당신의 안전을 위해 위기 대응 안전 모드로 즉각 전환합니다.<br />
                    어시스턴트 클로가 긴급 지원 절차를 안내하고 안전대처 계획 수립을 도울 것입니다.
                  </p>
                </div>
                <img src="/어시스턴트 클로.png" alt="어시스턴트 클로" className="w-32 h-32 object-contain my-1 filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />

                {/* Crisis Emergency Contact Hotline Buttons */}
                <div className="flex flex-col gap-2.5 w-full mt-2">
                  <a href="tel:1393" className="bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-between shadow-md hover:scale-[1.01]">
                    <span>📞 1393 자살예방 상담전화 (24시간)</span>
                    <span className="font-extrabold">지금 연결 →</span>
                  </a>
                  <a href="tel:1577-0199" className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-between shadow-md hover:scale-[1.01]">
                    <span>📞 1577-0199 정신건강 위기상담전화</span>
                    <span className="font-extrabold">지금 연결 →</span>
                  </a>
                  <a href="tel:119" className="bg-[#4B5563] hover:bg-[#374151] text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-between shadow-md hover:scale-[1.01]">
                    <span>📞 119 안전신고센터 및 긴급구조</span>
                    <span className="font-extrabold">지금 연결 →</span>
                  </a>
                </div>

                <div className="bg-[#1A2744] border border-gray-700 rounded-xl p-4 w-full text-left mt-2">
                  <h4 className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1">🛡️ 어시스턴트 클로 위기 개입 프로토콜</h4>
                  <ul className="text-xs text-gray-200 space-y-1.5 list-disc list-inside">
                    <li>심리적 응급처치(Psychological First Aid) 대화 진행</li>
                    <li>사용자 안전 서약서 작성 및 긴급 안전망 재구축</li>
                    <li>위기대처 세부 행동 계획(Crisis Action Plan) 수립</li>
                    <li>정신건강 전문의 및 오프라인 긴급 안전 전문가 유치 지원</li>
                  </ul>
                </div>

                <button
                  onClick={() => { setInitialPersona(3); setStep("chat"); }}
                  className="font-bold py-4 px-8 rounded-xl transition-all duration-300 w-full mt-4 shadow-lg bg-white text-[#1A2744] hover:bg-gray-100 hover:scale-[1.01]"
                >
                  클로와 안전 가이드 대화 시작하기 🤍
                </button>
              </div>
            )}

            {/* 2. 중등도 위험군 (Moderate Risk - Jiwoo) */}
            {isModerateRisk && (
              <div className="bg-[#EEF4FF] border border-[#DBEAFE] rounded-2xl p-6 flex flex-col items-center text-center gap-5 shadow-md">
                <span className="bg-[#DBEAFE] text-[#1D4ED8] px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
                  🔵 중등도 위험 · 전문 심리 상담 모드
                </span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">PHQ-9 {totalScore}점 · P4 {p4Score}점</h3>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                    마음의 그늘이 조금 깊어져 전문적인 지원이 도움이 되는 단계입니다.<br />
                    상담사 지우와 1:1 심층 상담을 통해 당신의 마음을 안전하게 성찰해봐요.
                  </p>
                </div>
                <img src="/상담사 지우.png" alt="상담사 지우" className="w-32 h-32 object-contain my-1" />

                <div className="bg-white rounded-xl p-4 w-full text-left text-xs text-gray-500 flex gap-2">
                  <span>💡</span>
                  <p>
                    성찰과 치유를 목적으로 하는 CBT-ACT(인지행동치료/수용전념치료) 기반의 대화를 진행합니다.<br />
                    상태에 따라 토닥 민트 선생님이 추가적으로 지원을 도울 수 있습니다.
                  </p>
                </div>

                <button
                  onClick={() => { setInitialPersona(2); setStep("chat"); }}
                  className="font-bold py-3.5 px-8 rounded-xl transition-all duration-300 w-full mt-2 shadow-md bg-[#6096C8] hover:bg-[#5085B7] text-white hover:scale-[1.01]"
                >
                  지우와 심층 심리상담 시작하기 →
                </button>
              </div>
            )}

            {/* 3. 정상 ~ 경도 위험군 (User Selection - 통합 노드) */}
            {isUserSelection && (
              <div className="bg-white rounded-2xl p-6 flex flex-col items-center text-center gap-6 border border-gray-100 shadow-sm">
                <span className="bg-[#FFF3C4] text-[#D97706] px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
                  🟡 정상 ~ 경도 위험 · 자율 선택 케어
                </span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">PHQ-9 {totalScore}점 · P4 {p4Score}점</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    경미한 우울이나 일시적인 정서적 무거움이 관찰되는 단계입니다.<br />
                    오늘의 기분과 고민 영역에 맞는 챗봇을 직접 선택하여 대화를 시작해보세요.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-2">
                  {/* Card A: Tochi */}
                  <div className="bg-[#FFFDF5] border-2 border-[#FEF3C7] rounded-2xl p-5 flex flex-col items-center justify-between gap-3 shadow-sm hover:shadow-md hover:scale-[1.03] transition-all duration-300">
                    <span className="text-4xl">🦔</span>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">고슴도치 또치</h4>
                      <p className="text-[11px] text-[#B7791F] font-semibold mt-1">따뜻한 위로와 친근한 대화</p>
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                        다정한 정서적 래포 형성과 일상의 따뜻한 이야기를 나눕니다.
                      </p>
                    </div>
                    <button
                      onClick={() => { setInitialPersona(1); setStep("chat"); }}
                      className="w-full bg-[#D97706] hover:bg-[#B75A00] text-white text-xs font-bold py-2.5 rounded-xl mt-2 transition-colors shadow-sm"
                    >
                      또치 선택
                    </button>
                  </div>

                  {/* Card B: Mint Mentor */}
                  <div className="bg-[#ECFDF5] border-2 border-[#D1FAE5] rounded-2xl p-5 flex flex-col items-center justify-between gap-3 shadow-sm hover:shadow-md hover:scale-[1.03] transition-all duration-300">
                    <span className="text-4xl">🌿</span>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">토닥 민트 선생님</h4>
                      <p className="text-[11px] text-[#065F46] font-semibold mt-1">인지 왜곡 및 부정 생각 정리</p>
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                        생각 오류를 소크라테스식 문답으로 스스로 고치도록 유도합니다.
                      </p>
                    </div>
                    <button
                      onClick={() => { setInitialPersona(4); setStep("chat"); }}
                      className="w-full bg-[#10B981] hover:bg-[#047857] text-white text-xs font-bold py-2.5 rounded-xl mt-2 transition-colors shadow-sm"
                    >
                      민트 선생님 선택
                    </button>
                  </div>

                  {/* Card C: Gardener Hyunsu */}
                  <div className="bg-[#FDF4FF] border-2 border-[#FAE8FF] rounded-2xl p-5 flex flex-col items-center justify-between gap-3 shadow-sm hover:shadow-md hover:scale-[1.03] transition-all duration-300">
                    <span className="text-4xl">🏡</span>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">마음치유 가드너 현수</h4>
                      <p className="text-[11px] text-[#86198F] font-semibold mt-1">웰니스 가이드 및 명상</p>
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                        스트레스를 완화하고 차분하게 감정 일기 작성을 지원합니다.
                      </p>
                    </div>
                    <button
                      onClick={() => { setInitialPersona(5); setStep("chat"); }}
                      className="w-full bg-[#D946EF] hover:bg-[#A21CAF] text-white text-xs font-bold py-2.5 rounded-xl mt-2 transition-colors shadow-sm"
                    >
                      가드너 현수 선택
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. 최소 우울 (Low Risk - Tochi) */}
            {isLowRisk && (
              <div className="bg-[#FFFBF0] border border-[#FEF3C7] rounded-2xl p-6 flex flex-col items-center text-center gap-5 shadow-md">
                <span className="bg-[#FFF3C4] text-[#D97706] px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
                  🟢 저위험 · 안정적인 정서 상태
                </span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">PHQ-9 {totalScore}점 · P4 {p4Score}점</h3>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                    정서적으로 비교적 매우 안정된 상태로 감지되었습니다.<br />
                    고슴도치 또치와 즐거운 이야기를 나누고 소중한 감정 자원을 충전해봐요.
                  </p>
                </div>
                <img src="/고슴도치 또치.png" alt="고슴도치 또치" className="w-32 h-32 object-contain my-1" />

                <button
                  onClick={() => { setInitialPersona(1); setStep("chat"); }}
                  className="font-bold py-3.5 px-8 rounded-xl transition-all duration-300 w-full mt-2 shadow-md bg-[#FFF3C4] hover:bg-[#FDE68A] text-[#D97706] hover:scale-[1.01]"
                >
                  또치와 대화 시작하기 →
                </button>
              </div>
            )}

            <button
              onClick={() => setStep("pledge")}
              className={`mt-4 text-xs transition-colors self-center font-semibold ${isHighRisk ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-700"}`}
            >
              ← 이전으로 돌아가기
            </button>
          </div>
        </div>
      )}

      {/* Chat Screen */}
      {step === "chat" && (
        <div className="w-full max-w-6xl mx-auto p-4 flex justify-center items-center min-h-screen">
          <UserFlow initialPersona={initialPersona} onEndChat={() => setStep("journal")} />
        </div>
      )}

      {/* Emotional Journal Screen */}
      {step === "journal" && (
        <div className="max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-[0_20px_50px_-20px_rgba(96,150,200,0.15)] flex flex-col animate-fade-in border border-gray-100">
          <div className="bg-gradient-to-r from-[#5B82B5] to-[#8B7BAD] p-6 text-white text-center">
            <h2 className="text-xl font-bold flex items-center justify-center gap-2">
              ✏️ 오늘의 마음 일기 작성
            </h2>
            <p className="text-xs opacity-90 mt-1">오늘 챗봇과의 대화를 돌아보며 감정을 기록해 보세요</p>
          </div>

          <div className="p-6 flex flex-col gap-5">
            <div className="bg-[#F7F9FC] rounded-2xl p-5 border border-gray-100">
              <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1">
                🌱 일기를 쓰며 생각을 정리해 볼까요?
              </h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                오늘 챗봇과 나눈 감정과 떠오르는 생각들, 지금 마음에 남아있는 느낌들을 자유롭게 적어보세요. 
                글을 쓰는 과정 자체만으로도 마음의 짐이 한결 가벼워지고 인지적인 환기가 이루어질 수 있답니다.
              </p>
            </div>

            {journalWarning && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-xs flex flex-col gap-1.5 animate-pulse">
                <span className="font-bold flex items-center gap-1">⚠️ 안전 경고 및 위기 전환 안내</span>
                <p className="leading-relaxed font-medium">
                  {journalWarning}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-500 flex justify-between">
                <span>일기 내용 (최소 10자 이상 권장)</span>
                <span className="text-gray-400">{diaryText.length}자</span>
              </label>
              <textarea
                value={diaryText}
                onChange={(e) => setDiaryText(e.target.value)}
                placeholder="여기에 오늘 하루의 마음과 대화 소감을 솔직하게 채워주세요... (예: 오늘 또치와 이야기 나누며 마음이 한결 편안해졌어요. 걱정이 가라앉는 기분이에요.)"
                className="w-full h-44 p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6096C8] focus:border-transparent text-sm resize-none leading-relaxed transition-all shadow-inner text-gray-800"
              />
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setStep("chat")}
                className="flex-1 bg-white border border-gray-200 text-gray-600 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                ← 대화로 돌아가기
              </button>
              <button
                onClick={() => {
                  const riskKeywords = ["죽고 싶", "자살", "자해", "끝내고 싶", "수면제", "사라지고", "약 먹고"];
                  const hasRisk = riskKeywords.some(kw => diaryText.includes(kw));

                  if (hasRisk) {
                    setJournalWarning("작성하신 내용에서 안전이 깊이 우려되는 위험 단어 또는 표현이 포착되었습니다. 지금은 혼자 글을 쓰는 것보다, 당신의 안전을 절대적으로 수호해 주는 어시스턴트 클로와의 안전 가이드 대화로 즉시 전환합니다. 🤍");
                    setTimeout(() => {
                      setJournalWarning("");
                      setInitialPersona(3); // 클로 강제 전환
                      setStep("chat");
                    }, 5000);
                  } else {
                    setStep("report");
                  }
                }}
                disabled={diaryText.trim().length === 0}
                className={`flex-1 font-bold py-3.5 rounded-xl transition-all text-sm shadow-md text-white ${
                  diaryText.trim().length === 0
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-[#6096C8] hover:bg-[#5085B7]"
                }`}
              >
                일기 제출 및 리포트 확인 →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emotion Report Screen */}
      {step === "report" && (
        <div className="w-full max-w-6xl mx-auto p-4 flex justify-center items-center min-h-screen">
          <EmotionReport onContinueChat={() => setStep("chat")} />
        </div>
      )}

      {/* Counselor Portal */}
      {(step === "counselor_dashboard" || step === "counselor_clients" || step === "counselor_report" || step === "counselor_guide" || step === "counselor_settings") && (
        <div className="flex min-h-screen w-full bg-[#F7F9FC]">
          {/* Sidebar */}
          <div className="w-[240px] bg-[#1E2D4E] text-white flex flex-col justify-between p-4 fixed h-screen top-0 left-0">
            {/* Top: Logo & Menu */}
            <div>
              <div className="flex items-center gap-2 mb-8 p-2">
                <span className="text-2xl">🫧</span>
                <div>
                  <h1 className="font-bold text-lg">말랑해도 돼</h1>
                  <p className="text-xs text-gray-400">상담사 포털</p>
                </div>
              </div>

              {/* Menu */}
              <nav className="flex flex-col gap-1">
                <button 
                  onClick={() => setStep("counselor_dashboard")} 
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors text-sm font-medium ${
                    step === "counselor_dashboard" ? "bg-[#2D4A7A] text-white" : "text-gray-400 hover:text-white hover:bg-[#2D4A7A]/50"
                  }`}
                >
                  <span className="text-base">📊</span> 대시보드
                </button>
                <button 
                  onClick={() => setStep("counselor_clients")} 
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors text-sm font-medium ${
                    step === "counselor_clients" ? "bg-[#2D4A7A] text-white" : "text-gray-400 hover:text-white hover:bg-[#2D4A7A]/50"
                  }`}
                >
                  <span className="text-base">👥</span> 내담자 목록
                </button>
                <button 
                  onClick={() => setStep("counselor_report")} 
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors text-sm font-medium ${
                    step === "counselor_report" ? "bg-[#2D4A7A] text-white" : "text-gray-400 hover:text-white hover:bg-[#2D4A7A]/50"
                  }`}
                >
                  <span className="text-base">📋</span> 리포트
                </button>
                <button 
                  onClick={() => setStep("counselor_guide")} 
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors text-sm font-medium ${
                    step === "counselor_guide" ? "bg-[#2D4A7A] text-white" : "text-gray-400 hover:text-white hover:bg-[#2D4A7A]/50"
                  }`}
                >
                  <span className="text-base">🧭</span> 개입 가이드
                </button>
                <button 
                  onClick={() => setStep("counselor_settings")} 
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors text-sm font-medium ${
                    step === "counselor_settings" ? "bg-[#2D4A7A] text-white" : "text-gray-400 hover:text-white hover:bg-[#2D4A7A]/50"
                  }`}
                >
                  <span className="text-base">⚙️</span> 설정
                </button>
              </nav>
            </div>

            {/* Bottom: Hotline & Logout */}
            <div className="flex flex-col gap-3">
              <a 
                href="tel:1393" 
                className="bg-[#EF4444] hover:bg-[#DC2626] text-white p-3 rounded-xl flex flex-col items-center text-center transition-colors shadow-lg shadow-red-900/20"
              >
                <span className="font-bold flex items-center gap-1 text-sm">🚨 긴급 핫라인</span>
                <span className="text-[10px] opacity-90 mt-0.5">1393 · 1577-0199 · 119</span>
              </a>
              <button 
                onClick={() => setStep("onboarding")}
                className="text-xs text-gray-400 hover:text-white mt-1 p-2 text-center transition-colors hover:underline"
              >
                로그아웃
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 ml-[240px] p-8">
            <div className="max-w-6xl mx-auto">
              {step === "counselor_dashboard" && <CounselorDashboard />}
              {step === "counselor_clients" && <CounselorPortal />}
              {step === "counselor_report" && <CounselorReport />}
              {step === "counselor_guide" && <CounselorGuide />}
              {step === "counselor_settings" && <CounselorSettings />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
