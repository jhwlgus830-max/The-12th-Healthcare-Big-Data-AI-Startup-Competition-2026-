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

REGION_MAPPING = {
    "서울": "서울", "서울특별시": "서울",
    "경기": "경기", "경기도": "경기",
    "인천": "인천", "인천광역시": "인천",
    "부산": "부산", "부산광역시": "부산",
    "대구": "대구", "대구광역시": "대구",
    "광주": "광주", "광주광역시": "광주",
    "대전": "대전", "대전광역시": "대전",
    "울산": "울산", "울산광역시": "울산",
    "세종": "세종", "세종특별자치시": "세종",
    "강원": "강원", "강원도": "강원", "강원특별자치도": "강원",
    "충북": "충북", "충청북도": "충북",
    "충남": "충남", "충청남도": "충남",
    "전북": "전북", "전라북도": "전북", "전북특별자치도": "전북",
    "전남": "전남", "전라남도": "전남",
    "경북": "경북", "경상북도": "경북",
    "경남": "경남", "경상남도": "경남",
    "제주": "제주", "제주특별자치도": "제주", "제주도": "제주"
}

def parse_region(address: str) -> str:
    if not address or not isinstance(address, str):
        return "Unknown"
    tokens = address.strip().split()
    if not tokens:
        return "Unknown"
    first_token = tokens[0]
    for raw_name, std_name in REGION_MAPPING.items():
        if first_token.startswith(raw_name) or raw_name in first_token:
            return std_name
    return "Unknown"

try:
    with open(csv_file, mode="r", encoding="cp949") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
except:
    with open(csv_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

unknowns = []
for idx, r in enumerate(rows):
    name = r.get("기관명", "").strip()
    addr = r.get("주소", "").strip()
    reg = parse_region(addr)
    if reg == "Unknown":
        unknowns.append((name, addr))

print(f"Total rows: {len(rows)}")
print(f"Total Unknown region rows: {len(unknowns)}")
if len(unknowns) > 0:
    print("First 10 unknowns:")
    for name, addr in unknowns[:10]:
        print(f"  - {name} | {addr}")
