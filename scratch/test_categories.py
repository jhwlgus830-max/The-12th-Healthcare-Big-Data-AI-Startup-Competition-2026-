import sys
import os

# 'data' 폴더를 sys.path에 추가
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), "data"))

from rag_engine import RAGEngine

try:
    rag_engine = RAGEngine()
    index = rag_engine.indices.get("public_resource_kb")
    if not index:
        print("Index not found!")
        sys.exit(1)
        
    print(f"Total documents: {len(index.docstore._dict)}")
    
    # Print first 5 documents
    count = 0
    for k, d in index.docstore._dict.items():
        print(f"\n--- Document {count} ---")
        print(f"Metadata: {d.metadata}")
        print(f"Page Content:\n{d.page_content}")
        count += 1
        if count >= 5:
            break
except Exception as e:
    import traceback
    traceback.print_exc()
