"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowRight, Calendar } from "lucide-react";

export default function EmotionReport({ onContinueChat }: { onContinueChat?: () => void }) {
  const [currentTab, setCurrentTab] = useState("대화턴");
  
  const trendData = [
    { turn: 1, 우울감: 0.0, 슬픔: 0.0, 외로움: 0.0, 분노: 0.0, 무기력: 1.0, 불면: 0.0, 피로: 0.0 },
    { turn: 2, 우울감: 0.15, 슬픔: 0.15, 외로움: 0.2, 분노: 0.0, 무기력: 0.45, 불면: 0.0, 피로: 0.0 },
    { turn: 3, 우울감: 0.05, 슬픔: 0.05, 외로움: 0.05, 분노: 0.0, 무기력: 0.6, 불면: 0.05, 피로: 0.25 },
    { turn: 4, 우울감: 0.2, 슬픔: 0.0, 외로움: 0.0, 분노: 0.0, 무기력: 0.1, 불면: 0.6, 피로: 0.02 },
  ];

  const emotions = [
    { name: "우울감", color: "#EF4444" },
    { name: "슬픔", color: "#3B82F6" },
    { name: "외로움", color: "#A855F7" },
    { name: "분노", color: "#F97316" },
    { name: "무기력", color: "#D946EF" },
    { name: "불면", color: "#0D9488" },
    { name: "피로", color: "#F59E0B" },
  ];

  const [visibleEmotions, setVisibleEmotions] = useState<string[]>(["무기력", "불면", "피로", "외로움", "우울감", "슬픔"]);

  const toggleEmotion = (name: string) => {
    setVisibleEmotions(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const pieData = [
    { name: "무기력", value: 35, color: "#D946EF" },
    { name: "우울감", value: 25, color: "#EF4444" },
    { name: "슬픔", value: 15, color: "#3B82F6" },
    { name: "외로움", value: 10, color: "#A855F7" },
    { name: "불안", value: 10, color: "#C07070" },
    { name: "기타", value: 5, color: "#D0D0D0" },
  ];

  const mindData = [
    { key: "A", title: "정서", desc: "무기력, 슬픔 감지", color: "border-[#D946EF]" },
    { key: "B", title: "행동", desc: "활동 감소, 수면 이상", color: "border-[#0D9488]" },
    { key: "C", title: "인지", desc: "'난 아무것도 못해' 패턴", color: "border-[#8B7BAD]" },
    { key: "D", title: "욕구", desc: "인정받고 싶은 욕구", color: "border-[#C4956B]" },
  ];

  const tabs = ["대화턴", "1일", "7일", "14일", "30일"];

  return (
    <div className="max-w-7xl w-full bg-white rounded-3xl overflow-hidden shadow-[0_20px_50px_-20px_rgba(96,150,200,0.15)] flex flex-col animate-fade-in max-h-[90vh]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#5B82B5] to-[#8B7BAD] p-6 text-white shrink-0">
        <div className="text-center">
          <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
            📊 나의 감정 리포트
          </h2>
          <p className="text-sm opacity-90 mt-1">오늘 대화를 분석했어요</p>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-6 flex-1 overflow-hidden">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
          <div className="bg-[#F7F9FC] p-4 rounded-xl text-center border border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-1">총 대화 턴</p>
            <p className="text-2xl font-bold text-gray-800">12회</p>
          </div>
          <div className="bg-[#F7F9FC] p-4 rounded-xl text-center border border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-1">평균 위험도</p>
            <p className="text-2xl font-bold text-[#D97706]">0.42</p>
          </div>
          <div className="bg-[#F7F9FC] p-4 rounded-xl text-center border border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-1">주요 감정</p>
            <p className="text-2xl font-bold text-gray-800">무기력</p>
          </div>
          <div className="bg-[#F7F9FC] p-4 rounded-xl text-center border border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-1">위험 등급</p>
            <p className="text-xl font-bold text-[#D97706]">🟠 중등도</p>
          </div>
        </div>

        {/* Scrollable Content Area - 2 Columns */}
        <div className="overflow-y-auto flex-1 pr-2 -mr-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column (4/12): Score, Donut, MIND, Word Cloud */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Score Card */}
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col items-center">
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  📊 우울 위험 점수
                </h3>
                <div className="relative w-28 h-28 flex items-center justify-center rounded-full border-8 border-orange-200">
                   <div className="text-center">
                     <span className="text-2xl font-black text-gray-800">45</span>
                     <span className="text-gray-400 text-xs">점</span>
                     <div className="text-xs font-bold text-orange-500">🟠 중증</div>
                   </div>
                </div>
              </div>

              {/* Donut Chart */}
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  💭 감정 분포
                </h3>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="h-28 w-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={30}
                          outerRadius={50}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                    {pieData.slice(0, 4).map((item) => (
                      <div key={item.name} className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }}></div>
                        <span className="text-gray-600 font-medium">{item.name}</span>
                        <span className="text-gray-400">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* MIND Framework */}
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  🧠 MIND 프레임워크
                </h3>
                <div className="flex flex-col gap-2">
                  {mindData.map((item) => (
                    <div key={item.key} className={`border-l-4 ${item.color} bg-[#F7F9FC] p-2 rounded-r-lg flex flex-col`}>
                      <p className="text-xs font-bold text-gray-500">{item.key}. {item.title}</p>
                      <p className="text-xs font-bold text-gray-800">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Word Cloud */}
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  ☁️ 자주 쓴 단어
                </h3>
                <div className="bg-[#F7F9FC] rounded-xl p-3 h-32 relative overflow-hidden">
                  <span className="absolute text-2xl font-black text-[#5B82B5] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">힘들어</span>
                  <span className="absolute text-lg font-bold text-[#8B7BAD] top-1/4 left-1/4">무기력</span>
                  <span className="absolute text-sm font-bold text-[#D97706] bottom-1/4 right-1/4">혼자</span>
                  <span className="absolute text-sm font-bold text-[#EF4444] top-1/4 right-1/3">잠</span>
                  <span className="absolute text-xs font-semibold text-[#10B981] bottom-1/3 left-1/4">회사</span>
                  <span className="absolute text-xs font-semibold text-[#6366F1] top-2/3 left-1/3">우울</span>
                </div>
              </div>
            </div>

            {/* Right Column (8/12): New Big Chart */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col gap-4">
                  {/* Title and Subtitle */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      📈 감정별 확률 추이
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      확률 1% 이상으로 나타난 감정만 자동 표시됩니다. 범례를 클릭해 다른 감정도 켜고 끌 수 있어요.
                    </p>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-gray-200 text-sm">
                    {tabs.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setCurrentTab(tab)}
                        className={`px-4 py-2 font-medium transition-colors ${
                          currentTab === tab
                            ? "border-b-2 border-[#6096C8] text-[#6096C8]"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Chart */}
                  <div className="h-64 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                        <XAxis dataKey="turn" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                        <YAxis domain={[0, 1]} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                        <Tooltip />
                        {emotions.map((emotion) => (
                          visibleEmotions.includes(emotion.name) && (
                            <Line
                              key={emotion.name}
                              type="monotone"
                              dataKey={emotion.name}
                              stroke={emotion.color}
                              strokeWidth={3}
                              dot={{ r: 4, fill: emotion.color }}
                              activeDot={{ r: 6 }}
                            />
                          )
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Custom Legend */}
                  <div className="mt-4">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs">
                      {emotions.map((emotion) => (
                        <button
                          key={emotion.name}
                          onClick={() => toggleEmotion(emotion.name)}
                          className={`flex items-center gap-1.5 p-1.5 rounded transition-colors ${
                            visibleEmotions.includes(emotion.name)
                              ? "bg-gray-50 text-gray-800"
                              : "text-gray-400 opacity-60"
                          }`}
                        >
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: emotion.color }}></div>
                          <span className="font-medium truncate">{emotion.name}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      💡 범례에서 감정 이름을 클릭하면 해당 감정 선을 켜고 끌 수 있어요.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-2 shrink-0">
          <button 
            onClick={onContinueChat}
            className="flex-1 bg-[#6096C8] hover:bg-[#5085B7] text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transform hover:translate-y-[-1px] transition-all flex items-center justify-center gap-2"
          >
            대화 계속하기 <ArrowRight size={18} />
          </button>
          <button className="flex-1 bg-white border-2 border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <Calendar size={18} /> 다음 재평가 예약
          </button>
        </div>
      </div>
    </div>
  );
}
