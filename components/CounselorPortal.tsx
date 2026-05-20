"use client";

import { useState, useEffect } from "react";
import { Search, Bell, HelpCircle, User, Filter, ChevronDown, AlertCircle, FileText, Activity, MoreVertical } from "lucide-react";
import { counselorInfo, clients } from "@/lib/mockData";

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

export default function CounselorPortal({ onSelectClient }: { onSelectClient?: (id: string) => void }) {
  const [selectedSort, setSelectedSort] = useState("위험도: 높은순");
  const [realClients, setRealClients] = useState<RealClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRealClients() {
      try {
        const res = await fetch("http://localhost:8000/api/counselor/clients");
        if (res.ok) {
          const data = await res.json();
          setRealClients(data);
        }
      } catch (err) {
        console.error("실시간 내담자 패칭 실패:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRealClients();
  }, []);

  const getRiskBadge = (risk: string) => {
    switch(risk) {
      case "High": return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold border border-red-200">고위험</span>;
      case "Medium": return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold border border-orange-200">중위험</span>;
      case "Low": return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold border border-green-200">저위험</span>;
      default: return null;
    }
  };

  const getActionButton = (risk: string) => {
    switch(risk) {
      case "High": return <button className="px-4 py-2 bg-[#1E2D4E] text-white rounded-lg text-xs font-bold hover:bg-[#2D4A7A] transition-colors whitespace-nowrap">가이드 보기</button>;
      case "Medium": return <button className="px-4 py-2 bg-[#F7F9FC] border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors whitespace-nowrap">기록 추가</button>;
      case "Low": return <button className="px-4 py-2 bg-[#F7F9FC] border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors whitespace-nowrap">상세보기</button>;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Bar (Search & Profile) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div className="relative w-96">
          <input
            type="text"
            placeholder="Search clients..."
            className="w-full pl-10 pr-4 py-2 bg-[#F7F9FC] border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6096C8] text-sm"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        </div>
        <div className="flex items-center gap-4">
          <button className="text-gray-500 hover:text-gray-700 relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="text-gray-500 hover:text-gray-700">
            <HelpCircle size={20} />
          </button>
          <div className="flex items-center gap-2 border-l pl-4 border-gray-100">
            <div className="w-8 h-8 bg-[#6096C8] rounded-full flex items-center justify-center text-white font-bold text-sm">
              {counselorInfo.avatar}
            </div>
            <div className="text-sm">
              <p className="font-bold text-gray-800">{counselorInfo.name}</p>
              <p className="text-xs text-gray-500">{counselorInfo.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">담당 내담자 통합 목록</h1>
          <p className="text-sm text-gray-500 mt-1">전체 내담자의 위험도 및 최근 상태를 모니터링합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              {selectedSort} <ChevronDown size={16} />
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <Filter size={16} /> 필터
          </button>
        </div>
      </div>

      {/* Client List */}
      <div className="flex flex-col gap-4">
        {/* Mock clients */}
        {clients.map((client) => (
          <div 
            key={client.id}
            onClick={() => onSelectClient?.(client.id)}
            className={`bg-white rounded-2xl shadow-sm border ${
              client.risk === "High" ? "border-red-100 border-l-4 border-l-red-500 animate-pulse-subtle" : "border-gray-100"
            } hover:shadow-md transition-shadow p-6 flex flex-col md:flex-row justify-between gap-6 cursor-pointer`}
          >
            {/* Left Info */}
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-bold text-gray-900 text-lg">{client.name}</h3>
                <span className="text-sm text-gray-500">({client.gender}/{client.id})</span>
                {getRiskBadge(client.risk)}
                {client.risk === "High" && (
                  <span className="px-2 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100">위험 감지</span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 leading-relaxed">{client.summary}</p>
              
              <div className="text-xs text-gray-400">
                업데이트: {client.updated}
              </div>
            </div>

            {/* Right Scores & Actions */}
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
              {/* Scores */}
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-xs text-gray-500 font-medium mb-1">PHQ-9</p>
                  <p className={`text-xl font-bold ${client.phq9 >= 20 ? 'text-red-600' : client.phq9 >= 15 ? 'text-orange-500' : 'text-green-500'}`}>
                    {client.phq9}점
                  </p>
                </div>
                <div className="text-center border-l pl-6 border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-1">P4</p>
                  <p className={`text-xl font-bold ${client.p4 >= 2 ? 'text-red-600' : client.p4 >= 1 ? 'text-orange-500' : 'text-green-500'}`}>
                    {client.p4}점
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                <button className="p-2 text-gray-400 hover:text-gray-600" onClick={() => onSelectClient?.(client.id)}>
                  <FileText size={18} />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600" onClick={() => onSelectClient?.(client.id)}>
                  <Activity size={18} />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <MoreVertical size={18} />
                </button>
                <div onClick={() => onSelectClient?.(client.id)}>
                  {getActionButton(client.risk)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Real-time sync divider */}
        <div className="border-t-2 border-dashed border-gray-200 pt-8 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              실시간 연동 내담자 (DB 연동)
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">
              실시간 동기화 완료 ({realClients.length}명)
            </span>
          </div>
        </div>

        {/* Real clients rendering */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500 text-sm animate-pulse">
            실시간 내담자 데이터를 불러오는 중입니다...
          </div>
        ) : realClients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            아직 실시간으로 연동된 실제 내담자가 없습니다. (내담자가 스크리너를 진행하면 실시간 추가됩니다.)
          </div>
        ) : (
          realClients.map((client) => (
            <div 
              key={client.id}
              onClick={() => onSelectClient?.(client.id)}
              className={`bg-white rounded-2xl shadow-sm border ${
                client.risk === "High" ? "border-red-100 border-l-4 border-l-red-500 animate-pulse-subtle" : "border-gray-100"
              } hover:shadow-md hover:border-[#6096C8]/40 transition-all p-6 flex flex-col md:flex-row justify-between gap-6 cursor-pointer`}
            >
              {/* Left Info */}
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-bold text-gray-900 text-lg">{client.name}</h3>
                  <span className="text-sm text-gray-500">({client.gender}/{client.id.slice(0, 8)}...)</span>
                  {getRiskBadge(client.risk)}
                  {client.risk === "High" && (
                    <span className="px-2 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100 animate-pulse">위험 감지</span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 leading-relaxed">{client.summary}</p>
                
                <div className="text-xs text-gray-400">
                  업데이트: {client.updated}
                </div>
              </div>

              {/* Right Scores & Actions */}
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                {/* Scores */}
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 font-medium mb-1">PHQ-9</p>
                    <p className={`text-xl font-bold ${client.phq9 >= 20 ? 'text-red-600' : client.phq9 >= 15 ? 'text-orange-500' : 'text-green-500'}`}>
                      {client.phq9}점
                    </p>
                  </div>
                  <div className="text-center border-l pl-6 border-gray-100">
                    <p className="text-xs text-gray-500 font-medium mb-1">P4</p>
                    <p className={`text-xl font-bold ${client.p4 >= 2 ? 'text-red-600' : client.p4 >= 1 ? 'text-orange-500' : 'text-green-500'}`}>
                      {client.p4}점
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  <button className="p-2 text-gray-400 hover:text-gray-600" onClick={() => onSelectClient?.(client.id)}>
                    <FileText size={18} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600" onClick={() => onSelectClient?.(client.id)}>
                    <Activity size={18} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <MoreVertical size={18} />
                  </button>
                  <div onClick={() => onSelectClient?.(client.id)}>
                    {getActionButton(client.risk)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Elements */}
      <div className="flex flex-col items-center gap-6 mt-4">
        <button className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
          더보기 (Load More)
        </button>
        <p className="text-xs text-gray-400 text-center max-w-2xl">
          이 도구는 보조 도구이며 전문적인 의학적 진단이나 치료를 대체하지 않습니다.
        </p>
      </div>
    </div>
  );
}

