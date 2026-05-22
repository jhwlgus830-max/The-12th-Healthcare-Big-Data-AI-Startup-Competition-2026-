"use client";

import { useState } from "react";
import { Phone, AlertTriangle, Shield, MapPin, Heart, ArrowRight, ExternalLink, Bookmark } from "lucide-react";
import InteractiveMap from "./InteractiveMap";

export default function CounselorCrisisDashboard() {
  const [selectedRegion, setSelectedRegion] = useState("서울");

  const hotlines = [
    { name: "자살예방 상담전화", number: "1393", desc: "24시간 운영, 자살 위기자 대상 즉각적 전화 심리상담", active: true },
    { name: "정신건강 상담전화", number: "1577-0199", desc: "24시간 운영, 정신건강 위기 및 의료 연계 정보 제공", active: true },
    { name: "보건복지 상담센터", number: "129", desc: "희망의 전화, 보건복지 긴급 지원 및 심리사회적 보호 연계", active: false },
    { name: "112 / 119 긴급구조", number: "112 / 119", desc: "자해/타해 급박 위기 시 경찰/소방 긴급 구조 출동", active: true }
  ];

  const guidelines = [
    {
      step: "01",
      title: "즉각적 위기 상황 평가",
      desc: "내담자의 P4 스크리너 점수가 2점 이상이거나 챗봇 실시간 위험 표현 로그가 탐지된 경우, 자살사고 유무 및 행동적 계획성을 신속히 문진합니다."
    },
    {
      step: "02",
      title: "신체 및 환경 안전 확보",
      desc: "자해 수단이나 치명적 도구를 격리하고 보호자, 학교 보건실, 혹은 사내 위기관리 담당 부서에 긴급 비상 연락을 조치합니다."
    },
    {
      step: "03",
      title: "생명존중 및 자살방지 서약서 체결",
      desc: "감정이 격앙되어 있는 경우, 우울빼미 생명존중 서약 프로세스를 즉각 가동하여 상담사 성명과 내담자 서명을 날인하고 마음의 안정을 유도합니다."
    },
    {
      step: "04",
      title: "지방 정부 전문 위기 대응 센터 연계",
      desc: "우측 실시간 인근 맵(정신건강복지센터, 응급 정신의료기관)을 바탕으로 RAG 연계 병상 및 24시간 정신과 응급실 예약을 유도합니다."
    }
  ];

  return (
    <div className="flex flex-col gap-6 text-left animate-in fade-in duration-500">
      {/* Upper Status Bar */}
      <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)] flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="inline-block w-3.5 h-3.5 rounded-full bg-red-500 animate-ping"></span>
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

      {/* Main Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Emergency Guideline & Hotlines */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Emergency Guideline */}
          <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)] flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b border-[#EAE5D9]/60 pb-3 mb-4">
                <Shield size={18} className="text-[#1E2D4E]" /> 임상 위기 개입 가이드라인
              </h3>
              
              <div className="space-y-4">
                {guidelines.map((g, i) => (
                  <div key={i} className="flex gap-3 items-start group">
                    <span className="text-sm font-extrabold text-[#C4956B] bg-[#F5EFE6] px-2 py-0.5 rounded-lg">
                      {g.step}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800 group-hover:text-[#1E2D4E] transition-colors">
                        {g.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
                        {g.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 p-3 bg-red-50/60 border border-red-100 rounded-xl text-[10px] text-red-700 leading-normal flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 text-red-500 mt-0.5" />
              <div>
                <strong>⚠️ 행동 의무 준수 사항 (C-006 규정):</strong> 본 대시보드에서 도출된 정보와 연락처는 극단 위기 완화 및 임시 대피를 위한 긴급 자원입니다. 응급 상황 시 즉시 119/112로 연계하여 소방 및 관할 경찰과의 협동 구조를 우선시해 주십시오.
              </div>
            </div>
          </div>

          {/* Crisis Hotlines Call Widget */}
          <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)]">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b border-[#EAE5D9]/60 pb-3 mb-4">
              <Phone size={18} className="text-red-500 animate-pulse" /> 긴급 비상 핫라인 바로연결
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs text-gray-800">{h.name}</span>
                      <span className={`w-2 h-2 rounded-full ${h.active ? "bg-red-500 animate-pulse" : "bg-gray-300"}`}></span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-snug line-clamp-2">{h.desc}</p>
                  </div>
                  <div className="flex justify-between items-center mt-3 border-t border-gray-100 pt-2 text-[10px] font-black text-red-500">
                    <span>TEL. {h.number}</span>
                    {h.active && <ArrowRight size={12} />}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Embedded Map */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#EAE5D9] bg-[#F5EFE6]/30 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <MapPin size={18} className="text-[#5B9E7A]" /> 📍 실시간 인근 정신건강복지센터 및 의료 자원 맵
            </h3>
            <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 border border-green-200 rounded-full font-bold">
              RAG DB 실시간 연동 완료
            </span>
          </div>
          
          <div className="flex-1 min-h-[500px] relative">
            {/* Embed the InteractiveMap directly with showBackBtn={false} and chosen region */}
            <InteractiveMap 
              userRegion={selectedRegion} 
              showBackBtn={false} 
            />
          </div>
        </div>

      </div>
    </div>
  );
}
