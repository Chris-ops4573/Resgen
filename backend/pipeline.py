import base64
from typing import Dict, Any, Optional
from .tools import select_best_items
from .llm import render_latex_with_llm
from .latex_safety import sanitize_and_validate
from .pdf import compile_pdf

def run_resume_pipeline(user: Dict[str, Any], job: Dict[str, Any], options: Optional[Dict[str, Any]] = None):
    options = options or {}
    # 1) select
    picked = select_best_items(user, job, options)
    # 2) LLM renders LaTeX
    latex = render_latex_with_llm(picked, user, job)
    latex = sanitize_and_validate(latex)
    # 3) compile (optional)
    pdf_b64 = None
    if options.get("compile", True):
        try:
            pdf_bytes = compile_pdf(latex)
            pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")
        except Exception:
            pdf_b64 = None
    return {"latex": latex, "pdfBase64": pdf_b64}
