import os, json, re, base64
from dotenv import load_dotenv
from typing import Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

load_dotenv()

ALLOWED_PACKAGES = ["geometry", "hyperref", "parskip", "enumitem"]

PARSER_MODEL = os.getenv("PARSER_MODEL_NAME", "gemini-2.5-flash")

PARSE_SYSTEM_PROMPT = """
You are a resume parser. You will ONLY output valid JSON (no markdown fences, no commentary).
Extract data into this schema (omit fields you cannot find):

{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "links": {
    "github": "", "linkedin": "", "website": "", "portfolio": "",
    "other": { "<label>": "<url>" }
  },
  "skills": ["..."],
  "experiences": [
    {
      "title": "", "company": "", "location": "",
      "startDate": "", "endDate": "",
      "skills": ["..."],
      "bullets": ["...", "..."]
    }
  ],
  "projects": [
    {
      "name": "", "link": "", "description": "",
      "skills": ["..."], "bullets": ["...", "..."]
    }
  ],
  "achievements": ["...", "..."],
  "education": [
    { "school": "", "degree": "", "graduation": "", "details": ["...", "..."] }
  ]
}

Rules:
- Output STRICT JSON only.
- Keep bullets concise; do not invent facts.
- Preserve original date strings even if imperfect.
"""

SYSTEM_PROMPT = f"""
You generate COMPLETE LaTeX resumes that are ATS-optimized and match a clean, professional, lined style
(UPPERCASE section headers with a thin rule; role/company/location inline with right-aligned dates).
Internships are merged into Work Experience (no separate section).
Keep the layout tight and clean so it usually fits on one page; if there is genuinely too much content,
allow a second page rather than cramming or shrinking text.

Requirements:
- Output ONLY a full LaTeX document, no code fences or commentary.
- Use ONLY these packages: {", ".join(ALLOWED_PACKAGES)}.
- No \\input, \\include, \\write18, \\openout, \\read, \\filecontents, \\csname, or shell-escape.
- Escape special chars (\\, %, $, #, &, _, {{, }}, ~, ^).
- Use consistent typography across all sections (same body font and size). Do NOT use \\textit, \\emph, \\itshape, or \\small in body text.
- Prefer one page with compact spacing; NEVER force it by reducing font size below 11pt or over-tightening spacing.
- ATS best practices: strong action verbs, quantified impact when provided, relevant keywords (no stuffing), no pronouns,
  ≤ ~25 words per bullet, MAX 3 bullets per item (prefer 1 or 3).
- Present tense for current roles; past tense for previous.
- Do NOT invent facts. Use only provided data. If no metric is given, use qualitative impact language without fabricating numbers.

You will receive:
- 'user'   : already PRUNED to contain at most the selected items to show.
- 'picked' : the same selected items, if you prefer that view.
- 'job'    : the target job spec.
- 'limits' : {{ maxExperiences, maxProjects, maxSkills, maxAchievements }}.

STRICTLY OBEY 'limits':
- Do not render more items than the maxima.
- If fewer items are available, render fewer (never fabricate).
- Place internships within the Work Experience section.

Use EXACTLY this preamble template and macros, then use these macros consistently in the body:

\\documentclass[11pt]{{article}}
\\usepackage[margin=0.7in]{{geometry}}
\\usepackage{{hyperref}}
\\usepackage{{parskip}}
\\usepackage{{enumitem}}
\\pagenumbering{{gobble}}
\\setlist[itemize]{{nosep,leftmargin=*}}

% --- Helpers for lined, professional look (NO extra packages required) ---
\\newcommand{{\\Name}}[1]{{{{\\LARGE\\bfseries #1}}}}
\\newcommand{{\\ContactLine}}[1]{{\\begin{{center}}\\small #1\\end{{center}}}}
\\newcommand{{\\Section}}[1]{{\\vspace{{2pt}}\\textbf{{\\MakeUppercase{{#1}}}}\\par\\vspace{{2pt}}\\hrule height 0.6pt\\vspace{{6pt}}}}
\\newcommand{{\\RoleRow}}[4]{{\\textbf{{#1}} --- #2, #3 \\hfill {{\\small #4}}\\par}}

Layout rules (tight & clean, never cramped):
1) Keep whitespace compact; avoid large vertical gaps. Do NOT add extra blank lines or excessive \\vspace.

2) SKILLS section — dynamic labels and safe fallback:
   - If 'user.skills' is empty or missing, OMIT the Skills section entirely.
   - Otherwise, use \\Section{{Skills}} (same header + rule as others) and render one or two labeled rows in the SAME body font/size (no italics/small), comma-separated, no bullets.
   - Choose labels dynamically based on the skills and job description:
       a) If many programming/CS/cloud items (Python/JavaScript/C++/Java/Go; React/Node; AWS/Docker/K8s),
          use labels: **Languages/CS** and **Frameworks/Tools**.
       b) If skills are ERP/finance/domain-heavy (SAP S/4HANA, FICO, FI-AR, CO, ECC, Oracle, Salesforce, GAAP),
          use labels: **Modules/Domains** and **Tools/Platforms**.
       c) Otherwise, default to: **Core Skills** and **Tools & Platforms**.
   - Partition 'skills' into at most two buckets using the above logic.
     Order within each row by relevance to 'job.description' first, then by importance/frequency.
   - Formatting (exact):
       \\noindent \\textbf{{<Label A>:}} skill1, skill2, skill3\\\\
       \\textbf{{<Label B>:}} skill4, skill5, skill6
     If only one bucket has content, render just the first row.
   - Respect 'limits.maxSkills': show at most that many skills across both rows.
   - Normalize names (e.g., "Node.js" not "nodejs"), deduplicate case-insensitively.
   - Do not invent new skills; use only those provided.

3) CONTENT REWRITE & POLISH (very important):
   - NEVER paste the job description text into the resume. Use it only to tailor wording and prioritize keywords.
   - Rewrite free-form text and messy bullets into crisp resume bullets with strong verbs and clear outcomes.
   - Prefer outcome-first phrasing when possible (e.g., "Reduced build times 30% by..." or, if no numbers, "Improved build times through...").
   - Fix grammar, tense, capitalization, and punctuation; remove filler/buzzwords; eliminate first-person pronouns.
   - Keep 1 or 3 bullets per item. If too many, keep the most relevant to 'job.description'.
   - If a project/experience description is a paragraph, convert it into 1 or 3 clean bullets.
   - Standardize dates as "Mon YYYY -- Mon YYYY" or "Mon YYYY -- Present" (e.g., "Feb 2023 -- Present").

4) SECTION ORDER:
   - Contact block, then optionally Skills (if present), then Education, Work Experience, Projects, Achievements.

5) Education, Work Experience, Projects, Achievements use \\Section{{...}} with the thin rule and \\RoleRow exactly once per item.

6) If the content cannot fit cleanly on one page while preserving readability and spacing, allow a second page.
   Never compress by shrinking fonts, cramming line spacing, or removing necessary structure.

Generate the final LaTeX document using only the allowed packages and the macros above. Do not add any other packages or external files.
"""

