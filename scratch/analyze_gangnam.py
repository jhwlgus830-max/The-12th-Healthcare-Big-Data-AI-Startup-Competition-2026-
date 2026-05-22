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

def test_encoding(enc):
    try:
        with open(csv_file, mode="r", encoding=enc) as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            if len(rows) > 0:
                first_row = rows[0]
                print(f"Encoding {enc} works. Headers: {list(first_row.keys())}")
                return rows
    except Exception as e:
        print(f"Encoding {enc} failed: {e}")
    return None

rows = test_encoding("cp949")
if not rows:
    rows = test_encoding("utf-8")

if not rows:
    print("Failed to read with both cp949 and utf-8")
    exit()

# Filter for Gangnam-gu
gangnam_rows = []
for r in rows:
    addr = r.get("주소", "")
    if "강남구" in addr:
        gangnam_rows.append(r)

output_lines = []
output_lines.append(f"Total Gangnam-gu: {len(gangnam_rows)}")

cat_counts = {}
for r in gangnam_rows:
    cat = r.get("기관구분", "None")
    cat_counts[cat] = cat_counts.get(cat, 0) + 1

output_lines.append("Category counts in Gangnam-gu:")
for cat, count in cat_counts.items():
    output_lines.append(f"  - {cat}: {count}")

output_lines.append("\nList of all Gangnam-gu institutions:")
for idx, r in enumerate(gangnam_rows):
    output_lines.append(f"{idx+1}. {r.get('기관명')} | {r.get('기관구분')} | {r.get('주소')}")

# Save to a file in scratch
with open(os.path.join(BASE_DIR, "scratch", "gangnam_report.txt"), "w", encoding="utf-8") as out:
    out.write("\n".join(output_lines))

print("Saved report to scratch/gangnam_report.txt")
