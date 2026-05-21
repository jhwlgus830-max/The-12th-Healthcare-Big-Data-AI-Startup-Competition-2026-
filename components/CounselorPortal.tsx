"use client";

import { useState } from "react";
import { Search, Bell, HelpCircle, User, Filter, ChevronDown, AlertCircle, FileText, Activity, MoreVertical } from "lucide-react";
import { counselorInfo, clients } from "@/lib/mockData";

export default function CounselorPortal() {
  const [selectedSort, setSelectedSort] = useState("위험도: 높은순");

  const getRiskBadge = (risk: string) => {
    switch(risk) {
      case "High": return <span className="px-2.5 py-0.5 bg-[#FFF5F5] text-red-600 rounded-full text-xs font-bold border border-red-200">고위험</span>;
      case "Medium": return <span className="px-2.5 py-0.5 bg-[#FFF8F0] text-orange-600 rounded-full text-xs font-bold border border-orange-200">중위험</span>;
      case "Low": return <span className="px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200">저위험</span>;
      default: return null;
    }
  };

  const getActionButton = (risk: string) => {
    switch(risk) {
      case "High": return <button className="px-4 py-2 bg-[#1E2D4E] text-[#FAF8F5] rounded-lg text-xs font-bold hover:bg-[#1E2D4E]/90 transition-colors whitespace-nowrap">가이드 보기</button>;
      case "Medium": return <button className="px-4 py-2 bg-white border border-[#EAE5D9] text-[#8C7862] hover:bg-[#FAF8F5] rounded-lg text-xs font-bold transition-colors whitespace-nowrap">기록 추가</button>;
      case "Low": return <button className="px-4 py-2 bg-white border border-[#EAE5D9] text-[#8C7862] hover:bg-[#FAF8F5] rounded-lg text-xs font-bold transition-colors whitespace-nowrap">상세보기</button>;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header Section */}
      <div className="flex justify-between items-center bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)] flex-col sm:flex-row gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">담당 내담자 통합 목록</h1>
          <p className="text-sm text-gray-500 mt-1">전체 내담자의 위험도 및 최근 상태를 모니터링합니다.</p>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#EAE5D9] rounded-xl text-sm text-[#8C7862] hover:bg-[#FAF8F5] transition-colors">
              {selectedSort} <ChevronDown size={16} />
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#EAE5D9] rounded-xl text-sm text-[#8C7862] hover:bg-[#FAF8F5] transition-colors">
            <Filter size={16} /> 필터
          </button>
        </div>
      </div>

      {/* Client List */}
      <div className="flex flex-col gap-4">
        {clients.map((client) => (
          <div 
            key={client.id}
            className={`bg-[#FAF8F5] rounded-2xl border ${
              client.risk === "High" ? "border-red-300 border-l-4 border-l-red-500" : "border-[#EAE5D9]"
            } hover:shadow-md transition-all p-6 flex flex-col md:flex-row justify-between gap-6`}
          >
            {/* Left Info */}
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-bold text-gray-900 text-lg">{client.name}</h3>
                <span className="text-sm text-gray-500">({client.gender}/{client.id})</span>
                {getRiskBadge(client.risk)}
                {client.risk === "High" && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold border border-red-200 animate-pulse">위험 감지</span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 leading-relaxed">{client.summary}</p>
              
              <div className="text-xs text-gray-400">
                업데이트: {client.updated}
              </div>
            </div>

            {/* Right Scores & Actions */}
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 justify-between md:justify-end">
              {/* Scores */}
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-xs text-[#8C7862] font-semibold mb-1">PHQ-9</p>
                  <p className={`text-xl font-bold ${client.phq9 >= 20 ? 'text-red-600' : client.phq9 >= 10 ? 'text-orange-500' : 'text-green-600'}`}>
                    {client.phq9}점
                  </p>
                </div>
                <div className="text-center border-l pl-6 border-[#EAE5D9]">
                  <p className="text-xs text-[#8C7862] font-semibold mb-1">P4</p>
                  <p className={`text-xl font-bold ${client.p4 >= 2 ? 'text-red-600' : client.p4 >= 1 ? 'text-orange-500' : 'text-green-600'}`}>
                    {client.p4}점
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button className="p-2 text-gray-400 hover:text-[#1E2D4E]">
                  <FileText size={18} />
                </button>
                <button className="p-2 text-gray-400 hover:text-[#1E2D4E]">
                  <Activity size={18} />
                </button>
                <button className="p-2 text-gray-400 hover:text-[#1E2D4E]">
                  <MoreVertical size={18} />
                </button>
                {getActionButton(client.risk)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Elements */}
      <div className="flex flex-col items-center gap-6 mt-4">
        <button className="px-6 py-2.5 bg-white border border-[#EAE5D9] rounded-xl text-sm font-bold text-[#8C7862] hover:bg-[#FAF8F5] transition-colors shadow-sm">
          더보기 (Load More)
        </button>
        <p className="text-xs text-gray-400 text-center max-w-2xl">
          이 도구는 보조 도구이며 전문적인 의학적 진단이나 치료를 대체하지 않습니다.
        </p>
      </div>
    </div>
  );
}
