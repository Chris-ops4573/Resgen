from langgraph.graph import StateGraph, END
from interviewgen.state import InterviewState
from interviewgen.nodes import (
    start_router,
    initialize_interview,
    retrieve_context,
    generate_question,
    process_answer,
    evaluate_answer,
    decide_next_action,
    conclude_interview,
)
import logging

logger = logging.getLogger(__name__)


def create_interview_graph():
    workflow = StateGraph(InterviewState)

    # Nodes
    workflow.add_node("start", start_router)
    workflow.add_node("initialize", initialize_interview)
    workflow.add_node("retrieve_context", retrieve_context)
    workflow.add_node("generate_question", generate_question)
    workflow.add_node("process_answer", process_answer)
    workflow.add_node("evaluate_answer", evaluate_answer)
    workflow.add_node("decide_next", decide_next_action)
    workflow.add_node("conclude", conclude_interview)

    # Entry point
    workflow.set_entry_point("start")

    # START ROUTING (THIS IS THE IMPORTANT PART)
    workflow.add_conditional_edges(
        "start",
        lambda state: "has_answer" if state.get("current_answer") else "no_answer",
        {
            "has_answer": "process_answer",
            "no_answer": "initialize",
        }
    )

    # Question flow
    workflow.add_edge("initialize", "retrieve_context")
    workflow.add_edge("retrieve_context", "generate_question")

    # Answer flow
    workflow.add_edge("process_answer", "evaluate_answer")
    workflow.add_edge("evaluate_answer", "decide_next")

    # Continue / End
    workflow.add_conditional_edges(
        "decide_next",
        lambda state: state.get("last_action", "end"),
        {
            "continue": "retrieve_context",
            "end": "conclude",
        }
    )

    workflow.add_edge("conclude", END)

    return workflow.compile()

interview_graph = create_interview_graph()

def run_interview_turn(state: InterviewState, answer: str = None):
    if answer:
        state["current_answer"] = answer

    return interview_graph.invoke(state)
