import React, { useRef, useState } from "react";

type ParsedUser = {
  name?: string; email?: string; phone?: string; location?: string;
  links?: Record<string, string> | { github?: string; linkedin?: string; website?: string; portfolio?: string; other?: Record<string,string> };
  skills?: string[];
  experiences?: Array<{ title?: string; company?: string; location?: string; startDate?: string; endDate?: string; skills?: string[]; bullets?: string[] }>;
  projects?: Array<{ name?: string; link?: string; description?: string; skills?: string[]; bullets?: string[] }>;
  achievements?: string[];
  education?: Array<{ school: string; degree?: string; graduation?: string; details?: string[] }>;
};

export default function ResumeParser({
  apiBase,
  onParsed,
}: {
  apiBase: string;
  onParsed: (user: ParsedUser) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>("PDF or image (PNG/JPG)");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || !files[0]) return;
    const file = files[0];
    setBusy(true); setError(null); setHint(`Uploading ${file.name}…`);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${apiBase}/parse`, { method: "POST", body: form });
      if (!res.ok) throw new Error(`Parse failed: ${res.status}`);
      const data = await res.json();
      if (!data?.user) throw new Error("No 'user' in parse response.");
      onParsed(data.user as ParsedUser);
      setHint(`Parsed: ${file.name}`);
    } catch (e: any) {
      setError(e?.message || "Failed to parse.");
      setHint("PDF or image (PNG/JPG)");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div
      className="rounded-2xl border border-zinc-200/80 bg-white/70 p-4 shadow-sm hover:shadow transition"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium text-zinc-800">Autofill from existing resume</div>
          <div className="text-xs text-zinc-500 truncate">{hint}</div>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-900 shadow-sm hover:shadow active:translate-y-[1px]"
          disabled={busy}
        >
          {busy ? "Parsing…" : "Upload"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/*"
          onChange={(e) => handleFiles(e.target.files)}
          hidden
        />
      </div>

      {/* Drop zone */}
      <div
        className="mt-3 grid place-items-center rounded-xl border border-dashed border-zinc-300 bg-white/60 px-4 py-6 text-xs text-zinc-600"
      >
        Drag & drop a PDF / image here, or click “Upload”.
      </div>

      {error ? (
        <div className="mt-3 text-xs text-red-600">{error}</div>
      ) : (
        <div className="mt-3 text-xs text-zinc-600">Tip: Clean PDFs parse best; phone photos also work.</div>
      )}
    </div>
  );
}
