"""
build_knowledge_db.py — RAG 상담 지식 DB 구축 자동화 스크립트
============================================================
rag_documents/ 폴더에 위치한 모든 PDF, DOCX, PNG 파일을 자동으로 감지하여 텍스트를 추출하고,
청킹(Chunking) 및 임베딩 과정을 거쳐 FAISS 벡터 DB(vector_store/clinical_kb)를 빌드합니다.

추후 새로운 전문 서적이나 임상 매뉴얼 파일이 추가되면, rag_documents/ 폴더에 파일만 넣고
이 스크립트를 재실행(python data/build_knowledge_db.py)하는 것만으로 지식 DB가 자동으로 확장됩니다.
"""

import os
import sys
from typing import List
from pypdf import PdfReader
from docx import Document as DocxDocument
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

_ocr_reader = None

def get_ocr_reader():
    """EasyOCR 리더를 싱글톤 패턴으로 초기화하여 메모리 및 실행 속도를 최적화합니다."""
    global _ocr_reader
    if _ocr_reader is None:
        # OpenMP 초기화 에러 방지
        os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
        import easyocr
        # 한국어와 영어를 함께 검출할 수 있도록 지원
        _ocr_reader = easyocr.Reader(['ko', 'en'], gpu=False)
    return _ocr_reader

def extract_text_from_pdf(pdf_path: str) -> str:
    """PDF 파일로부터 전체 텍스트를 정밀하게 추출합니다."""
    print(f"  └─ PDF 텍스트 추출 중: {os.path.basename(pdf_path)}")
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

def extract_text_from_docx(docx_path: str) -> str:
    """DOCX 파일로부터 본문 문단 및 표(Table) 내부의 텍스트를 정밀하게 추출합니다."""
    print(f"  └─ DOCX 텍스트 추출 중: {os.path.basename(docx_path)}")
    try:
        doc = DocxDocument(docx_path)
        full_text = []
        
        # 1. 문단 텍스트 추출
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text)
                
        # 2. 표(Table) 내부의 모든 텍스트 추출 및 결합
        for table in doc.tables:
            for row in table.rows:
                row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_text:
                    full_text.append(" | ".join(row_text))
                    
        return "\n\n".join(full_text)
    except Exception as e:
        print(f"[Error] DOCX 파싱 중 오류 발생: {docx_path}. 상세: {e}")
        return ""

def extract_text_from_png(png_path: str) -> str:
    """PNG 이미지 파일로부터 PIL을 사용하여 로딩한 뒤 EasyOCR로 한글/영어 텍스트를 추출합니다.
    (Windows 환경의 OpenCV 한글 경로 디코딩 우회 적용)
    """
    print(f"  └─ 이미지(OCR) 텍스트 추출 중: {os.path.basename(png_path)}")
    try:
        from PIL import Image
        import numpy as np
        reader = get_ocr_reader()
        # PIL Image로 로드하여 OpenCV 파일 경로 인코딩 문제 해결
        with Image.open(png_path) as img:
            # RGB로 변환 (투명도가 있는 RGBA 등도 처리)
            img = img.convert('RGB')
            img_np = np.array(img)
        result = reader.readtext(img_np)
        # 검출된 텍스트 조각들을 순서대로 결합
        text_lines = [line[1].strip() for line in result if line[1].strip()]
        return "\n".join(text_lines)
    except Exception as e:
        print(f"[Error] PNG OCR 중 오류 발생: {png_path}. 상세: {e}")
        return ""

def extract_text_from_md(md_path: str) -> str:
    """MD 파일로부터 전체 텍스트를 정밀하게 추출합니다."""
    print(f"  └─ MD 텍스트 추출 중: {os.path.basename(md_path)}")
    try:
        with open(md_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        print(f"[Error] MD 파싱 중 오류 발생: {md_path}. 상세: {e}")
        return ""

def process_and_chunk_documents() -> List[Document]:
    """rag_documents 폴더 안의 모든 PDF, DOCX, PNG, MD 파일을 청킹하여 Document 객체 리스트로 반환합니다."""
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
    
    # PDF, DOCX, PNG, MD 지원 확장자 목록 정의
    supported_extensions = ('.pdf', '.docx', '.png', '.md')
    all_files = [f for f in os.listdir(DOCS_DIR) if f.lower().endswith(supported_extensions)]

    if not all_files:
        print(f"[Information] {DOCS_DIR} 폴더에 처리할 지원 문서가 없습니다.")
        return []

    print(f"■ 총 {len(all_files)}개의 문서 분석을 시작합니다.")

    for file_name in all_files:
        file_path = os.path.join(DOCS_DIR, file_name)
        ext = os.path.splitext(file_name)[1].lower()
        
        text = ""
        if ext == '.pdf':
            text = extract_text_from_pdf(file_path)
        elif ext == '.docx':
            text = extract_text_from_docx(file_path)
        elif ext == '.png':
            text = extract_text_from_png(file_path)
        elif ext == '.md':
            text = extract_text_from_md(file_path)
            
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

    # 1. 문서들을 읽어와 청킹
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
