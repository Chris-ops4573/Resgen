# pdf.py
import os, shutil, subprocess, tempfile

# Resolve tectonic binary in a Windows-safe way
TECTONIC_BIN = (
    os.getenv("TECTONIC_BIN")
    or shutil.which("tectonic")
    or shutil.which("tectonic.exe")
)

if not TECTONIC_BIN:
    raise RuntimeError(
        "Tectonic binary not found. Install it and put it on PATH, "
        "or set TECTONIC_BIN to the full path (e.g., C:\\Users\\chris\\tectonic.exe)."
    )

def compile_pdf(latex: str) -> bytes:
    with tempfile.TemporaryDirectory() as tmp:
        tex_path = os.path.join(tmp, "resume.tex")
        pdf_path = os.path.join(tmp, "resume.pdf")
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(latex)

        # Keep flags minimal and broadly compatible
        cmd = [TECTONIC_BIN, "-o", tmp, tex_path]
        proc = subprocess.run(
            cmd, cwd=tmp, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
        )
        if proc.returncode != 0 or not os.path.exists(pdf_path):
            raise RuntimeError(f"Tectonic failed.\n\nCommand: {' '.join(cmd)}\n\nOutput:\n{proc.stdout}")

        with open(pdf_path, "rb") as f:
            return f.read()
