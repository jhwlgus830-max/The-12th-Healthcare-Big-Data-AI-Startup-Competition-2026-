import re

file_path = "components/CounselorReport.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Resolve 1: Risk badge at lines 249-253
c1_pattern = re.compile(r"<<<<<<< HEAD\s+client\.risk === 'High' \? 'bg-red-100 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'\s+=======\s+client\.risk === 'High' \? 'bg-red-100 text-red-600 animate-pulse' : 'bg-green-100 text-green-600'\s+>>>>>>> [a-f0-9]+", re.DOTALL)
c1_replacement = "client.risk === 'High' ? 'bg-red-100 text-red-600 border border-red-200 animate-pulse' : 'bg-green-50 text-green-700 border border-green-200'"
content = c1_pattern.sub(c1_replacement, content)

# Resolve 2: Save counseling log button at lines 268-280
c2_pattern = re.compile(r"<<<<<<< HEAD\s+<button className=\"flex items-center gap-2 px-4 py-2\.5 bg-\[#1E2D4E\] text-\[#FAF8F5\] rounded-xl text-sm font-bold hover:bg-\[#1E2D4E\]/90 transition-colors shadow-sm\">\s+=======\s+<button \s+onClick=\{\(\) => \{\s+if \(!isRealUser\) \{\s+alert\(\"실제 연동된 내담자의 리포트에서만 상담 기록을 백엔드에 영구 보존할 수 있습니다\. \(데모 기록 모달을 엽니다\)\"\);\s+\}\s+setIsOpenNoteModal\(true\);\s+\}\}\s+className=\"flex items-center gap-2 px-4 py-2\.5 bg-\[#1E2D4E\] text-white rounded-xl text-sm font-bold hover:bg-\[#2D4A7A\] transition-colors shadow-sm\"\s+>\s+>>>>>>> [a-f0-9]+", re.DOTALL)
c2_replacement = """<button 
                onClick={() => {
                  if (!isRealUser) {
                    alert("실제 연동된 내담자의 리포트에서만 상담 기록을 백엔드에 영구 보존할 수 있습니다. (데모 기록 모달을 엽니다)");
                  }
                  setIsOpenNoteModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1E2D4E] text-[#FAF8F5] rounded-xl text-sm font-bold hover:bg-[#1E2D4E]/90 transition-colors shadow-sm"
              >"""
content = c2_pattern.sub(c2_replacement, content)

# Resolve 3: Trend header at lines 329-333
c3_pattern = re.compile(r"<<<<<<< HEAD\s+<TrendingUp size=\{18\} className=\"text-\[#1E2D4E\]\" /> 감정 변화 추세 \(최근 30일\)\s+=======\s+<TrendingUp size=\{18\} className=\"text-\[#6096C8\]\" /> 감정 변화 추세 \(누적 진단 이력\)\s+>>>>>>> [a-f0-9]+", re.DOTALL)
c3_replacement = '<TrendingUp size={18} className="text-[#1E2D4E]" /> 감정 변화 추세 (누적 진단 이력)'
content = c3_pattern.sub(c3_replacement, content)

# Resolve 4: Line elements at lines 344-349
c4_pattern = re.compile(r"<<<<<<< HEAD\s+<Line type=\"monotone\" dataKey=\"절망\" stroke=\"#8B7BAD\" strokeWidth=\{3\} dot=\{\{\s+r: 4\s+\}\} activeDot=\{\{\s+r: 6\s+\}\} />\s+<Line type=\"monotone\" dataKey=\"무기력\" stroke=\"#1E2D4E\" strokeWidth=\{3\} dot=\{\{\s+r: 4\s+\}\} activeDot=\{\{\s+r: 6\s+\}\} />\s+=======\s+<Line type=\"monotone\" dataKey=\"자살사고\" stroke=\"#8B7BAD\" strokeWidth=\{3\} dot=\{\{\s+r: 4\s+\}\} activeDot=\{\{\s+r: 6\s+\}\} />\s+>>>>>>> [a-f0-9]+", re.DOTALL)
c4_replacement = '<Line type="monotone" dataKey="자살사고" stroke="#8B7BAD" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />'
content = c4_pattern.sub(c4_replacement, content)

