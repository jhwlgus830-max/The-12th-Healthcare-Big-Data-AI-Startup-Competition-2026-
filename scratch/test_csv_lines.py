import os
import sys

csv_path = r"d:\The-12th-Healthcare-Big-Data-AI-Startup-Competition-2026-\rag_documents\보건복지부 국립정신건강센터_정신건강 관련기관 정보_20220301.csv"

with open(csv_path, 'rb') as f:
    for idx in range(6):
        line_bytes = f.readline()
        print(f"\n--- Line {idx} ---")
        print("Raw bytes:", line_bytes)
        try:
            decoded = line_bytes.decode('cp949')
            escaped = decoded.encode('ascii', 'backslashreplace').decode('ascii')
            print("CP949 Decoded:", escaped)
        except Exception as e:
            print("CP949 Decode error:", e)
            
        try:
            decoded_utf8 = line_bytes.decode('utf-8')
            escaped_utf8 = decoded_utf8.encode('ascii', 'backslashreplace').decode('ascii')
            print("UTF-8 Decoded:", escaped_utf8)
        except Exception as e:
            print("UTF-8 Decode error:", e)
