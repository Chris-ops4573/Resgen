from langchain_core.prompts import PromptTemplate
import json
import logging
from datetime import datetime
import uuid
import os
from dotenv import load_dotenv

from interviewgen.state import InterviewState
from interviewgen.memory import InterviewMemory

load_dotenv()

logger = logging.getLogger(__name__)

from langchain_openai import ChatOpenAI

# LangChain's ChatOpenAI will read OPENAI_API_KEY from the environment by default.
# Model choice: change to your desired OpenAI model (e.g., "gpt-4o-mini", "gpt-4o", "gpt-4").
llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.7
)
memory = InterviewMemory()

def start_router(state: InterviewState) -> InterviewState:
    """
    Router start node.
    Must return state (dict). No routing logic here.
    """
    return state

def initialize_interview(state: InterviewState) -> InterviewState:
    """NODE 1: Initialize interview session and set up memory."""
    session_id = str(uuid.uuid4())[:8]
    
    state.update({
        "session_id": session_id,
        "created_at": datetime.utcnow().isoformat(),
        "turn": 0,
        "max_turns": 8,
        "questions_asked": [],
        "topics_covered": {},
        "interview_complete": False,
        "current_question": None,
        "current_answer": None,
        "current_assessment": None,
    })
    
    memory.get_or_create_collection(session_id)
    
    extract_jd_areas_prompt = PromptTemplate(
        template="""Extract 6-8 key skill/knowledge areas required for this job from the JD.
Format as JSON list of strings.

JD:
{jd}

Return only valid JSON, no markdown:""",
        input_variables=["jd"]
    )
    
    chain = extract_jd_areas_prompt | llm
    response = chain.invoke({"jd": state["jd"]})
    
    try:
        jd_areas = json.loads(response.content)
        state["topics_covered"] = {area: False for area in jd_areas}
    except json.JSONDecodeError:
        state["topics_covered"] = {
            "Technical Skills": False,
            "Problem Solving": False,
            "Communication": False,
            "Teamwork": False,
            "Experience": False,
        }
    
    logger.info(f"Initialized interview {session_id} with topics: {state['topics_covered'].keys()}")
    print("initialized interview")
    print(state)
    return state


def retrieve_context(state: InterviewState) -> InterviewState:
    """NODE 2: Retrieve relevant past answers from Chroma using semantic search."""
    if state["turn"] == 0:
        state["retrieved_context"] = []
        return state
    
    uncovered_topics = [t for t, covered in state["topics_covered"].items() if not covered]
    
    if uncovered_topics:
        query = f"Experience and skills related to: {', '.join(uncovered_topics[:3])}"
    else:
        query = "In-depth technical knowledge and problem-solving approach"
    
    results = memory.retrieve_context(
        session_id=state["session_id"],
        query=query,
        n_results=5
    )
    
    state["retrieved_context"] = [
        {
            "text": r["text"],
            "metadata": r["metadata"],
            "similarity_score": r["similarity_score"],
            "turn": r["metadata"].get("turn", 0),
        }
        for r in results
    ]
    
    logger.info(f"Retrieved {len(state['retrieved_context'])} context chunks for turn {state['turn']}")
    print("retrieved context")
    return state


