import json
import re

log_path = r"C:\Users\asia\.gemini\antigravity\brain\72d16992-e186-424b-9a6e-382a789a4040\.system_generated\logs\transcript.jsonl"
out_path = r"d:\The-12th-Healthcare-Big-Data-AI-Startup-Competition-2026-\scratch\extracted_dialogues.txt"

with open(log_path, 'r', encoding='utf-8') as f, open(out_path, 'w', encoding='utf-8') as out:
    for line in f:
        if "handleLoadExampleOwl" in line or "handleLoadExampleJiwoo" in line or "handleLoadExampleChloe" in line:
            data = json.loads(line)
            tool_calls = data.get("tool_calls", [])
            for tc in tool_calls:
                args = tc.get("args", {})
                content = args.get("ReplacementContent") or ""
                chunks = args.get("ReplacementChunks") or []
                
                out.write(f"Step: {data.get('step_index')}\n")
                if content:
                    out.write("--- Content ---\n")
                    out.write(content + "\n")
                if chunks:
                    out.write("--- Chunks ---\n")
                    for chunk in chunks:
                        if isinstance(chunk, dict):
                            out.write(str(chunk.get("ReplacementContent")) + "\n")
                        else:
                            out.write(str(chunk) + "\n")
                out.write("=" * 60 + "\n")

print("Done extraction of dialogues!")