# Resolve 5: Risk logs map at lines 363-384
c5_pattern = re.compile(r"<<<<<<< HEAD\s+<div className=\"space-y-3\">\s+\{reportData\.riskLogs\.map\(\(log, i\) => \(\s+<div key=\{i\} className=\"p-3 bg-white rounded-xl flex justify-between items-center border border-\[#EAE5D9\]/60\">\s+<div>\s+<div className=\"flex items-center gap-2 mb-1\">\s+<span className=\"text-\[10px\] font-bold text-gray-400\">\{log\.date\}</span>\s+<span className=\"text-\[10px\] px-1\.5 py-0\.5 bg-\[#FAF8F5\] text-gray-600 rounded border border-\[#EAE5D9\]/40\">\{log\.source\}</span>\s+=======\s+<div className=\"space-y-3 max-h-64 overflow-y-auto pr-1\">\s+\{mappedRiskLogs\.length === 0 \? \(\s+<p className=\"text-sm text-gray-400 text-center py-8\">감지된 자살/자해 고위험 위험 표현이 없습니다\.</p>\s+\) : \(\s+mappedRiskLogs\.map\(\(log, i\) => \(\s+<div key=\{i\} className=\"p-3 bg-red-50/40 rounded-xl flex justify-between items-center border border-red-100/60\">\s+<div className=\"flex-1 mr-3\">\s+<div className=\"flex items-center gap-2 mb-1\">\s+<span className=\"text-\[10px\] font-bold text-gray-400\">\{log\.date\}</span>\s+<span className=\"text-\[10px\] px-1\.5 py-0\.5 bg-red-100 text-red-600 rounded-md font-bold\">\{log\.source\}</span>\s+</div>\s+<p className=\"text-sm text-gray-800 font-semibold leading-relaxed\">\"\{log\.content\}\"</p>\s+>>>>>>> [a-f0-9]+", re.DOTALL)

c5_replacement = """              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {mappedRiskLogs.length === 0 ? (
                  <p className="text-sm text-[#8C7862] text-center py-8">감지된 자살/자해 고위험 위험 표현이 없습니다.</p>
                ) : (
                  mappedRiskLogs.map((log, i) => (
                    <div key={i} className="p-3 bg-[#FFF5F5] rounded-xl flex justify-between items-center border border-red-200/50">
                      <div className="flex-1 mr-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-gray-400">{log.date}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded-md font-bold">{log.source}</span>
                        </div>
                        <p className="text-sm text-gray-800 font-semibold leading-relaxed">"{log.content}"</p>"""
content = c5_pattern.sub(c5_replacement, content)

# Resolve 6: PieChart header at lines 396-400
c6_pattern = re.compile(r"<<<<<<< HEAD\s+<PieChart size=\{18\} className=\"text-\[#1E2D4E\]\" /> 감정 분포\s+=======\s+<PieChart size=\{18\} className=\"text-\[#6096C8\]\" /> 감정 분포 \(실시간 대화 분석\)\s+>>>>>>> [a-f0-9]+", re.DOTALL)
c6_replacement = '<PieChart size={18} className="text-[#1E2D4E]" /> 감정 분포 (실시간 대화 분석)'
content = c6_pattern.sub(c6_replacement, content)

# Resolve 7: Legend items at lines 426-432
c7_pattern = re.compile(r"<<<<<<< HEAD\s+<span className=\"flex items-center gap-2\"><span className=\{\`w-2 h-2 rounded-full\`\} style=\{\{\s+backgroundColor: COLORS\[i\]\s+\}\}></span> \{item\.name\}</span>\s+<span className=\"font-bold text-gray-800\">\{item\.value\}%</span>\s+=======\s+<span className=\"flex items-center gap-2\"><span className=\{\`w-2 h-2 rounded-full\`\} style=\{\{\s+backgroundColor: COLORS\[i % COLORS\.length\]\s+\}\}></span> \{item\.name\}</span>\s+<span className=\"font-bold\">\{item\.value\}%</span>\s+>>>>>>> [a-f0-9]+", re.DOTALL)
c7_replacement = """                        <span className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: COLORS[i % COLORS.length] }}></span> {item.name}</span>
                        <span className="font-bold text-gray-800">{item.value}%</span>"""
