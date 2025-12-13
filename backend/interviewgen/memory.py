import chromadb
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class InterviewMemory:
    """Manages vector embeddings and semantic retrieval for interview context."""
    
    def __init__(self, chroma_host: str = "localhost", chroma_port: int = 8001):
        self.client = chromadb.HttpClient(host=chroma_host, port=chroma_port)
        self.collections = {}
    
    def get_or_create_collection(self, session_id: str) -> chromadb.Collection:
        """Get or create a collection for this interview session"""
        collection_name = f"interview_{session_id}"
        
        if collection_name in self.collections:
            return self.collections[collection_name]
        
        collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"type": "interview", "session_id": session_id}
        )
        self.collections[collection_name] = collection
        logger.info(f"Created/retrieved collection for session {session_id}")
        return collection
    
    def store_answer(
        self,
        session_id: str,
        turn: int,
        question: str,
        answer: str,
        topics: List[str],
        assessment: Optional[Dict[str, Any]] = None
    ) -> str:
        """Store a Q&A pair in vector database."""
        collection = self.get_or_create_collection(session_id)
        
        document_text = f"Q: {question}\nA: {answer}"
        doc_id = f"{session_id}_turn_{turn}"
        
        metadata = {
            "session_id": session_id,
            "turn": turn,
            "type": "qa_pair",
            "question": question,
            "topics": ",".join(topics),
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        if assessment:
            metadata.update({
                "relevance_score": assessment.get("relevance_score", 0),
                "communication_score": assessment.get("communication_score", 0),
                "technical_depth": assessment.get("technical_depth", 0),
            })
        
        collection.add(
            ids=[doc_id],
            documents=[document_text],
            metadatas=[metadata],
        )
        
        logger.info(f"Stored Q&A pair for turn {turn} in session {session_id}")
        return doc_id
    
    def retrieve_context(
        self,
        session_id: str,
        query: str,
        n_results: int = 5
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant context from past answers using semantic similarity."""
        collection = self.get_or_create_collection(session_id)
        
        results = collection.query(
            query_texts=[query],
            n_results=min(n_results, 10),
            where={"session_id": session_id}
        )
        
        if not results or not results['documents']:
            logger.info(f"No context retrieved for query: {query}")
            return []
        
        retrieved = []
        for i in range(len(results['ids'][0])):
            retrieved.append({
                "id": results['ids'][0][i],
                "text": results['documents'][0][i],
                "metadata": results['metadatas'][0][i],
                "distance": results['distances'][0][i],
                "similarity_score": 1 - results['distances'][0][i]
            })
        
        logger.info(f"Retrieved {len(retrieved)} context chunks for session {session_id}")
        return retrieved
    
    def get_conversation_history(
        self,
        session_id: str,
        turn_limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Retrieve conversation history for this session."""
        collection = self.get_or_create_collection(session_id)
        
        results = collection.get(
            where={"session_id": session_id},
            include=["documents", "metadatas"]
        )
        
        if not results:
            return []
        
        conversations = []
        for i in range(len(results['ids'])):
            metadata = results['metadatas'][i]
            
            if turn_limit and metadata.get('turn', 0) > turn_limit:
                continue
            
            conversations.append({
                "id": results['ids'][i],
                "text": results['documents'][i],
                "metadata": metadata
            })
        
        conversations.sort(key=lambda x: x['metadata'].get('turn', 0))
        return conversations
    
    def clear_session(self, session_id: str) -> bool:
        """Delete all data for a session"""
        collection_name = f"interview_{session_id}"
        try:
            self.client.delete_collection(name=collection_name)
            if collection_name in self.collections:
                del self.collections[collection_name]
            logger.info(f"Cleared session {session_id}")
            return True
        except Exception as e:
            logger.error(f"Error clearing session {session_id}: {e}")
            return False