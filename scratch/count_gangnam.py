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

print(f"Reading CSV: {csv_file}")
gangnam_count = 0
gangnam_by_category = {}
gangnam_institutions = []

try:
    with open(csv_file, mode="r", encoding="cp949") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get("기관명", "").strip()
            category = row.get("기관구분", "").strip()
            address = row.get("주소", "").strip()
            if "강남구" in address:
                gangnam_count += 1
                gangnam_by_category[category] = gangnam_by_category.get(category, 0) + 1
                gangnam_institutions.append((name, category, address))
except Exception as e:
    print(f"Error: {e}")

print(f"Total Gangnam-gu institutions in CSV: {gangnam_count}")
print("Categories:")
for cat, count in gangnam_by_category.items():
    print(f"  - {cat}: {count}")

print("\nFirst 10 institutions in Gangnam-gu:")
for name, cat, addr in gangnam_institutions[:10]:
    print(f"  - {name} | {cat} | {addr}")
