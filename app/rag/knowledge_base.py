import os
import io
import json
from typing import List
from pypdf import PdfReader
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

INDEX_DIR = os.path.join("data", "vector_stores")
os.makedirs(INDEX_DIR, exist_ok=True)

_GLOBAL_EMBEDDINGS = None


def get_embeddings():
    global _GLOBAL_EMBEDDINGS
    if _GLOBAL_EMBEDDINGS is None:
        print("[RAG]: Initializing lightweight FastEmbed embeddings...")
        try:
            _GLOBAL_EMBEDDINGS = FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")
        except Exception as e:
            print(f"[RAG Warning]: FastEmbed fallback triggered: {e}")
            from langchain_huggingface import HuggingFaceEmbeddings
            _GLOBAL_EMBEDDINGS = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={"device": "cpu"}
            )
    return _GLOBAL_EMBEDDINGS


class KnowledgeBaseManager:
    """Manages document chunking, vector indexing, and document metadata tracking per tenant."""

    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.index_path = os.path.join(INDEX_DIR, f"tenant_{tenant_id}")
        self.metadata_path = os.path.join(self.index_path, "metadata.json")

    def _update_document_metadata(self, source_name: str):
        """Saves uploaded document filenames into a metadata.json file for frontend display."""
        os.makedirs(self.index_path, exist_ok=True)
        sources = []
        if os.path.exists(self.metadata_path):
            try:
                with open(self.metadata_path, "r", encoding="utf-8") as f:
                    sources = json.load(f).get("sources", [])
            except Exception:
                sources = []

        if source_name not in sources:
            sources.append(source_name)

        with open(self.metadata_path, "w", encoding="utf-8") as f:
            json.dump({"sources": sources}, f, indent=2)

    def extract_text_from_pdf_bytes(self, pdf_bytes: bytes) -> str:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        extracted_text = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text.append(text)
        return "\n".join(extracted_text)

    def create_index_from_file(self, file_bytes: bytes, filename: str) -> int:
        if filename.lower().endswith(".pdf"):
            raw_text = self.extract_text_from_pdf_bytes(file_bytes)
        else:
            raw_text = file_bytes.decode("utf-8", errors="ignore")

        if not raw_text.strip():
            raise ValueError("No extractable text found in the uploaded document.")

        return self.create_index_from_text(raw_text, source_name=filename)

    def create_index_from_text(self, text_content: str, source_name: str = "Raw Text Entry") -> int:
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=400,
            chunk_overlap=50
        )
        chunks = text_splitter.split_text(text_content)
        docs = [Document(page_content=chunk, metadata={"tenant_id": self.tenant_id, "source": source_name}) for chunk in chunks]
        
        embeddings = get_embeddings()
        vector_store = FAISS.from_documents(docs, embeddings)
        vector_store.save_local(self.index_path)

        # Record filename in metadata.json
        self._update_document_metadata(source_name)

        print(f"[Knowledge Base]: Successfully indexed {len(docs)} chunks for '{source_name}' (Tenant: {self.tenant_id})")
        return len(docs)

    def query_similar_context(self, query: str, top_k: int = 2) -> str:
        if not os.path.exists(self.index_path):
            return ""

        try:
            embeddings = get_embeddings()
            vector_store = FAISS.load_local(
                self.index_path, 
                embeddings,
                allow_dangerous_deserialization=True
            )
            docs = vector_store.similarity_search(query, k=top_k)
            return "\n---\n".join([d.page_content for d in docs])
        except Exception as e:
            print(f"[RAG Error]: Failed to load index for tenant {self.tenant_id}: {e}")
            return ""