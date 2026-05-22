import pandas as pd

csv_path = r"d:\The-12th-Healthcare-Big-Data-AI-Startup-Competition-2026-\rag_documents\보건복지부 국립정신건강센터_정신건강 관련기관 정보_20220301.csv"

encodings = ['utf-8', 'utf-8-sig', 'cp949', 'euc-kr', 'utf-16', 'utf-16-le', 'utf-16-be']
for enc in encodings:
    try:
        df = pd.read_csv(csv_path, encoding=enc, nrows=3)
        cols = df.columns.tolist()
        print(f"[{enc}] successfully read. Columns: {cols}")
        print(f"Row 0: {df.iloc[0].to_dict()}")
    except Exception as e:
        print(f"[{enc}] failed: {e}")
