"use client";

import { useState } from "react";
import { Search, Bell, HelpCircle, User, Calendar, Clock, Activity, AlertCircle, FileText, CheckCircle, ArrowRight } from "lucide-react";
import { counselorInfo, dashboardStats, schedules, monitoringList, recentActivities } from "@/lib/mockData";

export default function CounselorDashboard() {
  const getStatIcon = (type: string, color: string) => {
    switch(type) {
      case "user": return <User size={24} />;
      case "alert": return <AlertCircle size={24} />;
      case "calendar": return <Calendar size={24} />;
      default: return null;
    }
  };

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
              {counselorInfo.avatar}
            </div>
            <div className="text-sm">
              <p className="font-bold text-gray-800">{counselorInfo.name}</p>
              <p className="text-xs text-gray-500">{counselorInfo.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dashboardStats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">{stat.label}</p>
              <h3 className={`text-2xl font-bold ${stat.color === 'red' ? 'text-red-600' : 'text-gray-900'}`}>{stat.value}</h3>
              <p className={`text-xs mt-1 ${stat.color === 'red' ? 'text-red-500' : stat.color === 'blue' ? 'text-green-600' : 'text-gray-500'}`}>{stat.trend}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              stat.color === 'blue' ? 'bg-blue-50 text-[#6096C8]' : 
              stat.color === 'red' ? 'bg-red-50 text-red-500' : 
              'bg-purple-50 text-[#8B7BAD]'
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Clock size={18} className="text-[#6096C8]" /> 다음 상담 일정
              </h2>
              <button className="text-xs text-[#6096C8] hover:underline">전체 보기</button>
            </div>
            <div className="divide-y divide-gray-50">
              {schedules.map((session) => (
                <div key={session.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      session.color === 'blue' ? 'bg-[#F0F6FF] text-[#6096C8]' : 'bg-[#FFF4E5] text-[#C4956B]'
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
                        <div className={`h-full ${session.color === 'blue' ? 'bg-[#6096C8]' : 'bg-[#C4956B]'}`} style={{ width: `${session.progress}%` }}></div>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 border border-[#6096C8] text-[#6096C8] rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors">
                      기록 열기
                    </button>
                  </div>
                </div>
              ))}
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
              {monitoringList.map((item) => (
                <div key={item.id} className={`${item.color === 'red' ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'} p-3 rounded-xl border`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-gray-800">{item.name}</span>
                    <span className={`text-xs font-bold ${item.color === 'red' ? 'text-red-600' : 'text-orange-600'}`}>{item.status}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{item.desc}</p>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>마지막 활동: {item.lastActivity}</span>
                    <button className="text-[#6096C8] hover:underline">상세보기</button>
                  </div>
                </div>
              ))}
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
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="relative">
                    <span className={`absolute -left-[22px] top-1 w-3 h-3 rounded-full border-2 border-white ${
                      activity.color === 'blue' ? 'bg-[#6096C8]' : 
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