def generate_question(state: InterviewState) -> InterviewState:
    """NODE 3: Generate next interview question using LLM."""
    context_str = ""
    if state["retrieved_context"]:
        context_str = "## Previous Answers for Context:\n"
        for ctx in state["retrieved_context"][:3]:
            context_str += f"- {ctx['text'][:200]}...\n"
    
    uncovered_topics = [t for t, covered in state["topics_covered"].items() if not covered]
    
    generate_prompt = PromptTemplate(
    template="""You are a senior technical interviewer conducting a high-bar interview.

    If this is the FIRST question of the interview (turn 1):
    - Start with a short, neutral, professional greeting (1 sentence).
    - Do NOT include any reaction, since there is no prior answer.
    - Then ask ONE interview question.

    If this is NOT the first question (turn > 1):
    - Start with a short, natural interviewer reaction to the previous answer (1 sentence).
    - Then ask ONE interview question.

    Guidelines for the reaction:
    - If the answer shows strong clarity, depth, and relevance, respond with a positive but professional reaction (e.g., acknowledging solid understanding or good reasoning).
    - If the answer is acceptable but has gaps or lacks depth, respond with a neutral or mildly curious reaction that signals partial understanding.
    - If the answer is weak, vague, or lacks technical depth, respond with a skeptical or concerned reaction that signals doubt or hesitation.

    The reaction should sound like a real interviewer thinking out loud (e.g., brief approval, uncertainty, or concern), but must remain concise.

    Then, on the next line, ask ONE clear interview question.

    JOB DESCRIPTION:
    {jd}

      :
    {resume}

    PREVIOUS CONTEXT:
    {context}

    AREAS TO EXPLORE:
    {uncovered_topics}

    TURN NUMBER: {turn}/{max_turns}

    Requirements:
    - Reaction must be a single short sentence 
    - Question must be on a new line after the reaction
    - Ask ONLY ONE question
    - Focus on uncovered or weak areas
    - Increase difficulty if candidate is performing well
    - Probe deeper if answers seem shallow
    - Avoid yes/no questions

    Format EXACTLY as:
    <Reaction>
    <Question>

    Respond with nothing else.""",
        input_variables=["jd", "resume", "context", "uncovered_topics", "turn", "max_turns"]
    )
    
    chain = generate_prompt | llm
    response = chain.invoke({
        "jd": state["jd"][:1000],  # Truncate for token efficiency
        "resume": state["resume"],
        "context": context_str,
        "uncovered_topics": ", ".join(uncovered_topics) if uncovered_topics else "General depth",
        "turn": state["turn"],
        "max_turns": state["max_turns"],
    })
    
    question = response.content.strip()
    state["current_question"] = question
    state["questions_asked"].append(question)
    
    logger.info(f"Generated question {state['turn']}: {question[:50]}...")
    print("generated question")
    return state


def process_answer(state: InterviewState) -> InterviewState:
    """NODE 4: Store answer in vector DB and extract key topics."""
    if not state["current_answer"]:
        return state
    
    state["turn"] = int(state.get("turn", 0)) + 1
    
    extract_topics_prompt = PromptTemplate(
        template="""Extract 2-4 key topics/skills demonstrated in this answer.
Format as comma-separated list.

Q: {question}
A: {answer}

Topics (comma-separated, no markdown):""",
        input_variables=["question", "answer"]
    )
    
    chain = extract_topics_prompt | llm
    response = chain.invoke({
        "question": state["current_question"],
        "answer": state["current_answer"]
    })
    
    topics = [t.strip() for t in response.content.split(",")]
    
    memory.store_answer(
        session_id=state["session_id"],
        turn=state["turn"],
        question=state["current_question"],
        answer=state["current_answer"],
        topics=topics,
        assessment=state.get("current_assessment")
    )
    
    logger.info(f"Stored answer with topics: {topics}")
    print("processed answer")
    return state


def evaluate_answer(state: InterviewState) -> InterviewState:
    """NODE 5: Evaluate the quality and relevance of the candidate's answer."""
    if not state["current_answer"]:
        return state
    
    context_str = ""
    if state["retrieved_context"]:
        context_str = "\n## Related Previous Answers:\n"
        for ctx in state["retrieved_context"][:2]:
            context_str += f"- {ctx['text'][:150]}...\n"
    
    evaluate_prompt = PromptTemplate(
    template="""Evaluate this interview answer rigorously.

    JOB REQUIREMENTS:
    {jd}

    JOB TOPICS:
    {job_topics}

    QUESTION ASKED:
    {question}

    ANSWER PROVIDED:
    {answer}

    CONTEXT:
    {context}

    Tasks:
    1. Score the answer.
    2. Identify which JOB TOPICS were meaningfully covered in the answer.

    Scoring (0–1):
    - relevance_score
    - communication_score
    - technical_depth

    Also include:
    - follow_up_needed: true/false
    - key_points: 2–3 concise insights
    - topics_covered: list of job topics that were sufficiently addressed

    Rules:
    - Only mark a topic as covered if the answer shows real substance.
    - Do NOT infer or assume coverage.
    - Be conservative.

    Respond as ONLY valid JSON:
    {{
    "relevance_score": <float>,
    "communication_score": <float>,
    "technical_depth": <float>,
    "follow_up_needed": <bool>,
    "key_points": ["point1", "point2"],
    "topics_covered": ["topic1", "topic2"]
    }}""",
        input_variables=["jd", "job_topics", "question", "answer", "context"]
    )
    
    chain = evaluate_prompt | llm
    response = chain.invoke({
        "jd": state["jd"][:1000],
        "job_topics": list(state["topics_covered"].keys()),
        "question": state["current_question"],
        "answer": state["current_answer"],
        "context": context_str,
    })
    
    try:
        assessment = json.loads(response.content)
        state["current_assessment"] = assessment

        for topic in assessment.get("topics_covered", []):
            if topic in state["topics_covered"]:
                state["topics_covered"][topic] = True

    except json.JSONDecodeError:
        logger.warning("Failed to parse evaluation response")
        state["current_assessment"] = {
            "relevance_score": 0.5,
            "communication_score": 0.5,
            "technical_depth": 0.5,
            "follow_up_needed": False,
            "key_points": [],
            "topics_covered": []
        }
    
    logger.info(f"Evaluated answer - Relevance: {state['current_assessment'].get('relevance_score', 0)}")
    print("evaluated answer")
    return state


