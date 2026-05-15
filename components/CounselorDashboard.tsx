"use client";

import { useState } from "react";
import { Search, Bell, HelpCircle, User, Calendar, Clock, Activity, AlertCircle, FileText, CheckCircle, ArrowRight } from "lucide-react";

export default function CounselorDashboard() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div className="relative w-96">
          <input
            type="text"
            placeholder="내담자 검색..."
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
              김
            </div>
            <div className="text-sm">
              <p className="font-bold text-gray-800">김상담 전문가</p>
              <p className="text-xs text-gray-500">수석 상담사</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">활성 내담자</p>
            <h3 className="text-2xl font-bold text-gray-900">42명</h3>
            <p className="text-xs text-green-600 mt-1">↑ 지난주 대비 2명 증가</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#6096C8]">
            <User size={24} />
          </div>
        </div>
        {/* Card 2 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">고위험 사례</p>
            <h3 className="text-2xl font-bold text-red-600">3건</h3>
            <p className="text-xs text-red-500 mt-1">⚠️ 즉시 모니터링 필요</p>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
            <AlertCircle size={24} />
          </div>
        </div>
        {/* Card 3 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">오늘의 상담</p>
            <h3 className="text-2xl font-bold text-gray-900">5건</h3>
            <p className="text-xs text-gray-500 mt-1">3건 완료 / 2건 대기</p>
          </div>
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-[#8B7BAD]">
            <Calendar size={24} />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Next Counseling Schedule */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Clock size={18} className="text-[#6096C8]" /> 다음 상담 일정
              </h2>
              <button className="text-xs text-[#6096C8] hover:underline">전체 보기</button>
            </div>
            <div className="divide-y divide-gray-50">
              {/* Item 1 */}
              <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#F0F6FF] rounded-full flex items-center justify-center font-bold text-[#6096C8]">
                    이
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">이수진 내담자</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={12} /> 14:00 - 15:00
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-32">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">상담 회차</span>
                      <span className="font-medium text-gray-700">4/10회</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#6096C8]" style={{ width: "40%" }}></div>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 border border-[#6096C8] text-[#6096C8] rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors">
                    기록 열기
                  </button>
                </div>
              </div>
              {/* Item 2 */}
              <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#FFF4E5] rounded-full flex items-center justify-center font-bold text-[#C4956B]">
                    박
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">박민수 내담자</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={12} /> 16:00 - 17:00
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-32">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">상담 회차</span>
                      <span className="font-medium text-gray-700">8/12회</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#C4956B]" style={{ width: "66%" }}></div>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 border border-[#6096C8] text-[#6096C8] rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors">
                    기록 열기
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Counselor Check-in */}
          <div className="bg-[#FFF5F5] p-6 rounded-2xl border border-red-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-red-400 shadow-sm">
              <Activity size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">상담사 체크인</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                피로가 누적될 수 있습니다. 다음 상담 전에 5분간 스트레칭을 하거나 따뜻한 차 한 잔을 마시는 것은 어떨까요? 상담사님의 마음 건강도 중요합니다. 💙
              </p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Intensive Monitoring */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <AlertCircle size={18} className="text-red-500" /> 집중 모니터링
              </h2>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {/* Card 1 */}
              <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-gray-800">익명 사용자 1</span>
                  <span className="text-xs text-red-600 font-bold">DANGER</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">우울 척도(PHQ-9) 급증 (18점 → 24점)</p>
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>마지막 활동: 10분 전</span>
                  <button className="text-[#6096C8] hover:underline">상세보기</button>
                </div>
              </div>
              {/* Card 2 */}
              <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-gray-800">김지은 내담자</span>
                  <span className="text-xs text-orange-600 font-bold">WARNING</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">부정적 키워드 빈도 증가 (외로움, 자책)</p>
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>마지막 활동: 2시간 전</span>
                  <button className="text-[#6096C8] hover:underline">상세보기</button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <FileText size={18} className="text-[#6096C8]" /> 최근 활동
              </h2>
            </div>
            <div className="p-4">
              <div className="relative pl-6 flex flex-col gap-4 before:content-[''] before:absolute before:left-2 before:top-1 before:bottom-1 before:w-0.5 before:bg-gray-100">
                {/* Item 1 */}
                <div className="relative">
                  <span className="absolute -left-[22px] top-1 w-3 h-3 bg-[#6096C8] rounded-full border-2 border-white"></span>
                  <p className="text-xs font-bold text-gray-800">이수진 내담자 상담 일지 작성</p>
                  <p className="text-xs text-gray-400 mt-0.5">1시간 전</p>
                </div>
                {/* Item 2 */}
                <div className="relative">
                  <span className="absolute -left-[22px] top-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                  <p className="text-xs font-bold text-gray-800">박민수 내담자 정보 업데이트</p>
                  <p className="text-xs text-gray-400 mt-0.5">3시간 전</p>
                </div>
                {/* Item 3 */}
                <div className="relative">
                  <span className="absolute -left-[22px] top-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"></span>
                  <p className="text-xs font-bold text-gray-800">익명 사용자 1 위험 경고 발생</p>
                  <p className="text-xs text-gray-400 mt-0.5">5시간 전</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
