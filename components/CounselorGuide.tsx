"use client";

import { useState } from "react";
import { 
  User, AlertCircle, CheckCircle2, Heart, Calendar, Clock, 
  ChevronDown, FileText, Save, Printer, History, AlertTriangle 
} from "lucide-react";

export default function CounselorGuide() {
  const [status, setStatus] = useState("진행 중");

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 text-left">
      {/* Top Profile Area */}
      <div className="bg-[#FAF8F5] p-6 rounded-2xl shadow-[0_4px_20px_rgba(139,123,93,0.03)] border border-[#EAE5D9] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#F5EFE6] rounded-full flex items-center justify-center text-[#1E2D4E] border border-[#EAE5D9] shadow-sm">
            <User size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-gray-900">김지훈 (Kim Ji-hoon)</h2>
              <span className="px-2.5 py-0.5 bg-[#EF4444] text-[#FAF8F5] text-[11px] font-black rounded-full shadow-sm">고위험</span>
            </div>
            <p className="text-sm text-gray-500 font-medium">ID: 894-A21 · 최근 상담: 2일 전</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: System Recommended Intervention Guide */}
        <div className="bg-[#FAF8F5] p-8 rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)] flex flex-col gap-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-[#EF4444]" size={24} />
            <h3 className="text-xl font-bold text-gray-800">시스템 추천 개입 가이드</h3>
          </div>

          {/* Immediate Safety Check Box */}
          <div className="bg-[#FFF5F5] p-5 rounded-2xl border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="text-red-600" size={18} />
              <p className="font-bold text-red-600">즉각적인 안전 확인 필요</p>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              현재 연락이 가능한 상태인지, 신체적 위험 상황에 처해 있지 않은지 최우선으로 확인하세요.
            </p>
          </div>

          {/* Safety Check Checklist */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#8C7862] uppercase tracking-wider mb-2">안전 확인 체크리스트</h4>
            {[
              "혼자 있는지 확인 및 주변인 유무 파악",
              "자살계획의 구체성 및 수단 접근성 확인",
              "보호자 연락 취함 또는 유관 기관(119, 1393) 연결 검토"
            ].map((item, i) => (
              <label key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#EAE5D9] cursor-pointer hover:bg-[#FAF8F5] transition-colors">
                <input type="checkbox" className="w-5 h-5 rounded border-[#EAE5D9] text-[#1E2D4E] focus:ring-[#1E2D4E] accent-[#1E2D4E]" />
                <span className="text-sm text-gray-700 font-medium">{item}</span>
              </label>
            ))}
          </div>

          {/* Empathy Prompt Box */}
          <div className="bg-[#FFF8F0] p-6 rounded-2xl border border-orange-100 mt-2">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="text-[#F59E0B]" size={20} fill="currentColor" />
              <span className="text-sm font-bold text-orange-700">공감 프롬프트 제안</span>
            </div>
            <p className="text-sm text-gray-700 italic leading-relaxed">
              "지훈님, 지금 얼마나 힘드신지 제가 다 알 수는 없겠지만, 이 상황을 혼자 견디게 하고 싶지 않아요. 제가 안전하게 도와드릴 수 있도록 지금 어디 계신지 말씀해 주실 수 있을까요?"
            </p>
          </div>
        </div>

        {/* Right Column: Counseling Record & Action Details */}
        <div className="bg-[#FAF8F5] p-8 rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)] flex flex-col gap-6">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="text-[#F59E0B]" size={24} />
            <h3 className="text-xl font-bold text-gray-800">상담 기록 및 조치 내역</h3>
          </div>

          <div className="space-y-5">
            {/* Date/Time Input */}
            <div>
              <label className="text-xs font-bold text-[#8C7862] uppercase mb-2 block">상담 일시</label>
              <div className="relative">
                <input 
                  type="datetime-local" 
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#EAE5D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E2D4E] text-sm text-gray-700"
                  defaultValue={new Date().toISOString().slice(0, 16)}
                />
                <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
              </div>
            </div>

            {/* Intervention Type Select */}
            <div>
              <label className="text-xs font-bold text-[#8C7862] uppercase mb-2 block">개입 유형</label>
              <div className="relative">
                <select className="w-full pl-4 pr-10 py-3 bg-white border border-[#EAE5D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E2D4E] text-sm text-gray-700 appearance-none">
                  <option>전화 상담</option>
                  <option>대면 상담</option>
                  <option>모바일 채팅</option>
                  <option>외부 기관 연계</option>
                </select>
                <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>

            {/* Progress Status (Pills) */}
            <div>
              <label className="text-xs font-bold text-[#8C7862] uppercase mb-2 block">진행 상태</label>
              <div className="flex gap-2">
                {["진행 중", "완료", "타 기관 연계"].map((item) => (
                  <button 
                    key={item}
                    onClick={() => setStatus(item)}
                    className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all ${
                      status === item 
                        ? "bg-[#1E2D4E] text-[#FAF8F5] shadow-sm" 
                        : "bg-white border border-[#EAE5D9] text-[#8C7862] hover:bg-[#F5EFE6]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed Content Textarea */}
            <div>
              <label className="text-xs font-bold text-[#8C7862] uppercase mb-2 block">상세 내용 기록</label>
              <textarea 
                className="w-full p-4 bg-white border border-[#EAE5D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E2D4E] text-sm text-gray-700 h-32 resize-none"
                placeholder="내담자의 현재 상태, 대화 내용, 향후 계획 등을 구체적으로 기록해 주세요."
              ></textarea>
            </div>

            {/* Emergency Action Box */}
            <div className="bg-white p-5 rounded-2xl border border-[#EAE5D9]">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-[#EAE5D9] text-red-600 focus:ring-red-600 accent-red-600" />
                <span className="font-bold text-gray-800 text-sm">긴급 조치 실행 여부</span>
              </label>
              <p className="text-[11px] text-gray-500 mt-2 ml-8 leading-relaxed">
                경찰, 119 등 외부 기관에 즉각적인 개입을 요청한 경우 체크하세요. 체크 시 해당 내담자의 상태가 시스템 전체에 긴급 상황으로 공유됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Button Area */}
      <div className="flex justify-end items-center gap-3 mt-4 pb-10">
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-[#EAE5D9] text-gray-700 rounded-xl text-sm font-bold hover:bg-[#FAF8F5] transition-colors shadow-sm">
          <History size={18} /> 전체 내역 보기
        </button>
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-[#EAE5D9] text-gray-700 rounded-xl text-sm font-bold hover:bg-[#FAF8F5] transition-colors shadow-sm">
          <Printer size={18} /> 보고서 출력
        </button>
        <button className="flex items-center gap-2 px-8 py-3 bg-[#1E2D4E] text-[#FAF8F5] rounded-xl text-sm font-bold hover:bg-[#1E2D4E]/90 transition-all shadow-md active:transform active:scale-95">
          <Save size={18} /> 기록 저장
        </button>
      </div>
    </div>
  );
}
