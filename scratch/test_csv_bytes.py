import os
import sys

csv_path = r"d:\The-12th-Healthcare-Big-Data-AI-Startup-Competition-2026-\rag_documents\보건복지부 국립정신건강센터_정신건강 관련기관 정보_20220301.csv"

if not os.path.exists(csv_path):
    print("CSV file does not exist at path:", csv_path)
    sys.exit(1)

with open(csv_path, 'rb') as f:
    first_line = f.readline()
    print("Raw bytes of first line:")
    print(first_line)
    
    # Try decoding and re-encoding to unicode escape to see what it is
    for enc in ['utf-8', 'cp949', 'euc-kr', 'utf-16']:
        try:
            decoded = first_line.decode(enc)
            # escape so we can see the exact unicode characters regardless of stdout encoding
            escaped = decoded.encode('ascii', 'backslashreplace').decode('ascii')
            print(f"Decoded with {enc}: {escaped}")
        except Exception as e:
            print(f"Error decoding with {enc}: {e}")
