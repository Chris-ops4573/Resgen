import shutil, tempfile, subprocess, os

def compile_pdf(latex_source: str) -> bytes:
    tectonic = shutil.which("tectonic")
    pdflatex = shutil.which("pdflatex")
    if not tectonic and not pdflatex:
        raise RuntimeError("No TeX engine found. Install 'tectonic' or 'pdflatex' and ensure it's on PATH.")

    with tempfile.TemporaryDirectory() as td:
        tex_path = os.path.join(td, "resume.tex")
        pdf_path = os.path.join(td, "resume.pdf")
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(latex_source)

        if tectonic:
            subprocess.run([tectonic, "-X", "compile", tex_path, "--outdir", td], check=True)
        else:
            subprocess.run(["pdflatex", "-interaction=nonstopmode", tex_path], cwd=td, check=True)
            subprocess.run(["pdflatex", "-interaction=nonstopmode", tex_path], cwd=td, check=True)

        with open(pdf_path, "rb") as f:
            return f.read()
