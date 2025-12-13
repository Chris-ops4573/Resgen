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

PACKAGES = ", ".join(ALLOWED_PACKAGES)

SYSTEM_PROMPT_TEMPLATE = r"""
You generate COMPLETE LaTeX resumes that are ATS-optimized and match a clean, professional, lined style
(UPPERCASE section headers with a thin rule; role/company/location inline with right-aligned dates).
Internships are merged into Work Experience (no separate section).
TARGET one page, but allow a small overflow (5-10 lines on page 2) if it means preserving quality and content relevance.

Requirements:
- Output ONLY a full LaTeX document, no code fences or commentary.
- Use ONLY these packages: {PACKAGES}.
- No \input, \include, \write18, \openout, \read, \filecontents, \csname, or shell-escape.
- Escape special chars (\, %, $, #, &, _, {, }, ~, ^).
- Use consistent typography across all sections (same body font and size). Do NOT use \textit, \emph, \itshape, or \small in body text.
- ATS best practices: strong action verbs, quantified impact when provided, relevant keywords (no stuffing), no pronouns,
  ≤ ~20 words per bullet, MAX 2-3 bullets per item (aim for 2, use 3 only for highly relevant roles).
- Present tense for current roles; past tense for previous.
- Do NOT invent facts. Use only provided data.
- Separator hygiene: NEVER output dangling punctuation or separators.

You will receive:
- 'user'   : already PRUNED to contain at most the selected items to show.
- 'picked' : the same selected items, if you prefer that view.
- 'job'    : the target job spec.
- 'limits' : { maxExperiences, maxProjects, maxSkills, maxAchievements }.
- 'options': may include { tightResume: boolean }.

STRICTLY OBEY 'limits':
- Do not render more items than the maxima.
- If fewer items are available, render fewer (never fabricate).
- Place internships within the Work Experience section.

Use EXACTLY this preamble template and macros:

\documentclass[11pt]{article}
\usepackage[margin=0.6in]{geometry}
\usepackage[hidelinks]{hyperref}
\usepackage{parskip}
\usepackage{enumitem}
\usepackage{xcolor}
\pagenumbering{gobble}
\raggedbottom
\setlist[itemize]{nosep,leftmargin=*,itemsep=0.5pt,topsep=0.5pt,parsep=0pt,partopsep=0pt}
\setlength{\parskip}{0pt}

% Define colors for subtle visual hierarchy
\definecolor{darkgray}{gray}{0.25}
\definecolor{datecolor}{gray}{0.2}

% --- Helpers for lined, professional look ---
\newcommand{\Name}[1]{{\LARGE\bfseries #1}}
\newcommand{\ContactLine}[1]{\begin{center}\footnotesize\vspace{1pt}#1\vspace{3pt}\end{center}}
\newcommand{\Section}[1]{\vspace{3pt}\textbf{\MakeUppercase{#1}}\par\vspace{1.5pt}{\color{darkgray}\hrule height 0.5pt}\vspace{4pt}}
\newcommand{\RoleRow}[4]{\textbf{#1} \textbf{---} #2, #3 \hfill {\small\color{datecolor}#4}\par\vspace{0.5pt}}

Layout rules (fill the page intelligently):
1) FILL THE PAGE: Do NOT leave large white space gaps. Content should occupy 75-90% of the page comfortably.
   - Use full 2-3 bullets per item when content warrants it (not just 1-2).
   - Keep descriptions crisp but complete.
   - Only compress if truly necessary.

2) SMART PAGE MANAGEMENT:
   - If content fits on one page with good breathing room (80%+ filled), keep it on one page.
   - If you're at ~85-90% capacity and cutting would remove valuable information, allow 5-10 lines on page 2.
   - Priority order for cutting (if truly necessary): Achievements section → lowest-priority projects → reduce bullets on older/weaker roles.
   - NEVER use extreme spacing compression or font size reduction as a workaround.
   - OMIT Achievements section ONLY if space is genuinely critical.

3) SKILLS section — dynamic labels and safe fallback:
   - If 'user.skills' is empty or missing, OMIT the Skills section entirely.
   - Otherwise, use \Section{Skills} and render one or two labeled rows in the SAME body font/size (no italics/small), comma-separated, no bullets.
   - Choose labels dynamically:
       a) If many programming/CS/cloud items (Python/JavaScript/C++/Java/Go; React/Node; AWS/Docker/K8s),
          use labels: **Languages & CS** and **Frameworks & Tools**.
       b) If skills are ERP/finance/domain-heavy (SAP S/4HANA, FICO, FI-AR, CO, ECC, Oracle, Salesforce, GAAP),
          use labels: **Modules & Domains** and **Tools & Platforms**.
       c) Otherwise, default to: **Core Skills** and **Tools**.
   - Partition skills into at most two buckets. Order by relevance to 'job.description' first.
   - Formatting (exact):
       \noindent \textbf{<Label A>:} skill1, skill2, skill3\\
       \textbf{<Label B>:} skill4, skill5, skill6
     If only one bucket has content, render just that one.
   - Respect 'limits.maxSkills': show at most that many skills total.
   - Normalize names (e.g., "Node.js" not "nodejs"), deduplicate case-insensitively.

4) CONTENT REWRITE & POLISH:
   - NEVER paste job description text into the resume. Use it only to tailor wording and prioritize keywords.
   - Rewrite free-form text into crisp bullets: strong verbs, clear outcomes, quantified when possible.
   - Fix grammar, tense, capitalization, punctuation; remove filler/buzzwords; eliminate pronouns.
   - BULLET DISCIPLINE: Aim for 2-3 bullets per item to balance conciseness with coverage. Use 3 bullets for highly relevant roles/projects. Only reduce to 1 bullet if absolutely necessary. Preserve important accomplishments.
   - If a description is a paragraph, distill it to 2-3 clean bullets—keep what's relevant to 'job.description'.
   - Standardize dates as "Mon YYYY -- Mon YYYY" or "Mon YYYY -- Present" (e.g., "Feb 2023 -- Present").

5) SECTION ORDER:
   - Contact block, then optionally Skills (if present), then Education, Work Experience, Projects, Achievements.

6) Formatting by section:
   - Education & Work Experience: Use \RoleRow{Title}{Company/Org}{Location}{Dates}.
   - Projects (NO dangling separators):
       * Do NOT use \RoleRow unless you truly have Title, Org, Location, and Dates.
       * Print the header like this, only adding parts that exist:
         \textbf{<Project Name>}%
         [ \textemdash{} <Short Tagline>]%
         [ \hfill \href{<URL>}{<Display>}]
       * Include the em-dash only if a non-empty tagline exists.
       * Include the link block only if a URL exists.
       * Never leave a bare em-dash, comma, or colon with nothing after it.
       * Follow with 2-3 concise bullets.

Generate the final LaTeX document using only the allowed packages and the macros above. Do not add any other packages or external files.
"""

# Finalize the prompt (no f-string hazards)
SYSTEM_PROMPT = SYSTEM_PROMPT_TEMPLATE.replace("{PACKAGES}", PACKAGES)

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
        temperature=float(os.getenv("TEMPERATURE", "0.0")),
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
    payload = {"picked": picked, "user": user, "job": job, "limits": limits, "options": { "tightResume": bool(options.get("tightResume", False)) }}
    msgs = [SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=json.dumps(payload, ensure_ascii=False))]
    ai = _client().invoke(msgs)
    if isinstance(ai.content, list):
        return "".join([p.get("text", "") if isinstance(p, dict) else str(p) for p in ai.content])
    return str(ai.content)