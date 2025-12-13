import re

ALLOWED_PACKAGES = {
    "geometry", "hyperref", "parskip", "enumitem", "xcolor",
}

BANNED_CMDS = [
    r"\\write18", r"\\input(?!\{.*\})", r"\\include", r"\\openout", r"\\read",
    r"\\loop", r"\\repeat", r"\\csname", r"\\filecontents", r"\\immediate"
]

def strip_code_fences(s: str) -> str:
    s = s.strip()
    s = re.sub(r"^```[^\n]*\n", "", s)
    s = re.sub(r"\n```$", "", s)
    return s.strip()

def check_banned(latex: str) -> None:
    for pat in BANNED_CMDS:
        if re.search(pat, latex, flags=re.IGNORECASE):
            raise ValueError(f"Banned LaTeX command used: pattern {pat}")

def check_packages(latex: str) -> None:
    pkgs = re.findall(r"\\usepackage(?:\[[^\]]*\])?\{([^}]+)\}", latex)
    for group in pkgs:
        for pkg in [p.strip() for p in group.split(",")]:
            if pkg and pkg not in ALLOWED_PACKAGES:
                raise ValueError(f"Package not allowed: {pkg}")

def sanitize_and_validate(latex: str) -> str:
    latex = strip_code_fences(latex)
    if "\\begin{document}" not in latex or "\\end{document}" not in latex:
        raise ValueError("Missing document environment.")
    check_banned(latex)
    check_packages(latex)
    return latex
