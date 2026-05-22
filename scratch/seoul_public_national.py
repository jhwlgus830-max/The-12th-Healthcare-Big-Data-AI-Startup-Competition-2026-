import os
import csv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS_DIR = os.path.join(BASE_DIR, "rag_documents")

csv_file = None
for f in os.listdir(DOCS_DIR):
    if f.startswith("보건복지부") and f.endswith(".csv"):
        csv_file = os.path.join(DOCS_DIR, f)
        break

if not csv_file:
    print("CSV file not found")
    exit()

try:
    with open(csv_file, mode="r", encoding="cp949") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
except:
    with open(csv_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

seoul_public_national = []
for r in rows:
    name = r.get("기관명", "").strip()
    category = r.get("기관구분", "").strip()
    address = r.get("주소", "").strip()
    if not name or not address:
        continue
    if "서울" in address and (category == "공립" or category == "국립"):
        seoul_public_national.append((name, category, address))

output = []
output.append("Public and National institutions in Seoul:")
for idx, (name, cat, addr) in enumerate(seoul_public_national):
    output.append(f"{idx+1}. {name} | {cat} | {addr}")

with open(os.path.join(BASE_DIR, "scratch", "seoul_public_national_report.txt"), "w", encoding="utf-8") as out:
    out.write("\n".join(output))

print("Saved report to scratch/seoul_public_national_report.txt")