content = c7_pattern.sub(c7_replacement, content)

# Resolve 8: Record button at lines 505-517
c8_pattern = re.compile(r"<<<<<<< HEAD\s+<button className=\"flex items-center gap-2 px-4 py-2 bg-\[#1E2D4E\] text-\[#FAF8F5\] rounded-xl text-sm font-bold hover:bg-\[#1E2D4E\]/90 transition-colors shadow-sm\">\s+=======\s+<button \s+onClick=\{\(\) => \{\s+if \(!isRealUser\) \{\s+alert\(\"실제 연동된 내담자의 리포트에서만 상담 기록을 백엔드에 영구 보존할 수 있습니다\. \(데모 기록 모달을 엽니다\)\"\);\s+\}\s+setIsOpenNoteModal\(true\);\s+\}\}\s+className=\"flex items-center gap-2 px-4 py-2 bg-\[#1E2D4E\] text-white rounded-xl text-sm font-bold hover:bg-\[#2D4A7A\] transition-colors shadow-sm\"\s+>\s+>>>>>>> [a-f0-9]+", re.DOTALL)
c8_replacement = """<button 
                onClick={() => {
                  if (!isRealUser) {
                    alert("실제 연동된 내담자의 리포트에서만 상담 기록을 백엔드에 영구 보존할 수 있습니다. (데모 기록 모달을 엽니다)");
                  }
                  setIsOpenNoteModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#1E2D4E] text-[#FAF8F5] rounded-xl text-sm font-bold hover:bg-[#1E2D4E]/90 transition-colors shadow-sm"
              >"""
content = c8_pattern.sub(c8_replacement, content)

# Resolve 9: Table rows at lines 533-548
c9_pattern = re.compile(r"<<<<<<< HEAD\s+<tbody className=\"divide-y divide-\[#EAE5D9\]/40\">\s+\{reportData\.distortionStats\.map\(\(item, i\) => \(\s+<tr key=\{i\} className=\"hover:bg-\[#FAF8F5\] transition-colors group cursor-pointer\" onClick=\{\(\) => setSubStep\(\"detail\"\)\}>\s+=======\s+<tbody className=\"divide-y divide-gray-55*\">\s+\{distortionStats\.map\(\(item, i\) => \(\s+<tr \s+key=\{i\}\s+className=\"hover:bg-gray-50 transition-colors group cursor-pointer\"\s+onClick=\{\(\) => \{\s+setSelectedDistortionType\(item\.type\);\s+setSubStep\(\"detail\"\);\s+\}\}\s+>\s+>>>>>>> [a-f0-9]+", re.DOTALL)
# Let's make sure it handles both divide-gray-50 and divide-gray-55 (just to be safe)
c9_pattern_relaxed = re.compile(r"<<<<<<< HEAD\s+<tbody className=\"divide-y divide-\[#EAE5D9\]/40\">\s+\{reportData\.distortionStats\.map\(\(item, i\) => \(\s+<tr key=\{i\} className=\"hover:bg-\[#FAF8F5\] transition-colors group cursor-pointer\" onClick=\{\(\) => setSubStep\(\"detail\"\)\}>\s+=======\s+<tbody className=\"divide-y divide-gray-\d+\">\s+\{distortionStats\.map\(\(item, i\) => \(\s+<tr \s+key=\{i\}\s+className=\"hover:bg-gray-50 transition-colors group cursor-pointer\"\s+onClick=\{\(\) => \{\s+setSelectedDistortionType\(item\.type\);\s+setSubStep\(\"detail\"\);\s+\}\}\s+>\s+>>>>>>> [a-f0-9]+", re.DOTALL)

