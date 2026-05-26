"""
이 파일은 [SECTION 3] RAG 엔진 구현을 수행합니다.
(Lewis 2020 논문의 RAG-Token/RAG-Sequence 방식 및 DPR 스타일 Retriever 적용)
"""

import os
from typing import List, Dict, Optional

HAS_LANGCHAIN = True
try:
    from langchain_community.vectorstores import FAISS
    from langchain_community.embeddings import HuggingFaceEmbeddings
    from langchain_core.documents import Document
except ImportError:
    HAS_LANGCHAIN = False
    class Document:
        def __init__(self, page_content: str, metadata: dict = None):
            self.page_content = page_content
            self.metadata = metadata or {}


# 3-3. 임베딩 모델 설정
EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
EMBEDDING_DIM = 384  # 모델 교체 시 이 값만 변경

# 실행되는 위치에 무관하게 항상 절대경로로 vector_store를 로드할 수 있도록 수정
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VECTOR_STORE_DIR = os.path.join(BASE_DIR, "vector_store")

class RAGEngine:
    def __init__(self, model_name: str = EMBEDDING_MODEL):
        """
        RAG 엔진 초기화 (배포 512MB 메모리 초과 방지용 하이브리드 Fallback 지원)
        """
        self.is_lite_mode = False
        self.indices = {}
        
        if not HAS_LANGCHAIN:
            print("[RAG Engine Alert] langchain is not installed. Activating ultra-lightweight Keyword Match Retriever.")
            self.is_lite_mode = True
            return
            
        try:
            # 임베딩 모델 초기화 (CPU 환경 권장)
            self.embeddings = HuggingFaceEmbeddings(
                model_name=model_name,
                model_kwargs={'device': 'cpu'},
                encode_kwargs={'normalize_embeddings': True}
            )
            # 기본 인덱스 로드 시도
            self._load_all_indices()
        except Exception as e_rag:
            print(f"[RAG Engine Alert] Failed to load heavy neural RAG Retriever: {e_rag}. Activating ultra-lightweight Keyword Match Retriever instead.")
            self.is_lite_mode = True

    def _load_all_indices(self):
        """저장된 FAISS 인덱스들을 로드합니다."""
        if self.is_lite_mode:
            return
            
        if not os.path.exists(VECTOR_STORE_DIR):
            os.makedirs(VECTOR_STORE_DIR, exist_ok=True)
            
        kb_types = ['clinical_kb', 'public_resource_kb', 'crisis_kb']
        for kb in kb_types:
            path = os.path.join(VECTOR_STORE_DIR, kb)
            if os.path.exists(os.path.join(path, "index.faiss")):
                try:
                    self.indices[kb] = FAISS.load_local(path, self.embeddings, allow_dangerous_deserialization=True)
                except Exception as e_load:
                    print(f"[RAG Engine Alert] FAISS load failed for '{kb}': {e_load}. Activating Lite Mode backup.")
                    self.is_lite_mode = True
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
        # ── LITE_MODE FALLBACK ──────────────────────────
        if self.is_lite_mode:
            try:
                kb_data = [
                    {"category": "위기전화", "title": "24시간 자살예방 상담전화 109", "content": "극심한 정서적 위기나 자해/자살 사고가 일어날 시, 언제든 109로 전화해 주시기 바랍니다. 전문 상담사들이 24시간 실시간 정서적 지지 및 위기 연계를 제공합니다.", "tags": ["위기전화", "긴급", "24시간"], "source": "보건복지부 위기개입매뉴얼_2024"},
                    {"category": "위기전화", "title": "정신건강위기상담전화 1577-0199", "content": "전국 어디서나 1577-0199로 전화를 걸면 각 지자체의 정신건강복지센터 전문 요원들과 연결되어 심리적 안정화 및 내방 상담, 긴급 현장 동행 등을 연계받으실 수 있습니다.", "tags": ["위기전화", "정신건강복지센터"], "source": "보건복지부 위기개입매뉴얼_2024"},
                    {"category": "자가관리콘텐츠", "title": "우울 해소를 위한 행동활성화(Behavioral Activation)", "content": "무기력이 짙어지면 방 안에만 고립되어 긍정 강화를 잃어버리는 악순환이 생깁니다. 하루 중 단 10분만이라도 좋아하는 차를 끓이거나 집 주변 골목을 걷는 사소한 행동 스케줄링을 통해 성취를 채워가세요.", "tags": ["행동활성화", "자가관리", "우울"], "source": "상담연습교본"},
                    {"category": "자가관리콘텐츠", "title": "수면위생 10대 수칙", "content": "1) 매일 아침 같은 시간에 일어나기 2) 침대에 누워 스마트폰 쳐다보지 않기 3) 낮잠은 20분 이내로 제한하기 4) 오후 2시 이후 카페인 섭취 중단 5) 미지근한 물로 샤워 후 취침하기", "tags": ["수면위생", "생활습관"], "source": "상담연습교본"},
                    {"category": "자가관리콘텐츠", "title": "마음챙김(Mindfulness) 호흡법", "content": "과거나 미래의 두려운 절망에 잠식되지 않도록 '지금 이 순간'의 호흡으로 돌아오는 연습입니다. 코끝을 스치는 숨의 촉감과 가슴의 오르내림에 온 신경을 집중해 5분간 숨을 고릅니다.", "tags": ["마음챙김", "호흡", "안정화기법"], "source": "자가관리콘텐츠 DB"},
                    {"category": "인지왜곡개입", "title": "흑백논리 및 극단적 이분법 교정 가이드", "content": "내담자가 '완벽하지 못하면 실패한 것'이라고 생각할 때, '성공 아니면 완전 실패'의 양극단 사이에 10%에서 90%까지의 수많은 스펙트럼과 중간지대(Grey Zone)가 있음을 함께 선을 그려 설명해 줍니다.", "tags": ["인지왜곡", "흑백논리", "CBT"], "source": "상담연습교본"},
                    {"category": "안전대응문구", "title": "자살 직접 행동 의도 감지 시의 표준 템플릿", "content": "사용자가 수단이나 직접 의도(자살, 수면제 과다 등)를 표명했을 시, AI는 자유로운 정서 공감 생성을 엄격히 축소하고: '지금 매우 고통스럽고 위험한 상태에 계십니다. 생명을 지키기 위해, 지금 즉시 이 화면의 109 핫라인 혹은 119로 긴급 연결을 해주세요.' 라는 안전 규격 문구만을 노출합니다.", "tags": ["고위험", "가드레일", "템플릿"], "source": "안전대응문구_2024"}
                ]
                
                matched_docs = []
                for item in kb_data:
                    score = 0
                    for tag in item["tags"]:
                        if tag in query:
                            score += 3
                    if item["category"] in query:
                        score += 2
                    if any(word in query for word in item["title"].split()):
                        score += 2
                    if any(word in query for word in item["content"].split()):
                        score += 1
                        
                    if kb_category == 'crisis_kb' and item["category"] in ["위기전화", "안전대응문구"]:
                        score += 5
                    if any(w in query for w in ["잠", "불면", "수면"]):
                        if "수면" in item["title"] or "호흡" in item["title"]:
                            score += 10
                    if any(w in query for w in ["우울", "무기력", "슬퍼"]):
                        if "행동활성화" in item["title"] or "호흡" in item["title"]:
                            score += 8
                    if any(w in query for w in ["끝내", "자살", "죽고", "수면제"]):
                        if item["category"] in ["위기전화", "안전대응문구"]:
                            score += 12
                            
                    if score > 0:
                        matched_docs.append((score, item))
                        
                matched_docs.sort(key=lambda x: x[0], reverse=True)
                
                docs = []
                for sc, doc_info in matched_docs[:3]:
                    docs.append(Document(
                        page_content=doc_info["content"],
                        metadata={"source": doc_info["source"], "category": doc_info["category"]}
                    ))
                
                if not docs:
                    docs.append(Document(
                        page_content="가장 힘겨운 정서적 위기에 놓였을 때 우울빼미와 클로가 당신 곁에 늘 함께하겠습니다. 언제든 마음의 대화를 걸어 주세요.",
                        metadata={"source": "system_default", "category": "general"}
                    ))
                return docs
            except Exception as e_lite:
                print(f"[RAG Lite Error] Static search failed: {e_lite}")
                return [Document(page_content="안전과 안정을 위한 상담 가이드가 활성화되어 있습니다.", metadata={"source": "system"})]

        top_k = 3 if kb_category == 'crisis_kb' else 5
        retriever = self._get_retriever(kb_category, top_k)
        
        if not retriever:
            return []
            
        # 메타데이터 필터링 적용 (지역) - LangChain FAISS 필터 지원 활용
        if region and kb_category == 'public_resource_kb':
            retriever.search_kwargs["filter"] = {"region": region}
            retriever.search_kwargs["fetch_k"] = 2000
            
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
    try:
        from langchain_text_splitters import RecursiveCharacterTextSplitter
    except ImportError:
        print("[RAG Engine Warning] langchain_text_splitters not installed. Returning empty sample documents.")
        return [], [], []
    
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
