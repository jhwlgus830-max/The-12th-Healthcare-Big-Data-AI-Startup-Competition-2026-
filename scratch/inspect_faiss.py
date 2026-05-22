import os
import sys

# Add data folder to sys.path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), "data"))

from rag_engine import RAGEngine

try:
    rag_engine = RAGEngine()
    index = rag_engine.indices.get("public_resource_kb")
    if not index:
        print("public_resource_kb not loaded.")
        sys.exit(1)
        
    print(f"Total documents in docstore: {len(index.docstore._dict)}")
    
    # Print the first 5 documents' page_content and metadata
    keys = list(index.docstore._dict.keys())
    for i, k in enumerate(keys[:5]):
        doc = index.docstore._dict[k]
        print(f"\n--- Document {i} ---")
        print("Metadata:", doc.metadata)
        print("Page Content:")
        print(doc.page_content)
        print("Raw bytes of page_content (escaped):")
        print(doc.page_content.encode('ascii', 'backslashreplace').decode('ascii'))
        
except Exception as e:
    import traceback
    traceback.print_exc()
