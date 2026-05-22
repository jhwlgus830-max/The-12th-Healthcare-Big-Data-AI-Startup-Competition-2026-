import re

# 1. CounselorDashboard.tsx
with open("components/CounselorDashboard.tsx", "r", encoding="utf-8") as f:
    dashboard_content = f.read()

# Replace block: lines 149 - 162
dashboard_pattern = re.compile(r"<<<<<<< HEAD\s+<button className=\"text-\[#1E2D4E\] hover:underline font-bold\">상세보기</button>\s+=======\s+<button \s+onClick=\(\) => \{\s+if \(item\.name === \"김지민\"\) onSelectClient\?\.\(\"C005\"\);\s+else if \(item\.name === \"이현우\"\) onSelectClient\?\.\(\"C001\"\);\s+else onSelectClient\?\.\(\"C005\"\);\s+\}\}\s+className=\"text-\[#6096C8\] hover:underline\"\s+>\s+상세보기\s+</button>\s+>>>>>>> [a-f0-9]+", re.DOTALL)

dashboard_replacement = """                    <button 
                      onClick={() => {
                        if (item.name === "김지민") onSelectClient?.("C005");
                        else if (item.name === "이현우") onSelectClient?.("C001");
                        else onSelectClient?.("C005");
                      }} 
                      className="text-[#1E2D4E] hover:underline font-bold"
                    >
                      상세보기
                    </button>"""

dashboard_content_new, count1 = dashboard_pattern.subn(dashboard_replacement, dashboard_content)
with open("components/CounselorDashboard.tsx", "w", encoding="utf-8", newline="") as f:
    f.write(dashboard_content_new)
print(f"Resolved conflicts in CounselorDashboard.tsx: {count1}")


# 2. CounselorPortal.tsx
with open("components/CounselorPortal.tsx", "r", encoding="utf-8") as f:
    portal_content = f.read()

# Block 1: lines 85 - 94
portal_pattern_1 = re.compile(r"<<<<<<< HEAD\s+className=\{\`bg-\[#FAF8F5\] rounded-2xl border \$\{\s+client\.risk === \"High\" \? \"border-red-300 border-l-4 border-l-red-500\" : \"border-\[#EAE5D9\]\"\s+\} hover:shadow-md transition-all p-6 flex flex-col md:flex-row justify-between gap-6\`\}\s+=======\s+onClick=\(\) => onSelectClient\?\.\(client\.id\)\s+className=\{\`bg-white rounded-2xl shadow-sm border \$\{\s+client\.risk === \"High\" \? \"border-red-100 border-l-4 border-l-red-500 animate-pulse-subtle\" : \"border-gray-100\"\s+\} hover:shadow-md transition-shadow p-6 flex flex-col md:flex-row justify-between gap-6 cursor-pointer\`\}\s+>>>>>>> [a-f0-9]+", re.DOTALL)

portal_replacement_1 = """            onClick={() => onSelectClient?.(client.id)}
            className={`bg-[#FAF8F5] rounded-2xl border ${
              client.risk === "High" ? "border-red-300 border-l-4 border-l-red-500" : "border-[#EAE5D9]"
            } hover:shadow-md transition-all p-6 flex flex-col md:flex-row justify-between gap-6 cursor-pointer`}`"""

# Block 2: lines 133 - 145
portal_pattern_2 = re.compile(r"<<<<<<< HEAD\s+<div className=\"flex items-center gap-3\">\s+<button className=\"p-2 text-gray-400 hover:text-\[#1E2D4E\]\">\s+<FileText size=\{18\} />\s+</button>\s+<button className=\"p-2 text-gray-400 hover:text-\[#1E2D4E\]\">\s+=======\s+<div className=\"flex items-center gap-3\" onClick=\{\(e\) => e\.stopPropagation\(\)\}>\s+<button className=\"p-2 text-gray-400 hover:text-gray-600\" onClick=\{\(\) => onSelectClient\?\.\(client\.id\)\}>\s+<FileText size=\{18\} />\s+</button>\s+<button className=\"p-2 text-gray-400 hover:text-gray-600\" onClick=\{\(\) => onSelectClient\?\.\(client\.id\)\}>\s+>>>>>>> [a-f0-9]+", re.DOTALL)

