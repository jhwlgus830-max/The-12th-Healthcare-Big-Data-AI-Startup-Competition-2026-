"use client";

import { useState } from "react";
import { 
  User, Bell, Shield, Lock, Save, ChevronRight, 
  Mail, Building, CreditCard, ShieldCheck, LogIn, RefreshCcw
} from "lucide-react";

export default function CounselorSettings() {
  const [activeTab, setActiveTab] = useState("계정 정보");

  const tabs = [
    { id: "계정 정보", icon: <User size={18} /> },
    { id: "알림 설정", icon: <Bell size={18} /> },
    { id: "권한 관리", icon: <ShieldCheck size={18} /> },
    { id: "보안", icon: <Lock size={18} /> },
  ];

  const Toggle = ({ enabled, label, id }: { enabled: boolean, label: string, id: string }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
      <span className="text-sm font-medium text-gray-700">{label} <span className="text-[10px] text-gray-400 ml-2">({id})</span></span>
      <button className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? "bg-[#6096C8]" : "bg-gray-300"}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${enabled ? "left-7" : "left-1"}`}></div>
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">시스템 설정</h2>
        <p className="text-sm text-gray-500">계정 및 보안 설정을 관리합니다.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex flex-col gap-1 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm h-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? "bg-[#1E2D4E] text-white shadow-md shadow-blue-900/10" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              {tab.id}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[500px]">
          
          {/* Tab 1: Account Info */}
          {activeTab === "계정 정보" && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-right-2 duration-300">
              <h3 className="text-xl font-bold text-gray-800 pb-2 border-b">기본 계정 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">이름</label>
                  <div className="relative">
                    <input type="text" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6096C8] text-sm text-gray-700" defaultValue="김상담" />
                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">이메일</label>
                  <div className="relative">
                    <input type="email" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6096C8] text-sm text-gray-700" defaultValue="counselor_kim@mallang.com" />
                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">사번</label>
                  <div className="relative">
                    <input type="text" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6096C8] text-sm text-gray-700" defaultValue="2024-ST-0092" />
                    <CreditCard className="absolute left-3 top-3 text-gray-400" size={18} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">소속 기관</label>
                  <div className="relative">
                    <input type="text" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6096C8] text-sm text-gray-700" defaultValue="말랑 심리 지원 센터" />
                    <Building className="absolute left-3 top-3 text-gray-400" size={18} />
                  </div>
                </div>
              </div>
              <button className="flex items-center justify-center gap-2 mt-4 px-8 py-3 bg-[#1E2D4E] text-white rounded-xl text-sm font-bold hover:bg-[#2D4A7A] transition-all w-fit self-end">
                <Save size={18} /> 변경사항 저장
              </button>
            </div>
          )}

          {/* Tab 2: Notification Settings */}
          {activeTab === "알림 설정" && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-right-2 duration-300">
              <h3 className="text-xl font-bold text-gray-800 pb-2 border-b">알림 수신 설정</h3>
              <div className="space-y-3">
                <Toggle enabled={true} label="고위험 내담자 알림" id="N-006" />
                <Toggle enabled={true} label="다음 상담 일정 알림" id="N-007" />
                <Toggle enabled={false} label="상담 기록 미작성 알림" id="N-008" />
                <Toggle enabled={true} label="이메일 알림 수신" id="EMAIL" />
              </div>
              <p className="text-xs text-gray-400 bg-blue-50 p-4 rounded-xl border border-blue-100 mt-4 leading-relaxed">
                * 알림 설정 변경 시 즉시 적용됩니다. 고위험 내담자 알림은 시스템 보안 정책에 따라 항시 수신을 권장합니다.
              </p>
            </div>
          )}

          {/* Tab 3: Permission Management */}
          {activeTab === "권한 관리" && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-right-2 duration-300">
              <h3 className="text-xl font-bold text-gray-800 pb-2 border-b">권한 및 담당 정보</h3>
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">현재 권한 레벨</p>
                  <p className="text-lg font-bold text-[#6096C8]">일반 상담사 (General Counselor)</p>
                </div>
                <Shield className="text-gray-300" size={40} />
              </div>
              
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-700">담당 내담자 목록 (읽기 전용)</h4>
                <div className="max-h-[250px] overflow-y-auto pr-2 space-y-2">
                  {["김지훈 (Kim Ji-hoon)", "이수진 (Lee Su-jin)", "박민수 (Park Min-su)", "최지영 (Choi Ji-young)", "정현우 (Jung Hyun-woo)"].map((name, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl text-sm text-gray-600">
                      <span>{name}</span>
                      <ChevronRight size={14} className="text-gray-300" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Security */}
          {activeTab === "보안" && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-right-2 duration-300">
              <h3 className="text-xl font-bold text-gray-800 pb-2 border-b">보안 및 인증</h3>
              
              <div className="space-y-5">
                <div className="p-6 border border-gray-100 rounded-2xl bg-gray-50/50">
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <RefreshCcw size={16} className="text-[#6096C8]" /> 비밀번호 변경
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <input type="password" placeholder="현재 비밀번호" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6096C8] text-sm text-gray-700" />
                    <input type="password" placeholder="새 비밀번호" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6096C8] text-sm text-gray-700" />
                    <button className="px-6 py-2.5 bg-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-300 transition-all w-fit">비밀번호 재설정</button>
                  </div>
                </div>

                <Toggle enabled={true} label="2단계 인증 (2FA) 설정" id="SEC-AUTH" />

                <div className="p-6 border border-gray-100 rounded-2xl">
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <LogIn size={16} className="text-[#6096C8]" /> 마지막 로그인 정보
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex-1">
                      <p className="font-bold text-gray-700 mb-1">일시</p>
                      <p>2024-05-16 12:30:15</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-700 mb-1">IP 주소</p>
                      <p>121.130.XXX.XXX</p>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-[#6096C8] font-bold">인증 완료</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
