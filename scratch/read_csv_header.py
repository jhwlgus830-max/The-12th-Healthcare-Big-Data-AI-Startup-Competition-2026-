import pandas as pd
import os

csv_path = r"d:\The-12th-Healthcare-Big-Data-AI-Startup-Competition-2026-\rag_documents\보건복지부 국립정신건강센터_정신건강 관련기관 정보_20220301.csv"

if not os.path.exists(csv_path):
    print("CSV file not found!")
    exit(1)

try:
    # Try different encodings
    for encoding in ['utf-8', 'cp949', 'euc-kr', 'utf-8-sig']:
        try:
            df = pd.read_csv(csv_path, encoding=encoding, nrows=5)
            print(f"Success with encoding: {encoding}")
            print("Columns:")
            print(df.columns.tolist())
            print("\nFirst row:")
            print(df.iloc[0].to_dict())
            break
        except Exception as e:
            continue
except Exception as e:
    print(f"Error reading CSV: {e}")
