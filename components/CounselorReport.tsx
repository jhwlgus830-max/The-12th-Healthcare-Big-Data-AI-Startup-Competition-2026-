"use client";

import { useState } from "react";
import { 
  User, Phone, FileText, Edit, BarChart2, PieChart, TrendingUp, AlertTriangle, 
  ChevronRight, Download, Plus, MessageSquare, Info, CheckCircle, Activity
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend
} from "recharts";
import { reportData, clients } from "@/lib/mockData";

const COLORS = ["#6096C8", "#8B7BAD", "#5B9E7A", "#C4956B", "#C07070", "#D0D0D0"];

export default function CounselorReport() {
  const [subStep, setSubStep] = useState<"overview" | "stats" | "detail">("overview");

  // Get specific client for the report (e.g., Kim Ji-hoon C005)
  const client = clients.find(c => c.id === "C005") || clients[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Sub Navigation */}
      <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 w-fit">
        <button 
          onClick={() => setSubStep("overview")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${subStep === "overview" ? "bg-[#1E2D4E] text-white shadow-md" : "text-gray-500 hover:bg-gray-50"}`}
        >
          리포트 개요
        </button>
        <button 
          onClick={() => setSubStep("stats")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${subStep === "stats" ? "bg-[#1E2D4E] text-white shadow-md" : "text-gray-500 hover:bg-gray-50"}`}
        >
          인지 왜곡 통계
        </button>
        <button 
          onClick={() => setSubStep("detail")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${subStep === "detail" ? "bg-[#1E2D4E] text-white shadow-md" : "text-gray-500 hover:bg-gray-50"}`}
        >
          인지 왜곡 상세
        </button>
      </div>

      {/* --- View 1: Overview --- */}
      {subStep === "overview" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
          {/* Header & Profile */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#F0F4F8] rounded-full flex items-center justify-center text-[#6096C8]">
                <User size={32} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                    client.risk === 'High' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {client.risk === 'High' ? '고위험' : '저위험'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{client.age} · {client.gender === '남' ? '남성' : '여성'} · 배정일: 2026.05.10</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm">
                <Phone size={16} /> 비상 연락처
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm">
                <FileText size={16} /> 개입 가이드 보기
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1E2D4E] text-white rounded-xl text-sm font-bold hover:bg-[#2D4A7A] transition-colors shadow-sm">
                <Edit size={16} /> 상담 기록하기
              </button>
            </div>
          </div>

          {/* Visualization Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Test Summary */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle size={18} className="text-[#6096C8]" /> 검사 요약
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-xs text-red-600 font-bold mb-1">PHQ-9 (우울 자가진단)</p>
                    <p className="text-lg font-bold text-gray-900">{client.phq9} / 27 <span className="text-sm font-medium text-red-600 ml-2">심한 우울 상태</span></p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="text-xs text-orange-600 font-bold mb-3">P4 Screener (자살 위험)</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">자살 사고</span>
                        <span className="font-bold text-red-600">Yes</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">계획성</span>
                        <span className="font-bold text-orange-600">Partially</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">보호요인</span>
                        <span className="font-bold text-red-600">Weak</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Emotion Trend */}
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <TrendingUp size={18} className="text-[#6096C8]" /> 감정 변화 추세 (최근 30일)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData.trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#999" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#999" }} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                    <Legend iconType="circle" />
                    <Line type="monotone" dataKey="우울" stroke="#C07070" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="절망" stroke="#8B7BAD" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="무기력" stroke="#6096C8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Risk Log */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" /> 위험 표현 로그
              </h3>
              <div className="space-y-3">
                {reportData.riskLogs.map((log, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-xl flex justify-between items-center border border-gray-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-gray-400">{log.date}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">{log.source}</span>
                      </div>
                      <p className="text-sm text-gray-800 font-medium">"{log.content}"</p>
                    </div>
                    <span className={`text-xs font-bold ${log.severity === "높음" ? "text-red-500" : "text-orange-500"}`}>{log.severity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emotion Distribution */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                <PieChart size={18} className="text-[#6096C8]" /> 감정 분포
              </h3>
              <div className="flex items-center">
                <div className="w-1/2 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={reportData.emotionData}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {reportData.emotionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 pl-4">
                  <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">가장 많이 감지된 감정</p>
                  <ul className="space-y-2">
                    {reportData.emotionData.slice(0, 3).map((item, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: COLORS[i] }}></span> {item.name}</span>
                        <span className="font-bold">{item.value}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- View 2: Stats --- */}
      {subStep === "stats" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">인지 왜곡 종합 빈도 분석</h2>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">진행 중</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">내담자: {client.name} ({client.id}) · 분석 기간: 2026.05.10 ~ 현재</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
                <Download size={16} /> PDF 내보내기
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#1E2D4E] text-white rounded-xl text-sm font-bold hover:bg-[#2D4A7A] transition-colors shadow-sm">
                <Plus size={16} /> 상담 노트 추가
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">유형</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">핵심 특징</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">빈도 수준</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">빈도 (Count)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reportData.distortionStats.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => setSubStep("detail")}>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{item.type}</span>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-[#6096C8] transition-colors" />
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{item.feature}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[100px]">
                          <div className={`h-full ${item.color}`} style={{ width: `${item.percent}%` }}></div>
                        </div>
                        <span className={`text-xs font-bold ${item.level === "높음" ? "text-red-500" : item.level === "중간" ? "text-blue-500" : "text-green-500"}`}>
                          {item.level}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center font-bold text-gray-800">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- View 3: Detail --- */}
      {subStep === "detail" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 text-sm text-[#6096C8] font-bold mb-1 cursor-pointer" onClick={() => setSubStep("stats")}>
                <ChevronRight className="rotate-180" size={14} /> 목록으로 돌아가기
              </div>
              <h2 className="text-3xl font-bold text-gray-900">흑백논리 <span className="text-lg font-normal text-gray-400 ml-2">{client.name} 님의 분석 결과</span></h2>
            </div>
            <div className="flex gap-2">
              <button className="p-2 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors">
                <Download size={20} />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#1E2D4E] text-white rounded-xl text-sm font-bold hover:bg-[#2D4A7A] transition-colors">
                <Plus size={16} /> 노트 추가
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Core Concept */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Info size={20} className="text-[#6096C8]" /> 핵심 개념
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  흑백논리는 이분법적 사고라고도 불리며, 상황이나 대상을 '전부 아니면 전무(All-or-Nothing)'의 관점으로 바라보는 왜곡된 사고 패턴입니다. 완벽하지 않으면 실패라고 단정 짓거나, 중립적인 영역을 인정하지 않는 특징이 있습니다.
                </p>
              </div>
              <div className="mt-8 p-6 bg-green-50 rounded-2xl border border-green-100">
                <p className="text-xs text-green-700 font-bold mb-2 flex items-center gap-1">
                  <MessageSquare size={14} /> 공감 프롬프트 제안
                </p>
                <p className="text-sm text-gray-700 italic">
                  "{client.name}님, 완벽하게 해내지 못했다는 생각 때문에 속상하시군요. 하지만 100점이 아니라고 해서 0점인 것은 아니에요. 오늘 {client.name}님이 노력한 부분들은 분명히 가치가 있어요."
                </p>
              </div>
            </div>

            {/* Frequency */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">빈도 분석</h3>
              <p className="text-4xl font-black text-red-500 mb-2">매우 흔함</p>
              <p className="text-gray-500 mb-8">최근 10회 세션 중 8회 관찰됨</p>
              
              <div className="w-full max-w-xs">
                <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                  <span>낮음</span>
                  <span>매우 높음</span>
                </div>
                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-red-500" style={{ width: "85%" }}></div>
                </div>
              </div>
            </div>

            {/* Detected Phrases */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <MessageSquare size={20} className="text-[#6096C8]" /> 드러나는 문장 (탐지 로그)
              </h3>
              <div className="space-y-4">
                {reportData.detectedPhrases.map((text, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex gap-3">
                    <span className="text-[#6096C8] font-bold">"</span>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed">{text}</p>
                    <span className="text-[#6096C8] font-bold self-end">"</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Context */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Activity size={20} className="text-[#6096C8]" /> 관련 맥락 및 성향
              </h3>
              <div className="flex flex-wrap gap-3">
                {reportData.relatedContext.map((chip, i) => (
                  <div key={i} className="px-4 py-2.5 bg-blue-50 text-[#1E2D4E] rounded-full border border-blue-100 text-sm font-bold flex items-center gap-2">
                    <span>{chip.icon}</span> {chip.label}
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">주요 연관 분석</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {client.name}님의 경우 학업 성취에 대한 **완벽주의적 강박**이 흑백논리를 강화하고 있는 것으로 분석됩니다. 성과가 기대에 못 미칠 때 자신을 '실패자'로 규정하며 **심한 우울감**으로 빠지는 패턴이 반복적으로 나타납니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
