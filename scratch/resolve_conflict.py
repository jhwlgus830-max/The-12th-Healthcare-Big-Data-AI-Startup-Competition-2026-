import re

file_path = "app/page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Build the replacement content with both our layout/styles and remote callbacks
replacement = """          {/* Main Layout Area */}
          <div className="flex-1 pl-64 flex flex-col min-h-screen">
            {/* Top Navigation Bar */}
            <header className="h-16 bg-[#FAF8F5] border-b border-[#EAE5D9] px-8 flex justify-between items-center sticky top-0 z-20 shadow-[0_2px_15px_rgba(139,123,93,0.02)]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#8C7862]">상담사 포털</span>
                <span className="text-xs text-[#EAE5D9] font-light">/</span>
                <span className="text-sm font-black text-[#1E2D4E]">
                  {step === "counselor_dashboard" && "대시보드"}
                  {step === "counselor_clients" && "내담자 목록"}
                  {step === "counselor_report" && "리포트"}
                  {step === "counselor_guide" && "개입 가이드"}
                  {step === "counselor_settings" && "설정"}
                </span>
              </div>
              
              <div className="text-xs text-[#8C7862] font-semibold">
                접속일: {formattedDate}
              </div>
            </header>

            {/* Page transition header strip */}
            <div className="bg-gradient-to-r from-[#1E2D4E] to-[#2E3C56] h-1.5 w-full shrink-0"></div>

            {/* Content Area */}
            <main className="flex-1 p-6 md:p-8">
              <div className="max-w-7xl mx-auto">
                {step === "counselor_dashboard" && (
                  <CounselorDashboard 
                    onSelectClient={(id) => { 
                      setSelectedClientId(id); 
                      setStep("counselor_report"); 
                    }} 
                  />
                )}
                {step === "counselor_clients" && (
                  <CounselorPortal 
                    onSelectClient={(id) => { 
                      setSelectedClientId(id); 
                      setStep("counselor_report"); 
                    }} 
                  />
                )}
                {step === "counselor_report" && (
                  <CounselorReport 
                    clientId={selectedClientId} 
                  />
                )}
                {step === "counselor_guide" && <CounselorGuide />}
                {step === "counselor_settings" && <CounselorSettings />}
              </div>
            </main>
          </div>"""

# Match <<<<<<< HEAD ... ======= ... >>>>>>> [commit hash]
pattern = re.compile(r"<<<<<<< HEAD.*?=======.*?>>>>>>> [a-f0-9]+", re.DOTALL)

new_content, count = pattern.subn(replacement, content)
if count > 0:
    with open(file_path, "w", encoding="utf-8", newline="") as f:
        f.write(new_content)
    print(f"Successfully resolved {count} conflict blocks in {file_path}")
else:
    print("Conflict block not found or already resolved.")
