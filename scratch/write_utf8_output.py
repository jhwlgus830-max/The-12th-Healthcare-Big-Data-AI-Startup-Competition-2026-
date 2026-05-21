import pandas as pd

csv_path = r"d:\The-12th-Healthcare-Big-Data-AI-Startup-Competition-2026-\rag_documents\보건복지부 국립정신건강센터_정신건강 관련기관 정보_20220301.csv"
output_path = r"d:\The-12th-Healthcare-Big-Data-AI-Startup-Competition-2026-\scratch\decoded_sample.txt"

try:
    df = pd.read_csv(csv_path, encoding='cp949')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("Columns: " + str(df.columns.tolist()) + "\n")
        for idx, row in df.head(10).iterrows():
            f.write(f"Row {idx}: {row.to_dict()}\n")
    print("Successfully wrote sample in UTF-8 to scratch/decoded_sample.txt!")
except Exception as e:
    print(f"Error: {e}")
