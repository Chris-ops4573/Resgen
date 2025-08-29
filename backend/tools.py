from typing import Dict, Any, List, Optional

def _tokenize(s: str) -> List[str]:
    return [w for w in (s or "").lower().replace("/", " ").replace(",", " ").split() if w]

def select_best_items(
    user: Dict[str, Any],
    job: Dict[str, Any],
    options: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    options = options or {}
    max_exps = int(options.get("maxExperiences", 3))
    max_projs = int(options.get("maxProjects", 2))
    max_skills = int(options.get("maxSkills", 10))

    jd_tokens = set(_tokenize(" ".join([
        str(job.get("title", "")),
        str(job.get("company", "")),
        str(job.get("description", "")),
    ])))

    def score_text(text: str, skills: List[str] = None) -> float:
        toks = set(_tokenize(text))
        overlap = len(toks.intersection(jd_tokens))
        skill_hits = len([s for s in (skills or []) if s.lower() in jd_tokens])
        return 1.5 * overlap + 2.0 * skill_hits

    exps = user.get("experiences", []) or []
    scored_exps = sorted(
        exps,
        key=lambda e: score_text(
            " ".join([str(e.get("title", "")), str(e.get("company", "")), " ".join(e.get("bullets", []))]),
            e.get("skills", []),
        ),
        reverse=True,
    )
    picked_exps = scored_exps[:max_exps]

    projs = user.get("projects", []) or []
    scored_projs = sorted(
        projs,
        key=lambda p: score_text(
            " ".join([str(p.get("name", "")), str(p.get("description", "")), " ".join(p.get("bullets", []))]),
            p.get("skills", []),
        ),
        reverse=True,
    )
    picked_projs = scored_projs[:max_projs]

    skills = user.get("skills", []) or []
    in_jd = [s for s in skills if s.lower() in jd_tokens]
    rest = [s for s in skills if s.lower() not in jd_tokens]
    picked_skills = (in_jd + rest)[:max_skills]

    return {"experiences": picked_exps, "projects": picked_projs, "skills": picked_skills}