def decide_next_action(state: InterviewState) -> InterviewState:
    """Increment turn and decide whether to continue or end. Return the mutated state."""

    MIN_TURNS = 6

    can_continue = state["turn"] < state["max_turns"]
    enough_turns = state["turn"] >= MIN_TURNS
    topics_remain = any(not covered for covered in state["topics_covered"].values())

    if can_continue and (topics_remain or not enough_turns):
        state["last_action"] = "continue"
    else:
        state["last_action"] = "end"

    action = state["last_action"]
    prev_turn = int(state.get("turn", 0)) - 1

    logger.info("decide_next_action: turn %d -> %d, action=%s", prev_turn, state["turn"], action)
    print("decided next action:", action)
    return state



def conclude_interview(state: InterviewState) -> InterviewState:
    """NODE 7: Generate final interview summary and assessment."""
    history = memory.get_conversation_history(state["session_id"])
    
    history_str = "\n".join([
        f"Turn {h['metadata'].get('turn', 'N/A')}: {h['text'][:300]}..."
        for h in history[-5:]  # Last 5 exchanges
    ])
    
    conclude_prompt = PromptTemplate(
        template="""You are a senior hiring panelist at a high-stakes, user-facing tech company.
    Hiring the wrong candidate can cause serious reliability, scalability, and user experience issues.

    Be critical, evidence-driven, and conservative in your assessment.
    Do NOT be lenient. Assume strong competition.

    CANDIDATE RESUME:
    {resume}

    INTERVIEW TRANSCRIPT (excerpt):
    {history}

    Evaluate the candidate rigorously and produce a JSON summary with:

    - overall_fit: integer from 0 o100
    • 90+ = exceptional, hire without hesitation
    • 75–89 = strong hire
    • 60–74 = borderline, concerns exist
    • <60 = do not hire

    - strengths: 2–4 concrete, evidence-backed strengths (no generic praise)
    - weaknesses: 2–4 specific gaps, risks, or missing depth
    - hiring_risks: 1–3 risks that could negatively impact production systems or team velocity
    - recommendation: one of ["strong_yes", "yes", "maybe", "no"]
    - summary: 2–3 sentences explaining *why* this decision was made

    Rules:
    - Base conclusions strictly on demonstrated answers, not assumptions
    - Penalize shallow answers, buzzwords, or lack of technical depth
    - Favor clarity, ownership, and real-world impact

    Respond with ONLY valid JSON. No markdown, no commentary.""",
        input_variables=["resume", "history"]
    )

    
    chain = conclude_prompt | llm
    response = chain.invoke({
        "resume": state["resume"],
        "history": history_str,
    })
    
    try:
        assessment = json.loads(response.content)
    except json.JSONDecodeError:
        assessment = {
            "overall_fit": 65,
            "strengths": ["Clear communication", "Technical knowledge"],
            "weaknesses": ["Limited experience"],
            "recommendation": "maybe",
            "summary": "Solid candidate with good potential."
        }
    
    state["final_assessment"] = assessment
    state["interview_complete"] = True
    
    logger.info(f"Interview concluded with fit score: {assessment.get('overall_fit', 'N/A')}")
    return state