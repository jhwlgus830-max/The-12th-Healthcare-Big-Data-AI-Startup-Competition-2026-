"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Bell, HelpCircle, User, Filter, ChevronDown, AlertCircle, FileText, Activity, MoreVertical, RefreshCw, CheckCircle2, Phone, ShieldAlert, Award } from "lucide-react";
import { counselorInfo, clients } from "@/lib/mockData";

interface RealClient {
  id: string;
  name: string;
  gender: string;
  age: string;
  risk: "Crisis" | "High" | "Medium" | "Low";
  phq9: number;
  p4: number;
  summary: string;
  updated: string;
}

interface CombinedClient extends RealClient {
  isMock: boolean;
  uniqueId: string;
}

export default function CounselorPortal({ onSelectClient }: { onSelectClient?: (id: string) => void }) {
  const [realClients, setRealClients] = useState<RealClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"Crisis" | "High" | "Medium" | "Low">("Crisis");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSort, setSelectedSort] = useState("위험 지표 높은순");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 실시간 DB 데이터 패칭 함수
  async function fetchRealClients() {
    setIsRefreshing(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiBase}/api/counselor/clients`);
      if (res.ok) {
        const data = await res.json();
        setRealClients(data);
      }
    } catch (err) {
      console.error("실시간 내담자 패칭 실패:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    fetchRealClients();
  }, []);

  // 1. Mock 데이터와 실시간 연동 데이터의 고품격 단일 통합
  const combinedClients = useMemo<CombinedClient[]>(() => {
    const mockMapped = clients.map((c) => ({
      ...c,
      risk: c.risk as "Crisis" | "High" | "Medium" | "Low",
      isMock: true,
      uniqueId: `mock-${c.id}`,
    }));

    const realMapped = realClients.map((c) => ({
      ...c,
      isMock: false,
      uniqueId: `real-${c.id}`,
    }));

    // ID 중복 방지 (실시간 연동 데이터가 존재하는 경우 Mock 데이터를 덮어씀)
    const seenIds = new Set<string>();
    const merged: CombinedClient[] = [];

    // 실시간 DB 데이터를 먼저 추가
    realMapped.forEach((item) => {
      merged.push(item);
      seenIds.add(item.id);
    });

    // 실시간 DB에 없는 Mock 데이터만 추가
    mockMapped.forEach((item) => {
      if (!seenIds.has(item.id)) {
        merged.push(item);
      }
    });

    return merged;
  }, [realClients]);

  // 2. 다중 가중치 정렬 헬퍼 (Crisis > High > Medium > Low, 더미 우선, PHQ-9 > P4 내림차순 정렬)
  const sortClients = (list: CombinedClient[]) => {
    return [...list].sort((a, b) => {
      // 1순위: 위험도 수준 정렬 (Crisis > High > Medium > Low)
      const riskOrder = { Crisis: 4, High: 3, Medium: 2, Low: 1 };
      const riskA = riskOrder[a.risk] || 0;
      const riskB = riskOrder[b.risk] || 0;
      if (riskA !== riskB) {
        return riskB - riskA;
      }

      // 2순위: 더미 내담자(Mock) 여부 우선 정렬
      if (a.isMock !== b.isMock) {
        return a.isMock ? -1 : 1;
      }

      // 3순위: 우울 자가진단(PHQ-9) 점수 높은순
      if (b.phq9 !== a.phq9) {
        return b.phq9 - a.phq9;
      }
      // 4순위: 자살 위기스크리너(P4) 점수 높은순
      return b.p4 - a.p4;
    });
  };

  // 3. 실시간 검색 필터링 및 탭별 필터링 연산
  const processedClients = useMemo(() => {
    let filtered = combinedClients;

    // 탭 필터링
    filtered = filtered.filter((c) => c.risk === activeTab);

    // 검색어 필터링 (이름 또는 요약 내용 검색)
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) => c.name.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q)
      );
    }

    // 최종 고위험 가중치 다중 정렬 적용
    return sortClients(filtered);
  }, [combinedClients, activeTab, searchQuery]);

  // 각 탭별 전체 통계 누적 카운트 집계
  const tabCounts = useMemo(() => {
    return {
      Crisis: combinedClients.filter((c) => c.risk === "Crisis").length,
      High: combinedClients.filter((c) => c.risk === "High").length,
      Medium: combinedClients.filter((c) => c.risk === "Medium").length,
      Low: combinedClients.filter((c) => c.risk === "Low").length,
    };
  }, [combinedClients]);

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "Crisis":
        return (
          <span className="px-2.5 py-1 bg-red-600 text-white rounded-full text-[11px] font-black shadow-sm flex items-center gap-1 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-white"></span> 극단위기군
          </span>
        );
      case "High":
        return (
          <span className="px-2.5 py-1 bg-[#FFF5F5] text-red-600 rounded-full text-[11px] font-bold border border-red-200 shadow-sm flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> 고위험군
          </span>
        );
      case "Medium":
        return (
          <span className="px-2.5 py-1 bg-[#FFF8F0] text-orange-600 rounded-full text-[11px] font-bold border border-orange-200 shadow-sm flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400"></span> 중등도군
          </span>
        );
      case "Low":
        return (
          <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-[11px] font-bold border border-green-200 shadow-sm flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> 경도군
          </span>
        );
      default:
        return null;
    }
  };

  const getActionButton = (client: CombinedClient) => {
    const baseClass = "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap";
    switch (client.risk) {
      case "Crisis":
        return (
          <button 
            onClick={() => onSelectClient?.(client.id)}
            className={`${baseClass} bg-red-600 text-white hover:bg-red-700 hover:shadow-md border border-red-600`}
          >
            긴급 위기대응 개입
          </button>
        );
      case "High":
        return (
          <button 
            onClick={() => onSelectClient?.(client.id)}
            className={`${baseClass} bg-[#1E2D4E] text-[#FAF8F5] hover:bg-[#1E2D4E]/90 hover:shadow-md border border-[#1E2D4E]`}
          >
            임상 가이드 & 분석
          </button>
        );
      case "Medium":
      case "Low":
        return (
          <button 
            onClick={() => onSelectClient?.(client.id)}
            className={`${baseClass} bg-white border border-[#EAE5D9] text-[#8C7862] hover:bg-[#FAF8F5] hover:border-[#C4956B]`}
          >
            상세 리포트 조회
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left font-sans">
      {/* Header Section */}
      <div className="flex justify-between items-center bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE5D9] shadow-[0_4px_20px_rgba(139,123,93,0.03)] flex-col lg:flex-row gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">담당 내담자 통합 모니터링</h1>
            <button 
              onClick={fetchRealClients}
              disabled={isRefreshing}
              className={`p-1.5 text-gray-400 hover:text-[#1E2D4E] hover:bg-gray-100 rounded-lg transition-all ${isRefreshing ? 'animate-spin text-[#1E2D4E]' : ''}`}
              title="데이터 새로고침"
            >
              <RefreshCw size={16} />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1.5 font-medium leading-relaxed">
            자가검진 PHQ-9 및 P4 스크리너, 실시간 챗봇 로그를 기반으로 분류된 내담자 목록입니다.
          </p>
        </div>

        {/* Search & Sort Panel */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="내담자 이름 또는 진단 요약 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#EAE5D9] rounded-xl text-sm placeholder-gray-400 text-gray-800 focus:outline-none focus:border-[#C4956B] focus:ring-1 focus:ring-[#C4956B] transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#EAE5D9] rounded-xl text-sm font-semibold text-[#8C7862] hover:bg-[#FAF8F5] transition-colors shadow-sm">
              <Filter size={15} /> 필터
            </button>
            <div className="relative">
              <button className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#EAE5D9] rounded-xl text-sm font-semibold text-[#8C7862] hover:bg-[#FAF8F5] transition-colors shadow-sm">
                <span>{selectedSort}</span>
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 우울증 위험 수준별 4대 프리미엄 탭바 구성 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-[#FAF8F5] p-1.5 rounded-2xl border border-[#EAE5D9] shadow-sm">
        <button
          onClick={() => setActiveTab("Crisis")}
          className={`flex items-center justify-center gap-2 py-3 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
            activeTab === "Crisis"
              ? "bg-red-600 text-white shadow-md font-black scale-[1.01]"
              : "text-[#8C7862] hover:bg-red-50/30 hover:text-red-500"
          }`}
        >
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <span className="truncate">🚨 극단위기 ({tabCounts.Crisis}명)</span>
        </button>

        <button
          onClick={() => setActiveTab("High")}
          className={`flex items-center justify-center gap-2 py-3 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
            activeTab === "High"
              ? "bg-[#FFF5F5] text-red-600 shadow-md border border-red-200/80 font-extrabold scale-[1.01]"
              : "text-[#8C7862] hover:bg-red-50/20 hover:text-red-500"
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-red-500 shrink-0"></span>
          <span className="truncate">🔴 고위험군 ({tabCounts.High}명)</span>
        </button>

        <button
          onClick={() => setActiveTab("Medium")}
          className={`flex items-center justify-center gap-2 py-3 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
            activeTab === "Medium"
              ? "bg-[#FFF8F0] text-orange-600 shadow-md border border-orange-200/80 font-extrabold scale-[1.01]"
              : "text-[#8C7862] hover:bg-orange-50/30 hover:text-orange-500"
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-orange-400 shrink-0"></span>
          <span className="truncate">🟠 중등도군 ({tabCounts.Medium}명)</span>
        </button>

        <button
          onClick={() => setActiveTab("Low")}
          className={`flex items-center justify-center gap-2 py-3 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
            activeTab === "Low"
              ? "bg-green-50/80 text-green-700 shadow-md border border-green-200/80 font-extrabold scale-[1.01]"
              : "text-[#8C7862] hover:bg-green-50/20 hover:text-green-600"
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-green-500 shrink-0"></span>
          <span className="truncate">🟢 경도군 ({tabCounts.Low}명)</span>
        </button>
      </div>

      {/* 내담자 통합 리스트 */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="bg-white rounded-2xl border border-[#EAE5D9] p-12 text-center text-[#8C7862] text-sm shadow-inner flex flex-col items-center justify-center gap-3">
            <div className="animate-spin text-[#C4956B]">
              <RefreshCw size={24} />
            </div>
            <p className="font-medium animate-pulse">실시간 동기화 상태 및 내담자 기록을 연동하고 있습니다...</p>
          </div>
        ) : processedClients.length === 0 ? (
          <div className="bg-[#FAF8F5]/50 rounded-2xl border border-dashed border-[#EAE5D9] p-16 text-center text-gray-400 text-sm flex flex-col items-center justify-center gap-3">
            <AlertCircle size={32} className="text-gray-300" />
            <div>
              <p className="font-bold text-gray-600 text-base">해당 등급의 내담자가 존재하지 않습니다</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                {searchQuery ? "검색 조건에 맞는 내담자가 없습니다. 검색어를 다시 확인해주세요." : "진단 및 모니터링을 진행 중인 대상자가 지정되면 실시간으로 동기화됩니다."}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4.5">
            {/* 정렬 명시 */}
            <div className="flex items-center justify-between pl-1">
              <span className="text-xs font-bold text-[#8C7862] tracking-wider uppercase flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-green-600" />
                정렬 순위: {activeTab === "Crisis" ? "🚨 위기관리 긴급 대응 최우선순위" : "PHQ-9 점수 가중치순"}
              </span>
              <span className="text-xs text-gray-400 font-semibold bg-gray-100/70 px-2 py-0.5 rounded-md">
                조회된 내담자 {processedClients.length}명
              </span>
            </div>

            {/* --- View Type A: Card View (Crisis & High) --- */}
            {(activeTab === "Crisis" || activeTab === "High") && (
              <div className="flex flex-col gap-5 animate-in fade-in duration-300">
                {processedClients.map((client) => {
                  const isCrisis = client.risk === "Crisis";
                  const p4Display = client.p4;
                  return (
                    <div
                      key={client.uniqueId}
                      onClick={() => onSelectClient?.(client.id)}
                      className={`bg-[#FAF8F5] rounded-2xl border transition-all duration-300 p-6 flex flex-col md:flex-row justify-between gap-6 cursor-pointer shadow-[0_2px_8px_rgba(139,123,93,0.02)] hover:shadow-md hover:scale-[1.005] ${
                        isCrisis
                          ? "border-red-400 border-l-[6px] border-l-red-600 bg-red-50/[0.04]"
                          : "border-amber-300 border-l-[6px] border-l-amber-500 bg-amber-50/[0.03]"
                      }`}
                    >
                      {/* Left Info */}
                      <div className="flex-1 flex flex-col gap-3">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-lg tracking-tight">{client.name}</h3>
                          <span className="text-xs text-gray-500 font-semibold bg-white/80 border border-[#EAE5D9] px-2 py-0.5 rounded-md">
                            {client.gender}/{client.age}
                          </span>
                          {getRiskBadge(client.risk)}
                          
                          {client.isMock ? (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[10px] font-semibold border border-gray-200">
                              테스트 케이스
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold border border-blue-100 animate-pulse flex items-center gap-0.5">
                              ⚡ 실시간 연동
                            </span>
                          )}

                          {isCrisis && (
                            <span className="px-2.5 py-0.5 bg-red-100 text-red-700 rounded-md text-[10px] font-extrabold border border-red-200 animate-bounce flex items-center gap-0.5">
                              <Phone size={10} /> 위기 긴급 개입 필요
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 leading-relaxed font-medium mt-1">
                          {client.summary}
                        </p>

                        {/* Crisis 전용: 비상연락처 및 서약서 정보 표시 */}
                        {isCrisis && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-white/60 p-4 rounded-xl border border-red-200/50 mt-2 text-xs text-gray-700 font-medium">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 bg-red-50 text-red-600 rounded-lg"><Phone size={13} /></span>
                              <div>
                                <p className="text-[10px] text-gray-400 font-bold">비상 보호자 연락처</p>
                                <p className="font-bold">010-4180-6449 (모친 양영순)</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 size={13} /></span>
                              <div>
                                <p className="text-[10px] text-gray-400 font-bold">자살방지 서약서</p>
                                <p className="font-bold text-green-700 flex items-center gap-0.5">
                                  <Award size={12} /> 서명 및 동의 완료
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="text-[11px] text-gray-400 font-semibold mt-1 flex items-center gap-1">
                          <span>최근 활동 업데이트:</span>
                          <span className="text-gray-600">{client.updated}</span>
                        </div>
                      </div>

                      {/* Right Scores & Action */}
                      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 justify-between md:justify-end self-stretch md:self-center shrink-0">
                        {/* Scores */}
                        <div className="flex gap-5 bg-white p-3 rounded-xl border border-[#EAE5D9] shadow-sm w-full md:w-auto justify-around">
                          <div className="text-center px-2">
                            <p className="text-[10px] text-[#8C7862] font-bold tracking-tight mb-1">PHQ-9 (우울)</p>
                            <p className={`text-lg font-black ${
                              client.phq9 >= 20 ? 'text-red-600' : 'text-orange-500'
                            }`}>
                              {client.phq9}점
                            </p>
                          </div>
                          <div className="text-center border-l pl-5 border-gray-100 pr-2">
                            <p className="text-[10px] text-[#8C7862] font-bold tracking-tight mb-1">P4 (위험 스크리너)</p>
                            <p className={`text-lg font-black ${
                              client.p4 >= 1 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {p4Display}점
                            </p>
                          </div>
                        </div>

                        {/* Action Panel */}
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => onSelectClient?.(client.id)}
                            className="p-2.5 text-gray-400 hover:text-[#1E2D4E] hover:bg-gray-100 rounded-xl transition-colors"
                            title="상세 리포트"
                          >
                            <FileText size={18} />
                          </button>
                          <button 
                            onClick={() => onSelectClient?.(client.id)}
                            className="p-2.5 text-gray-400 hover:text-[#1E2D4E] hover:bg-gray-100 rounded-xl transition-colors"
                            title="정서 차트"
                          >
                            <Activity size={18} />
                          </button>
                          <div className="ml-1">
                            {getActionButton(client)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* --- View Type B: Table View (Medium & Low) --- */}
            {(activeTab === "Medium" || activeTab === "Low") && (
              <div className="bg-white rounded-2xl border border-[#EAE5D9] overflow-hidden shadow-[0_4px_20px_rgba(139,123,93,0.02)] animate-in fade-in duration-300">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FAF8F5] border-b border-[#EAE5D9] text-xs font-bold text-[#8C7862]">
                        <th className="py-4.5 px-6">내담자 정보</th>
                        <th className="py-4.5 px-6">자가진단 점수</th>
                        <th className="py-4.5 px-6">정서 심각도 게이지 (우울/불안/절망)</th>
                        <th className="py-4.5 px-6">활동 이행도</th>
                        <th className="py-4.5 px-6">최근 활성 시각</th>
                        <th className="py-4.5 px-6 text-right">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE5D9]/40 text-sm">
                      {processedClients.map((client) => {
                        const isLow = client.risk === "Low";
                        // 우울 점수에 비례한 게이지 퍼센트 계산
                        const depressionPct = Math.min(100, Math.round((client.phq9 / 27) * 100));
                        const anxietyPct = isLow ? 15 : 45;
                        const hopelessnessPct = isLow ? 10 : 35;
                        
                        return (
                          <tr 
                            key={client.uniqueId} 
                            onClick={() => onSelectClient?.(client.id)}
                            className="hover:bg-[#FAF8F5]/50 transition-colors cursor-pointer"
                          >
                            {/* 내담자 정보 */}
                            <td className="py-4.5 px-6">
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900 text-base">{client.name}</span>
                                <span className="text-xs text-gray-500 mt-0.5 font-medium">{client.gender}/{client.age}</span>
                              </div>
                            </td>
                            {/* 자가진단 점수 */}
                            <td className="py-4.5 px-6">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center justify-center font-extrabold rounded-lg px-2 py-1 text-xs ${
                                  client.phq9 >= 15 ? 'bg-red-50 text-red-600' : 'bg-orange-50/70 text-orange-600'
                                }`}>
                                  PHQ-9: {client.phq9}점
                                </span>
                              </div>
                            </td>
                            {/* 정서 심각도 게이지 */}
                            <td className="py-4.5 px-6">
                              <div className="flex flex-col gap-1.5 w-44">
                                <div className="flex justify-between text-[10px] font-bold text-gray-500">
                                  <span>우울</span>
                                  <span>{depressionPct}%</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden border border-gray-100 shadow-inner">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      isLow 
                                        ? 'bg-gradient-to-r from-green-400 to-green-500' 
                                        : 'bg-gradient-to-r from-orange-400 to-red-500'
                                    }`}
                                    style={{ width: `${depressionPct}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            {/* 활동 이행도 */}
                            <td className="py-4.5 px-6">
                              {isLow ? (
                                // 저위험군: 감정 일기 작성 여부 (예/아니오)
                                client.id === "user-005" ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                                    <CheckCircle2 size={12} /> 예 (작성완료)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-500 border border-gray-200">
                                    <AlertCircle size={12} /> 아니오 (미작성)
                                  </span>
                                )
                              ) : (
                                // 중위험군: 감정 일기 이행률
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md w-fit border border-orange-100">
                                    일기 작성률 80%
                                  </span>
                                </div>
                              )}
                            </td>
                            {/* 최근 활성 */}
                            <td className="py-4.5 px-6">
                              <span className="text-xs font-semibold text-gray-500">{client.updated}</span>
                            </td>
                            {/* 관리 액션 */}
                            <td className="py-4.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button 
                                  onClick={() => onSelectClient?.(client.id)}
                                  className="p-2 text-gray-400 hover:text-[#1E2D4E] hover:bg-gray-100 rounded-lg transition-colors"
                                  title="임상 분석"
                                >
                                  <FileText size={16} />
                                </button>
                                {getActionButton(client)}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer statistics indicator */}
      <div className="flex flex-col items-center gap-4 mt-6">
        <button 
          onClick={fetchRealClients}
          className="px-6 py-2.5 bg-white border border-[#EAE5D9] rounded-xl text-xs font-bold text-[#8C7862] hover:bg-[#FAF8F5] hover:border-[#C4956B] hover:text-[#C4956B] transition-all shadow-sm flex items-center gap-2"
        >
          <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
          실시간 내담자 목록 동기화
        </button>
        <p className="text-[10px] text-gray-400 text-center max-w-xl leading-normal">
          본 대시보드는 실시간 AI 챗봇 로그와 스크리너 데이터의 다각도 결합을 통해 상담사님의 임상적 의사결정을 보조합니다. 자해 및 자살 등 극단적 고위험 징후 감지 시 시스템 가이드에 따라 외부 전문 기관(1393) 연계를 즉시 권고합니다.
        </p>
      </div>
    </div>
  );
}

