"""
이 파일은 [SECTION 3] RAG 엔진 구현을 수행합니다.
(Lewis 2020 논문의 RAG-Token/RAG-Sequence 방식 및 DPR 스타일 Retriever 적용)
"""

import os
from typing import List, Dict, Optional
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document

# 3-3. 임베딩 모델 설정
EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
EMBEDDING_DIM = 384  # 모델 교체 시 이 값만 변경

# 실행되는 위치에 무관하게 항상 절대경로로 vector_store를 로드할 수 있도록 수정
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VECTOR_STORE_DIR = os.path.join(BASE_DIR, "vector_store")

class RAGEngine:
    def __init__(self, model_name: str = EMBEDDING_MODEL):
        """
        RAG 엔진 초기화
        """
        # 임베딩 모델 초기화 (CPU 환경 권장)
        self.embeddings = HuggingFaceEmbeddings(
            model_name=model_name,
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True} # IP(Inner Product) 검색을 위해 정규화
        )
        self.indices = {}
        
        # 기본 인덱스 로드 시도
        self._load_all_indices()

    def _load_all_indices(self):
        """저장된 FAISS 인덱스들을 로드합니다. (Hot-swapping 지원을 위해 메모리에 유지)"""
        if not os.path.exists(VECTOR_STORE_DIR):
            os.makedirs(VECTOR_STORE_DIR, exist_ok=True)
            
        kb_types = ['clinical_kb', 'public_resource_kb', 'crisis_kb']
        for kb in kb_types:
            path = os.path.join(VECTOR_STORE_DIR, kb)
            if os.path.exists(os.path.join(path, "index.faiss")):
                self.indices[kb] = FAISS.load_local(path, self.embeddings, allow_dangerous_deserialization=True)
            else:
                self.indices[kb] = None

    def build_index(self, documents: List[Document], kb_category: str):
        """
        3-4. FAISS 인덱스 구성 및 빌드
        kb_category: 'clinical_kb', 'public_resource_kb', 'crisis_kb'
        """
        # Lewis 논문 기준: FAISS IndexFlatIP (정확도 우선)
        # index = faiss.IndexFlatIP(EMBEDDING_DIM)
        # 대규모 문서(10만개 이상)의 경우 아래 HNSW 근사 탐색 사용 권장
        # index = faiss.IndexHNSWFlat(EMBEDDING_DIM, 32)
        
        # LangChain의 FAISS.from_documents는 기본적으로 L2 거리 등을 사용하지만,
        # 위에서 normalize_embeddings=True를 적용하여 코사인 유사도(IP)와 유사하게 동작합니다.
        vector_store = FAISS.from_documents(documents, self.embeddings)
        
        save_path = os.path.join(VECTOR_STORE_DIR, kb_category)
        vector_store.save_local(save_path)
        self.indices[kb_category] = vector_store
        
        print(f"[{kb_category}] 인덱스 구축 완료 (총 {len(documents)} 청크)")

    def _get_retriever(self, kb_category: str, top_k: int = 5):
        if kb_category not in self.indices or self.indices[kb_category] is None:
            return None
        return self.indices[kb_category].as_retriever(search_kwargs={"k": top_k})

    def retrieve(self, query: str, kb_category: str, region: Optional[str] = None) -> List[Document]:
        """
        3-5. Retriever 검색 수행
        상황별 동적 조정 (위기 인덱스는 K=3으로 제한)
        """
        top_k = 3 if kb_category == 'crisis_kb' else 5
        retriever = self._get_retriever(kb_category, top_k)
        
        if not retriever:
            return []
            
        # 메타데이터 필터링 적용 (지역) - LangChain FAISS 필터 지원 활용
        if region and kb_category == 'public_resource_kb':
            retriever.search_kwargs["filter"] = {"region": region}
            
        docs = retriever.invoke(query)
        return docs

    def retrieve_multi_kb(self, query: str, intents: List[str], region: Optional[str] = None) -> Dict[str, List[Document]]:
        """
        3-5. RAG-Token 전략 적용
        사용자 발화의 핵심 키워드/인텐트에 따라 여러 인덱스(KB)를 동시 참조
        예: "강남구 우울증 어디서 상담받지?" -> public_resource_kb(강남구) + clinical_kb(우울증)
        """
        results = {}
        if 'crisis' in intents:
            results['crisis'] = self.retrieve(query, 'crisis_kb')
        if 'resource' in intents:
            results['resource'] = self.retrieve(query, 'public_resource_kb', region=region)
        if 'clinical' in intents or not intents: # 기본적으로 임상 가이드는 검색
            results['clinical'] = self.retrieve(query, 'clinical_kb')
            
        return results

def create_sample_documents():
    """
    3-2. 청크 전략 (Chunking) 샘플 생성기
    - 임상/위기 매뉴얼: 한국어 의미 손실 방지를 위해 문단 경계 우선 + 최대 500자, 50자 오버랩
    - 공공기관: 시도/기관명/연락처 등 1개 청크 (통합)
    """
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        separators=["\n\n", "\n", ".", "?", "!", " ", ""]
    )
    
    # 임상 가이드 샘플
    clinical_text = "우울증 환자를 대할 때는 공감적 경청이 중요합니다. 섣부른 조언보다는 감정을 알아주는 것이 우선되어야 합니다."
    clinical_docs = splitter.create_documents(
        [clinical_text],
        metadatas=[{"source": "cbt_manual.txt", "category": "clinical", "region": "전국", "chunk_id": 1}]
    )
    
    # 공공 자원 샘플 (공공기관 정보는 단일 청크로 묶음)
    public_docs = [
        Document(
            page_content="서울특별시 강남구 정신건강복지센터\n연락처: 02-3456-7890\n운영시간: 평일 09:00~18:00",
            metadata={"source": "api_data", "category": "public", "region": "서울", "chunk_id": 1}
        )
    ]
    
    # 위기 매뉴얼 샘플
    crisis_text = "자살 고위험군 상담 시 즉각적인 안전 확보가 필요합니다. 1393이나 112로 연계하여 물리적 안전을 보장하세요."
    crisis_docs = splitter.create_documents(
        [crisis_text],
        metadatas=[{"source": "crisis_protocol.pdf", "category": "crisis", "region": "전국", "chunk_id": 1}]
    )
    
    return clinical_docs, public_docs, crisis_docs

if __name__ == "__main__":
    engine = RAGEngine()
    print("샘플 인덱스를 구축합니다...")
    clinical, public, crisis = create_sample_documents()
    engine.build_index(clinical, "clinical_kb")
    engine.build_index(public, "public_resource_kb")
    engine.build_index(crisis, "crisis_kb")
