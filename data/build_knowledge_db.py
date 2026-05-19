"""
build_knowledge_db.py — RAG 상담 지식 DB 구축 자동화 스크립트
============================================================
rag_documents/ 폴더에 위치한 모든 PDF 파일을 자동으로 감지하여 텍스트를 추출하고,
청킹(Chunking) 및 임베딩 과정을 거쳐 FAISS 벡터 DB(vector_store/clinical_kb)를 빌드합니다.

추후 새로운 전문 서적이나 임상 매뉴얼 PDF가 추가되면, rag_documents/ 폴더에 파일만 넣고
이 스크립트를 재실행(python data/build_knowledge_db.py)하는 것만으로 지식 DB가 자동으로 확장됩니다.
"""

import os
import sys
from typing import List
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

# Windows 콘솔 유니코드 출력 인코딩 설정
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

# data 폴더를 path에 추가하여 로컬 모듈 로드 지원
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from rag_engine import RAGEngine

# 기본 경로 정의
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS_DIR = os.path.join(BASE_DIR, "rag_documents")
VECTOR_STORE_DIR = os.path.join(BASE_DIR, "vector_store")

def extract_text_from_pdf(pdf_path: str) -> str:
    """PDF 파일로부터 전체 텍스트를 정밀하게 추출합니다."""
    print(f"  └─ 텍스트 추출 중: {os.path.basename(pdf_path)}")
    try:
        reader = PdfReader(pdf_path)
        full_text = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                full_text.append(text)
        return "\n\n".join(full_text)
    except Exception as e:
        print(f"[Error] PDF 파싱 중 오류 발생: {pdf_path}. 상세: {e}")
        return ""

def process_and_chunk_documents() -> List[Document]:
    """rag_documents 폴더 안의 모든 PDF 파일을 청킹하여 Document 객체 리스트로 반환합니다."""
    if not os.path.exists(DOCS_DIR):
        print(f"[Warning] 문서 폴더가 존재하지 않아 새로 생성합니다: {DOCS_DIR}")
        os.makedirs(DOCS_DIR, exist_ok=True)
        return []

    # 1. 청커 설정 (한국어 문맥 의미 유실 방지 전략)
    # 문단 경계 우선 및 500자 단위 청크, 50자 오버랩 적용
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        separators=["\n\n", "\n", ".", "?", "!", " ", ""]
    )

    all_chunks = []
    pdf_files = [f for f in os.listdir(DOCS_DIR) if f.lower().endswith('.pdf')]

    if not pdf_files:
        print(f"[Information] {DOCS_DIR} 폴더에 처리할 PDF 파일이 없습니다.")
        return []

    print(f"■ 총 {len(pdf_files)}개의 PDF 문서 분석을 시작합니다.")

    for file_name in pdf_files:
        pdf_path = os.path.join(DOCS_DIR, file_name)
        text = extract_text_from_pdf(pdf_path)
        
        if not text.strip():
            print(f"  └─ [패스] 추출된 텍스트가 비어있습니다.")
            continue

        # 2. 메타데이터와 함께 청킹 수행
        # 소스 파일명 및 카테고리를 저장하여 추후 출처 표기 지원
        docs = splitter.create_documents(
            texts=[text],
            metadatas=[{
                "source": file_name,
                "category": "clinical",
                "char_length": len(text)
            }]
        )
        all_chunks.extend(docs)
        print(f"  └─ 완료: {len(docs)}개의 청크 생성 완료.")

    return all_chunks

def build_kb():
    """RAG 지식 데이터베이스 구축 파이프라인을 실행합니다."""
    print("===================================================")
    print("   [말랑해도 돼] RAG 상담 지식 DB 구축 파이프라인")
    print("===================================================\n")

    # 1. PDF 문서들을 읽어와 청킹
    chunks = process_and_chunk_documents()
    
    if not chunks:
        print("\n[알림] 처리된 문서 청크가 없어 빌드를 종료합니다.")
        return

    print(f"\n■ 총 {len(chunks)}개의 상담 지식 조각(Chunk)을 FAISS 벡터 인덱스로 구축합니다...")

    # 2. RAGEngine을 통해 FAISS 인덱스 빌드 및 저장
    try:
        # RAGEngine 인스턴스화
        engine = RAGEngine()
        # clinical_kb 카테고리에 저장
        engine.build_index(chunks, "clinical_kb")
        print("\n===================================================")
        print("🎉 RAG 상담 지식 DB 구축이 성공적으로 완료되었습니다!")
        print(f"   - 저장 경로: {os.path.join(VECTOR_STORE_DIR, 'clinical_kb')}")
        print("===================================================")
    except Exception as e:
        print(f"\n❌ 벡터 DB 인덱스 빌드 실패: {e}")

if __name__ == "__main__":
    build_kb()