portal_replacement_2 = """              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                <button className="p-2 text-gray-400 hover:text-[#1E2D4E]" onClick={() => onSelectClient?.(client.id)}>
                  <FileText size={18} />
                </button>
                <button className="p-2 text-gray-400 hover:text-[#1E2D4E]" onClick={() => onSelectClient?.(client.id)}>"""

portal_content_new = portal_pattern_1.sub(portal_replacement_1, portal_content)
portal_content_new, count2 = portal_pattern_2.subn(portal_replacement_2, portal_content_new)
with open("components/CounselorPortal.tsx", "w", encoding="utf-8", newline="") as f:
    f.write(portal_content_new)
print(f"Resolved conflicts in CounselorPortal.tsx: {count2 + 1 if portal_content != portal_content_new else 0}")


# 3. UserFlow.tsx
with open("components/UserFlow.tsx", "r", encoding="utf-8") as f:
    flow_content = f.read()

flow_pattern = re.compile(r"<<<<<<< HEAD\s+<div className=\"bg-white border-b border-\[#EAE5D9\] p-2 flex gap-2 text-xs justify-center items-center overflow-x-auto\">\s+<span className=\"font-bold text-\[#8C7862\] shrink-0\">테스트용 페르소나:</span>\s+<button onClick=\{\(\) => handlePersonaChange\(1\)\} className=\{\`px-2 py-1 rounded border border-\[#EAE5D9\] shadow-sm transition-all \$\{currentPersona === 1 \? \"bg-\[#1E2D4E\] text-white border-\[#1E2D4E\]\" : \"bg-white text-gray-800 hover:bg-\[#F8F5F0\]\"\}\`\}>1\. 또치 \(경증\)</button>\s+<button onClick=\{\(\) => handlePersonaChange\(2\)\} className=\{\`px-2 py-1 rounded border border-\[#EAE5D9\] shadow-sm transition-all \$\{currentPersona === 2 \? \"bg-\[#1E2D4E\] text-white border-\[#1E2D4E\]\" : \"bg-white text-gray-800 hover:bg-\[#F8F5F0\]\"\}\`\}>2\. 지우 \(중등도\)</button>\s+<button onClick=\{\(\) => handlePersonaChange\(3\)\} className=\{\`px-2 py-1 rounded border border-\[#EAE5D9\] shadow-sm transition-all \$\{currentPersona === 3 \? \"bg-\[#1E2D4E\] text-white border-\[#1E2D4E\]\" : \"bg-white text-gray-800 hover:bg-\[#F8F5F0\]\"\}\`\}>3\. 클로 \(고위험\)</button>\s+<button onClick=\{\(\) => handlePersonaChange\(4\)\} className=\{\`px-2 py-1 rounded border border-\[#EAE5D9\] shadow-sm transition-all \$\{currentPersona === 4 \? \"bg-\[#1E2D4E\] text-white border-\[#1E2D4E\]\" : \"bg-white text-gray-800 hover:bg-\[#F8F5F0\]\"\}\`\}>4\. 멘토 \(CBT\)</button>\s+<button onClick=\{\(\) => handlePersonaChange\(5\)\} className=\{\`px-2 py-1 rounded border border-\[#EAE5D9\] shadow-sm transition-all \$\{currentPersona === 5 \? \"bg-\[#1E2D4E\] text-white border-\[#1E2D4E\]\" : \"bg-white text-gray-800 hover:bg-\[#F8F5F0\]\"\}\`\}>5\. 철수 \(행동\)</button>\s+=======\s+<div className=\"bg-gray-100 p-2 flex gap-2 text-xs justify-center items-center overflow-x-auto\">\s+<span className=\"font-bold shrink-0\">테스트용 페르소나:</span>\s+<button onClick=\{\(\) => handlePersonaChange\(1\)\} className=\{\`px-2 py-1 rounded shadow \$\{currentPersona === 1 \? \"bg-\[#6096C8\] text-white\" : \"bg-white text-gray-800\"\}\`\}>1\. 또치 \(경증\)</button>\s+<button onClick=\{\(\) => handlePersonaChange\(2\)\} className=\{\`px-2 py-1 rounded shadow \$\{currentPersona === 2 \? \"bg-\[#6096C8\] text-white\" : \"bg-white text-gray-800\"\}\`\}>2\. 지우 \(중등도\)</button>\s+<button onClick=\{\(\) => handlePersonaChange\(3\)\} className=\{\`px-2 py-1 rounded shadow \$\{currentPersona === 3 \? \"bg-\[#6096C8\] text-white\" : \"bg-white text-gray-800\"\}\`\}>3\. 클로 \(고위험\)</button>\s+<button onClick=\{\(\) => handlePersonaChange\(4\)\} className=\{\`px-2 py-1 rounded shadow \$\{currentPersona === 4 \? \"bg-\[#6096C8\] text-white\" : \"bg-white text-gray-800\"\}\`\}>4\. 멘토 \(소크라테스식 질문\)</button>\s+<button onClick=\{\(\) => handlePersonaChange\(5\)\} className=\{\`px-2 py-1 rounded shadow \$\{currentPersona === 5 \? \"bg-\[#6096C8\] text-white\" : \"bg-white text-gray-800\"\}\`\}>5\. 철수 \(행동\)</button>\s+>>>>>>> [a-f0-9]+", re.DOTALL)

