"use client";

import { useState, useEffect } from "react";
import { 
  Phone, AlertTriangle, ShieldAlert, MapPin, ArrowRight, 
  CheckCircle, Clock, Lock, User
} from "lucide-react";
import InteractiveMap from "./InteractiveMap";

export default function CounselorCrisisDashboard() {
  const [selectedRegion, setSelectedRegion] = useState("서울");
  const [selectedClientId, setSelectedClientId] = useState("user-003");
  const [safetyPlan, setSafetyPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const hotlines = [
    { name: "자살예방 상담전화", number: "1393", desc: "24시간 운영, 자살 위기자 대상 즉각적 전화 심리상담", active: true },
    { name: "정신건강 상담전화", number: "1577-0199", desc: "24시간 운영, 정신건강 위기 및 의료 연계 정보 제공", active: true },
    { name: "보건복지 상담센터", number: "129", desc: "희망의 전화, 보건복지 긴급 지원 및 심리사회적 보호 연계", active: false },
    { name: "112 / 119 긴급구조", number: "112 / 119", desc: "자해/타해 급박 위기 시 경찰/소방 긴급 구조 출동", active: true }
  ];

  useEffect(() => {
    async function fetchSafetyPlan() {
      setLoading(true);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const planRes = await fetch(`${apiBase}/api/counselor/client/${selectedClientId}/safety_plan`);
        if (planRes.ok) {
          const planData = await planRes.json();
          if (planData.status === "success") {
            setSafetyPlan(planData.data);
            return;
          }
        }
      } catch (err) {
        console.error("6단계 안전계획 실시간 패칭 실패:", err);
      } finally {
        setLoading(false);
      }
      
      // Fallback if API fails or offline (highly detailed clinical demo plans)
      if (selectedClientId === "user-003") {
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
      } else if (selectedClientId === "user-004") {
        setSafetyPlan({
          user_id: "user-004",
          current_step: 2,
          step1_warning_signs: "학업 스트레스가 정점에 달하고 머리가 지끈거리며 극도의 좌절감이 들 때.",
          step2_coping_strategies: "좋아하는 게임 스트리밍 시청하기, 찬물로 세수하기",
          step3_social_distraction: "",
          step4_social_support: "",
          step5_professional_agencies: "",
          step6_safe_environment: ""
        });
      } else if (selectedClientId === "user-006") {
        setSafetyPlan({
          user_id: "user-006",
          current_step: 3,
          step1_warning_signs: "부정적인 피드백을 듣고 세상에서 지워지고 싶다는 생각이 강하게 스칠 때.",
          step2_coping_strategies: "일기장에 감정 써내려가기, 심호흡 5회 들이쉬고 내쉬기",
          step3_social_distraction: "근처 한강공원 전망대 벤치에 30분 앉아 가만히 흐르는 강물 바라보기",
          step4_social_support: "",
          step5_professional_agencies: "",
          step6_safe_environment: ""
        });
      } else {
        setSafetyPlan(null);
      }
    }

    fetchSafetyPlan();
  }, [selectedClientId]);

  return (
    <div className="flex flex-col gap-6 text-left animate-in fade-in duration-500">
      {/* Upper Status Bar */}
      <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)] flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="inline-block w-3.5 h-3.5 rounded-full bg-red-500 animate-ping shrink-0"></span>
              자살/자해 위기군 임상 대응 대시보드
            </h2>
            <span className="px-2.5 py-0.5 bg-red-50 text-red-600 text-xs font-bold rounded-full border border-red-100">
              실시간 위기 대응 관제 중
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">위기 핫라인 24시간 연계 및 RAG 기반 전국 정신건강 인프라 맵 통합 관제</p>
        </div>
        
        <div className="flex gap-2">
          {["서울", "경기", "인천", "부산"].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRegion(r)}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                selectedRegion === r
                  ? "bg-[#1E2D4E] text-[#FAF8F5] border-[#1E2D4E] shadow-sm"
                  : "bg-white text-[#8C7862] border-[#EAE5D9] hover:bg-[#FAF8F5]"
              }`}
            >
              📍 {r} 관할 지도
            </button>
          ))}
        </div>
      </div>

      {/* 고위험군 내담자 선택 패널 */}
      <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)] flex items-center justify-between flex-wrap gap-4 animate-in slide-in-from-top duration-300">
        <div className="flex items-center gap-3">
          <ShieldAlert size={20} className="text-red-500 animate-pulse shrink-0" />
          <div>
            <h3 className="font-bold text-gray-800 text-sm">🚨 고위험군 내담자 실시간 관제 및 자원 맵</h3>
            <p className="text-xs text-gray-500 mt-0.5">내담자를 클릭하면 구조봇과 수립 중인 6단계 안전계획 실시간 진행 현황을 조회할 수 있습니다.</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { id: "user-003", name: "최서연", label: "극단위기 (5단계)" },
            { id: "user-004", name: "김민준", label: "극단위기 (2단계)" },
            { id: "user-006", name: "강지원", label: "고위험 (3단계)" },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedClientId(c.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
                selectedClientId === c.id
                  ? "bg-[#1E2D4E] text-[#FAF8F5] border-[#1E2D4E] shadow-sm font-black scale-[1.02]"
                  : "bg-white text-[#8C7862] border-[#EAE5D9] hover:bg-[#FAF8F5]"
              }`}
            >
              <User size={12} /> {c.name} <span className="opacity-80 text-[10px]">({c.label})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stanley-Brown 자살 위기 대응 6단계 안전 계획 (Safety Plan) */}
      {safetyPlan && (
        <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)] flex flex-col gap-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center border-b border-[#EAE5D9]/60 pb-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <ShieldAlert size={18} className="text-[#C07070]" /> Stanley-Brown 자살 위기 대응 6단계 안전 계획 (Safety Plan)
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400">실시간 진척도:</span>
              <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full animate-pulse border border-red-200">
                {safetyPlan.current_step}단계 진행 중 / 6단계
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { 
                step: 1, 
                title: "1단계: 경고 신호", 
                desc: "자살 위기가 임박했음을 알리는 신체적, 정서적 변화", 
                content: safetyPlan.step1_warning_signs 
              },
              { 
                step: 2, 
                title: "2단계: 내적 대처", 
                desc: "도움을 요청하지 않고 혼자서 주의를 분산하고 진정시키는 방법", 
                content: safetyPlan.step2_coping_strategies 
              },
              { 
                step: 3, 
                title: "3단계: 사회적 주의", 
                desc: "위기감을 분산시키기 위해 머물 수 있는 사회적 장소나 사람들", 
                content: safetyPlan.step3_social_distraction 
              },
              { 
                step: 4, 
                title: "4단계: 사회적 지원", 
                desc: "자신의 위기 상황을 털어놓고 도움을 요청할 수 있는 주변인", 
                content: safetyPlan.step4_social_support 
              },
              { 
                step: 5, 
                title: "5단계: 전문 기관", 
                desc: "즉각 연락하여 전문 개입을 받을 수 있는 치료진이나 기관", 
                content: safetyPlan.step5_professional_agencies 
              },
              { 
                step: 6, 
                title: "6단계: 환경 안전", 
                desc: "자해 수단이나 위험 물건에 대한 접근성을 차단하는 안전 방안", 
                content: safetyPlan.step6_safe_environment 
              },
            ].map((item) => {
              const isCompleted = item.step < safetyPlan.current_step;
              const isCurrent = item.step === safetyPlan.current_step;
              const isLocked = item.step > safetyPlan.current_step;
              
              let cardStyle = "border-[#EAE5D9]/40 bg-white/40 text-gray-400";
              let badge = null;
              
              if (isCompleted) {
                cardStyle = "border-emerald-200 bg-emerald-50/20 text-gray-800 shadow-[0_2px_12px_rgba(16,185,129,0.02)]";
                badge = (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    <CheckCircle size={10} /> 완료
                  </span>
                );
              } else if (isCurrent) {
                cardStyle = "border-amber-200 bg-amber-50/30 text-gray-800 shadow-[0_2px_12px_rgba(245,158,11,0.04)] ring-1 ring-amber-300/30";
                badge = (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 animate-pulse">
                    <Clock size={10} /> 진행 중
                  </span>
                );
              } else {
                badge = (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                    <Lock size={10} /> 잠김
                  </span>
                );
              }
              
              return (
                <div key={item.step} className={`p-4 rounded-xl border flex flex-col justify-between min-h-[150px] bg-white transition-all duration-300 ${cardStyle}`}>
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className={`text-xs font-bold ${isLocked ? "text-gray-400" : "text-gray-800"}`}>
                        {item.title}
                      </h4>
                      {badge}
                    </div>
                    <p className="text-[10px] text-[#8C7862] leading-relaxed mb-3">
                      {item.desc}
                    </p>
                  </div>
                  
                  <div className="mt-auto pt-2 border-t border-dashed border-gray-100/60">
                    {isLocked ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-300 italic py-1">
                        <Lock size={12} /> 이전 단계 진행 완료 후 공개됩니다
                      </div>
                    ) : item.content ? (
                      <div className="bg-[#FAF8F5] p-2.5 rounded-lg border border-[#EAE5D9]/40 text-[11px] font-semibold text-gray-700 leading-relaxed shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                        "{item.content}"
                      </div>
                    ) : (
                      <div className="text-[11px] text-amber-600/80 italic py-1.5 bg-amber-50/20 px-2 rounded-lg border border-amber-100/20">
                        ⏳ 구조봇과 내담자가 이 단계를 수립하고 있습니다...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Responsive Grid: Map & Hotlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Map */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#EAE5D9] bg-[#F5EFE6]/30 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <MapPin size={18} className="text-[#5B9E7A]" /> 📍 실시간 인근 정신건강복지센터 및 의료 자원 맵
            </h3>
            <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 border border-green-200 rounded-full font-bold">
              RAG DB 실시간 연동 완료
            </span>
          </div>
          
          <div className="flex-1 min-h-[480px] relative">
            <InteractiveMap 
              userRegion={selectedRegion} 
              showBackBtn={false} 
              title="📍 내담자 주변 심리상담센터 찾기"
            />
          </div>
        </div>

        {/* Right: Hotlines & Emergency Notice */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Crisis Hotlines Call Widget */}
          <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)] flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b border-[#EAE5D9]/60 pb-3 mb-4">
                <Phone size={18} className="text-red-500 animate-pulse shrink-0" /> 긴급 비상 핫라인 바로연결
              </h3>
              
              <div className="space-y-3">
                {hotlines.map((h, i) => (
                  <div 
                    key={i} 
                    className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                      h.active 
                        ? "bg-white border-red-200 hover:shadow-md cursor-pointer hover:border-red-300"
                        : "bg-[#F5EFE6]/30 border-[#EAE5D9] opacity-75"
                    }`}
                    onClick={() => {
                      if (h.active) {
                        alert(`비상 핫라인 전화 연결 시뮬레이션: ${h.number} 번호로 발신합니다. 📞`);
                      }
                    }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs text-gray-800">{h.name}</span>
                      <span className={`w-2 h-2 rounded-full ${h.active ? "bg-red-500 animate-pulse" : "bg-gray-300"}`}></span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-snug line-clamp-1">{h.desc}</p>
                    <div className="flex justify-between items-center mt-2 border-t border-gray-100 pt-1.5 text-[10px] font-black text-red-500">
                      <span>TEL. {h.number}</span>
                      {h.active && <ArrowRight size={12} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-red-50/60 border border-red-100 rounded-xl text-[10px] text-red-700 leading-normal flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 text-red-500 mt-0.5" />
              <div>
                <strong>⚠️ 행동 의무 준수 사항:</strong> 응급 상황 시 즉시 119/112로 연계하여 소방 및 관할 경찰과의 협동 구조를 우선시해 주십시오.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
