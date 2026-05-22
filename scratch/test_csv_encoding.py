import chardet
import os
import sys

csv_path = r"d:\The-12th-Healthcare-Big-Data-AI-Startup-Competition-2026-\rag_documents\보건복지부 국립정신건강센터_정신건강 관련기관 정보_20220301.csv"

if not os.path.exists(csv_path):
    print("CSV file does not exist at path:", csv_path)
    sys.exit(1)

with open(csv_path, 'rb') as f:
    raw_data = f.read(10000)
    result = chardet.detect(raw_data)
    print("Detected encoding:", result)

# Let's try reading the first few lines with detected encoding and with utf-8/cp949
encodings = [result['encoding'], 'utf-8', 'cp949', 'euc-kr']
for enc in encodings:
    if not enc:
        continue
    print(f"\n--- Reading with {enc} ---")
    try:
        with open(csv_path, 'r', encoding=enc) as f:
            for idx in range(5):
                line = f.readline()
                if not line:
                    break
                print(f"Line {idx}: {repr(line)}")
    except Exception as e:
        print(f"Error reading with {enc}: {e}")
