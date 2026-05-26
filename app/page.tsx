"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LandingPage from "../components/LandingPage";
import EmotionReport from "../components/EmotionReport";
import UserFlow from "../components/UserFlow";
import CounselorPortal from "../components/CounselorPortal";
import CounselorDashboard from "../components/CounselorDashboard";
import CounselorReport from "../components/CounselorReport";
import CounselorGuide from "../components/CounselorGuide";
import CounselorCrisisDashboard from "../components/CounselorCrisisDashboard";
import CounselorSettings from "../components/CounselorSettings";
import OwlLogo from "../components/OwlLogo";
import InteractiveMap from "../components/InteractiveMap";
import { phq9ResultConfig } from "@/lib/mockData";
import { Heart, UserCheck, ArrowRight } from "lucide-react";


export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<"onboarding" | "select" | "login" | "consent" | "profile" | "phq9" | "p4" | "pledge" | "result" | "report" | "chat" | "journal" | "counselor_dashboard" | "counselor_clients" | "counselor_report" | "counselor_guide" | "counselor_settings" | "counselor_crisis" | "map">("onboarding");
  const [prevStep, setPrevStep] = useState<"onboarding" | "select" | "login" | "consent" | "profile" | "phq9" | "p4" | "pledge" | "result" | "report" | "chat" | "journal" | "counselor_dashboard" | "counselor_clients" | "counselor_report" | "counselor_guide" | "counselor_settings" | "counselor_crisis" | "map">("onboarding");
  const [role, setRole] = useState<"user" | "counselor" | null>(null);
  const [initialPersona, setInitialPersona] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [diaryText, setDiaryText] = useState("");
  const [journalWarning, setJournalWarning] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [devOpen, setDevOpen] = useState(false);
  const [lastPhq9Date, setLastPhq9Date] = useState<string | null>(null);
  const [showRephqPopup, setShowRephqPopup] = useState(false);

  // Real Auth states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<{ userId: string; nickname: string; email: string; region?: string } | null>(null);
  const [authError, setAuthError] = useState("");
  const [counselorOrg, setCounselorOrg] = useState("");
  const [isCounselorSignUp, setIsCounselorSignUp] = useState(false);
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [showTwoFactorInfo, setShowTwoFactorInfo] = useState(false);
  const [showCounselorSuccess, setShowCounselorSuccess] = useState(false);

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

  // 세션 복구 및 상태 복구
  useEffect(() => {
    const localUser = localStorage.getItem("uulppae_user");
    if (localUser) {
      try {
        const parsed = JSON.parse(localUser);
        if (parsed.userId) {
          setLoggedInUser({
            userId: parsed.userId,
            nickname: parsed.nickname,
            email: parsed.email,
            region: parsed.region
          });
          if (parsed.profile) {
            setProfile(parsed.profile);
          }
          if (parsed.last_phq9_date) {
            setLastPhq9Date(parsed.last_phq9_date);
          }
          if (parsed.has_profile) {
            // 2주일 스킵 로직 검사
            const lastDate = parsed.last_phq9_date;
            if (lastDate) {
              const diffTime = Math.abs(new Date().getTime() - new Date(lastDate).getTime());
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays < 14) {
                setStep("chat");
              } else {
                setStep("chat");
                setShowRephqPopup(true);
              }
            } else {
              setStep("chat");
            }
          } else {
            setStep("consent");
          }
        }
      } catch (e) {
        console.error("세션 복구 에러", e);
      }
    }
  }, []);

  // PHQ-9 2주일 락 스킵 제어
  useEffect(() => {
    if ((step === "consent" || step === "phq9" || step === "p4" || step === "pledge") && lastPhq9Date) {
      const diffTime = Math.abs(new Date().getTime() - new Date(lastPhq9Date).getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 14) {
        console.log("PHQ-9 2주일 재검사 락에 의해 검사 단계가 차단되었습니다. 챗방으로 이동합니다.");
        setStep("chat");
      }
    }
  }, [step, lastPhq9Date]);

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
    phone: "",
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

  const handleCounselorSignUp = () => {
    setAuthError("");
    if (!email || !password || !nickname || !counselorOrg) {
      setAuthError("모든 필드를 입력해주세요.");
      return;
    }
    setShowCounselorSuccess(true);
  };

  const handleAuth = async () => {
    setAuthError("");
    if (role === "counselor" && isCounselorSignUp) {
      handleCounselorSignUp();
      return;
    }

    if (!email || !password || (isSignUp && !nickname)) {
      setAuthError("모든 필드를 입력해주세요.");
      return;
    }

    // Unified role determination based on email or current selected role
    const isCounselorEmail = email.trim() === "counselor@uulppae.com" || email.trim() === "counselor@mallang.com";
    const activeRole = role || (isCounselorEmail ? "counselor" : "user");
    setRole(activeRole);

    try {
      if (activeRole === "counselor") {
        setShowOtpScreen(true);
        return;
      }

      const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/login";
      const payload = isSignUp ? { email, password, nickname } : { email, password };

      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiBase}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "인증에 실패했습니다.");
      }

      const data = await res.json();
      setLoggedInUser({ userId: data.user_id, nickname: data.nickname, email: data.email, region: data.region });
      setLastPhq9Date(data.last_phq9_date);
      
      const newProfile = {
        nickname: data.profile?.nickname || data.nickname || "",
        ageGroup: data.profile?.ageGroup || "",
        gender: data.profile?.gender || "",
        occupation: data.profile?.occupation || "",
        region: data.profile?.region || data.region || "",
        contact: data.profile?.contact || "",
        phone: data.profile?.phone || "",
      };
      setProfile(newProfile);
      
      localStorage.setItem("uulppae_user", JSON.stringify({ 
        userId: data.user_id, 
        nickname: data.nickname, 
        email: data.email, 
        region: data.region || data.profile?.region || "",
        profile: newProfile,
        has_profile: data.has_profile,
        last_phq9_date: data.last_phq9_date
      }));
      
      if (data.has_profile) {
        if (data.last_phq9_date) {
          const diffTime = Math.abs(new Date().getTime() - new Date(data.last_phq9_date).getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays < 14) {
            setStep("chat");
          } else {
            setStep("chat");
            setShowRephqPopup(true);
          }
        } else {
          setStep("chat");
        }
      } else {
        setStep("consent");
      }
    } catch (err: any) {
      console.warn("Backend connection failed. Using mock offline fallback for demo...", err);
      // Fallback to local authentication for demo robustness
      let mockUserId = "user-001";
      let mockNickname = email.split("@")[0] || "우울이";
      let mockRegion = "서울";
      let hasProfile = false;
      let mockProfile = {
        nickname: mockNickname,
        ageGroup: "",
        gender: "",
        occupation: "",
        region: mockRegion,
        contact: "",
        phone: ""
      };

      if (isSignUp) {
        mockUserId = "user-" + Math.random().toString(36).substring(2, 7);
        mockNickname = nickname;
        mockProfile.nickname = nickname;
      } else {
        // Mocking testuser@example.com offline fallback
        if (email === "testuser@example.com") {
          mockUserId = "user-2c8add22";
          mockNickname = "테스트유저";
          mockRegion = "부산";
          hasProfile = true;
          mockProfile = {
            nickname: "테스트유저",
            ageGroup: "30대",
            gender: "남성",
            occupation: "직장인",
            region: "부산",
            contact: "010-2222-3333",
            phone: "010-1111-2222"
          };
        }
      }

      setLoggedInUser({
        userId: mockUserId,
        nickname: mockNickname,
        email: email,
        region: mockRegion
      });
      setProfile(mockProfile);

      // 로컬 폴백에서 날짜 조회
      let localLastPhq9Date = null;
      try {
        const localUsersStr = localStorage.getItem("local_users_fallback");
        if (localUsersStr) {
          const localUsers = JSON.parse(localUsersStr);
          if (localUsers[mockUserId]) {
            localLastPhq9Date = localUsers[mockUserId].last_phq9_date || null;
          }
        }
      } catch (e) {}
      
      setLastPhq9Date(localLastPhq9Date);

      localStorage.setItem("uulppae_user", JSON.stringify({ 
        userId: mockUserId, 
        nickname: mockNickname, 
        email: email, 
        region: mockRegion,
        profile: mockProfile,
        has_profile: hasProfile,
        last_phq9_date: localLastPhq9Date
      }));

      if (hasProfile) {
        if (localLastPhq9Date) {
          const diffTime = Math.abs(new Date().getTime() - new Date(localLastPhq9Date).getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays < 14) {
            setStep("chat");
          } else {
            setStep("chat");
            setShowRephqPopup(true);
          }
        } else {
          setStep("chat");
        }
      } else {
        setStep("consent");
      }
    }
  };

  const handleUpdateProfile = async (updatedProfile: typeof profile) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiBase}/api/user/update_profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: loggedInUser?.userId || "anonymous_user",
          nickname: updatedProfile.nickname,
          gender: updatedProfile.gender,
          age_group: updatedProfile.ageGroup,
          occupation: updatedProfile.occupation,
          region: updatedProfile.region,
          contact: updatedProfile.contact,
          phone: updatedProfile.phone
        })
      });
      if (!res.ok) {
        throw new Error("프로필 저장 실패");
      }
      
      // Update local state
      setProfile(updatedProfile);
      setLoggedInUser(prev => prev ? { ...prev, nickname: updatedProfile.nickname, region: updatedProfile.region } : null);
      
      // Update local storage
      const localUser = localStorage.getItem("uulppae_user");
      if (localUser) {
        try {
          const parsed = JSON.parse(localUser);
          parsed.nickname = updatedProfile.nickname;
          parsed.region = updatedProfile.region;
          parsed.profile = updatedProfile;
          localStorage.setItem("uulppae_user", JSON.stringify(parsed));
        } catch (e) {
          console.error("로컬 스토리지 갱신 에러", e);
        }
      }
    } catch (err) {
      console.error("프로필 수정 오류:", err);
      // Fallback update in case API fails
      setProfile(updatedProfile);
      setLoggedInUser(prev => prev ? { ...prev, nickname: updatedProfile.nickname, region: updatedProfile.region } : null);
      
      const localUser = localStorage.getItem("uulppae_user");
      if (localUser) {
        try {
          const parsed = JSON.parse(localUser);
          parsed.nickname = updatedProfile.nickname;
          parsed.region = updatedProfile.region;
          parsed.profile = updatedProfile;
          localStorage.setItem("uulppae_user", JSON.stringify(parsed));
        } catch (e) {}
      }
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

  if (step === "onboarding") {
    return <LandingPage onStart={() => setStep("select")} />;
  }

  const isCounselor = step.startsWith("counselor_");

  return (
    <div className={`min-h-screen bg-[#F8F5F0] font-sans text-gray-800 ${
      isCounselor ? "flex" : "flex flex-col items-center justify-center p-4"
    }`}>

      {/* Role Selection Screen */}
      {step === "select" && (
        <div className="max-w-2xl w-full bg-[#FAF8F5] border border-[#EAE5D9] rounded-3xl p-10 shadow-[0_16px_48px_rgba(139,123,93,0.08)] flex flex-col items-center animate-fade-in">
          <div className="mb-6">
            <OwlLogo size={64} variant="ivory" />
          </div>
          
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">우울빼미 시작하기</h2>
          <p className="text-sm text-gray-500 mb-10 max-w-md text-center leading-relaxed">
            밤낮으로 마음의 고요를 지켜주는 우울빼미입니다.<br />귀하의 역할에 맞는 서비스 경로를 선택해 주세요.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
            {/* 개인 사용자 카드 */}
            <button
              onClick={() => {
                setRole("user");
                setIsSignUp(false);
                setAuthError("");
                setEmail("");
                setPassword("");
                setIsCounselorSignUp(false);
                setShowCounselorSuccess(false);
                setShowOtpScreen(false);
                setStep("login");
              }}
              className="group text-left p-6 bg-white border border-[#EAE5D9] hover:border-[#F59E0B] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between h-60 transform hover:-translate-y-1"
            >
              <div>
                <div className="w-12 h-12 bg-[#F59E0B]/10 rounded-xl flex items-center justify-center text-[#F59E0B] mb-4 group-hover:scale-110 transition-transform">
                  <Heart className="w-6 h-6 fill-[#F59E0B]/20" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#F59E0B] transition-colors">개인 사용자</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  AI 동반자와의 야간 상담, 정기 자가검진, 데일리 일기 작성 및 개인용 감정 분석 리포트를 이용합니다.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-[#F59E0B] mt-4">
                사용자 로그인 <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* 전문 상담사 카드 */}
            <button
              onClick={() => {
                setRole("counselor");
                setIsSignUp(false);
                setAuthError("");
                setEmail("");
                setPassword("");
                setIsCounselorSignUp(false);
                setShowCounselorSuccess(false);
                setShowOtpScreen(false);
                setCounselorOrg("");
                setStep("login");
              }}
              className="group text-left p-6 bg-white border border-[#EAE5D9] hover:border-[#1E2D4E] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between h-60 transform hover:-translate-y-1"
            >
              <div>
                <div className="w-12 h-12 bg-[#1E2D4E]/10 rounded-xl flex items-center justify-center text-[#1E2D4E] mb-4 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#1E2D4E] transition-colors">전문 상담사</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  내담자 목록 및 건강 점수 실시간 모니터링, RAG 연계 상담 가이드라인, 상담 세션 정보 및 노트를 기록/관리합니다.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-[#1E2D4E] mt-4">
                상담사 포털 입장 <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          <button
            onClick={() => setStep("onboarding")}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
          >
            ← 메인 소개 화면으로 돌아가기
          </button>
        </div>
      )}

      {/* Login */}
      {step === "login" && (
        <div className="max-w-md w-full flex flex-col items-center gap-4 animate-fade-in">
          {showOtpScreen ? (
            <div className="w-full bg-[#FAF8F5] border border-[#EAE5D9] rounded-3xl p-10 shadow-[0_12px_40px_rgba(139,123,93,0.06)] flex flex-col items-center text-center">
              <div className="mb-4">
                <span className="w-12 h-12 bg-[#1E2D4E]/10 text-[#1E2D4E] rounded-2xl flex items-center justify-center text-2xl">
                  🔒
                </span>
              </div>
              
              <h2 className="text-2xl font-black text-gray-900 mb-2">2단계 추가 보안 인증</h2>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                안전한 상담 환경과 내담자 개인정보 보호를 위해<br />
                등록된 모바일 OTP 인증코드를 입력해주세요.
              </p>

              <div className="flex flex-col gap-4 w-full">
                <div className="text-left w-full">
                  <label className="text-xs font-bold text-[#8C7862] ml-1">6자리 OTP 인증코드</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="0 0 0 0 0 0"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^0-9]/g, ""))}
                    className="bg-white border border-[#EAE5D9] rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#1E2D4E] transition-all w-full mt-1 text-gray-800 text-center tracking-[1em] text-lg font-bold placeholder:text-gray-300"
                  />
                </div>

                {authError && (
                  <p className="text-red-500 text-xs mt-1 font-semibold text-center">{authError}</p>
                )}

                <button
                  onClick={() => {
                    if (twoFactorCode.length !== 6) {
                      setAuthError("6자리 인증코드를 정확히 입력해주세요.");
                      return;
                    }
                    setLoggedInUser({
                      userId: "counselor-001",
                      nickname: nickname || "상담사 김상담",
                      email: email || "counselor@uulppae.com"
                    });
                    setStep("counselor_dashboard");
                    setShowOtpScreen(false);
                    setAuthError("");
                    setTwoFactorCode("");
                  }}
                  className="font-bold py-3.5 rounded-xl mt-2 transition-all duration-200 bg-[#1E2D4E] hover:bg-[#152037] text-white shadow-[0_4px_12px_rgba(30,45,78,0.2)] hover:shadow-[0_6px_16px_rgba(30,45,78,0.3)] text-center w-full"
                >
                  인증 완료 및 포털 입장
                </button>

                <button
                  onClick={() => {
                    setShowOtpScreen(false);
                    setAuthError("");
                    setTwoFactorCode("");
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors text-center mt-2"
                >
                  ← 로그인 화면으로 돌아가기
                </button>

                {/* OTP Quick Prefill Panel */}
                <div className="mt-4 text-left w-full bg-[#1E2D4E]/5 border border-[#1E2D4E]/10 rounded-2xl p-4">
                  <p className="text-[11px] font-bold text-[#1E2D4E] mb-2 flex items-center gap-1">
                    🔑 데모용 OTP 자동 입력 단축키
                  </p>
                  <button
                    onClick={() => {
                      setTwoFactorCode("123456");
                      setAuthError("");
                    }}
                    className="w-full text-[11px] bg-white border border-[#EAE5D9] hover:border-[#1E2D4E] rounded-lg py-1.5 px-3 font-semibold text-gray-700 hover:text-[#1E2D4E] shadow-sm transition-all text-center"
                  >
                    원클릭 자동 완성 (123456)
                  </button>
                </div>
              </div>
            </div>
          ) : showCounselorSuccess ? (
            <div className="w-full bg-[#FAF8F5] border border-[#EAE5D9] rounded-3xl p-10 shadow-[0_12px_40px_rgba(139,123,93,0.06)] flex flex-col items-center text-center">
              <div className="mb-4">
                <span className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl">
                  🎉
                </span>
              </div>
              
              <h2 className="text-2xl font-black text-gray-900 mb-2">상담사 계정 신청 완료</h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                우울빼미 전문 상담사 계정 신청이<br />정상적으로 접수되었습니다.
              </p>

              <div className="bg-white border border-[#EAE5D9] rounded-2xl p-4 w-full text-left text-xs text-gray-600 mb-6 space-y-2">
                <p>• <strong>상담사 성명:</strong> {nickname}</p>
                <p>• <strong>이메일 계정:</strong> {email}</p>
                <p>• <strong>소속 기관:</strong> {counselorOrg}</p>
                <div className="bg-[#FAF8F5] border border-[#EAE5D9] p-3 rounded-lg text-gray-500 leading-normal mt-2">
                  개인정보보호 및 의료정보 다중 검증 절차에 의해, 제출하신 전문 라이선스/소속 검증서류 심사는 영업일 기준 최대 24시간이 소요됩니다. 심사 승인 즉시 메일이 발송됩니다.
                </div>
              </div>

              <button
                onClick={() => {
                  setShowCounselorSuccess(false);
                  setIsCounselorSignUp(false);
                  setShowOtpScreen(true);
                }}
                className="w-full bg-[#1E2D4E] hover:bg-[#152037] text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-md text-xs"
              >
                임시 승인 계정으로 즉시 로그인하기 (데모 체험) →
              </button>
            </div>
          ) : (
            <>
              {/* Main Credentials Card */}
              <div className="w-full bg-[#FAF8F5] border border-[#EAE5D9] rounded-3xl p-10 shadow-[0_12px_40px_rgba(139,123,93,0.06)] flex flex-col items-center text-center">
                <div className="mb-4">
                  <OwlLogo size={56} variant="ivory" />
                </div>
                
                <h2 className="text-2xl font-black text-gray-900 mb-2">
                  {role === "counselor" 
                    ? isCounselorSignUp ? "상담사 계정 신청" : "전문 상담사 로그인"
                    : isSignUp ? "우울빼미 회원가입" : "개인 사용자 로그인"}
                </h2>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                  {role === "counselor" 
                    ? isCounselorSignUp ? "우울빼미 전문 상담사 포털 계정 개설 신청 단계입니다" : "내담자의 마음 상태를 세밀하게 살피고 돕습니다" 
                    : "안정적인 심리 분석과 맞춤 케어를 지원합니다"}
                </p>
                
                <div className="flex flex-col gap-4 w-full">
                  {/* 1. 개인 사용자 회원가입 시 닉네임 입력 */}
                  {isSignUp && role !== "counselor" && (
                    <div className="text-left w-full">
                      <label className="text-xs font-bold text-[#8C7862] ml-1">닉네임</label>
                      <input
                        type="text"
                        placeholder="사용하실 닉네임을 입력해 주세요"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="bg-white border border-[#EAE5D9] rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#1E2D4E] transition-all w-full mt-1 text-gray-800"
                      />
                    </div>
                  )}

                  {/* 2. 상담사 계정 신청 시 이름 입력 */}
                  {role === "counselor" && isCounselorSignUp && (
                    <div className="text-left w-full">
                      <label className="text-xs font-bold text-[#8C7862] ml-1">상담사 성명</label>
                      <input
                        type="text"
                        placeholder="홍길동"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="bg-white border border-[#EAE5D9] rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#1E2D4E] transition-all w-full mt-1 text-gray-800"
                      />
                    </div>
                  )}
                  
                  <div className="text-left w-full">
                    <label className="text-xs font-bold text-[#8C7862] ml-1">이메일 주소</label>
                    <input
                      type="text"
                      placeholder={role === "counselor" ? "counselor@uulppae.com" : "example@uulppae.com"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white border border-[#EAE5D9] rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#1E2D4E] transition-all w-full mt-1 text-gray-800"
                    />
                  </div>

                  {/* 3. 상담사 계정 신청 시 소속 기관 입력 */}
                  {role === "counselor" && isCounselorSignUp && (
                    <div className="text-left w-full">
                      <label className="text-xs font-bold text-[#8C7862] ml-1">소속 기관 / 센터명</label>
                      <input
                        type="text"
                        placeholder="예: 서울정신건강복지센터"
                        value={counselorOrg}
                        onChange={(e) => setCounselorOrg(e.target.value)}
                        className="bg-white border border-[#EAE5D9] rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#1E2D4E] transition-all w-full mt-1 text-gray-800"
                      />
                    </div>
                  )}
                  
                  <div className="text-left w-full">
                    <label className="text-xs font-bold text-[#8C7862] ml-1">비밀번호</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white border border-[#EAE5D9] rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#1E2D4E] transition-all w-full mt-1 text-gray-800"
                    />
                  </div>

                  {authError && (
                    <p className="text-red-500 text-xs mt-1 font-semibold">{authError}</p>
                  )}

                  {/* 4. 상담사 로그인 폼일 때 로그인 버튼 위에 2단계 인증 버튼과 안내 배치 */}
                  {role === "counselor" && !isCounselorSignUp && (
                    <div className="flex flex-col gap-2 mt-2 w-full text-left">
                      <div className="bg-[#1E2D4E]/5 border border-[#1E2D4E]/10 rounded-xl p-3 text-xs flex flex-col gap-1 shadow-inner">
                        <div className="flex items-center gap-1.5 font-bold text-[#1E2D4E]">
                          <span>🔒</span>
                          <span>보안 안내: 로그인 후 2단계 인증 필수</span>
                        </div>
                        <p className="text-gray-500 leading-normal text-[11px]">
                          안전한 환경 및 내담자 민감 정보 보호를 위해, 로그인 성공 후 추가 모바일 OTP 보안 코드(6자리) 인증이 법적으로 의무 적용됩니다.
                        </p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setShowTwoFactorInfo(true)}
                        className="text-[11px] font-bold text-[#1E2D4E] hover:underline flex items-center justify-center gap-1 bg-[#1E2D4E]/10 hover:bg-[#1E2D4E]/15 py-2.5 rounded-xl transition-all border border-[#1E2D4E]/20 mt-1 shadow-sm"
                      >
                        🛡️ 2단계 인증(2FA) 보안 및 규정 안내 확인
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleAuth}
                    className={`font-bold py-3.5 rounded-xl mt-4 transition-all duration-200 transform hover:translate-y-[-1px] ${
                      role === "counselor"
                        ? "bg-[#1E2D4E] hover:bg-[#152037] text-white shadow-[0_4px_12px_rgba(30,45,78,0.2)] hover:shadow-[0_6px_16px_rgba(30,45,78,0.3)]"
                        : "bg-[#F59E0B] hover:bg-[#D97706] text-white shadow-[0_4px_12px_rgba(245,158,11,0.2)] hover:shadow-[0_6px_16px_rgba(245,158,11,0.3)]"
                    }`}
                  >
                    {role === "counselor" 
                      ? isCounselorSignUp ? "계정 신청 완료하기" : "로그인" 
                      : isSignUp ? "회원가입" : "로그인"}
                  </button>
                </div>

                <div className="mt-6 flex flex-col gap-2 w-full">
                  {role === "counselor" ? (
                    <button
                      onClick={() => {
                        setIsCounselorSignUp(!isCounselorSignUp);
                        setAuthError("");
                      }}
                      className="text-xs text-[#8C7862] hover:underline transition-all"
                    >
                      {isCounselorSignUp ? "이미 신청하셨나요? 로그인하기" : "아직 전문 계정이 없으신가요? 상담사 계정 신청하기"}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setAuthError("");
                      }}
                      className="text-xs text-[#8C7862] hover:underline transition-all"
                    >
                      {isSignUp ? "이미 계정이 있으신가요? 로그인하기" : "아직 계정이 없으신가요? 회원가입하기"}
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setRole(null);
                      setStep("select");
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors mt-2"
                  >
                    ← 역할 선택으로 돌아가기
                  </button>
                </div>

                {/* 5. C-006 서비스 한계 고지 문구 (전문가 전용 화면 하단 배치) */}
                {role === "counselor" && (
                  <div className="mt-8 text-[10px] text-gray-400 leading-relaxed max-w-sm text-center border-t border-[#EAE5D9]/60 pt-4 px-2">
                    <span className="font-bold text-[#1E2D4E] block mb-1">⚠️ 전문 상담 서비스 한계 고지</span>
                    본 서비스는 우울·자살 예방을 위한 보조 도구이며, 전문적인 의학적 진단이나 치료를 대체할 수 없습니다.
                  </div>
                )}
              </div>

              {/* DEVELOPMENT ONLY: Quick Test Accounts Panel - START (Placed OUTSIDE the login card, easily removable) */}
              {role === "counselor" ? (
                !isCounselorSignUp && (
                  <div className="w-full bg-[#1E2D4E]/5 border border-[#1E2D4E]/10 rounded-2xl p-4 text-left shadow-sm">
                    <p className="text-[11px] font-bold text-[#1E2D4E] mb-2 flex items-center gap-1">
                      🔑 [테스트용] 전문 상담사 빠른 입력
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEmail("counselor@uulppae.com");
                          setPassword("counselor123");
                        }}
                        className="w-full text-[11px] bg-white border border-[#EAE5D9] hover:border-[#1E2D4E] rounded-lg py-1.5 px-3 font-semibold text-gray-700 hover:text-[#1E2D4E] shadow-sm transition-all text-center"
                      >
                        counselor@uulppae.com 로 자동 입력
                      </button>
                    </div>
                  </div>
                )
              ) : (
                !isSignUp && (
                  <div className="w-full bg-[#F59E0B]/5 border border-[#F59E0B]/10 rounded-2xl p-4 text-left shadow-sm">
                    <p className="text-[11px] font-bold text-[#F59E0B] mb-2 flex items-center gap-1">
                      🔑 [테스트용] 개인 사용자 빠른 입력
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setEmail("testuser@example.com");
                          setPassword("testpass123");
                        }}
                        className="text-[11px] bg-white border border-[#EAE5D9] hover:border-[#F59E0B] rounded-lg py-1.5 px-3 font-semibold text-gray-700 hover:text-[#F59E0B] shadow-sm transition-all"
                      >
                        기존 사용자 (프로필 있음)
                      </button>
                      <button
                        onClick={() => {
                          setEmail("test@test.com");
                          setPassword("test123");
                        }}
                        className="text-[11px] bg-white border border-[#EAE5D9] hover:border-[#F59E0B] rounded-lg py-1.5 px-3 font-semibold text-gray-700 hover:text-[#F59E0B] shadow-sm transition-all"
                      >
                        일반 테스트 계정
                      </button>
                    </div>
                  </div>
                )
              )}
              {/* DEVELOPMENT ONLY: Quick Test Accounts Panel - END */}
            </>
          )}
        </div>
      )}

      {/* 2단계 인증 모달 안내창 */}
      {showTwoFactorInfo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-[#EAE5D9] rounded-3xl p-8 max-w-md w-full shadow-2xl text-left transform scale-100 transition-all duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-2">
                <span className="w-10 h-10 bg-[#1E2D4E]/10 text-[#1E2D4E] rounded-xl flex items-center justify-center text-lg">
                  🛡️
                </span>
                <div>
                  <h3 className="font-extrabold text-lg text-gray-900 leading-tight">2단계 인증(2FA) 보안 제도</h3>
                  <span className="text-[10px] text-gray-400 font-semibold tracking-wider block mt-0.5">TWO-FACTOR AUTHENTICATION SECURITY GUIDE</span>
                </div>
              </div>
              <button 
                onClick={() => setShowTwoFactorInfo(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg p-1 transition-colors focus:outline-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
              <div className="bg-[#FAF8F5] border border-[#EAE5D9] p-4 rounded-xl">
                <p className="font-bold text-[#1E2D4E] mb-1">Q. 왜 2단계 인증이 필수인가요?</p>
                <p className="text-gray-500">
                  보건복지부 및 개인정보 보호법의 고위험 민감의료정보 취급 가이드라인에 따라, 외부 불법 접근을 차단하기 위해 로그인 정보 입력 후 지정된 신뢰 기기 또는 모바일 OTP(One-Time Password) 앱을 통한 2차 본인 검증이 법적으로 의무화되어 있습니다.
                </p>
              </div>

              <div className="bg-[#FAF8F5] border border-[#EAE5D9] p-4 rounded-xl">
                <p className="font-bold text-[#1E2D4E] mb-1">Q. 어떻게 이용하나요?</p>
                <ol className="list-decimal pl-4 space-y-1 text-gray-500">
                  <li>전문 상담사 포털 계정(이메일, 비밀번호)을 입력하고 로그인 버튼을 누릅니다.</li>
                  <li>자동으로 2단계 인증(OTP 입력) 화면으로 전환됩니다.</li>
                  <li>모바일 OTP 인증기 앱(Google Authenticator 등) 또는 지정된 SMS로 전송받은 6자리 일회용 코드를 입력하면 즉시 승인됩니다.</li>
                </ol>
              </div>
              
              <p className="text-[10px] text-[#8C7862] text-center font-medium bg-[#FAF8F5] py-2 rounded-lg border border-dashed border-[#EAE5D9]">
                💡 데모 버전에서는 누구나 간편하게 6자리 임의 번호나 단축키로 테스트할 수 있습니다.
              </p>
            </div>

            <button
              onClick={() => setShowTwoFactorInfo(false)}
              className="w-full bg-[#1E2D4E] hover:bg-[#152037] text-white font-bold py-3.5 rounded-xl mt-6 transition-all duration-200 shadow-md text-xs"
            >
              이해했습니다 및 닫기
            </button>
          </div>
        </div>
      )}


      {/* Consent */}
      {step === "consent" && (
        <div className="max-w-2xl w-full bg-[#FAF8F5] rounded-3xl overflow-hidden border border-[#EAE5D9] shadow-[0_12px_40px_rgba(139,123,93,0.06)] flex flex-col animate-fade-in text-left">
          <div className="bg-gradient-to-r from-[#8C7862] to-[#A69584] p-6 text-white text-center border-b border-[#EAE5D9]">
            <h2 className="text-xl font-bold flex items-center justify-center gap-2">
              📋 서비스 이용 안내
            </h2>
            <p className="text-sm opacity-90 mt-1">안전한 서비스 이용을 위해 아래 내용을 확인해 주세요</p>
          </div>

          <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
            <div className="bg-[#FFF8F0] border border-orange-100 border-l-4 border-l-[#F59E0B] p-4 rounded-r-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[#F59E0B] font-bold">⚠️</span>
                <h3 className="font-bold text-gray-900 text-sm">본 서비스는 의료 진단을 대체하지 않습니다</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                AI 상담은 정서적 지원을 목적으로 하며, 전문 의료인의 진단 및 치료를 대신할 수 없습니다. 위기 상황 시에는 반드시 전문 기관의 도움을 받으세요.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-xl p-4 shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={agreements.privacy}
                      onChange={(e) => handleCheck("privacy", e.target.checked)}
                      className="w-5 h-5 accent-[#F59E0B] rounded focus:ring-[#F59E0B]"
                    />
                    <div>
                      <p className="font-bold text-sm text-gray-900">개인정보 수집 및 이용 동의 (필수)</p>
                      <p className="text-xs text-gray-500">대화 내용은 암호화되어 안전하게 보관됩니다</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPrivacyDetail(!showPrivacyDetail)}
                    className="text-xs text-[#8C7862] hover:text-[#1E2D4E] hover:underline"
                  >
                    {showPrivacyDetail ? "닫기 ∧" : "내용 보기 ∨"}
                  </button>
                </div>
                {showPrivacyDetail && (
                  <div className="mt-4 text-xs text-gray-600 bg-white border border-[#EAE5D9] p-3 rounded-lg animate-fade-in">
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr className="border-b border-[#EAE5D9]">
                          <td className="font-bold p-2 w-24 align-top text-gray-700">일반 정보</td>
                          <td className="p-2 text-gray-600">닉네임, 이메일, 생년월일 (목적: 서비스 이용 및 맞춤화)</td>
                        </tr>
                        <tr className="border-b border-[#EAE5D9]">
                          <td className="font-bold p-2 text-orange-600 align-top">민감 정보 (중요)</td>
                          <td className="p-2 text-gray-600">PHQ-9/P4 결과, 자살방지 서약서, 챗봇 대화 내용, 감정 리포트 (목적: 우울 위험도 측정 및 고위험군 선별, AI 상담 제공)</td>
                        </tr>
                        <tr>
                          <td className="font-bold p-2 align-top text-gray-700">보유 기간</td>
                          <td className="p-2 text-gray-600">서비스 탈퇴 시 즉시 파기</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-xl p-4 shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={agreements.terms}
                      onChange={(e) => handleCheck("terms", e.target.checked)}
                      className="w-5 h-5 accent-[#F59E0B] rounded focus:ring-[#F59E0B]"
                    />
                    <div>
                      <p className="font-bold text-sm text-gray-900">서비스 이용약관 동의 (필수)</p>
                      <p className="text-xs text-gray-500">AI 상담 서비스 이용 규칙 및 이용자 권리 안내</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTermsDetail(!showTermsDetail)}
                    className="text-xs text-[#8C7862] hover:text-[#1E2D4E] hover:underline"
                  >
                    {showTermsDetail ? "닫기 ∧" : "내용 보기 ∨"}
                  </button>
                </div>
                {showTermsDetail && (
                  <div className="mt-4 text-xs text-gray-600 bg-white border border-[#EAE5D9] p-3 rounded-lg leading-relaxed animate-fade-in">
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr className="border-b border-[#EAE5D9]">
                          <td className="font-bold p-2 w-24 align-top text-gray-800">제1조 (목적)</td>
                          <td className="p-2 text-gray-700">본 약관은 '우울빼미'가 제공하는 AI 기반 정서적 지원 및 예방형 심리케어 서비스의 이용 조건을 규정합니다.</td>
                        </tr>
                        <tr className="border-b border-[#EAE5D9]">
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

              <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-xl p-4 shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={agreements.safety}
                      onChange={(e) => handleCheck("safety", e.target.checked)}
                      className="w-5 h-5 accent-[#F59E0B] rounded focus:ring-[#F59E0B]"
                    />
                    <div>
                      <p className="font-bold text-sm text-gray-900">안전 안내 확인 (필수)</p>
                      <p className="text-xs text-gray-500">위기 상황 발생 시 신속한 구호를 위한 긴급 연락망 및 기관 연계 안내입니다.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSafetyDetail(!showSafetyDetail)}
                    className="text-xs text-[#8C7862] hover:text-[#1E2D4E] hover:underline"
                  >
                                        {showSafetyDetail ? "닫기 ∧" : "내용 보기 ∨"}
                  </button>
                </div>
                {showSafetyDetail && (
                  <div className="mt-4 text-xs text-gray-600 bg-white border border-[#EAE5D9] p-3 rounded-lg leading-relaxed animate-fade-in">
                    사용자의 답변에서 자해 및 타해 위험이 감지될 경우, 사용자의 안전을 위해 등록된 비상 연락처 또는 유관 기관(1393 등)에 정보가 제공될 수 있음에 동의합니다.
                  </div>
                )}
              </div>

              <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-xl p-4 shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={agreements.counselorShare}
                      onChange={(e) => handleCheck("counselorShare", e.target.checked)}
                      className="w-5 h-5 accent-[#F59E0B] rounded focus:ring-[#F59E0B]"
                    />
                    <div>
                      <p className="font-bold text-sm text-gray-900">상담사 공유 동의 (필수)</p>
                      <p className="text-xs text-gray-500">안전한 심리 케어와 연계 상담을 위해 담당 상담사 포털에 내담자 데이터가 공유됩니다.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCounselorDetail(!showCounselorDetail)}
                    className="text-xs text-[#8C7862] hover:text-[#1E2D4E] hover:underline"
                  >
                                        {showCounselorDetail ? "닫기 ∧" : "내용 보기 ∨"}
                  </button>
                </div>
                {showCounselorDetail && (
                  <div className="mt-4 text-xs text-gray-600 bg-white border border-[#EAE5D9] p-3 rounded-lg animate-fade-in">
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr className="border-b border-[#EAE5D9]">
                          <td className="font-bold p-2 w-24 align-top text-gray-700">공유 목적</td>
                          <td className="p-2 text-gray-600">내담자 위험도 실시간 모니터링, 상담 전 리포트 생성, 맞춤형 개입 가이드 적용</td>
                        </tr>
                        <tr className="border-b border-[#EAE5D9]">
                          <td className="font-bold p-2 align-top text-gray-700">공유 항목</td>
                          <td className="p-2 text-gray-600">PHQ-9점수, P4 결과, 자살방지 서약서 서명 및 내용, 챗봇 대화 로그 내 위험표현 및 인지 왜곡 빈도</td>
                        </tr>
                        <tr>
                          <td className="font-bold p-2 align-top text-gray-700">보유 기간</td>
                          <td className="p-2 text-gray-600">서비스 탈퇴 시 또는 담당 상담사 배정 종료 시 즉시 파기</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-xl p-4 shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={agreements.ageVerify}
                      onChange={(e) => handleCheck("ageVerify", e.target.checked)}
                      className="w-5 h-5 accent-[#F59E0B] rounded focus:ring-[#F59E0B]"
                    />
                    <div>
                      <p className="font-bold text-sm text-gray-900">만 14세 이상 이용가 및 청소년 정책 확인 (필수)</p>
                      <p className="text-xs text-gray-500">만 14세 이상 이용 가능자임을 확인하며, 청소년 고위험군 예방 방침에 동의합니다.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAgeDetail(!showAgeDetail)}
                    className="text-xs text-[#8C7862] hover:text-[#1E2D4E] hover:underline"
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
        <div className="max-w-2xl w-full bg-[#FAF8F5] rounded-3xl overflow-hidden border border-[#EAE5D9] shadow-[0_12px_40px_rgba(139,123,93,0.06)] flex flex-col animate-fade-in text-left">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#8C7862] to-[#A69584] p-6 text-white relative border-b border-[#EAE5D9]">
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
            <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-xl p-4 shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
              <label className="text-sm font-bold text-gray-700 block mb-2">닉네임 (앱에서 불릴 이름)</label>
              <input
                type="text"
                placeholder="예: 빼미"
                value={profile.nickname}
                onChange={(e) => handleProfileChange("nickname", e.target.value)}
                className="bg-white border border-[#EAE5D9] rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#8C7862] transition-all w-full text-gray-800"
              />
            </div>

            {/* Card 2: Age Group */}
            <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-xl p-4 shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
              <label className="text-sm font-bold text-gray-700 block mb-2">연령대</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {ageGroups.map((age) => (
                  <button
                    key={age}
                    onClick={() => handleProfileChange("ageGroup", age)}
                    className={`py-2 text-xs font-medium rounded-lg border transition-all ${profile.ageGroup === age
                      ? "bg-[#1E2D4E] text-white border-[#1E2D4E] shadow-sm"
                      : "bg-white text-gray-600 border-[#EAE5D9] hover:bg-[#F8F5F0]"
                      }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>

            {/* Card 3: Gender */}
            <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-xl p-4 shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
              <label className="text-sm font-bold text-gray-700 block mb-2">성별</label>
              <div className="grid grid-cols-3 gap-2">
                {genders.map((gender) => (
                  <button
                    key={gender}
                    onClick={() => handleProfileChange("gender", gender)}
                    className={`py-2 text-xs font-medium rounded-lg border transition-all ${profile.gender === gender
                      ? "bg-[#1E2D4E] text-white border-[#1E2D4E] shadow-sm"
                      : "bg-white text-gray-600 border-[#EAE5D9] hover:bg-[#F8F5F0]"
                      }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>

            {/* Card 4: Occupation */}
            <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-xl p-4 shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
              <label className="text-sm font-bold text-gray-700 block mb-2">직업</label>
              <select
                value={profile.occupation}
                onChange={(e) => handleProfileChange("occupation", e.target.value)}
                className="bg-white border border-[#EAE5D9] rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#8C7862] transition-all w-full text-sm text-gray-700"
              >
                <option value="" disabled>선택해주세요</option>
                {occupations.map((occ) => (
                  <option key={occ} value={occ}>{occ}</option>
                ))}
              </select>
            </div>

            {/* Card 5: Region */}
            <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-xl p-4 shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
              <label className="text-sm font-bold text-gray-700 block mb-2">거주 지역 (공공서비스 연계용)</label>
              <select
                value={profile.region}
                onChange={(e) => handleProfileChange("region", e.target.value)}
                className="bg-white border border-[#EAE5D9] rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#8C7862] transition-all w-full text-sm text-gray-700"
              >
                <option value="" disabled>선택해주세요</option>
                {regions.map((reg) => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
            </div>

            {/* Card 6: Phone */}
            <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-xl p-4 shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
              <label className="text-sm font-bold text-gray-700 block mb-1">본인 연락처 (선택)</label>
              <p className="text-xs text-gray-500 mb-2">원활한 안내 및 소통을 위한 연락처예요</p>
              <input
                type="text"
                placeholder="예: 010-1234-5678"
                value={profile.phone || ""}
                onChange={(e) => handleProfileChange("phone", e.target.value)}
                className="bg-white border border-[#EAE5D9] rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#8C7862] transition-all w-full text-gray-800"
              />
            </div>

            {/* Card 7: Contact */}
            <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-xl p-4 shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
              <label className="text-sm font-bold text-gray-700 block mb-1">비상연락처 (선택)</label>
              <p className="text-xs text-gray-500 mb-2">위기 상황 시 알림을 보낼 연락처예요</p>
              <input
                type="text"
                placeholder="예: 010-1234-5678"
                value={profile.contact}
                onChange={(e) => handleProfileChange("contact", e.target.value)}
                className="bg-white border border-[#EAE5D9] rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#8C7862] transition-all w-full text-gray-800"
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
                ? "bg-[#F59E0B] hover:bg-[#D97706] text-white shadow-[0_4px_12px_rgba(245,158,11,0.2)] hover:shadow-[0_6px_16px_rgba(245,158,11,0.3)] transform hover:translate-y-[-1px]"
                : "bg-gray-300 text-white cursor-not-allowed"
                }`}
            >
              다음: PHQ-9 자가진단 →
            </button>

            <button
              onClick={() => setStep("consent")}
              className="mt-6 text-sm text-[#8C7862] hover:text-[#1E2D4E] transition-colors self-center hover:underline"
            >
              ← 이전으로 돌아가기
            </button>
          </div>
        </div>
      )}

      {/* PHQ-9 Survey */}
      {step === "phq9" && (
        <div className="max-w-2xl w-full bg-[#FAF8F5] rounded-3xl overflow-hidden border border-[#EAE5D9] shadow-[0_12px_40px_rgba(139,123,93,0.06)] flex flex-col animate-fade-in text-left">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#8C7862] to-[#A69584] p-6 text-white relative border-b border-[#EAE5D9]">
            <div className="text-center">
              <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                📋 PHQ-9 우울 자가진단
              </h2>
              <p className="text-sm opacity-90 mt-1">지난 2주 동안 아래 문제들로 얼마나 불편했나요?</p>
            </div>
            <span className="absolute top-6 right-6 text-sm font-bold opacity-80">2/4단계</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#F0ECE6] h-2">
            <div 
              className="bg-[#F59E0B] h-full transition-all duration-300" 
              style={{ width: `${((currentQuestionIndex + 1) / 9) * 100}%` }}
            ></div>
          </div>
          <div className="text-right text-xs text-[#8C7862] px-6 mt-2">
            {currentQuestionIndex + 1} / 9 완료
          </div>

          <div className="p-6 flex flex-col gap-6">
            {/* Question Card */}
            <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-xl p-6 shadow-[0_2px_8px_rgba(139,123,93,0.02)] flex flex-col items-center text-center gap-4">
              <div className="w-10 h-10 bg-[#1E2D4E] text-white rounded-full flex items-center justify-center font-bold shadow-sm">
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
                    className={`p-4 rounded-xl text-left font-bold text-sm border transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-[#1E2D4E] border-[#1E2D4E] text-white shadow-sm"
                        : "bg-white border-[#EAE5D9] text-gray-600 hover:bg-[#F8F5F0]"
                    }`}
                  >
                    <span>{option.label} · {option.score}점</span>
                    {isSelected && <span className="text-[#F59E0B]">✓</span>}
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
                className="flex-1 bg-white border border-[#EAE5D9] text-gray-700 font-bold py-3.5 rounded-xl hover:bg-[#F8F5F0] transition-colors"
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
                    ? "bg-[#F59E0B] hover:bg-[#D97706] text-white shadow-[0_4px_12px_rgba(245,158,11,0.2)] hover:shadow-[0_6px_16px_rgba(245,158,11,0.3)] transform hover:translate-y-[-1px]"
                    : "bg-gray-300 text-white cursor-not-allowed"
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
        <div className="max-w-2xl w-full bg-[#FAF8F5] rounded-3xl overflow-hidden border border-[#EAE5D9] shadow-[0_12px_40px_rgba(139,123,93,0.06)] flex flex-col animate-fade-in text-left">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#8C7862] to-[#A69584] p-6 text-white relative border-b border-[#EAE5D9]">
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
            <div className="bg-[#FFF8F0] border border-orange-100 border-l-4 border-l-[#F59E0B] p-4 rounded-r-xl">
              <p className="text-sm text-gray-700 leading-relaxed">
                아래 질문들은 더 정확한 맞춤 케어를 위한 질문이에요.<br />
                솔직하게 답해주실수록 더 잘 도와드릴 수 있어요 🦉
              </p>
            </div>

            {/* Card 1 */}
            <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-xl p-4 shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
              <p className="text-sm font-bold text-gray-900 mb-3">1. 이전에 당신을 위험에 빠뜨리는 행동을 한 적이 있습니까?</p>
              <div className="grid grid-cols-2 gap-3">
                {["없음", "있음"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setP4Answers({ ...p4Answers, q1: opt })}
                    className={`py-2.5 text-sm font-bold rounded-lg border transition-all ${
                      p4Answers.q1 === opt
                        ? "bg-[#1E2D4E] border-[#1E2D4E] text-white shadow-sm"
                        : "bg-white text-gray-600 border-[#EAE5D9] hover:bg-[#F8F5F0]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-xl p-4 shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
              <p className="text-sm font-bold text-gray-900 mb-3">2. 당신 자신을 정말 해칠 방법에 대해 지금도 생각을 하고 있습니까?</p>
              <div className="grid grid-cols-2 gap-3">
                {["없음", "있음"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setP4Answers({ ...p4Answers, q2: opt })}
                    className={`py-2.5 text-sm font-bold rounded-lg border transition-all ${
                      p4Answers.q2 === opt
                        ? "bg-[#1E2D4E] border-[#1E2D4E] text-white shadow-sm"
                        : "bg-white text-gray-600 border-[#EAE5D9] hover:bg-[#F8F5F0]"
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
                    className="bg-white border border-[#EAE5D9] rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#8C7862] transition-all w-full text-sm h-20 text-gray-800"
                  />
                </div>
              )}
            </div>

            {/* Card 3 */}
            <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-xl p-4 shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
              <p className="text-sm font-bold text-gray-900 mb-3">3. 생각하는 것과 생각을 행동에 옮기는 것은 큰 차이가 있습니다. 앞으로 한 달 내에는 어느 때라도 당신 자신을 해치거나 당신의 삶을 끝내겠다는 그 생각을 행동으로 옮길 것 같습니까?</p>
              <div className="grid grid-cols-3 gap-2">
                {["전혀 아니다", "약간 그렇다", "매우 그렇다"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setP4Answers({ ...p4Answers, q3: opt })}
                    className={`py-2.5 text-xs font-bold rounded-lg border transition-all ${
                      p4Answers.q3 === opt
                        ? "bg-[#1E2D4E] border-[#1E2D4E] text-white shadow-sm"
                        : "bg-white text-gray-600 border-[#EAE5D9] hover:bg-[#F8F5F0]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-xl p-4 shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
              <p className="text-sm font-bold text-gray-900 mb-3">4. 당신 자신을 해치려는 당신의 행동을 멈추게 하거나 하지 못하게 막는 것이 있습니까?</p>
              <div className="grid grid-cols-2 gap-3">
                {["없음", "있음"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setP4Answers({ ...p4Answers, q4: opt })}
                    className={`py-2.5 text-sm font-bold rounded-lg border transition-all ${
                      p4Answers.q4 === opt
                        ? "bg-[#1E2D4E] border-[#1E2D4E] text-white shadow-sm"
                        : "bg-white text-gray-600 border-[#EAE5D9] hover:bg-[#F8F5F0]"
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
                    className="bg-white border border-[#EAE5D9] rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#8C7862] transition-all w-full text-sm h-20 text-gray-800"
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
                  ? "bg-[#F59E0B] hover:bg-[#D97706] text-white shadow-[0_4px_12px_rgba(245,158,11,0.2)] hover:shadow-[0_6px_16px_rgba(245,158,11,0.3)] transform hover:translate-y-[-1px]"
                  : "bg-gray-300 text-white cursor-not-allowed"
              }`}
            >
              다음: 서약서 작성 →
            </button>

            <button
              onClick={() => setStep("phq9")}
              className="mt-6 text-sm text-[#8C7862] hover:text-[#1E2D4E] transition-colors self-center hover:underline"
            >
              ← 이전으로 돌아가기
            </button>
          </div>
        </div>
      )}

      {/* Pledge Screen */}
      {step === "pledge" && (
        <div className="max-w-2xl w-full bg-[#FAF8F5] rounded-3xl overflow-hidden border border-[#EAE5D9] shadow-[0_12px_40px_rgba(139,123,93,0.06)] flex flex-col animate-fade-in text-left">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#8C7862] to-[#A69584] p-6 text-white relative border-b border-[#EAE5D9]">
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
            <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-xl p-6 shadow-[0_2px_8px_rgba(139,123,93,0.02)] flex flex-col items-center gap-4">
              <span className="text-5xl">🧡</span>
              <h3 className="text-lg font-bold text-gray-900">나는 나 자신과 약속합니다</h3>
              
              <div className="flex flex-col gap-4 text-sm text-gray-700 w-full">
                <div className="flex flex-col gap-2.5">
                  <div className="flex gap-2">
                    <span className="text-[#F59E0B] font-bold">✓</span>
                    <p className="leading-relaxed">나는 절대로 자살하지 않을 것이며, 자해나 자살을 시도하지도 않을 것을 서약합니다. 나는 자살하고 싶은 생각이 들면 반드시 (가족, 친구, 상담자, 성직자)에게 먼저 말할 것입니다. 만일 이 사람들을 만날 수 없으면 전화를 하거나 주위 사람에게 도움을 청하겠습니다.</p>
                  </div>
                  {/* Emergency Contact Input */}
                  <div className="ml-5 mt-1 bg-[#FAF8F5] border border-[#EAE5D9] rounded-xl p-3 animate-fade-in flex flex-col gap-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                    <label htmlFor="emergency-contact" className="text-xs font-bold text-gray-750 flex items-center gap-1">
                      🚨 위기 시 즉시 연락할 비상연락처 (가족, 친구 등)
                    </label>
                    <input
                      id="emergency-contact"
                      type="text"
                      placeholder="예: 어머니 010-1234-5678 (닉네임 또는 연락처)"
                      value={profile.contact}
                      onChange={(e) => handleProfileChange("contact", e.target.value)}
                      className="bg-white border border-[#EAE5D9] rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#8C7862] transition-all w-full text-xs text-gray-800 placeholder-gray-400"
                    />
                    <p className="text-[10px] text-gray-400 font-medium">
                      ※ 위기 상황 발생 시 상담원 연계 및 긴급 알림을 보낼 연락처입니다.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 border-t border-[#EAE5D9]/50 pt-3">
                  <span className="text-[#F59E0B] font-bold">✓</span>
                  <p className="leading-relaxed">나는 충분한 휴식과 수면을 취하고 잘 먹을 것을 서약합니다.</p>
                </div>
                <div className="flex gap-2 border-t border-[#EAE5D9]/50 pt-3">
                  <span className="text-[#F59E0B] font-bold">✓</span>
                  <p className="leading-relaxed">나는 자살 할 수 있는 모든 도구를 없앨 것을 서약합니다.</p>
                </div>
                <div className="flex gap-2 border-t border-[#EAE5D9]/50 pt-3">
                  <span className="text-[#F59E0B] font-bold">✓</span>
                  <p className="whitespace-pre-line leading-relaxed">{"나는 조금이라도 기분이 이상하면 반드시\n\n📞자살예방상담전화 109\n📞한국생명의전화 1588-9191\n\n로 전화를 걸거나 어떠한 수단을 써서라도 알리겠습니다. 이 사실을 알리기 전에는 절대로 아무런 행동을 하지 않을 것을 서약합니다."}</p>
                </div>
              </div>
            </div>

            {/* Signature Area */}
            <div className="flex flex-col gap-4">
              <div className="text-center text-sm font-bold text-[#8C7862]">
                {formattedDate}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Client Signature */}
                <div className="bg-white border border-dashed border-[#EAE5D9] rounded-xl p-4 flex flex-col gap-2 shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
                  <label className="text-xs font-bold text-gray-500">내담자 서명</label>
                  <input
                    type="text"
                    placeholder="닉네임 또는 성명"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    className="bg-transparent border-b border-[#EAE5D9] focus:outline-none focus:border-[#8C7862] transition-all py-1 text-center font-serif italic text-lg text-gray-800"
                  />
                </div>
                
                {/* Counselor Signature */}
                <div className="bg-white border border-dashed border-[#EAE5D9] rounded-xl p-4 flex flex-col gap-2 items-center justify-center relative overflow-hidden shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
                  <label className="text-xs font-bold text-gray-500 absolute top-4 left-4">상담자 서명</label>
                  <div className="text-sm font-bold text-gray-400 mt-4 mr-6">
                    우울빼미 서비스 운영팀
                  </div>
                  {/* Custom SVG filter to convert black to red (#DC2626) while keeping white/transparent */}
                  <svg width="0" height="0" className="absolute pointer-events-none" style={{ position: "absolute", width: 0, height: 0 }}>
                    <defs>
                      <filter id="blackToRedStamp">
                        <feColorMatrix type="matrix" values="
                          0.14 0 0 0.86 0
                          0 0.85 0 0.15 0
                          0 0 0.85 0.15 0
                          0 0 0 1 0
                        " />
                      </filter>
                    </defs>
                  </svg>
                  {/* Mock Seal with Owl Image */}
                  <div className="absolute right-3 bottom-2 w-14 h-14 border border-dashed border-[#DC2626] rounded-full flex items-center justify-center bg-white/40 transform rotate-12 opacity-85 shadow-[inset_0_0_4px_rgba(220,38,38,0.2)]">
                    <div className="w-12 h-12 border-2 border-[#DC2626] rounded-full flex items-center justify-center relative overflow-hidden bg-white/20">
                      <img 
                        src="/우울빼미흑백.png" 
                        alt="우울빼미 인장" 
                        className="w-10 h-10 object-contain select-none"
                        style={{
                          filter: "url(#blackToRedStamp)"
                        }}
                      />
                      <span className="absolute text-[8px] font-black text-[#DC2626] bottom-0.5 bg-white/70 px-0.5 rounded leading-none select-none">
                        우울빼미
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={async () => {
                if (signature.trim() !== "") {
                  let savedDate = new Date().toISOString();
                  try {
                    const filteredPhq9 = phq9Answers.filter((a) => a !== null) as number[];
                    const p4List = [p4Answers.q1, p4Answers.q2, p4Answers.q3, p4Answers.q4];
                    
                    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                    const res = await fetch(`${apiBase}/api/survey/save`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        user_id: loggedInUser?.userId || "anonymous_user",
                        phq9_answers: filteredPhq9,
                        p4_answers: p4List,
                        gender: profile.gender,
                        age_group: profile.ageGroup,
                        occupation: profile.occupation,
                        region: profile.region,
                        contact: profile.contact,
                        phone: profile.phone
                      })
                    });
                    if (res.ok) {
                      const resData = await res.json();
                      if (resData.data && resData.data.last_phq9_date) {
                        savedDate = resData.data.last_phq9_date;
                      }
                    } else {
                      console.error("설문 저장 실패");
                    }
                  } catch (err) {
                    console.error("설문 저장 API 연동 실패:", err);
                  }
                  
                  setLastPhq9Date(savedDate);

                  // 거주지역(region) 및 마지막 검사날짜 세션 및 로컬스토리지 즉시 동기화
                  setLoggedInUser(prev => prev ? { ...prev, region: profile.region } : null);
                  const localUser = localStorage.getItem("uulppae_user");
                  if (localUser) {
                    try {
                      const parsed = JSON.parse(localUser);
                      parsed.region = profile.region;
                      parsed.last_phq9_date = savedDate;
                      parsed.has_profile = true;
                      localStorage.setItem("uulppae_user", JSON.stringify(parsed));
                    } catch (e) {
                      console.error("로컬 스토리지 갱신 에러", e);
                    }
                  }

                  // 로컬 폴백 오프라인 스토어 업데이트
                  try {
                    if (loggedInUser?.userId) {
                      const localUsersStr = localStorage.getItem("local_users_fallback");
                      let localUsers = localUsersStr ? JSON.parse(localUsersStr) : {};
                      if (!localUsers[loggedInUser.userId]) {
                        localUsers[loggedInUser.userId] = {};
                      }
                      localUsers[loggedInUser.userId].last_phq9_date = savedDate;
                      localUsers[loggedInUser.userId].gender = profile.gender;
                      localUsers[loggedInUser.userId].age_group = profile.ageGroup;
                      localUsers[loggedInUser.userId].occupation = profile.occupation;
                      localUsers[loggedInUser.userId].region = profile.region;
                      localStorage.setItem("local_users_fallback", JSON.stringify(localUsers));
                    }
                  } catch (e) {}
                  
                  setStep("result");
                }
              }}
              disabled={signature.trim() === ""}
              className={`font-bold py-3.5 rounded-xl mt-2 transition-all duration-200 w-full flex items-center justify-center gap-2 ${
                signature.trim() !== ""
                  ? "bg-[#F59E0B] hover:bg-[#D97706] text-white shadow-[0_4px_12px_rgba(245,158,11,0.2)] hover:shadow-[0_6px_16px_rgba(245,158,11,0.3)] transform hover:translate-y-[-1px]"
                  : "bg-gray-300 text-white cursor-not-allowed"
              }`}
            >
              서약하고 시작하기 🦉
            </button>

            <button
              onClick={() => setStep("p4")}
              className="mt-6 text-sm text-[#8C7862] hover:text-[#1E2D4E] transition-colors self-center hover:underline"
            >
              ← 이전으로 돌아가기
            </button>
          </div>
        </div>
      )}

      {/* Result Screen */}
      {/* Result Screen */}
      {step === "result" && (
        <div className={`max-w-3xl w-full rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(139,123,93,0.06)] border flex flex-col animate-fade-in ${
          isHighRisk ? "bg-[#1E2D4E] text-white border-red-900/30" : "bg-[#FAF8F5] text-gray-800 border-[#EAE5D9]"
        }`}>
          {/* Header */}
          <div className={`bg-gradient-to-r ${isHighRisk ? "from-red-950 to-[#1E2D4E]" : "from-[#8C7862] to-[#A69584]"} p-6 text-white text-center border-b ${isHighRisk ? "border-red-900/30" : "border-[#EAE5D9]"}`}>
            <h2 className="text-xl font-bold flex items-center justify-center gap-2">
              당신의 마음 검사 결과입니다
            </h2>
          </div>

          <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[75vh]">
            {/* Score Selector for Testing */}
            <div className={`p-3 rounded-xl flex flex-wrap gap-2 text-xs justify-center items-center shadow-inner ${isHighRisk ? "bg-[#111A2E]" : "bg-white border border-[#EAE5D9]"}`}>
              <span className="font-bold mr-1">🧪 시나리오 테스트용 점수 강제 세팅:</span>
              <button onClick={() => { setPhq9Answers(Array(9).fill(0)); setP4Answers({ q1: "없음", q2: "없음", q2_text: "", q3: "전혀 아니다", q4: "있음", q4_text: "" }); }} className="px-2.5 py-1 bg-white border border-[#EAE5D9] text-gray-700 rounded-lg shadow-sm hover:bg-[#F8F5F0] hover:scale-[1.05] transition-all font-semibold">🟢 0~4점 (저위험 우울빼미)</button>
              <button onClick={() => { setPhq9Answers([1,2,1,2,0,0,1,0,0]); setP4Answers({ q1: "없음", q2: "없음", q2_text: "", q3: "전혀 아니다", q4: "있음", q4_text: "" }); }} className="px-2.5 py-1 bg-white border border-[#EAE5D9] text-gray-700 rounded-lg shadow-sm hover:bg-[#F8F5F0] hover:scale-[1.05] transition-all font-semibold">🟡 5~9점 (자율 선택)</button>
              <button onClick={() => { setPhq9Answers([2,2,2,2,2,2,0,0,2]); setP4Answers({ q1: "없음", q2: "없음", q2_text: "", q3: "전혀 아니다", q4: "있음", q4_text: "" }); }} className="px-2.5 py-1 bg-white border border-[#EAE5D9] text-gray-700 rounded-lg shadow-sm hover:bg-[#F8F5F0] hover:scale-[1.05] transition-all font-semibold">🔵 10~19점 (지우 상담)</button>
              <button onClick={() => { setPhq9Answers(Array(9).fill(3)); setP4Answers({ q1: "있음", q2: "있음", q2_text: "위기", q3: "매우 그렇다", q4: "없음", q4_text: "없음" }); }} className="px-2.5 py-1 bg-white border border-[#EAE5D9] text-gray-700 rounded-lg shadow-sm hover:bg-[#F8F5F0] hover:scale-[1.05] transition-all font-semibold">🔴 P4 1+ 또는 PHQ 20+ (고위험 클로)</button>
            </div>

            {/* 1. 고위험군 (High Risk - Cloe) */}
            {isHighRisk && (
              <div className="bg-[#111A2E]/50 border border-red-900/30 rounded-2xl p-6 flex flex-col items-center text-center gap-5 shadow-lg">
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
                  <a href="tel:1577-0199" className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-between shadow-md hover:scale-[1.01]">
                    <span>📞 1577-0199 정신건강 위기상담전화</span>
                    <span className="font-extrabold">지금 연결 →</span>
                  </a>
                  <a href="tel:119" className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-between shadow-md hover:scale-[1.01]">
                    <span>📞 119 안전신고센터 및 긴급구조</span>
                    <span className="font-extrabold">지금 연결 →</span>
                  </a>
                </div>

                <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4 w-full text-left mt-2">
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
                  className="font-bold py-4 px-8 rounded-xl transition-all duration-300 w-full mt-4 shadow-lg bg-white text-[#1E2D4E] hover:bg-[#FAF8F5] hover:scale-[1.01]"
                >
                  클로와 안전 가이드 대화 시작하기
                </button>
              </div>
            )}

            {/* 2. 중등도 위험군 (Moderate Risk - Jiwoo) */}
            {isModerateRisk && (
              <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-2xl p-6 flex flex-col items-center text-center gap-5 shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
                <span className="bg-[#E0F2FE] text-[#0369A1] px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
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

                <div className="bg-white border border-[#EAE5D9] rounded-xl p-4 w-full text-left text-xs text-gray-600 flex gap-2">
                  <span>💡</span>
                  <p>
                    성찰과 치유를 목적으로 하는 CBT-ACT(인지행동치료/수용전념치료) 기반의 대화를 진행합니다.<br />
                    상태에 따라 멘토 선생님이 추가적으로 지원을 도울 수 있습니다.
                  </p>
                </div>

                <button
                  onClick={() => { setInitialPersona(2); setStep("chat"); }}
                  className="font-bold py-3.5 px-8 rounded-xl transition-all duration-300 w-full mt-2 shadow-sm bg-[#F59E0B] hover:bg-[#D97706] text-white hover:scale-[1.01]"
                >
                  지우와 심층 심리상담 시작하기 →
                </button>
              </div>
            )}

            {/* 3. 정상 ~ 경도 위험군 (User Selection - 통합 노드) */}
            {isUserSelection && (
              <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-2xl p-6 flex flex-col items-center text-center gap-6 shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
                <span className="bg-[#FEF3C7] text-[#B45309] px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
                  🟡 정상 ~ 경도 위험 · 자율 선택 케어
                </span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">PHQ-9 {totalScore}점 · P4 {p4Score}점</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    경미한 우울이나 일시적인 정서적 무거움이 관찰되는 단계입니다.<br />
                    오늘의 기분과 고민 영역에 맞는 챗봇을 직접 선택하여 대화를 시작해보세요.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-2">
                  {/* Card A: Uulppae */}
                  <div className="bg-white border border-[#EAE5D9] rounded-2xl p-5 flex flex-col items-center justify-between gap-3 shadow-[0_2px_8px_rgba(139,123,93,0.01)] hover:shadow-md hover:scale-[1.03] transition-all duration-300">
                    <img src="/달려가는 우울빼미.png" alt="우울빼미" className="w-16 h-16 object-contain" />
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">우울빼미</h4>
                      <p className="text-[11px] text-[#B7791F] font-semibold mt-1">따뜻한 위로와 친근한 대화</p>
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                        다정한 정서적 래포 형성과 일상의 따뜻한 이야기를 나눕니다.
                      </p>
                    </div>
                    <button
                      onClick={() => { setInitialPersona(1); setStep("chat"); }}
                      className="w-full bg-[#1E2D4E] hover:bg-[#2A3B5C] text-white text-xs font-bold py-2.5 rounded-xl mt-2 transition-colors shadow-sm"
                    >
                      우울빼미 선택
                    </button>
                  </div>

                  {/* Card B: Mentor */}
                  <div className="bg-white border border-[#EAE5D9] rounded-2xl p-5 flex flex-col items-center justify-between gap-3 shadow-[0_2px_8px_rgba(139,123,93,0.01)] hover:shadow-md hover:scale-[1.03] transition-all duration-300">
                    <img src="/멘토 선생님.png" alt="멘토 선생님" className="w-16 h-16 object-contain" />
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">멘토 선생님</h4>
                      <p className="text-[11px] text-[#065F46] font-semibold mt-1">인지 왜곡 및 부정 생각 정리</p>
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                        생각 오류를 소크라테스식 문답으로 스스로 고치도록 유도합니다.
                      </p>
                    </div>
                    <button
                      onClick={() => { setInitialPersona(4); setStep("chat"); }}
                      className="w-full bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold py-2.5 rounded-xl mt-2 transition-colors shadow-sm"
                    >
                      멘토 선생님 선택
                    </button>
                  </div>

                  {/* Card C: Chulsoo */}
                  <div className="bg-white border border-[#EAE5D9] rounded-2xl p-5 flex flex-col items-center justify-between gap-3 shadow-[0_2px_8px_rgba(139,123,93,0.01)] hover:shadow-md hover:scale-[1.03] transition-all duration-300">
                    <img src="/개그맨 철수.png" alt="개그맨 철수" className="w-16 h-16 object-contain" />
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">개그맨 철수</h4>
                      <p className="text-[11px] text-[#86198F] font-semibold mt-1">웰니스 가이드 및 명상</p>
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                        스트레스를 완화하고 차분하게 감정 일기 작성을 지원합니다.
                      </p>
                    </div>
                    <button
                      onClick={() => { setInitialPersona(5); setStep("chat"); }}
                      className="w-full bg-[#D946EF] hover:bg-[#C084FC] text-white text-xs font-bold py-2.5 rounded-xl mt-2 transition-colors shadow-sm"
                    >
                      개그맨 철수 선택
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. 최소 우울 (Low Risk - Uulppae) */}
            {isLowRisk && (
              <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-2xl p-6 flex flex-col items-center text-center gap-5 shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
                <span className="bg-[#D1FAE5] text-[#065F46] px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
                  🟢 저위험 · 안정적인 정서 상태
                </span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">PHQ-9 {totalScore}점 · P4 {p4Score}점</h3>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                    정서적으로 비교적 매우 안정된 상태로 감지되었습니다.<br />
                    우울빼미와 즐거운 이야기를 나누고 소중한 감정 자원을 충전해봐요.
                  </p>
                </div>
                <img src="/달려가는 우울빼미.png" alt="우울빼미" className="w-32 h-32 object-contain my-1" />

                <button
                  onClick={() => { setInitialPersona(1); setStep("chat"); }}
                  className="font-bold py-3.5 px-8 rounded-xl transition-all duration-300 w-full mt-2 shadow-sm bg-[#1E2D4E] hover:bg-[#2A3B5C] text-white hover:scale-[1.01]"
                >
                  우울빼미와 대화 시작하기 →
                </button>
              </div>
            )}

            <button
              onClick={() => setStep("pledge")}
              className={`mt-4 text-xs transition-colors self-center font-semibold ${isHighRisk ? "text-gray-400 hover:text-white" : "text-[#8C7862] hover:text-[#1E2D4E] hover:underline"}`}
            >
              ← 이전으로 돌아가기
            </button>
          </div>
        </div>
      )}

      {/* Chat Screen */}
      {step === "chat" && (
        <div className="w-full max-w-6xl mx-auto p-4 flex justify-center items-center min-h-screen relative">
          <UserFlow 
            initialPersona={initialPersona} 
            onEndChat={(sid) => {
              setCurrentSessionId(sid);
              setStep("journal");
            }} 
            userId={loggedInUser?.userId} 
            phq9Score={totalScore}
            phq9Answers={phq9Answers.filter((a) => a !== null) as number[]}
            p4Answers={[p4Answers.q1, p4Answers.q2, p4Answers.q3, p4Answers.q4]}
            onNavigateToMap={() => {
              setPrevStep("chat");
              setStep("map");
            }}
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
          />

          {/* PHQ-9 재검사 권장 알림 팝업 */}
          {showRephqPopup && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-[#FAF8F5] border border-[#EAE5D9] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center transform scale-100 transition-all duration-300">
                <div className="w-16 h-16 bg-[#F59E0B]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <OwlLogo size={40} variant="ivory" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">PHQ-9 재검사 권장 알림</h3>
                
                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  마지막 우울증 건강 설문(PHQ-9)을 수행한 지 2주일이 경과했습니다. 현재 마음 상태를 정기적으로 점검하고 맞춤형 케어를 받기 위해 자가진단을 다시 진행하시겠습니까?
                </p>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRephqPopup(false);
                      // 기존 설문 상태 초기화 후 검사 시작
                      setPhq9Answers(Array(9).fill(null));
                      setP4Answers({ q1: "없음", q2: "없음", q2_text: "", q3: "전혀 아니다", q4: "있음", q4_text: "" });
                      setCurrentQuestionIndex(0);
                      setStep("consent"); // consent부터 재검사 진행
                    }}
                    className="flex-1 py-3 px-4 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold rounded-xl shadow-md transition-all text-sm"
                  >
                    지금 검사하기
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRephqPopup(false)}
                    className="flex-1 py-3 px-4 bg-white border border-[#EAE5D9] text-gray-700 font-bold rounded-xl hover:bg-[#F8F5F0] transition-colors text-sm"
                  >
                    나중에 하기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Emotional Journal Screen */}
      {step === "journal" && (
        <div className="max-w-2xl w-full bg-[#FAF8F5] rounded-3xl overflow-hidden border border-[#EAE5D9] shadow-[0_12px_40px_rgba(139,123,93,0.06)] flex flex-col animate-fade-in text-left">
          <div className="bg-gradient-to-r from-[#8C7862] to-[#A69584] p-6 text-white text-center border-b border-[#EAE5D9]">
            <h2 className="text-xl font-bold flex items-center justify-center gap-2">
              ✏️ 오늘의 마음 일기 작성
            </h2>
            <p className="text-xs opacity-90 mt-1">오늘 챗봇과의 대화를 돌아보며 감정을 기록해 보세요</p>
          </div>

          <div className="p-6 flex flex-col gap-5">
            <div className="bg-white rounded-2xl p-5 border border-[#EAE5D9] shadow-[0_2px_8px_rgba(139,123,93,0.02)]">
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
                placeholder="여기에 오늘 하루의 마음과 대화 소감을 솔직하게 채워주세요... (예: 오늘 우울빼미와 이야기 나누며 마음이 한결 편안해졌어요. 걱정이 가라앉는 기분이에요.)"
                className="w-full h-44 p-4 border border-[#EAE5D9] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8C7862] text-sm resize-none leading-relaxed transition-all shadow-inner text-gray-800 bg-white"
              />
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setStep("chat")}
                className="flex-1 bg-white border border-[#EAE5D9] text-[#8C7862] hover:text-[#1E2D4E] hover:bg-[#F8F5F0] font-bold py-3.5 rounded-xl transition-all text-sm"
              >
                ← 대화로 돌아가기
              </button>
              <button
                onClick={async () => {
                  if (diaryText.trim().length === 0) return;

                  try {
                    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                    const res = await fetch(`${apiBase}/api/journal/save`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        user_id: loggedInUser?.userId || "anonymous_user",
                        content: diaryText
                      })
                    });
                    if (!res.ok) {
                      console.error("일기 저장 실패");
                    }
                  } catch (err) {
                    console.error("일기 저장 API 연동 실패:", err);
                  }

                  const riskKeywords = ["죽고 싶", "자살", "자해", "끝내고 싶", "수면제", "사라지고", "약 먹고"];
                  const hasRisk = riskKeywords.some(kw => diaryText.includes(kw));

                  if (hasRisk) {
                    setJournalWarning("작성하신 내용에서 안전이 깊이 우려되는 위험 단어 또는 표현이 포착되었습니다. 지금은 혼자 글을 쓰는 것보다, 당신의 안전을 절대적으로 수호해 주는 어시스턴트 클로와의 안전 가이드 대화로 즉시 전환합니다.");
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
                    : "bg-[#F59E0B] hover:bg-[#D97706] shadow-[0_4px_12px_rgba(245,158,11,0.2)] hover:shadow-[0_6px_16px_rgba(245,158,11,0.3)] transform hover:translate-y-[-1px]"
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
          <EmotionReport 
            onContinueChat={() => setStep("chat")} 
            phq9Score={totalScore}
            phq9Severity={
              totalScore <= 9 
                ? "🟡 경도 우울" 
                : totalScore <= 19 
                  ? "🟠 중등도 우울" 
                  : "🔴 고위험 우울"
            }
            sessionId={currentSessionId}
            onNavigateToMap={() => {
              setPrevStep("report");
              setStep("map");
            }}
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            lastPhq9Date={lastPhq9Date}
            onReTakePhq9={() => {
              setPhq9Answers(Array(9).fill(null));
              setP4Answers({ q1: "없음", q2: "없음", q2_text: "", q3: "전혀 아니다", q4: "있음", q4_text: "" });
              setCurrentQuestionIndex(0);
              setStep("consent");
            }}
          />
        </div>
      )}

      {/* Map Screen */}
      {step === "map" && (
        <div className="w-full max-w-6xl mx-auto p-4 flex justify-center items-center min-h-screen animate-fade-in">
          <InteractiveMap 
            userRegion={loggedInUser?.region || profile.region || "서울"} 
            onBack={() => setStep(prevStep)} 
          />
        </div>
      )}

      {/* Counselor Portal */}
      {(step === "counselor_dashboard" || step === "counselor_clients" || step === "counselor_report" || step === "counselor_guide" || step === "counselor_settings" || step === "counselor_crisis") && (
        <div className="flex min-h-screen w-full bg-[#F8F5F0]">
          {/* Sidebar */}
          <aside className="w-64 bg-[#FAF8F5] border-r border-[#EAE5D9] flex flex-col fixed h-full z-30 shadow-[0_4px_20px_rgba(139,123,93,0.02)]">
            {/* Sidebar Brand Header */}
            <div className="p-6 border-b border-[#EAE5D9] flex items-center gap-3 select-none">
              <OwlLogo size={36} variant="ivory" />
              <div className="text-left">
                <span className="font-extrabold text-base text-[#1E2D4E] tracking-tight block">우울빼미</span>
                <span className="text-[10px] bg-[#1E2D4E] text-[#FAF8F5] px-2 py-0.5 rounded-full font-bold">상담사 포털</span>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
              {[
                { id: "counselor_dashboard", label: "대시보드", icon: "📊" },
                { id: "counselor_clients", label: "내담자 목록", icon: "👥" },
                { id: "counselor_crisis", label: "자살/자해 위험군", icon: "🚨" },
                { id: "counselor_report", label: "리포트", icon: "📋" },
                { id: "counselor_guide", label: "개입 가이드", icon: "🛡️" },
                { id: "counselor_settings", label: "설정", icon: "⚙️" }
              ].map((item) => {
                const isActive = step === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setStep(item.id as any)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${
                      isActive
                        ? "bg-[#1E2D4E] text-[#FAF8F5] shadow-md"
                        : "text-[#8C7862] hover:text-[#1E2D4E] hover:bg-[#FAF8F5]/50"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Footer with Logout & User Profile */}
            <div className="p-4 border-t border-[#EAE5D9] bg-[#FAF8F5]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-[#1E2D4E] rounded-full flex items-center justify-center text-[#FAF8F5] font-bold text-xs">
                  지우
                </div>
                <div className="text-[11px] text-left">
                  <p className="font-bold text-gray-800">김상담 상담사</p>
                  <p className="text-gray-400">위기센터 전담</p>
                </div>
              </div>
              <button 
                onClick={() => setStep("onboarding")}
                className="w-full bg-[#FAF8F5] border border-[#EAE5D9] hover:bg-[#F5EFE6] text-xs font-bold py-2 rounded-xl text-red-500 hover:text-red-600 transition-colors flex items-center justify-center gap-1"
              >
                로그아웃
              </button>
            </div>
          </aside>

          {/* Main Layout Area */}
          <div className="flex-1 pl-64 flex flex-col min-h-screen">
            {/* Top Navigation Bar */}
            <header className="h-16 bg-[#FAF8F5] border-b border-[#EAE5D9] px-8 flex justify-between items-center sticky top-0 z-20 shadow-[0_2px_15px_rgba(139,123,93,0.02)]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#8C7862]">상담사 포털</span>
                <span className="text-xs text-[#EAE5D9] font-light">/</span>
                <span className="text-sm font-black text-[#1E2D4E]">
                  {step === "counselor_dashboard" && "대시보드"}
                  {step === "counselor_clients" && "내담자 목록"}
                  {step === "counselor_crisis" && "자살/자해 위험군"}
                  {step === "counselor_report" && "리포트"}
                  {step === "counselor_guide" && "개입 가이드"}
                  {step === "counselor_settings" && "설정"}
                </span>
              </div>
              
              <div className="text-xs text-[#8C7862] font-semibold">
                접속일: {formattedDate}
              </div>
            </header>

            {/* Page transition header strip */}
            <div className="bg-gradient-to-r from-[#1E2D4E] to-[#2E3C56] h-1.5 w-full shrink-0"></div>

            {/* Content Area */}
            <main className="flex-1 p-6 md:p-8">
              <div className="max-w-7xl mx-auto">
                {step === "counselor_dashboard" && (
                  <CounselorDashboard 
                    onSelectClient={(id) => { 
                      setSelectedClientId(id); 
                      setStep("counselor_report"); 
                    }} 
                  />
                )}
                {step === "counselor_clients" && (
                  <CounselorPortal 
                    onSelectClient={(id) => { 
                      setSelectedClientId(id); 
                      setStep("counselor_report"); 
                    }} 
                  />
                )}
                {step === "counselor_crisis" && (
                  <CounselorCrisisDashboard />
                )}
                {step === "counselor_report" && (
                  <CounselorReport 
                    clientId={selectedClientId} 
                  />
                )}
                {step === "counselor_guide" && <CounselorGuide />}
                {step === "counselor_settings" && <CounselorSettings />}
              </div>
            </main>
          </div>
        </div>
      )}

      {/* Developer Quick Navigation Panel */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 font-sans">
        {devOpen && (
          <div className="bg-white/95 backdrop-blur-md border border-gray-200/60 shadow-2xl rounded-2xl p-4 w-80 text-[11px] text-gray-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
              <span className="font-bold text-gray-800 flex items-center gap-1">🛠️ 개발자 퀵 네비게이션</span>
              <button 
                onClick={() => setDevOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold px-1"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-3 border-b border-gray-100 pb-3">
              <span className="text-[10px] text-gray-400 font-semibold block mb-1">⏱️ PHQ-9 재검사 & 팝업 테스트</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
                    setLastPhq9Date(fifteenDaysAgo);
                    
                    // 로컬스토리지 갱신
                    const localUser = localStorage.getItem("uulppae_user");
                    if (localUser) {
                      try {
                        const parsed = JSON.parse(localUser);
                        parsed.last_phq9_date = fifteenDaysAgo;
                        localStorage.setItem("uulppae_user", JSON.stringify(parsed));
                      } catch (e) {}
                    }
                    
                    // 오프라인 폴백 갱신
                    if (loggedInUser?.userId) {
                      try {
                        const localUsersStr = localStorage.getItem("local_users_fallback");
                        let localUsers = localUsersStr ? JSON.parse(localUsersStr) : {};
                        if (!localUsers[loggedInUser.userId]) {
                          localUsers[loggedInUser.userId] = {};
                        }
                        localUsers[loggedInUser.userId].last_phq9_date = fifteenDaysAgo;
                        localStorage.setItem("local_users_fallback", JSON.stringify(localUsers));
                      } catch (e) {}
                    }
                    
                    alert("마지막 PHQ-9 검사일이 15일 전으로 설정되었습니다. 챗방에 재진입하면 권장 팝업이 나타납니다.");
                  }}
                  className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg border border-amber-200 transition-all text-center"
                >
                  🕒 15일 전 가상 설정
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRephqPopup(true);
                    setDevOpen(false);
                  }}
                  className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 transition-all text-center"
                >
                  🚨 권장 팝업 강제 표시
                </button>
              </div>
            </div>

            <div className="mb-3">
              <span className="text-[10px] text-gray-400 font-semibold block mb-1">🔑 자동 로그인 단축키</span>
              <button
                onClick={() => {
                  setLoggedInUser({
                    userId: "user-developer",
                    email: "test@test.com",
                    nickname: "개발자테스트"
                  });
                  setStep("chat");
                  setDevOpen(false);
                }}
                className="w-full py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-lg text-center transition-all flex items-center justify-center gap-1 border border-indigo-100"
              >
                👤 test@test.com 자동 로그인 + 챗방 이동
              </button>
            </div>
            
            <div className="mb-3">
              <span className="text-[10px] text-gray-400 font-semibold block mb-1.5">👤 사용자 화면 바로가기</span>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { label: "온보딩", val: "onboarding" },
                  { label: "역할 선택", val: "select" },
                  { label: "로그인", val: "login" },
                  { label: "개인정보동의", val: "consent" },
                  { label: "프로필 설정", val: "profile" },
                  { label: "PHQ-9 진단", val: "phq9" },
                  { label: "P4 위기진단", val: "p4" },
                  { label: "생명존중서약", val: "pledge" },
                  { label: "결과 리포트", val: "result" },
                  { label: "실시간 대화", val: "chat" },
                  { label: "감정 리포트", val: "report" },
                  { label: "내 주변 지도", val: "map" }
                ].map((s) => (
                  <button
                    key={s.val}
                    onClick={() => {
                      setStep(s.val as any);
                      setDevOpen(false);
                    }}
                    className={`py-1 px-1.5 text-left rounded transition-all truncate border ${
                      step === s.val 
                        ? "bg-indigo-600 text-white font-bold border-indigo-600" 
                        : "bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-100"
                    }`}
                  >
                    • {s.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <span className="text-[10px] text-gray-400 font-semibold block mb-1.5">🧑‍⚕️ 상담사 화면 바로가기</span>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { label: "상담사 대시보드", val: "counselor_dashboard" },
                  { label: "내담자 관리", val: "counselor_clients" },
                  { label: "자살/자해 위험군", val: "counselor_crisis" },
                  { label: "감정 분석 리포트", val: "counselor_report" },
                  { label: "임상 가이드라인", val: "counselor_guide" },
                  { label: "전문가 포털 설정", val: "counselor_settings" }
                ].map((s) => (
                  <button
                    key={s.val}
                    onClick={() => {
                      setStep(s.val as any);
                      setDevOpen(false);
                    }}
                    className={`py-1 px-1.5 text-left rounded transition-all truncate border ${
                      step === s.val 
                        ? "bg-emerald-600 text-white font-bold border-emerald-600" 
                        : "bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-100"
                    }`}
                  >
                    • {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={() => setDevOpen(!devOpen)}
          className="bg-white/80 hover:bg-white backdrop-blur-md border border-gray-200/60 shadow-lg text-[10px] font-bold px-3 py-1.5 rounded-full text-gray-500 hover:text-indigo-600 transition-all flex items-center gap-1 cursor-pointer select-none"
        >
          🛠️ Dev Panel
        </button>
      </div>
    </div>
  );
}
