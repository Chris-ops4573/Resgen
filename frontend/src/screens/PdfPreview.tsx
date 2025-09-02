import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* Local UI atoms (same look & feel as ResumeBuilder) */
function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section
      className={[
        "group relative rounded-2xl p-6 md:p-8",
        "bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60",
        "border border-zinc-200/70 ring-1 ring-black/5",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.6)_inset,0_10px_30px_-10px_rgba(0,0,0,0.15)]",
        "transition hover:shadow-[0_1px_0_0_rgba(255,255,255,0.6)_inset,0_24px_50px_-20px_rgba(0,0,0,0.25)]",
        "min-w-0", // allow child content to shrink
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent [background:radial-gradient(1200px_600px_at_0%_-20%,rgba(14,165,233,0.08),transparent_40%),radial-gradient(1200px_600px_at_100%_120%,rgba(99,102,241,0.08),transparent_40%)]" />
      <div className="relative">
        <div className="mb-5">
          <h2 className="text-[22px] md:text-2xl font-semibold tracking-tight text-zinc-900">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900">
              {title}
            </span>
          </h2>
          {desc ? <p className="text-sm text-zinc-600 mt-1">{desc}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}
function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { children, ...rest } = props;
  return (
    <button
      {...rest}
      className={[
        "relative inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium",
        "text-white",
        "bg-gradient-to-b from-zinc-900 to-black",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_20px_-10px_rgba(0,0,0,0.5)]",
        "transition active:translate-y-[1px] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_6px_16px_-10px_rgba(0,0,0,0.6)]",
        "disabled:opacity-50",
        "before:absolute before:inset-0 before:rounded-2xl before:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.25),transparent)] before:pointer-events-none",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { children, ...rest } = props;
  return (
    <button
      {...rest}
      className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-900 shadow-sm transition hover:shadow active:translate-y-[1px]"
    >
      {children}
    </button>
  );
}

export default function PdfPreview() {
  const accent = "#0ea5e9";
  const navigate = useNavigate();

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [latex, setLatex] = useState<string | null>(null);

  // Read from sessionStorage (set by ResumeBuilder on success)
  useEffect(() => {
    const b64 = sessionStorage.getItem("resume_pdf_b64");
    const lx = sessionStorage.getItem("resume_latex") || null;
    setLatex(lx);

    if (!b64) return; // allow page to show fallback if PDF missing

    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, []);

  function downloadPdf() {
    const b64 = sessionStorage.getItem("resume_pdf_b64");
    if (!b64) return;
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadTex() {
    if (!latex) return;
    const blob = new Blob([latex], { type: "text/x-tex;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.tex";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-dvh text-zinc-900 antialiased" style={{ ["--accent" as any]: accent }}>
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-50 to-white" />
        <div className="absolute -top-24 -left-24 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(closest-side,rgba(14,165,233,0.12),transparent)] blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.12),transparent)] blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-6xl px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-2xl bg-gradient-to-b from-zinc-700 to-zinc-900 shadow ring-1 ring-black/10" />
            <span className="text-sm font-semibold tracking-tight">Resume Preview</span>
          </div>
          <div className="hidden md:block text-xs text-zinc-500">Resgen - AI Resume Builder</div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-10 grid gap-6 md:grid-cols-[minmax(0,1fr),22rem]">
        <Section
          title="Your resume"
          desc={pdfUrl ? "Rendered from your latest submission." : "No compiled PDF was returned. (Showing LaTeX if available.)"}
        >
          {pdfUrl ? (
            <div className="rounded-xl overflow-hidden border border-zinc-200 shadow-sm bg-white">
              <iframe
                title="PDF"
                src={pdfUrl}
                className="w-full"
                style={{ height: "78vh" }}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white/70 p-4 text-sm text-zinc-700">
              No PDF found. Try generating again from the builder. If your TeX engine isn’t available server-side, you can still download the LaTeX and compile locally.
            </div>
          )}
        </Section>

        <aside className="grid gap-6 md:sticky md:top-[76px] h-max min-w-0">
          <Section title="Actions" desc="Download or go back to edit.">
            <div className="flex flex-wrap gap-3">
              <PrimaryButton type="button" onClick={downloadPdf} disabled={!pdfUrl}>
                Download PDF
              </PrimaryButton>
              <SecondaryButton type="button" onClick={() => navigate("/")}>
                Back to Builder
              </SecondaryButton>
            </div>

            {latex ? (
              <details className="mt-5">
                <summary className="cursor-pointer text-sm text-zinc-600">Show LaTeX (debug)</summary>
                <pre className="mt-2 max-h-64 max-w-full overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-zinc-950/90 p-3 text-xs text-zinc-50">
                  {latex}
                </pre>
                <div className="mt-3">
                  <SecondaryButton type="button" onClick={downloadTex}>Download .tex</SecondaryButton>
                </div>
              </details>
            ) : null}
          </Section>
        </aside>
      </main>
    </div>
  );
}