c9_replacement = """              <tbody className="divide-y divide-[#EAE5D9]/40">
                {distortionStats.map((item, i) => (
                  <tr 
                    key={i} 
                    className="hover:bg-[#FAF8F5] transition-colors group cursor-pointer" 
                    onClick={() => {
                      setSelectedDistortionType(item.type);
                      setSubStep("detail");
                    }}
                  >"""
content = c9_pattern_relaxed.sub(c9_replacement, content)

# Resolve 10: Record button 2 at lines 589-601
c10_pattern = re.compile(r"<<<<<<< HEAD\s+<button className=\"flex items-center gap-2 px-4 py-2 bg-\[#1E2D4E\] text-\[#FAF8F5\] rounded-xl text-sm font-bold hover:bg-\[#1E2D4E\]/90 transition-colors\">\s+=======\s+<button \s+onClick=\{\(\) => \{\s+if \(!isRealUser\) \{\s+alert\(\"실제 연동된 내담자의 리포트에서만 상담 기록을 백엔드에 영구 보존할 수 있습니다\. \(데모 기록 모달을 엽니다\)\"\);\s+\}\s+setIsOpenNoteModal\(true\);\s+\}\}\s+className=\"flex items-center gap-2 px-4 py-2 bg-\[#1E2D4E\] text-white rounded-xl text-sm font-bold hover:bg-\[#2D4A7A\] transition-colors\"\s+>\s+>>>>>>> [a-f0-9]+", re.DOTALL)
c10_replacement = """<button 
                onClick={() => {
                  if (!isRealUser) {
                    alert("실제 연동된 내담자의 리포트에서만 상담 기록을 백엔드에 영구 보존할 수 있습니다. (데모 기록 모달을 엽니다)");
                  }
                  setIsOpenNoteModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#1E2D4E] text-[#FAF8F5] rounded-xl text-sm font-bold hover:bg-[#1E2D4E]/90 transition-colors"
              >"""
content = c10_pattern.sub(c10_replacement, content)

# Resolve 11: Progress bar at lines 655-668
c11_pattern = re.compile(r"<<<<<<< HEAD\s+<div className=\"w-full h-4 bg-\[#F5EFE6\] rounded-full overflow-hidden flex\">\s+<div className=\"h-full bg-red-500\" style=\{\{\s+width: \"85%\"\s+\}\}></div>\s+=======\s+<div className=\"w-full h-4 bg-gray-100 rounded-full overflow-hidden flex\">\s+<div \s+className=\"h-full bg-red-500 transition-all duration-500\" \s+style=\{\{\s+width: activeDistortion \s+\? \`\$\{\(activeDistortion\.sessionObservedCount / activeDistortion\.totalSessions\) \* 100\}%\` \s+: \"85%\"\s+\}\}\s+></div>\s+>>>>>>> [a-f0-9]+", re.DOTALL)
c11_replacement = """                <div className="w-full h-4 bg-[#F5EFE6] rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-red-500 transition-all duration-500" 
                    style={{ 
                      width: activeDistortion 
                        ? `${(activeDistortion.sessionObservedCount / activeDistortion.totalSessions) * 100}%` 
                        : "85%" 
                    }}
                  ></div>"""
content = c11_pattern.sub(c11_replacement, content)

