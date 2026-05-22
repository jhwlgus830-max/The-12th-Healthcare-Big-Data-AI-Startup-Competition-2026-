import os
import csv

DOCS_DIR = "rag_documents"
csv_file = None
for f in os.listdir(DOCS_DIR):
    if f.startswith("보건복지부") and f.endswith(".csv"):
        csv_file = os.path.join(DOCS_DIR, f)
        break

if not csv_file:
    print("CSV file not found.")
else:
    categories = set()
    with open(csv_file, mode="r", encoding="cp949") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cat = row.get("기관구분", "").strip()
            if cat:
                categories.add(cat)
                
    print("Unique categories in CSV (Escaped):")
    for cat in sorted(categories):
        escaped = cat.encode('ascii', 'backslashreplace').decode('ascii')
        print("-", escaped)
