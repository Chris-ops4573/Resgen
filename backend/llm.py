import os, json
from dotenv import load_dotenv
from typing import Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

load_dotenv()

ALLOWED_PACKAGES = ["geometry", "hyperref", "parskip", "enumitem"]

SYSTEM_PROMPT = f"""
You generate COMPLETE LaTeX resumes that are ATS-optimized.

Requirements:
- Output ONLY a full LaTeX document, no code fences or commentary.
- Use ONLY these packages: {", ".join(ALLOWED_PACKAGES)}.
- No \\input, \\include, \\write18, \\openout, \\read, \\filecontents, \\csname, or shell-escape.
- Escape special chars (\\, %, $, #, &, _, {{, }}, ~, ^).
- Single page, tight layout, consistent headings.
- ATS best practices: odd number of bullet pointsstrong action verbs, quantified impact, relevant keywords (no stuffing), no pronouns, <= ~25 words per bullet, max 3 bullets per item.
- Present tense for current roles; past for previous.
- Do NOT invent facts. Use only provided data.

Prefer this style:
\\documentclass[11pt]{{article}}
\\usepackage[margin=0.7in]{{geometry}}
\\usepackage{{hyperref}}
\\usepackage{{parskip}}
\\usepackage{{enumitem}}
\\pagenumbering{{gobble}}
\\setlist[itemize]{{nosep,leftmargin=*}}
"""

def _client():
    return ChatGoogleGenerativeAI(
        model=os.getenv("MODEL_NAME", "gemini-1.5-flash"),
        temperature=float(os.getenv("TEMPERATURE", "0.2")),
        convert_system_message_to_human=True,
    )

def render_latex_with_llm(picked: Dict[str, Any], user: Dict[str, Any], job: Dict[str, Any]) -> str:
    payload = {"picked": picked, "user": user, "job": job}
    msgs = [SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=json.dumps(payload, ensure_ascii=False))]
    ai = _client().invoke(msgs)
    if isinstance(ai.content, list):
        return "".join([p.get("text","") if isinstance(p, dict) else str(p) for p in ai.content])
    return str(ai.content)
