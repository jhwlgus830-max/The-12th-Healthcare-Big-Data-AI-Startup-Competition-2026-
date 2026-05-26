import json
import sys

log_path = r"C:\Users\asia\.gemini\antigravity\brain\72d16992-e186-424b-9a6e-382a789a4040\.system_generated\logs\transcript.jsonl"
out_path = r"d:\The-12th-Healthcare-Big-Data-AI-Startup-Competition-2026-\scratch\extracted_userflow_changes.txt"

with open(log_path, 'r', encoding='utf-8') as f, open(out_path, 'w', encoding='utf-8') as out:
    for line in f:
        data = json.loads(line)
        if "replace_file_content" in line or "multi_replace_file_content" in line:
            tool_calls = data.get("tool_calls", [])
            for tc in tool_calls:
                args = tc.get("args", {})
                target_file = args.get("TargetFile", "")
                if "UserFlow.tsx" in target_file:
                    out.write(f"Step: {data.get('step_index')}\n")
                    out.write(f"Description: {args.get('Description')}\n")
                    chunks = args.get("ReplacementChunks")
                    if chunks:
                        for idx, chunk in enumerate(chunks):
                            out.write(f"  Chunk {idx}:\n")
                            if isinstance(chunk, dict):
                                out.write(str(chunk.get("ReplacementContent")) + "\n")
                            else:
                                out.write(str(chunk) + "\n")
                    else:
                        out.write(str(args.get("ReplacementContent")) + "\n")
                    out.write("-" * 50 + "\n")

print("Done! Check d:\\The-12th-Healthcare-Big-Data-AI-Startup-Competition-2026-\\scratch\\extracted_userflow_changes.txt")
