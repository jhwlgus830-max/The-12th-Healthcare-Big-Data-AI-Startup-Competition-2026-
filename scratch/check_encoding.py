import chardet
import os

csv_path = r"d:\The-12th-Healthcare-Big-Data-AI-Startup-Competition-2026-\rag_documents\보건복지부 국립정신건강센터_정신건강 관련기관 정보_20220301.csv"

with open(csv_path, 'rb') as f:
    raw_data = f.read(10000)
    result = chardet.detect(raw_data)
    print("Detected encoding:", result)
    
    # Try decoding with euc-kr, cp949, utf-8, utf-16
    for enc in ['cp949', 'euc-kr', 'utf-8', 'utf-16', 'utf-16-le', 'utf-16-be']:
        try:
            decoded = raw_data.decode(enc)
            print(f"\n--- Decoded with {enc} (first 200 chars) ---")
            print(decoded[:200])
        except Exception as e:
            print(f"Failed decoding with {enc}: {e}")
