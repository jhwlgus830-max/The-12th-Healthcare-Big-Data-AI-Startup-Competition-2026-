"use client";

import { useState, useEffect } from "react";
import { Search, Bell, HelpCircle, User, Calendar, Clock, Activity, AlertCircle, FileText, CheckCircle, ArrowRight } from "lucide-react";
import { counselorInfo, dashboardStats, schedules, monitoringList, recentActivities } from "@/lib/mockData";

interface RealClient {
  id: string;
  name: string;
  gender: string;
  age: string;
  risk: "High" | "Medium" | "Low";
  phq9: number;
  p4: number;
  summary: string;
  updated: string;
}

export default function CounselorDashboard({ onSelectClient }: { onSelectClient?: (id: string) => void }) {
  const [realHighRiskClients, setRealHighRiskClients] = useState<RealClient[]>([]);

  useEffect(() => {
    async function fetchRealClients() {
      try {
        const res = await fetch("http://localhost:8000/api/counselor/clients");
        if (res.ok) {
          const data: RealClient[] = await res.json();
          // Filter only High-risk clients
          const highRisk = data.filter(c => c.risk === "High");
          setRealHighRiskClients(highRisk);
        }
      } catch (err) {
        console.error("실시간 내담자 대시보드 패칭 실패:", err);
      }
    }
    fetchRealClients();
  }, []);
  const getStatIcon = (type: string, color: string) => {
    switch(type) {
      case "user": return <User size={24} />;
      case "alert": return <AlertCircle size={24} />;
      case "calendar": return <Calendar size={24} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dashboardStats.map((stat, i) => (
          <div key={i} className="bg-[#FAF8F5] p-6 rounded-2xl shadow-[0_4px_20px_rgba(139,123,93,0.03)] border border-[#EAE5D9] flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs text-[#8C7862] font-semibold mb-1">{stat.label}</p>
              <h3 className={`text-2xl font-bold ${stat.color === 'red' ? 'text-red-600' : 'text-gray-900'}`}>{stat.value}</h3>
              <p className={`text-xs mt-1 ${stat.color === 'red' ? 'text-red-500' : stat.color === 'blue' ? 'text-green-600' : 'text-gray-500'}`}>{stat.trend}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              stat.color === 'blue' ? 'bg-[#EAE5D9] text-[#1E2D4E]' : 
              stat.color === 'red' ? 'bg-red-50 text-red-500' : 
              'bg-[#F5EFE6] text-[#8C7862]'
            }`}>
              {getStatIcon(stat.type, stat.color)}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Next Counseling Schedule */}
          <div className="bg-[#FAF8F5] rounded-2xl shadow-[0_4px_20px_rgba(139,123,93,0.03)] border border-[#EAE5D9] overflow-hidden">
            <div className="p-4 border-b border-[#EAE5D9] flex justify-between items-center bg-[#F5EFE6]/30">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Clock size={18} className="text-[#1E2D4E]" /> 다음 상담 일정
              </h2>
              <button className="text-xs text-[#1E2D4E] hover:underline font-bold">전체 보기</button>
            </div>
            <div className="divide-y divide-[#EAE5D9]/40 bg-white">
              {schedules.map((session) => (
                <div key={session.id} className="p-4 flex items-center justify-between hover:bg-[#FAF8F5]/80 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      session.color === 'blue' ? 'bg-[#FAF8F5] border border-[#EAE5D9] text-[#1E2D4E]' : 'bg-[#FFF4E5] text-[#C4956B]'
                    }`}>
                      {session.initial}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{session.clientName}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} /> {session.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="w-32">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">상담 회차</span>
                        <span className="font-medium text-gray-700">{session.sessionCount}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${session.color === 'blue' ? 'bg-[#1E2D4E]' : 'bg-[#F59E0B]'}`} style={{ width: `${session.progress}%` }}></div>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 border border-[#1E2D4E] text-[#1E2D4E] rounded-lg text-xs font-bold hover:bg-[#FAF8F5] transition-colors">
                      기록 열기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Counselor Check-in */}
          <div className="bg-[#FFF5F5] p-6 rounded-2xl border border-red-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-red-400 shadow-sm shrink-0">
              <Activity size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">상담사 체크인</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                피로가 누적될 수 있습니다. 다음 상담 전에 5분간 스트레칭을 하거나 따뜻한 차 한 잔을 마시는 것은 어떨까요? 상담사님의 마음 건강도 중요합니다. 🦉
              </p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Intensive Monitoring */}
          <div className="bg-[#FAF8F5] rounded-2xl shadow-[0_4px_20px_rgba(139,123,93,0.03)] border border-[#EAE5D9] overflow-hidden">
            <div className="p-4 border-b border-[#EAE5D9] bg-[#F5EFE6]/30">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <AlertCircle size={18} className="text-red-500" /> 집중 모니터링
              </h2>
            </div>
            <div className="p-4 flex flex-col gap-3 bg-white">
              {monitoringList.map((item) => (
                <div key={item.id} className={`${item.color === 'red' ? 'bg-red-50/50 border-red-200' : 'bg-orange-50/50 border-orange-200'} p-3 rounded-xl border`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-gray-800">{item.name}</span>
                    <span className={`text-xs font-bold ${item.color === 'red' ? 'text-red-600' : 'text-orange-600'}`}>{item.status}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{item.desc}</p>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>마지막 활동: {item.lastActivity}</span>
                    <button 
                      onClick={() => {
                        if (item.name === "김지민") onSelectClient?.("C005");
                        else if (item.name === "이현우") onSelectClient?.("C001");
                        else onSelectClient?.("C005");
                      }} 
                      className="text-[#1E2D4E] hover:underline font-bold"
                    >
                      상세보기
                    </button>
                  </div>
                </div>
              ))}

              {/* Real-time high-risk clients */}
              {realHighRiskClients.length > 0 && (
                <>
                  <div className="border-t border-dashed border-gray-200 my-2 pt-2 text-[10px] font-bold text-red-500 tracking-wider uppercase flex items-center gap-1.5 animate-pulse">
                    <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    실시간 감지 고위험 내담자
                  </div>
                  {realHighRiskClients.map((client) => (
                    <div 
                      key={client.id} 
                      onClick={() => onSelectClient?.(client.id)}
                      className="bg-red-50/70 border-red-100/80 p-3 rounded-xl border hover:shadow-sm transition-all cursor-pointer hover:border-red-300"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-red-900">{client.name}</span>
                        <span className="text-xs font-bold text-red-600 animate-pulse">위험군 감지</span>
                      </div>
                      <p className="text-xs text-red-700 mt-1">PHQ-9 {client.phq9}점 · P4 {client.p4}점</p>
                      <p className="text-[10px] text-red-600/80 mt-1 line-clamp-2 italic">"{client.summary}"</p>
                      <div className="flex justify-between items-center mt-2 text-xs text-red-500">
                        <span>업데이트: {client.updated}</span>
                        <button className="text-red-700 font-bold hover:underline">리포트 열기 →</button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-[#FAF8F5] rounded-2xl shadow-[0_4px_20px_rgba(139,123,93,0.03)] border border-[#EAE5D9] overflow-hidden">
            <div className="p-4 border-b border-[#EAE5D9] bg-[#F5EFE6]/30">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <FileText size={18} className="text-[#1E2D4E]" /> 최근 활동
              </h2>
            </div>
            <div className="p-4 bg-white">
              <div className="relative pl-6 flex flex-col gap-4 before:content-[''] before:absolute before:left-2 before:top-1 before:bottom-1 before:w-0.5 before:bg-[#EAE5D9]">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="relative text-left">
                    <span className={`absolute -left-[22px] top-1 w-3 h-3 rounded-full border-2 border-white ${
                      activity.color === 'blue' ? 'bg-[#1E2D4E]' : 
                      activity.color === 'green' ? 'bg-green-500' : 
                      'bg-orange-500'
                    }`}></span>
                    <p className="text-xs font-bold text-gray-800">{activity.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
