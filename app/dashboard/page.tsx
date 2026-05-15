"use client";

import { useState } from "react";
import UserFlow from "../../components/UserFlow";
import CounselorPortal from "../../components/CounselorPortal";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"user" | "counselor">("user");

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-sans text-gray-800">
      {/* Header and Tabs */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🫧</span>
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#6096C8] to-[#8B7BAD] bg-clip-text text-transparent">
                말랑해도 돼
              </h1>
            </div>

            <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("user")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "user"
                  ? "bg-white text-[#6096C8] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                개인 사용자
              </button>
              <button
                onClick={() => setActiveTab("counselor")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "counselor"
                  ? "bg-white text-[#8B7BAD] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                상담사 포털
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "user" ? <UserFlow /> : <CounselorPortal />}
      </main>
    </div>
  );
}
