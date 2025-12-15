from typing import TypedDict, List, Optional, Any, Dict


class RetrievedContext(TypedDict):
    """Schema for retrieved context from Chroma"""
    text: str
    metadata: Dict[str, Any]
    similarity_score: float
    turn: int


class Assessment(TypedDict):
    """Interview answer assessment"""
    relevance_score: float
    communication_score: float
    technical_depth: float
    follow_up_needed: bool
    key_points: List[str]


class InterviewState(TypedDict):
    """Complete state for interview flow"""
    session_id: str
    created_at: str
    jd: str
    resume: str
    candidate_name: Optional[str]
    target_role: Optional[str]
    turn: int
    max_turns: int
    questions_asked: List[str]
    topics_covered: Dict[str, Dict[str, Any]]
    current_question: Optional[str]
    current_answer: Optional[str]
    current_assessment: Optional[Assessment]
    retrieved_context: List[RetrievedContext]
    interview_depth: str
    interview_style: str
    interview_complete: bool
    final_assessment: Optional[Dict[str, Any]]