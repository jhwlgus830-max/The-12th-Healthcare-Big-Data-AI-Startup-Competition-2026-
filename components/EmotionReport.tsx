"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowRight, Calendar } from "lucide-react";
import { userEmotionReport } from "@/lib/mockData";

interface EmotionReportProps {
  onContinueChat?: () => void;
  phq9Score?: number;
  phq9Severity?: string;
  sessionId?: string | null;
}

export default function EmotionReport({ 
  onContinueChat,
  phq9Score = 14, // 기본값 설정 (테스트용)
  phq9Severity = "🟠 중등도",
  sessionId
}: EmotionReportProps) {
  const [currentTab, setCurrentTab] = useState("대화턴");
  const [reportData, setReportData] = useState<{
    summary: {
      totalTurns: number;
      avgRisk: number;
      mainEmotion: string;
    };
    pieData: { name: string; value: number; color: string }[];
    trendData: any[];
    wordCloud: { text: string; size: string; color: string; pos: string }[];
    mindData: { key: string; title: string; desc: string; color: string }[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // PHQ-9 실제 점수 기반 등급 및 색상 매핑
  const actualScore = phq9Score;
  let actualSeverity = phq9Severity;
  let severityColor = "text-orange-500";
  let badgeColor = "text-[#D97706]";
  let circleBorderColor = "border-orange-200";

  if (phq9Score <= 4) {
    actualSeverity = "🟢 최소 우울";
    severityColor = "text-green-500";
    badgeColor = "text-green-600";
    circleBorderColor = "border-green-200";
  } else if (phq9Score <= 9) {
    actualSeverity = "🟡 경도 우울";
    severityColor = "text-yellow-500";
    badgeColor = "text-yellow-600";
    circleBorderColor = "border-yellow-200";
  } else if (phq9Score <= 14) {
    actualSeverity = "🟠 중등도 우울";
    severityColor = "text-orange-500";
    badgeColor = "text-orange-600";
    circleBorderColor = "border-orange-200";
  } else if (phq9Score <= 19) {
    actualSeverity = "🔴 중증 우울";
    severityColor = "text-red-500";
    badgeColor = "text-red-600";
    circleBorderColor = "border-red-200";
  } else {
    actualSeverity = "💀 극심한 우울";
    severityColor = "text-red-700 font-extrabold";
    badgeColor = "text-red-700 font-extrabold";
    circleBorderColor = "border-red-400";
  }

  // 실시간 대화 기반 감정 정보 로드 및 통계 연동
  useEffect(() => {
    if (!sessionId) return;
    
    const fetchSessionData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`http://localhost:8000/api/chat/history/${sessionId}`);
        if (!res.ok) throw new Error("Failed to fetch session history");
        const history = await res.json();
        
        // 유저 발화만 필터링 (내담자 감정 분석 위함)
        const userMsgs = history.filter((msg: any) => msg.role === "user");
        if (userMsgs.length === 0) {
          setIsLoading(false);
          return;
        }

        const totalTurns = userMsgs.length;

        // 평균 위험도 계산
        const sumRisk = userMsgs.reduce((acc: number, curr: any) => acc + curr.risk_score, 0);
        const avgRisk = parseFloat((sumRisk / totalTurns).toFixed(2));

        // 감정별 누적 확률 및 형태소 클렌징 빈도 분석
        const emotionSum: { [key: string]: number } = {};
        const primaryEmotionCounts: { [key: string]: number } = {};
        const wordCounts: { [key: string]: number } = {};

        userMsgs.forEach((msg: any) => {
          let parsedEmo: any = null;
          try {
            if (msg.emotion) {
              parsedEmo = typeof msg.emotion === "string" ? JSON.parse(msg.emotion) : msg.emotion;
            }
          } catch (e) {
            console.error("Error parsing emotion:", e);
          }

          if (parsedEmo) {
            const primary = parsedEmo.primary || "일상";
            primaryEmotionCounts[primary] = (primaryEmotionCounts[primary] || 0) + 1;

            if (parsedEmo.probabilities) {
              Object.entries(parsedEmo.probabilities).forEach(([emo, prob]) => {
                emotionSum[emo] = (emotionSum[emo] || 0) + (prob as number);
              });
            }
          }

          // 워드클라우드용 단어 카운트
          const cleanText = msg.content
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
            .replace(/\s{2,}/g, " ");
          const words = cleanText.split(" ");
          const stopWords = ["나는", "내가", "너무", "진짜", "그냥", "하고", "했다", "해서", "있어", "같아", "오늘", "너무나", "정말", "엄청", "되게", "아주", "많이", "우리", "나의", "내", "나", "저", "이", "그", "에", "도", "은", "는", "가", "을", "를"];
          words.forEach((w: string) => {
            const trimmed = w.trim();
            if (trimmed.length > 1 && !stopWords.includes(trimmed)) {
              wordCounts[trimmed] = (wordCounts[trimmed] || 0) + 1;
            }
          });
        });

        // 주요 감정 결정 (일상 제외 우선순위)
        let mainEmotion = "일상";
        let maxCount = 0;
        Object.entries(primaryEmotionCounts).forEach(([emo, count]) => {
          if (count > maxCount && emo !== "일상") {
            mainEmotion = emo;
            maxCount = count;
          }
        });
        if (mainEmotion === "일상" && Object.keys(primaryEmotionCounts).length > 1) {
          let secondMax = 0;
          Object.entries(primaryEmotionCounts).forEach(([emo, count]) => {
            if (emo !== "일상" && count > secondMax) {
              mainEmotion = emo;
              secondMax = count;
            }
          });
        }

        // Pie Data 구성
        const avgEmotions = Object.entries(emotionSum).map(([name, sum]) => ({
          name,
          value: Math.round((sum / totalTurns) * 100)
        })).filter(e => e.value > 0);

        avgEmotions.sort((a, b) => b.value - a.value);

        const EMOTION_COLORS: { [key: string]: string } = {
          "우울감": "#EF4444",
          "슬픔": "#3B82F6",
          "외로움": "#A855F7",
          "분노": "#F97316",
          "무기력": "#D946EF",
          "불면": "#0D9488",
          "피로": "#F59E0B",
          "일상": "#10B981",
          "불안": "#EC4899",
          "기타": "#CCCCCC"
        };

        let pieData: { name: string; value: number; color: string }[] = [];
        let otherSum = 0;

        avgEmotions.forEach((item, idx) => {
          if (idx < 4) {
            pieData.push({
              name: item.name,
              value: item.value,
              color: EMOTION_COLORS[item.name] || "#6B7280"
            });
          } else {
            otherSum += item.value;
          }
        });

        if (otherSum > 0) {
          pieData.push({
            name: "기타",
            value: otherSum,
            color: "#CCCCCC"
          });
        }

        if (pieData.length === 0) {
          pieData = [{ name: "일상", value: 100, color: "#10B981" }];
        }

        // Trend Data 구성
        const trendData = userMsgs.map((msg: any, idx: number) => {
          let parsedEmo: any = null;
          try {
            if (msg.emotion) {
              parsedEmo = typeof msg.emotion === "string" ? JSON.parse(msg.emotion) : msg.emotion;
            }
          } catch (e) {}

          const dataPoint: any = { turn: `${idx + 1}턴` };
          const targetEmotions = ["우울감", "슬픔", "외로움", "분노", "무기력", "불면", "피로"];
          targetEmotions.forEach(emo => {
            dataPoint[emo] = 0;
          });

          if (parsedEmo && parsedEmo.probabilities) {
            Object.entries(parsedEmo.probabilities).forEach(([emo, prob]) => {
              if (targetEmotions.includes(emo)) {
                dataPoint[emo] = parseFloat((prob as number).toFixed(2));
              }
            });
          }
          return dataPoint;
        });

        // Word Cloud 구성
        const sortedWords = Object.entries(wordCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6);

        const fontSizes = ["text-3xl", "text-2xl", "text-2xl", "text-xl", "text-lg", "text-lg"];
        const cloudColors = [
          "text-[#EF4444]",
          "text-[#A855F7]",
          "text-[#3B82F6]",
          "text-[#F59E0B]",
          "text-[#D946EF]",
          "text-gray-500"
        ];
        const positions = [
          "top-10 right-10",
          "top-4 left-6",
          "bottom-6 left-12",
          "bottom-10 right-6",
          "top-6 left-1/3",
          "bottom-16 left-1/2"
        ];

        const wordCloud = sortedWords.map(([text], idx) => ({
          text,
          size: fontSizes[idx] || "text-lg",
          color: cloudColors[idx] || "text-gray-500",
          pos: positions[idx] || "top-4 left-4"
        }));

        if (wordCloud.length === 0) {
          wordCloud.push({ text: "마음", size: "text-3xl", color: "text-[#3B82F6]", pos: "top-10 left-10" });
        }

        // MIND Framework 구성
        const hasLowSleep = emotionSum["불면"] ? (emotionSum["불면"] / totalTurns) > 0.15 : false;
        const hasFatigue = emotionSum["피로"] ? (emotionSum["피로"] / totalTurns) > 0.15 : false;
        const hasGuilt = emotionSum["죄책감"] ? (emotionSum["죄책감"] / totalTurns) > 0.10 : false;
        const hasDespair = emotionSum["절망감"] ? (emotionSum["절망감"] / totalTurns) > 0.10 : false;
        const hasLowConfidence = emotionSum["자신감저하"] || emotionSum["자존감저하"] ? (((emotionSum["자신감저하"] || 0) + (emotionSum["자존감저하"] || 0)) / totalTurns) > 0.10 : false;

        const mDesc = phq9Score <= 4
          ? "우울 지수가 안정적인 상태이며 마음이 잘 정돈되어 있습니다."
          : phq9Score <= 9
            ? "경미한 우울감이 관찰되므로 주기적인 관찰과 환기가 필요합니다."
            : phq9Score <= 14
              ? "전반적인 우울 지수가 중등도로 정기적인 마음 점검과 대화가 필요합니다."
              : phq9Score <= 19
                ? "우울 정도가 다소 높습니다. 적극적인 전문 심리 상담을 고려해 보세요."
                : "고위험군 우울 상태입니다. 즉시 전문 의료기관이나 자살예방 전화를 통해 긴급 보호 지원을 받으시기 바랍니다.";

        const mColor = phq9Score <= 4
          ? "border-green-500"
          : phq9Score <= 9
            ? "border-yellow-500"
            : phq9Score <= 14
              ? "border-orange-500"
              : "border-red-500";

        const iDesc = (emotionSum["외로움"] || emotionSum["상실감"]) && (((emotionSum["외로움"] || 0) + (emotionSum["상실감"] || 0)) / totalTurns) > 0.15
          ? "외로움과 고립감을 자주 언급하고 있어 주변에 지지해 줄 수 있는 대인 관계망 확보가 필요합니다."
          : "대인관계에서의 감정 소모가 원만하며 마음의 연결성이 잘 유지되고 있습니다.";
        
        const nDesc = hasGuilt || hasDespair || hasLowConfidence
          ? "자책이나 자기비하와 같은 부정적인 인지 왜곡 성향이 감지되어, 소크라테스 대안 탐색 훈련이 권장됩니다."
          : "자신과 주변에 대해 합리적이고 객관적인 통찰력을 잃지 않고 유연하게 바라보고 있습니다.";

        const dDesc = hasLowSleep || hasFatigue
          ? "불면이나 만성적인 신체 피로 증상이 포착되므로, 규칙적인 기초 생체 리듬 회복이 최우선입니다."
          : "일상 생활 에너지가 잘 순환되고 있으며 신체 피로 및 식욕 변화의 영향이 비교적 낮습니다.";

        const mindData = [
          { key: "M", title: "Mental State (정신 상태)", desc: mDesc, color: mColor },
          { key: "I", title: "Interpersonal (대인 관계)", desc: iDesc, color: (emotionSum["외로움"] || emotionSum["상실감"]) && (((emotionSum["외로움"] || 0) + (emotionSum["상실감"] || 0)) / totalTurns) > 0.15 ? "border-purple-500" : "border-purple-300" },
          { key: "N", title: "Negative Bias (인지 왜곡)", desc: nDesc, color: hasGuilt || hasDespair || hasLowConfidence ? "border-blue-500" : "border-blue-300" },
          { key: "D", title: "Daily Life (일상 생활)", desc: dDesc, color: hasLowSleep || hasFatigue ? "border-teal-500" : "border-teal-300" }
        ];

        setReportData({
          summary: {
            totalTurns,
            avgRisk,
            mainEmotion
          },
          pieData,
          trendData,
          wordCloud,
          mindData
        });
      } catch (err) {
        console.error("Error generating dynamic emotion report:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId, phq9Score]);

  // 로딩 및 다이내믹 데이터 적용 대비 폴백
  const displaySummary = reportData?.summary || userEmotionReport.summary;
  const displayPieData = reportData?.pieData || userEmotionReport.pieData;
  const displayTrendData = reportData?.trendData || userEmotionReport.trendData;
  const displayWordCloud = reportData?.wordCloud || userEmotionReport.wordCloud;
  const displayMindData = reportData?.mindData || userEmotionReport.mindData;

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

  const tabs = ["대화턴", "1일", "7일", "14일", "30일"];

  return (
    <div className="max-w-7xl w-full bg-[#FAF8F5] rounded-3xl overflow-hidden border border-[#EAE5D9] shadow-[0_12px_40px_rgba(139,123,93,0.06)] flex flex-col animate-fade-in max-h-[90vh]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E2D4E] to-[#2E3C56] p-6 text-white shrink-0 border-b border-[#EAE5D9]/20">
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
          <div className="bg-[#FDFCFB] p-4 rounded-xl text-center border border-[#EAE5D9]">
            <p className="text-xs text-gray-500 font-medium mb-1">총 대화 턴</p>
            <p className="text-2xl font-bold text-gray-800">{displaySummary.totalTurns}회</p>
          </div>
          <div className="bg-[#FDFCFB] p-4 rounded-xl text-center border border-[#EAE5D9]">
            <p className="text-xs text-gray-500 font-medium mb-1">평균 위험도</p>
            <p className="text-2xl font-bold text-[#D97706]">{displaySummary.avgRisk}</p>
          </div>
          <div className="bg-[#FDFCFB] p-4 rounded-xl text-center border border-[#EAE5D9]">
            <p className="text-xs text-gray-500 font-medium mb-1">주요 감정</p>
            <p className="text-2xl font-bold text-gray-800">{displaySummary.mainEmotion}</p>
          </div>
          <div className="bg-[#FDFCFB] p-4 rounded-xl text-center border border-[#EAE5D9]">
            <p className="text-xs text-gray-500 font-medium mb-1">위험 등급</p>
            <p className={`text-xl font-bold ${badgeColor}`}>{actualSeverity}</p>
          </div>
        </div>

        {/* Scrollable Content Area - 2 Columns */}
        <div className="overflow-y-auto flex-1 pr-2 -mr-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column (4/12): Score, Donut, MIND, Word Cloud */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Score Card */}
              <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col items-center">
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  📊 우울 위험 점수
                </h3>
                <div className={`relative w-28 h-28 flex items-center justify-center rounded-full border-8 ${circleBorderColor}`}>
                   <div className="text-center">
                     <span className="text-2xl font-black text-gray-800">{actualScore}</span>
                     <span className="text-gray-400 text-xs">점</span>
                     <div className={`text-xs font-bold ${severityColor}`}>{actualSeverity}</div>
                   </div>
                </div>
              </div>

              {/* Donut Chart */}
              <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  💭 감정 분포
                </h3>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="h-28 w-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={displayPieData}
                          innerRadius={30}
                          outerRadius={50}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {displayPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                    {displayPieData.slice(0, 4).map((item) => (
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
              <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  🧠 MIND 프레임워크
                </h3>
                <div className="flex flex-col gap-2">
                  {displayMindData.map((item) => (
                    <div key={item.key} className={`border-l-4 ${item.color} bg-[#FAF8F5] p-2 rounded-r-lg border-y border-r border-[#EAE5D9]/50 flex flex-col`}>
                      <p className="text-xs font-bold text-gray-500">{item.key}. {item.title}</p>
                      <p className="text-xs font-bold text-gray-800">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Word Cloud */}
              <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  ☁️ 자주 쓴 단어
                </h3>
                <div className="bg-[#FAF8F5] border border-[#EAE5D9]/60 rounded-xl p-3 h-32 relative overflow-hidden">
                  {displayWordCloud.map((item, i) => (
                    <span key={i} className={`absolute ${item.size} font-bold ${item.color} ${item.pos}`}>
                      {item.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (8/12): New Big Chart */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="bg-[#FDFCFB] border border-[#EAE5D9] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
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
                            ? "border-b-2 border-[#1E2D4E] text-[#1E2D4E]"
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
                      <LineChart data={displayTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold py-3.5 rounded-xl shadow-[0_4px_12px_rgba(245,158,11,0.2)] hover:shadow-[0_6px_16px_rgba(245,158,11,0.3)] transform hover:translate-y-[-1px] transition-all flex items-center justify-center gap-2"
          >
            대화 계속하기 <ArrowRight size={18} />
          </button>
          <button className="flex-1 bg-[#FDFCFB] border border-[#EAE5D9] text-[#3E3A35] font-bold py-3.5 rounded-xl hover:bg-[#FAF8F5] transition-colors flex items-center justify-center gap-2">
            <Calendar size={18} /> 다음 재평가 예약
          </button>
        </div>
      </div>
    </div>
  );
}
