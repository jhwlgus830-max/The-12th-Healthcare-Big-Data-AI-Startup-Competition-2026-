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
    
    print(f"Found {len(filtered_docs)} documents in {region}")
    
    results = []
    categories_found = set()
    
    for d in filtered_docs[:10]:
        category_val = "기타"
        content = d.page_content or ""
        for line in content.split("\n"):
            if line.startswith("기관구분:"):
                category_val = line.replace("기관구분:", "").strip()
                break
        
        name_escaped = d.metadata.get("name", "").encode('ascii', 'backslashreplace').decode('ascii')
        category_escaped = category_val.encode('ascii', 'backslashreplace').decode('ascii')
        
        print(f"Name: {name_escaped} | Parsed Category: {category_escaped}")
        categories_found.add(category_val)
        
except Exception as e:
    import traceback
    traceback.print_exc()
