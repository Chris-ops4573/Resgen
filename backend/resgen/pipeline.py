import base64
from typing import Dict, Any, Optional
from tools import select_best_items
from resgen.llm import render_latex_with_llm
from resgen.latex_safety import sanitize_and_validate
from resgen.pdf import compile_pdf

def run_resume_pipeline(user: Dict[str, Any], job: Dict[str, Any], options: Optional[Dict[str, Any]] = None):
    options = options or {}

    # Merge internships into experiences so the LLM treats all as Work Experience.
    merged_user = {
        **user,
        "experiences": (user.get("experiences") or []) + (user.get("internships") or []),
    }

    # 1) Pick top items per options (maxExperiences, maxProjects, maxSkills)
    picked = select_best_items(merged_user, job, options)
    # 2) HARD-CAP: prune the user payload so the LLM cannot see more than allowed
    pruned_user = {
        **user,
        "experiences": picked.get("experiences", []),
        "projects": picked.get("projects", []),
        "skills": picked.get("skills", []),
        # Ensure internships don't form a separate section:
        "internships": [],
    }

    # 3) LLM renders LaTeX using only pruned lists and explicit limits
    latex = render_latex_with_llm(picked, pruned_user, job, options)
    latex = sanitize_and_validate(latex)

    # 4) Compile (optional)
    pdf_b64 = None
    if options.get("compile", True):
        try:
            pdf_bytes = compile_pdf(latex)
            pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")
        except Exception:
            pdf_b64 = None

    return {"latex": latex, "pdfBase64": pdf_b64}
