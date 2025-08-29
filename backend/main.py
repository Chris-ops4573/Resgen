from fastapi import FastAPI, HTTPException
from .models import GenerateRequest, GenerateResponse
from .pipeline import run_resume_pipeline

app = FastAPI(title="Resume Pipeline Backend", version="1.0.0")

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/v1/resume/generate", response_model=GenerateResponse)
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
