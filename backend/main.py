# main.py
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from models import GenerateRequest, GenerateResponse, ParseResponse, UserProfile
from pipeline import run_resume_pipeline
from llm import parse_resume_bytes

app = FastAPI(title="Resume Pipeline Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/", response_model=GenerateResponse)
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

# NEW: LLM/Vision-only parser endpoint
@app.post("/parse", response_model=ParseResponse)
async def parse_resume(file: UploadFile = File(...)):
    try:
        data = await file.read()
        mime = file.content_type or "application/octet-stream"
        parsed_dict = parse_resume_bytes(data, mime)
        user = UserProfile(**parsed_dict)  # validate/shape to your schema
        return ParseResponse(user=user)
    except Exception as e:
        print(("Parse failed: %s\n%s", e, traceback.format_exc()))
        raise HTTPException(status_code=400, detail=str(e))