flow_replacement = """        <div className="bg-white border-b border-[#EAE5D9] p-2 flex gap-2 text-xs justify-center items-center overflow-x-auto">
          <span className="font-bold text-[#8C7862] shrink-0">테스트용 페르소나:</span>
          <button onClick={() => handlePersonaChange(1)} className={`px-2 py-1 rounded border border-[#EAE5D9] shadow-sm transition-all ${currentPersona === 1 ? "bg-[#1E2D4E] text-white border-[#1E2D4E]" : "bg-white text-gray-800 hover:bg-[#F8F5F0]"}`}>1. 또치 (경증)</button>
          <button onClick={() => handlePersonaChange(2)} className={`px-2 py-1 rounded border border-[#EAE5D9] shadow-sm transition-all ${currentPersona === 2 ? "bg-[#1E2D4E] text-white border-[#1E2D4E]" : "bg-white text-gray-800 hover:bg-[#F8F5F0]"}`}>2. 지우 (중등도)</button>
          <button onClick={() => handlePersonaChange(3)} className={`px-2 py-1 rounded border border-[#EAE5D9] shadow-sm transition-all ${currentPersona === 3 ? "bg-[#1E2D4E] text-white border-[#1E2D4E]" : "bg-white text-gray-800 hover:bg-[#F8F5F0]"}`}>3. 클로 (고위험)</button>
          <button onClick={() => handlePersonaChange(4)} className={`px-2 py-1 rounded border border-[#EAE5D9] shadow-sm transition-all ${currentPersona === 4 ? "bg-[#1E2D4E] text-white border-[#1E2D4E]" : "bg-white text-gray-800 hover:bg-[#F8F5F0]"}`}>4. 멘토 (소크라테스식 질문)</button>
          <button onClick={() => handlePersonaChange(5)} className={`px-2 py-1 rounded border border-[#EAE5D9] shadow-sm transition-all ${currentPersona === 5 ? "bg-[#1E2D4E] text-white border-[#1E2D4E]" : "bg-white text-gray-800 hover:bg-[#F8F5F0]"}`}>5. 철수 (행동)</button>
        </div>"""

flow_content_new, count3 = flow_pattern.subn(flow_replacement, flow_content)
with open("components/UserFlow.tsx", "w", encoding="utf-8", newline="") as f:
    f.write(flow_content_new)
print(f"Resolved conflicts in UserFlow.tsx: {count3}")
