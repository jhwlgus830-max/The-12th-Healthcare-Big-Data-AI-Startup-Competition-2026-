import os
import re

files_to_check = [
    "components/CounselorDashboard.tsx",
    "components/CounselorPortal.tsx",
    "components/CounselorReport.tsx",
    "components/UserFlow.tsx"
]

out_lines = []

for file_path in files_to_check:
    if not os.path.exists(file_path):
        continue
    out_lines.append(f"\n========================================\nFILE: {file_path}\n========================================\n")
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    in_conflict = False
    conflict_block = []
    conflict_start_line = 0
    
    for idx, line in enumerate(lines):
        line_num = idx + 1
        if "<<<<<<< HEAD" in line:
            in_conflict = True
            conflict_block = []
            conflict_start_line = line_num
            conflict_block.append((line_num, line))
        elif ">>>>>>>" in line and in_conflict:
            conflict_block.append((line_num, line))
            in_conflict = False
            out_lines.append(f"\n[Conflict block lines {conflict_start_line} - {line_num}]:\n")
            for ln, cl in conflict_block:
                out_lines.append(f"{ln:4d}: {cl}")
        elif in_conflict:
            conflict_block.append((line_num, line))

with open("scratch/conflicts.txt", "w", encoding="utf-8") as out_f:
    out_f.writelines(out_lines)

print("Conflicts written to scratch/conflicts.txt successfully.")