def _vision_client() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=PARSER_MODEL,
        temperature=float(os.getenv("PARSER_TEMPERATURE", "0.0")),
        convert_system_message_to_human=True,
    )

def _coerce_json(s: str) -> Dict[str, Any]:
    """
    Be defensive: if model ever wraps in text by mistake, pull the first {...} block.
    """
    s = s.strip()
    if s.startswith("```"):
        s = s.strip("` \n\r\t")
    # Grab first top-level JSON object
    match = re.search(r"\{.*\}", s, flags=re.DOTALL)
    if match:
        s = match.group(0)
    return json.loads(s)

def parse_resume_bytes(data: bytes, mime: str) -> Dict[str, Any]:
    """
    Pure LLM/Vision path. Sends the binary (PDF or image) to Gemini as media.
    """
    b64 = base64.b64encode(data).decode("utf-8")
    msgs = [
        SystemMessage(content=PARSE_SYSTEM_PROMPT),
        HumanMessage(content=[
            {"type": "text", "text": "Extract the resume into the strict JSON schema."},
            # 'media' supports PDFs and images in the Gemini LangChain connector
            {"type": "media", "mime_type": (mime or "application/octet-stream"), "data": b64},
        ]),
    ]
    ai = _vision_client().invoke(msgs)

    # LangChain can return list parts or a string; normalize to text
    if isinstance(ai.content, list):
        text = "".join([p.get("text", "") if isinstance(p, dict) else str(p) for p in ai.content])
    else:
        text = str(ai.content or "")

    return _coerce_json(text or "{}")

def _client():
    return ChatGoogleGenerativeAI(
        model=os.getenv("MODEL_NAME", "gemini-2.5-flash"),
        temperature=float(os.getenv("TEMPERATURE", "0.2")),
        convert_system_message_to_human=True,
    )

def render_latex_with_llm(
    picked: Dict[str, Any],
    user: Dict[str, Any],
    job: Dict[str, Any],
    options: Dict[str, Any],
) -> str:
    limits = {
        "maxExperiences": int(options.get("maxExperiences", 3)),
        "maxProjects": int(options.get("maxProjects", 2)),
        "maxSkills": int(options.get("maxSkills", 10)),
        "maxAchievements": int(options.get("maxAchievements", 3)),
    }
    payload = {"picked": picked, "user": user, "job": job, "limits": limits}
    msgs = [SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=json.dumps(payload, ensure_ascii=False))]
    ai = _client().invoke(msgs)
    if isinstance(ai.content, list):
        return "".join([p.get("text", "") if isinstance(p, dict) else str(p) for p in ai.content])
    return str(ai.content)