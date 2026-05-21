import sys
sys.path.append('data')
from rag_engine import RAGEngine

engine = RAGEngine()
index = engine.indices.get('public_resource_kb')

print("Total docs in index:", index.index.ntotal)
print("Docs with region='서울':", len([d for d in index.docstore._dict.values() if d.metadata.get('region') == '서울']))

docs = index.similarity_search('정신건강복지센터', k=15, filter={'region': '서울'})
print("Similarity search with filter={'region': '서울'} count:", len(docs))

docs_callable = index.similarity_search('정신건강복지센터', k=15, filter=lambda m: m.get('region') == '서울')
print("Similarity search with callable filter count:", len(docs_callable))
