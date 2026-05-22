import os
import sys

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), "data"))
from rag_engine import RAGEngine

try:
    rag_engine = RAGEngine()
    index = rag_engine.indices.get("public_resource_kb")
    keys = list(index.docstore._dict.keys())
    doc = index.docstore._dict[keys[0]]
    
    print("--- METADATA ESCAPED ---")
    for k, v in doc.metadata.items():
        if isinstance(v, str):
            escaped = v.encode('ascii', 'backslashreplace').decode('ascii')
            print(f"{k}: {escaped}")
        else:
            print(f"{k}: {v}")
            
except Exception as e:
    import traceback
    traceback.print_exc()
