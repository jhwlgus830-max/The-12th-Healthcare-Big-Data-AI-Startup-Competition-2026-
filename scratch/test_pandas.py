import pandas as pd

csv_path = r"d:\The-12th-Healthcare-Big-Data-AI-Startup-Competition-2026-\rag_documents\보건복지부 국립정신건강센터_정신건강 관련기관 정보_20220301.csv"

try:
    df = pd.read_csv(csv_path, encoding='cp949')
    print("Success reading with cp949!")
    print("Shape:", df.shape)
    print("Columns:", df.columns.tolist())
    print("\nFirst 3 rows:")
    for idx, row in df.head(3).iterrows():
        print(f"Row {idx}: {row.to_dict()}")
except Exception as e:
    print(f"Error: {e}")
