from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class StartInterviewRequest(BaseModel):
    """Request to start a new interview"""
    job_description: str = Field(..., description="Full job description")
    resume: str = Field(..., description="Candidate's resume text")
    candidate_name: Optional[str] = Field(None, description="Candidate's name")
    target_role: Optional[str] = Field(None, description="Target job role")
    interview_depth: str = Field(
        default="medium",
        description="Interview depth: 'shallow' (4-5 questions), 'medium' (8 questions), 'deep' (12+ questions)"
    )
    interview_style: str = Field(
        default="mixed",
        description="Interview style: 'technical', 'behavioral', or 'mixed'"
    )


class InterviewQuestionResponse(BaseModel):
    """Response containing an interview question"""
    session_id: str = Field(..., description="Unique interview session ID")
    turn: int = Field(..., description="Question number (1-indexed)")
    question: str = Field(..., description="The interview question")
    is_final: bool = Field(
        default=False,
        description="True if this is the final question"
    )


class SubmitAnswerRequest(BaseModel):
    """Request to submit an answer to an interview question"""
    session_id: str = Field(..., description="Interview session ID")
    answer: str = Field(..., description="Candidate's answer")


class InterviewAssessment(BaseModel):
    """Assessment of a single answer"""
    relevance_score: float = Field(..., description="0-1, relevance to job")
    communication_score: float = Field(..., description="0-1, clarity and articulation")
    technical_depth: float = Field(..., description="0-1, technical knowledge depth")
    key_points: List[str] = Field(..., description="Key skills/insights demonstrated")


class InterviewSummary(BaseModel):
    """Final interview summary and assessment"""
    overall_fit: int = Field(..., description="0-100 overall fit score")
    strengths: List[str] = Field(..., description="Top candidate strengths")
    weaknesses: List[str] = Field(..., description="Areas for improvement")
    recommendation: str = Field(
        ...,
        description="Hiring recommendation: 'strong_yes', 'yes', 'maybe', 'no'"
    )
    summary: str = Field(..., description="Professional interview summary")


class InterviewConcludeResponse(BaseModel):
    """Response when interview is concluded"""
    session_id: str = Field(..., description="Interview session ID")
    interview_complete: bool = Field(default=True)
    total_turns: int = Field(..., description="Total questions asked")
    final_assessment: InterviewSummary = Field(..., description="Final assessment")
