# main.py
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from model.models import GenerateRequest, GenerateResponse, ParseResponse, UserProfile
from resgen.pipeline import run_resume_pipeline
from resgen.llm import parse_resume_bytes
from typing import Dict, Optional
import logging
import os
from dotenv import load_dotenv
import traceback
import tempfile
import subprocess
from openai import OpenAI

client = OpenAI()

load_dotenv()

from model.interview import (
    StartInterviewRequest,
    InterviewQuestionResponse,
    SubmitAnswerRequest,
    InterviewConcludeResponse,
)
from interviewgen.graph import run_interview_turn
from interviewgen.state import InterviewState
from interviewgen.memory import InterviewMemory

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Resume Pipeline Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

interview_sessions: Dict[str, InterviewState] = {}
memory = InterviewMemory(
    chroma_host=os.getenv("CHROMA_HOST", "localhost"),
    chroma_port=int(os.getenv("CHROMA_PORT", 8001))
)

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    try:
        out = run_resume_pipeline(
            req.user.model_dump(),
            req.job.model_dump(),
            (req.options or {}).model_dump() if req.options else {}
        )
        return GenerateResponse(**out)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# NEW: LLM/Vision-only parser endpoint
@app.post("/parse", response_model=ParseResponse)
async def parse_resume(file: UploadFile = File(...)):
    try:
        data = await file.read()
        mime = file.content_type or "application/octet-stream"
        parsed_dict = parse_resume_bytes(data, mime)
        user = UserProfile(**parsed_dict)  # validate/shape to your schema
        return ParseResponse(user=user)
    except Exception as e:
        print(("Parse failed: %s\n%s", e, traceback.format_exc()))
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/interview/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    try:
        # Save uploaded webm
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as in_f:
            in_f.write(await audio.read())
            in_path = in_f.name

        # Convert to WAV (PCM)
        out_path = in_path.replace(".webm", ".wav")
        subprocess.run(
            ["ffmpeg", "-y", "-i", in_path, "-ac", "1", "-ar", "16000", out_path],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        # Send WAV to OpenAI
        with open(out_path, "rb") as f:
            transcript = client.audio.transcriptions.create(
                file=f,
                model="gpt-4o-transcribe"
            )

        return {"transcript": transcript.text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        for p in [locals().get("in_path"), locals().get("out_path")]:
            if p and os.path.exists(p):
                os.remove(p)

@app.post("/interview/start", response_model=InterviewQuestionResponse)
async def start_interview(request: StartInterviewRequest):
    """Start a new interview session."""
    try:
        state: InterviewState = {
            "jd": request.job_description,
            "resume": request.resume,
            "candidate_name": request.candidate_name,
            "target_role": request.target_role,
            "turn": 0,
            "max_turns": {
                "shallow": 5,
                "medium": 8,
                "deep": 12
            }.get(request.interview_depth, 8),
            "questions_asked": [],
            "topics_covered": {},
            "interview_complete": False,
            "current_question": None,
            "current_answer": None,
            "current_assessment": None,
            "retrieved_context": [],
            "interview_depth": request.interview_depth,
            "interview_style": request.interview_style,
            "final_assessment": None,
        }
        
        state = run_interview_turn(state, answer=None)
        
        interview_sessions[state["session_id"]] = state
        
        logger.info(f"Started interview session {state['session_id']}")
        
        return InterviewQuestionResponse(
            session_id=state["session_id"],
            turn=state["turn"],
            question=state["current_question"],
            is_final=False
        )
    
    except Exception as e:
        logger.error(f"Error starting interview: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start interview: {str(e)}")


@app.post("/interview/submit_answer")
async def submit_answer(request: SubmitAnswerRequest):
    """Submit an answer to the current interview question."""
    try:
        if request.session_id not in interview_sessions:
            raise HTTPException(status_code=404, detail="Interview session not found")
        
        state = interview_sessions[request.session_id]
        
        state = run_interview_turn(state, answer=request.answer)
        
        interview_sessions[request.session_id] = state
        
        if state["interview_complete"]:
            logger.info(f"Interview {request.session_id} completed")
            
            return InterviewConcludeResponse(
                session_id=request.session_id,
                is_final=(state["turn"] >= state["max_turns"]),
                interview_complete=True,
                total_turns=state["turn"],
                final_assessment=state["final_assessment"],
            )
        else:
            logger.info(f"Continuing interview {request.session_id} at turn {state['turn']}")
            
            return InterviewQuestionResponse(
                session_id=request.session_id,
                turn=state["turn"],
                question=state["current_question"],
                is_final=(state["turn"] >= state["max_turns"])
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing answer for session {request.session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing answer: {str(e)}")


@app.get("/interview/status/{session_id}")
async def get_interview_status(session_id: str):
    """Get current status of an interview session."""
    try:
        if session_id not in interview_sessions:
            raise HTTPException(status_code=404, detail="Interview session not found")
        
        state = interview_sessions[session_id]
        
        return {
            "session_id": session_id,
            "turn": state["turn"],
            "max_turns": state["max_turns"],
            "interview_complete": state["interview_complete"],
            "questions_asked": state["questions_asked"],
            "topics_covered": state["topics_covered"],
            "current_question": state["current_question"],
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching status: {e}")
        raise HTTPException(status_code=500, detail="Error fetching interview status")


@app.delete("/interview/session/{session_id}")
async def delete_session(session_id: str):
    """Delete an interview session and clear its vector embeddings from Chroma."""
    try:
        if session_id not in interview_sessions:
            raise HTTPException(status_code=404, detail="Interview session not found")
        
        memory.clear_session(session_id)
        del interview_sessions[session_id]
        
        logger.info(f"Deleted interview session {session_id}")
        
        return {"message": f"Session {session_id} deleted successfully"}
    
    except Exception as e:
        logger.error(f"Error deleting session: {e}")
        raise HTTPException(status_code=500, detail="Error deleting session")

@app.on_event("startup")
async def preload_chroma():
    from interviewgen.memory import InterviewMemory
    mem = InterviewMemory()
    # Force a small dummy collection so embedding model loads
    col = mem.get_or_create_collection("preload_test")
    col.add(ids=["x"], documents=["test"])
