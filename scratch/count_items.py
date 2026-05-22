import os
import sys

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), "data"))
from rag_engine import RAGEngine

try:
    rag_engine = RAGEngine()
    index = rag_engine.indices.get("public_resource_kb")
    
    # We want to filter by region "서울"
    region = "서울"
    filtered_docs = [d for d in index.docstore._dict.values() if d.metadata.get("region") == region]
    
    print(f"Total documents in {region}: {len(filtered_docs)}")
    
    count_gonglib = 0
    count_guglib = 0
    
    # Detailed check for Gangnam-gu
    gangnam_docs = []
    
    for d in filtered_docs:
        category_val = "기타"
        content = d.page_content or ""
        for line in content.split("\n"):
            if line.startswith("기관구분:"):
                category_val = line.replace("기관구분:", "").strip()
                break
                
        if category_val == "공립":
            count_gonglib += 1
        elif category_val == "국립":
            count_guglib += 1
            
        address = d.metadata.get("address", "")
        # extract Gangnam-gu
        if "강남구" in address:
            gangnam_docs.append((d.metadata.get("name"), category_val, address))
            
    print(f"In region {region}:")
    print(f"- '공립' count: {count_gonglib}")
    print(f"- '국립' count: {count_guglib}")
    print(f"Total Gangnam-gu documents: {len(gangnam_docs)}")
    print("Gangnam-gu items and their parsed categories:")
    for idx, (name, cat, addr) in enumerate(gangnam_docs):
        name_esc = name.encode('ascii', 'backslashreplace').decode('ascii')
        cat_esc = cat.encode('ascii', 'backslashreplace').decode('ascii')
        addr_esc = addr.encode('ascii', 'backslashreplace').decode('ascii')
        print(f"{idx}: {name_esc} | Cat: {cat_esc} | Addr: {addr_esc}")
        
except Exception as e:
    import traceback
    traceback.print_exc()