# Resolve 12: Detected phrases at lines 678-700
c12_pattern = re.compile(r"<<<<<<< HEAD\s+<div className=\"space-y-4\">\s+\{reportData\.detectedPhrases\.map\(\(text, i\) => \(\s+<div key=\{i\} className=\"p-4 bg-white rounded-2xl border border-\[#EAE5D9\]/60 flex gap-3\">\s+<span className=\"text-\[#F59E0B\] font-bold\">\"</span>\s+<p className=\"text-sm text-gray-700 font-medium leading-relaxed\">\{text\}</p>\s+<span className=\"text-\[#F59E0B\] font-bold self-end\">\"</span>\s+</div>\s+\)\)\}\s+=======\s+<div className=\"space-y-4 max-h-72 overflow-y-auto pr-1\">\s+\{detectedPhrases\.length === 0 \? \(\s+<p className=\"text-sm text-gray-400 text-center py-8\">이번 유형으로 탐지된 내담자 대화 기록이 없습니다\.</p>\s+\) : \(\s+detectedPhrases\.map\(\(text, i\) => \(\s+<div key=\{i\} className=\"p-4 bg-gray-50 rounded-2xl border border-gray-100 flex gap-3\">\s+<span className=\"text-\[#6096C8\] font-bold\">\"</span>\s+<p className=\"text-sm text-gray-700 font-medium leading-relaxed\">\{text\}</p>\s+<span className=\"text-\[#6096C8\] font-bold self-end\">\"</span>\s+</div>\s+\)\)\s+\)\}\s+>>>>>>> [a-f0-9]+", re.DOTALL)

c12_replacement = """              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {detectedPhrases.length === 0 ? (
                  <p className="text-sm text-[#8C7862] text-center py-8">이번 유형으로 탐지된 내담자 대화 기록이 없습니다.</p>
                ) : (
                  detectedPhrases.map((text, i) => (
                    <div key={i} className="p-4 bg-white rounded-2xl border border-[#EAE5D9] flex gap-3">
                      <span className="text-[#F59E0B] font-bold">"</span>
                      <p className="text-sm text-gray-700 font-medium leading-relaxed">{text}</p>
                      <span className="text-[#F59E0B] font-bold self-end">"</span>
                    </div>
                  ))
                )}"""
content = c12_pattern.sub(c12_replacement, content)

# Resolve 13: Related context chips at lines 710-730
c13_pattern = re.compile(r"<<<<<<< HEAD\s+\{reportData\.relatedContext\.map\(\(chip, i\) => \(\s+<div key=\{i\} className=\"px-4 py-2\.5 bg-\[#F5EFE6\] text-\[#1E2D4E\] rounded-full border border-\[#EAE5D9\]/60 text-sm font-bold flex items-center gap-2\">\s+<span>\{chip\.icon\}</span> \{chip\.label\}\s+</div>\s+\)\)\}\s+=======\s+\{activeDistortion && activeDistortion\.relatedContext \? \(\s+activeDistortion\.relatedContext\.map\(\(chip, i\) => \(\s+<div key=\{i\} className=\"px-4 py-2\.5 bg-blue-50 text-\[#1E2D4E\] rounded-full border border-blue-100 text-sm font-bold flex items-center gap-2\">\s+<span>🧠</span> \{chip\}\s+</div>\s+\)\)\s+\) : \(\s+reportData\.relatedContext\.map\(\(chip, i\) => \(\s+<div key=\{i\} className=\"px-4 py-2\.5 bg-blue-50 text-\[#1E2D4E\] rounded-full border border-blue-100 text-sm font-bold flex items-center gap-2\">\s+<span>\{chip\.icon\}</span> \{chip\.label\}\s+</div>\s+\)\)\s+\)\}\s+>>>>>>> [a-f0-9]+", re.DOTALL)

c13_replacement = """                {activeDistortion && activeDistortion.relatedContext ? (
                  activeDistortion.relatedContext.map((chip, i) => (
                    <div key={i} className="px-4 py-2.5 bg-[#F5EFE6] text-[#1E2D4E] rounded-full border border-[#EAE5D9] text-sm font-bold flex items-center gap-2">
                      <span>🧠</span> {chip}
                    </div>
                  ))
                ) : (
                  reportData.relatedContext.map((chip, i) => (
                    <div key={i} className="px-4 py-2.5 bg-[#F5EFE6] text-[#1E2D4E] rounded-full border border-[#EAE5D9] text-sm font-bold flex items-center gap-2">
                      <span>{chip.icon}</span> {chip.label}
                    </div>
                  ))
                )}"""
content = c13_pattern.sub(c13_replacement, content)

with open(file_path, "w", encoding="utf-8", newline="") as f:
    f.write(content)

print("Finished processing CounselorReport.tsx conflicts.")
