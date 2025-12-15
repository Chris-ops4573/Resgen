import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ResumeParser from "../components/ResumeParser";

/* point the frontend to FastAPI (port 8000) */
const RAW_API_BASE = (import.meta as any)?.env?.VITE_API_BASE;
const API_BASE = String(RAW_API_BASE).replace(/\/+$/, "");
const BUILDER_STORAGE_KEY = "resgen_builder_state_v1";

/* ---------------- Types ---------------- */
type LinkItem = { label: string; url: string };
type BulletItem = { text: string };
type Experience = {
  title: string;
  company?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  skills: string[];
  bullets: BulletItem[];
};
type Project = {
  name: string;
  link?: string;
  description?: string;
  skills: string[];
  bullets: BulletItem[];
};
type Education = {
  school: string;
  degree?: string;
  graduation?: string;
  details: string[];
};

type BuilderSnapshot = {
  name: string;
  email: string;
  phone: string;
  location: string;
  links: LinkItem[];
  educations: Education[];
  skills: string[];
  experiences: Experience[];
  projects: Project[];
  achievements: string[];
  jobTitle: string;
  jobCompany: string;
  jobDesc: string;
  maxExperiences: number;
  maxProjects: number;
  maxSkills: number;
  maxAchievements: number;
  tightResume: boolean;
};

function readSnapshot(): BuilderSnapshot | null {
  try {
    const raw = sessionStorage.getItem(BUILDER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BuilderSnapshot) : null;
  } catch {
    return null;
  }
}

function writeSnapshot(s: BuilderSnapshot) {
  try {
    sessionStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

/* ---------------- Shared UI atoms ---------------- */
const ACCENT = "#0ea5e9";

function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="rounded-2xl shadow ring-1 ring-black/10" aria-hidden="true">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="48" height="48" rx="12" fill="url(#g1)" />
      {/* thin pipeline glyph (bottom-right) */}
      <g opacity=".9" transform="translate(26,26)">
        <rect x="0" y="8" width="18" height="2" rx="1" fill="white" />
        <circle cx="0" cy="9" r="2" fill="white" />
        <circle cx="18" cy="9" r="2" fill="white" />
      </g>
      {/* stylized R */}
      <path d="M10 14c0-2.2 1.8-4 4-4h10c4.4 0 8 3.6 8 8s-3.6 8-8 8h-6v6h-4V14Zm14 8c2.2 0 4-1.8 4-4s-1.8-4-4-4h-10v8h10Z" fill="white" fillOpacity="0.9" />
    </svg>
  );
}

function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-6xl px-4 py-3 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandMark />
          <span className="text-sm font-semibold tracking-tight">{title}</span>
        </div>
        {subtitle ? <div className="hidden md:block text-xs text-zinc-500">{subtitle}</div> : null}
      </div>
    </header>
  );
}

function Section({
  title, desc, children,
}: {
  title: string; desc?: string; children: React.ReactNode;
}) {
  return (
    <section
      className={[
        "group relative rounded-2xl p-6 md:p-8",
        "bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60",
        "border border-zinc-200/70 ring-1 ring-black/5",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.6)_inset,0_10px_30px_-10px_rgba(0,0,0,0.15)]",
        "transition hover:shadow-[0_1px_0_0_rgba(255,255,255,0.6)_inset,0_24px_50px_-20px_rgba(0,0,0,0.25)]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent [background:radial-gradient(1200px_600px_at_0%_-20%,rgba(14,165,233,0.08),transparent_40%),radial-gradient(1200px_600px_at_100%_120%,rgba(99,102,241,0.08),transparent_40%)]" />
      <div className="relative">
        <div className="mb-5">
          <h2 className="text-[22px] md:text-2xl font-semibold tracking-tight text-zinc-900">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900">{title}</span>
          </h2>
          {desc ? <p className="text-sm text-zinc-600 mt-1">{desc}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-medium text-zinc-800">{label}</span>
        {hint ? <span className="text-xs text-zinc-500">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-xl border px-3.5 py-2.75 text-sm text-zinc-900",
        "border-zinc-200 bg-white/70 shadow-inner placeholder:text-zinc-400",
        "transition hover:bg-white focus:bg-white",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--accent)]/20",
        className || "",
      ].join(" ")}
    />
  );
}

function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "w-full rounded-xl border px-3.5 py-2.75 text-sm text-zinc-900",
        "border-zinc-200 bg-white/70 shadow-inner min-h-[92px] placeholder:text-zinc-400",
        "transition hover:bg-white focus:bg-white",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--accent)]/20",
        className || "",
      ].join(" ")}
    />
  );
}

function Chip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white/80 px-2.5 py-1 text-xs text-zinc-700 shadow-sm hover:shadow transition">
      {label}
      {onRemove ? (
        <button
          onClick={onRemove}
          className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition"
          title="Remove"
          type="button"
          aria-label="Remove"
        >
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
            <path d="M6.3 6.3a1 1 0 0 1 1.4 0L10 8.6l2.3-2.3a1 1 0 1 1 1.4 1.4L11.4 10l2.3 2.3a1 1 0 1 1-1.4 1.4L10 11.4l-2.3 2.3a1 1 0 1 1-1.4-1.4L8.6 10 6.3 7.7a1 1 0 0 1 0-1.4Z" />
          </svg>
        </button>
      ) : null}
    </span>
  );
}

function PrimaryButton({ children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={[
        "relative inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium",
        "text-white bg-gradient-to-b from-zinc-900 to-black",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_20px_-10px_rgba(0,0,0,0.5)]",
        "transition active:translate-y-[1px] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_6px_16px_-10px_rgba(0,0,0,0.6)]",
        "disabled:opacity-50",
        "before:absolute before:inset-0 before:rounded-2xl before:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.25),transparent)] before:pointer-events-none",
        className || "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={[
        "rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-900 shadow-sm transition hover:shadow active:translate-y-[1px]",
        className || "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Toast({ message, onClose }: { message: string | null; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="fixed inset-x-0 top-3 z-[100] flex justify-center px-4">
      <div className="relative max-w-[640px] w-full rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur shadow-[0_10px_30px_-10px_rgba(0,0,0,0.25)] ring-1 ring-black/5 px-4 py-3 text-sm text-zinc-900">
        {message}
        <button onClick={onClose} className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-700" aria-label="Close" title="Close">×</button>
      </div>
    </div>
  );
}

function NumberField({
  value, onChange, min = 0, max = Infinity, step = 1, placeholder,
}: {
  value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number; placeholder?: string;
}) {
  function clamp(n: number) { return Math.max(min, Math.min(max, n)); }
  function inc() { onChange(clamp((Number.isFinite(value) ? value : 0) + step)); }
  function dec() { onChange(clamp((Number.isFinite(value) ? value : 0) - step)); }
  function onTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value; if (raw === "") { onChange(min); return; }
    const n = Number(raw); if (!Number.isNaN(n)) onChange(clamp(n));
  }
  return (
    <div className="relative">
      <Input type="number" inputMode="numeric" placeholder={placeholder} value={Number.isFinite(value) ? value : min} onChange={onTextChange} min={min} max={max} className="pr-12 [appearance:textfield]" />
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm w-7" aria-hidden="true">
        <button type="button" onClick={inc} aria-label="Increase" className="group h-5 w-7 grid place-items-center bg-gradient-to-b from-white to-zinc-50 hover:from-zinc-50 hover:to-white active:from-zinc-100 active:to-zinc-50 transition">
          <svg viewBox="0 0 20 20" className="h-3 w-3 text-zinc-700" fill="currentColor" aria-hidden="true"><path d="M10 6l-4 4h8l-4-4z" /></svg>
        </button>
        <div className="h-px bg-zinc-200" />
        <button type="button" onClick={dec} aria-label="Decrease" className="group h-5 w-7 grid place-items-center bg-gradient-to-b from-white to-zinc-50 hover:from-zinc-50 hover:to-white active:from-zinc-100 active:to-zinc-50 transition">
          <svg viewBox="0 0 20 20" className="h-3 w-3 text-zinc-700" fill="currentColor" aria-hidden="true"><path d="M10 14l4-4H6l4 4z" /></svg>
        </button>
      </div>
    </div>
  );
}

/* ---------------- Screen ---------------- */
export default function ResumeBuilder() {
  const navigate = useNavigate();

  // basic profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  // links
  const [links, setLinks] = useState<LinkItem[]>([
    { label: "GitHub", url: "" },
    { label: "LinkedIn", url: "" },
  ]);

  // education
  const [educations, setEducations] = useState<Education[]>([
    { school: "", degree: "", graduation: "", details: [""] },
  ]);

  // skills
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  // experiences
  const [experiences, setExperiences] = useState<Experience[]>([
    { title: "", company: "", location: "", startDate: "", endDate: "Present", skills: [], bullets: [{ text: "" }] },
  ]);

  // projects
  const [projects, setProjects] = useState<Project[]>([
    { name: "", link: "", description: "", skills: [], bullets: [{ text: "" }] },
  ]);

  // achievements
  const [achievements, setAchievements] = useState<string[]>([""]);

  // job spec
  const [jobTitle, setJobTitle] = useState("");
  const [jobCompany, setJobCompany] = useState("");
  const [jobDesc, setJobDesc] = useState("");

  // options
  const [maxExperiences, setMaxExperiences] = useState(3);
  const [maxProjects, setMaxProjects] = useState(2);
  const [maxSkills, setMaxSkills] = useState(10);
  const [maxAchievements, setMaxAchievements] = useState(3);
  const [tightResume, setTightResume] = useState(false);

  // submit state
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [latex, setLatex] = useState<string | null>(null);

  // interview start state
  const [startingInterview, setStartingInterview] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [interviewSessionId, setInterviewSessionId] = useState<string | null>(null);
  const [firstQuestion, setFirstQuestion] = useState<string | null>(null);



  // toast
  const [toast, setToast] = useState<string | null>(null);

  React.useEffect(() => {
    const snap = readSnapshot();
    if (!snap) return;

    setName(snap.name || "");
    setEmail(snap.email || "");
    setPhone(snap.phone || "");
    setLocation(snap.location || "");
    setLinks(Array.isArray(snap.links) ? snap.links : []);
    setEducations(Array.isArray(snap.educations) ? snap.educations : [{ school: "", degree: "", graduation: "", details: [""] }]);
    setSkills(Array.isArray(snap.skills) ? snap.skills : []);
    setExperiences(Array.isArray(snap.experiences) ? snap.experiences : [
      { title: "", company: "", location: "", startDate: "", endDate: "Present", skills: [], bullets: [{ text: "" }] },
    ]);
    setProjects(Array.isArray(snap.projects) ? snap.projects : [
      { name: "", link: "", description: "", skills: [], bullets: [{ text: "" }] },
    ]);
    setAchievements(Array.isArray(snap.achievements) ? snap.achievements : [""]);
    setJobTitle(snap.jobTitle || "");
    setJobCompany(snap.jobCompany || "");
    setJobDesc(snap.jobDesc || "");
    setMaxExperiences(Number.isFinite(snap.maxExperiences) ? snap.maxExperiences : 3);
    setMaxProjects(Number.isFinite(snap.maxProjects) ? snap.maxProjects : 2);
    setMaxSkills(Number.isFinite(snap.maxSkills) ? snap.maxSkills : 10);
    setMaxAchievements(Number.isFinite(snap.maxAchievements) ? snap.maxAchievements : 3);
    setTightResume(!!snap.tightResume);
  }, []);

  React.useEffect(() => {
    const id = window.setTimeout(() => {
      writeSnapshot({
        name, email, phone, location,
        links, educations, skills, experiences, projects, achievements,
        jobTitle, jobCompany, jobDesc,
        maxExperiences, maxProjects, maxSkills, maxAchievements,
        tightResume,
      });
    }, 300);
    return () => window.clearTimeout(id);
  }, [
    name, email, phone, location,
    links, educations, skills, experiences, projects, achievements,
    jobTitle, jobCompany, jobDesc,
    maxExperiences, maxProjects, maxSkills, maxAchievements,
    tightResume,
  ]);

  const pop = (msg: string) => {
    setToast(msg);
    window.clearTimeout((pop as any)._t);
    (pop as any)._t = window.setTimeout(() => setToast(null), 3800);
  };

  function applyParsedUser(u: any) {
    if (u.name) setName(u.name); 
    if (u.email) setEmail(u.email);
    if (u.phone) setPhone(u.phone);
    if (u.location) setLocation(u.location);

    if (u.links && typeof u.links === "object") {
      const flat: { label: string; url: string }[] = [];
      for (const [k, v] of Object.entries(u.links)) {
        if (!v) continue;
        if (typeof v === "string") flat.push({ label: k[0].toUpperCase() + k.slice(1), url: v });
        else for (const [lk, lv] of Object.entries(v as Record<string, string>)) if (lv) flat.push({ label: lk, url: lv as string });
      }
      if (flat.length) setLinks(flat);
    }

    if (Array.isArray(u.skills)) setSkills(Array.from(new Set(u.skills.filter(Boolean))));

    if (Array.isArray(u.education)) {
      setEducations(
        u.education.map((ed: any) => ({
          school: ed.school || "", degree: ed.degree || "",
          graduation: ed.graduation || "",
          details: Array.isArray(ed.details) ? ed.details.filter(Boolean) : [],
        }))
      );
    }

    if (Array.isArray(u.experiences)) {
      setExperiences(
        u.experiences.map((e: any) => ({
          title: e.title || "", company: e.company || "", location: e.location || "",
          startDate: e.startDate || "", endDate: e.endDate || "",
          skills: Array.isArray(e.skills) ? e.skills.filter(Boolean) : [],
          bullets: Array.isArray(e.bullets) ? e.bullets.filter(Boolean).map((t: string) => ({ text: t })) : [{ text: "" }],
        }))
      );
    }

    if (Array.isArray(u.projects)) {
      setProjects(
        u.projects.map((p: any) => ({
          name: p.name || "", link: p.link || "", description: p.description || "",
          skills: Array.isArray(p.skills) ? p.skills.filter(Boolean) : [],
          bullets: Array.isArray(p.bullets) ? p.bullets.filter(Boolean).map((t: string) => ({ text: t })) : [{ text: "" }],
        }))
      );
    }

    if (Array.isArray(u.achievements)) {
      const arr = u.achievements.filter(Boolean);
      setAchievements(arr.length ? arr : [""]);
    }
  }

  const canSubmit = useMemo(
    () =>
      !!name &&
      (!!jobTitle || !!jobDesc) &&
      (experiences.some((e) => e.title || e.company) || projects.some((p) => p.name)),
    [name, jobTitle, jobDesc, experiences, projects]
  );

  function addSkill(s: string) {
    const clean = s.trim();
    if (!clean) return;
    if (!skills.includes(clean)) setSkills((prev) => [...prev, clean]);
    setSkillInput("");
  }

  function buildResumeText(): string {
    const lines: string[] = [];

    lines.push(name);
    if (email) lines.push(email);
    if (phone) lines.push(phone);
    if (location) lines.push(location);

    if (skills.length) {
      lines.push("\nSkills:");
      lines.push(skills.join(", "));
    }

    if (experiences.length) {
      lines.push("\nExperience:");
      experiences.forEach((e) => {
        if (!e.title && !e.company) return;
        lines.push(`${e.title || ""} @ ${e.company || ""}`);
        e.bullets.forEach((b) => b.text && lines.push(`- ${b.text}`));
      });
    }

    if (projects.length) {
      lines.push("\nProjects:");
      projects.forEach((p) => {
        if (!p.name) return;
        lines.push(p.name);
        p.bullets.forEach((b) => b.text && lines.push(`- ${b.text}`));
      });
    }

    return lines.join("\n");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // validation
    const expCount = experiences.filter((e) => e.title || e.company).length;
    const projCount = projects.filter((p) => p.name).length;
    const skillCount = skills.length;
    const achCount = achievements.filter(Boolean).length;

    if (!jobTitle && !jobDesc) { pop("Please add a Target Job — enter a job title or paste a job description."); return; }
    if (maxExperiences > expCount) { pop(`You selected ${maxExperiences} experiences but only added ${expCount}. Reduce the number or add more roles.`); return; }
    if (maxProjects > projCount) { pop(`You selected ${maxProjects} projects but only added ${projCount}. Reduce the number or add more projects.`); return; }
    if (maxSkills > skillCount) { pop(`You selected ${maxSkills} skills but only added ${skillCount}. Reduce the number or add more skills.`); return; }
    if (maxAchievements > achCount) { pop(`You selected ${maxAchievements} achievements but only added ${achCount}. Reduce the number or add more achievements.`); return; }
    if (!name) { pop("Please enter your Name."); return; }
    if (!canSubmit) { pop("Please add at least one Experience or Project."); return; }

    setIsGeneratingResume(true);
    setError(null);
    setPdfBase64(null);
    setLatex(null);

    try {
      const user = {
        name, email, phone, location,
        links: Object.fromEntries(links.filter((l) => l.url).map((l) => [l.label.toLowerCase(), l.url])),
        skills,
        experiences: experiences.map((e) => ({ ...e, bullets: e.bullets.map((b) => b.text).filter(Boolean) })),
        projects: projects.map((p) => ({ ...p, bullets: p.bullets.map((b) => b.text).filter(Boolean) })),
        achievements: achievements.filter(Boolean),
        education: educations
          .filter((ed) => ed.school.trim())
          .map((ed) => ({
            school: ed.school.trim(),
            degree: ed.degree?.trim() || undefined,
            graduation: ed.graduation?.trim() || undefined,
            details: ed.details.map((d) => d.trim()).filter(Boolean),
          })),
      };

      const job = { title: jobTitle, company: jobCompany, description: jobDesc };
      const options = { maxExperiences, maxProjects, maxSkills, maxAchievements, compile: true, tightResume};

      const res = await fetch(`${API_BASE}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, job, options }),
      });

      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setPdfBase64(data.pdfBase64 ?? null);
      setLatex(data.latex ?? null);
      try {
        if (data.latex) sessionStorage.setItem("resume_latex", data.latex);
        if (data.pdfBase64) sessionStorage.setItem("resume_pdf_b64", data.pdfBase64);
        else sessionStorage.removeItem("resume_pdf_b64");
      } catch {}
      navigate("/preview");
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
      pop(err?.message || "Request failed. Check your backend (CORS, URL, logs).");
    } finally {
      setIsGeneratingResume(false);
    }
  }

  async function startInterview() {
    if (!name || (!jobTitle && !jobDesc)) {
      pop("Please enter your name and a target job before starting the interview.");
      return;
    }

    try {
      setIsStartingInterview(true);

      const payload = {
        job_description: jobDesc || jobTitle,
        resume: buildResumeText(),
        candidate_name: name,
        target_role: jobTitle,
        interview_depth: "medium",
        interview_style: "mixed",
      };

      const res = await fetch(`${API_BASE}/interview/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to start interview");

      const data = await res.json();

      setInterviewSessionId(data.session_id ?? null);
      setFirstQuestion(data.question ?? null);
      setCountdown(5);
      setStartingInterview(true);

    } catch (err: any) {
      pop(err?.message || "Could not start interview");
    } finally {
      setIsStartingInterview(false);
    }
  }

  React.useEffect(() => {
    if (!startingInterview) return;

    if (countdown <= 0 && interviewSessionId && firstQuestion) {
      navigate(`/interview/${interviewSessionId}`, {
        state: {
          firstQuestion
        },
      });
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [startingInterview, countdown, interviewSessionId, firstQuestion, navigate]);



  function downloadPdf() {
    if (!pdfBase64) return;
    const bin = atob(pdfBase64);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([buf], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-dvh text-zinc-900 antialiased" style={{ ["--accent" as any]: ACCENT }}>
      {/* hide native number spinners */}
      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none !important; margin: 0 !important; }
        input[type="number"] { -moz-appearance: textfield !important; appearance: textfield !important; }
      `}</style>

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-50 to-white" />
        <div className="absolute -top-24 -left-24 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(closest-side,rgba(14,165,233,0.12),transparent)] blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.12),transparent)] blur-3xl" />
      </div>

      <Header title="Tailored Resume" subtitle="Resgen — AI Resume Builder" />

      <main className="mx-auto max-w-6xl px-4 py-6 md:py-10 grid gap-6 md:grid-cols-[minmax(0,1fr),22rem]">
        <form onSubmit={onSubmit} className="grid gap-6 min-w-0">
          <Section title="Quick Start" desc="Upload your current resume to autofill fields.">
            <ResumeParser apiBase={API_BASE} onParsed={applyParsedUser} />
          </Section>

          <Section title="Profile" desc="Your basic info and contact details.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name *"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Dev" /></Field>
              <Field label="Location"><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bengaluru, IN" /></Field>
              <Field label="Email"><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex@example.com" /></Field>
              <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91-90000-00000" /></Field>
            </div>

            {/* Links */}
            <div className="mt-5 grid gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-800">Links</span>
                <button type="button" onClick={() => setLinks((prev) => [...prev, { label: "Other", url: "" }])} className="text-sm text-zinc-700 hover:text-zinc-900">+ Add link</button>
              </div>

              {links.map((l, i) => (
                <div key={i} className="grid gap-3 md:grid-cols-[1fr,1fr,auto] items-start">
                  <Input
                    value={l.label}
                    onChange={(e) => setLinks((prev) => prev.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))}
                    placeholder="Label (GitHub, LinkedIn)"
                  />
                  <Input
                    value={l.url}
                    onChange={(e) => setLinks((prev) => prev.map((x, idx) => (idx === i ? { ...x, url: e.target.value } : x)))}
                    placeholder="https://…"
                  />
                  {links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setLinks((prev) => prev.filter((_, idx) => idx !== i))}
                      className="justify-self-start md:justify-self-end self-center text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Education */}
            <div className="mt-6 grid gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-800">Education</span>
                <button
                  type="button"
                  onClick={() => setEducations((prev) => [...prev, { school: "", degree: "", graduation: "", details: [""] }])}
                  className="text-sm text-zinc-700 hover:text-zinc-900"
                >
                  + Add education
                </button>
              </div>

              <div className="grid gap-5">
                {educations.map((ed, i) => (
                  <div key={i} className="grid gap-3 rounded-xl border border-zinc-200/80 p-4 bg-white/65 shadow-sm hover:shadow transition">
                    <div className="grid gap-3 md:grid-cols-3">
                      <Input placeholder="School *" value={ed.school}
                             onChange={(e) => setEducations((prev) => prev.map((x, idx) => (idx === i ? { ...x, school: e.target.value } : x)))} />
                      <Input placeholder="Degree (e.g., B.Tech in CSE)" value={ed.degree || ""}
                             onChange={(e) => setEducations((prev) => prev.map((x, idx) => (idx === i ? { ...x, degree: e.target.value } : x)))} />
                      <Input placeholder="Graduation (e.g., 2024 / May 2024)" value={ed.graduation || ""}
                             onChange={(e) => setEducations((prev) => prev.map((x, idx) => (idx === i ? { ...x, graduation: e.target.value } : x)))} />
                    </div>

                    <div className="grid gap-2">
                      <span className="text-sm font-medium text-zinc-800">Details</span>
                      {ed.details.map((d, j) => (
                        <Input key={j} placeholder="e.g., GPA: 8.7/10  |  Coursework: DS&A, DBMS, OS" value={d}
                               onChange={(e) => setEducations((prev) => prev.map((x, idx) => {
                                 if (idx !== i) return x;
                                 const details = x.details.map((dd, jj) => (jj === j ? e.target.value : dd));
                                 return { ...x, details };
                               }))} />
                      ))}
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setEducations((prev) => prev.map((x, idx) => idx === i ? { ...x, details: [...x.details, ""] } : x))}
                                className="text-sm text-zinc-700 hover:text-zinc-900">+ Add detail</button>
                        {ed.details.length > 1 && (
                          <button type="button" onClick={() => setEducations((prev) => prev.map((x, idx) => {
                            if (idx !== i) return x; return { ...x, details: x.details.slice(0, -1) };
                          }))} className="text-sm text-zinc-500 hover:text-zinc-700">Remove last</button>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      {educations.length > 1 && (
                        <button type="button" onClick={() => setEducations((prev) => prev.filter((_, idx) => idx !== i))} className="text-sm text-red-600 hover:text-red-700">
                          Remove education
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Skills" desc="Press Enter or comma to add.">
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.map((s, i) => <Chip key={i} label={s} onRemove={() => setSkills((prev) => prev.filter((_, idx) => idx !== i))} />)}
            </div>
            <Input
              placeholder="Type a skill and press Enter (e.g., React)"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(skillInput); }
              }}
              onBlur={() => addSkill(skillInput)}
            />
          </Section>

          <Section title="Experiences" desc="Roles with bullets & associated skills.">
            <div className="grid gap-8">
              {experiences.map((exp, i) => (
                <div key={i} className="grid gap-3 rounded-xl border border-zinc-200/80 p-4 bg-white/65 shadow-sm hover:shadow transition">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input placeholder="Title" value={exp.title} onChange={(e) => setExperiences((prev) => prev.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} />
                    <Input placeholder="Company" value={exp.company} onChange={(e) => setExperiences((prev) => prev.map((x, idx) => idx === i ? { ...x, company: e.target.value } : x))} />
                    <Input placeholder="Location" value={exp.location} onChange={(e) => setExperiences((prev) => prev.map((x, idx) => idx === i ? { ...x, location: e.target.value } : x))} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder="Start (YYYY-MM)" value={exp.startDate} onChange={(e) => setExperiences((prev) => prev.map((x, idx) => idx === i ? { ...x, startDate: e.target.value } : x))} />
                      <Input placeholder="End (YYYY-MM or Present)" value={exp.endDate} onChange={(e) => setExperiences((prev) => prev.map((x, idx) => idx === i ? { ...x, endDate: e.target.value } : x))} />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <span className="text-sm font-medium text-zinc-800">Bullets</span>
                    {exp.bullets.map((b, j) => (
                      <Textarea key={j} placeholder="Start with an action verb and quantify impact…" value={b.text}
                                onChange={(e) => setExperiences((prev) => prev.map((x, idx) => {
                                  if (idx !== i) return x;
                                  const bullets = x.bullets.map((bb, jj) => (jj === j ? { text: e.target.value } : bb));
                                  return { ...x, bullets };
                                }))} />
                    ))}
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setExperiences((prev) => prev.map((x, idx) => idx === i ? { ...x, bullets: [...x.bullets, { text: "" }] } : x))}
                              className="text-sm text-zinc-700 hover:text-zinc-900">+ Add bullet</button>
                      {exp.bullets.length > 1 && (
                        <button type="button" onClick={() => setExperiences((prev) => prev.map((x, idx) => {
                          if (idx !== i) return x; return { ...x, bullets: x.bullets.slice(0, -1) };
                        }))} className="text-sm text-zinc-500 hover:text-zinc-700">Remove last</button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <span className="text-sm font-medium text-zinc-800">Role skills (comma/Enter to add)</span>
                    <div className="flex flex-wrap gap-2">
                      {exp.skills.map((s, k) => (
                        <Chip key={k} label={s} onRemove={() => setExperiences((prev) => prev.map((x, idx) => idx === i ? { ...x, skills: x.skills.filter((_, kk) => kk !== k) } : x))} />
                      ))}
                    </div>
                    <Input
                      placeholder="e.g., React, AWS, TypeScript"
                      onKeyDown={(e) => {
                        const t = e.target as HTMLInputElement;
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          const raw = t.value.split(",").map((s) => s.trim()).filter(Boolean);
                          if (raw.length) {
                            setExperiences((prev) => prev.map((x, idx) => idx === i ? { ...x, skills: [...x.skills, ...raw] } : x));
                            t.value = "";
                          }
                        }
                      }}
                    />
                  </div>

                  <div className="flex justify-end">
                    {experiences.length > 1 && (
                      <button type="button" onClick={() => setExperiences((prev) => prev.filter((_, idx) => idx !== i))}
                              className="text-sm text-red-600 hover:text-red-700">Remove role</button>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setExperiences((prev) => [...prev, { title: "", company: "", location: "", startDate: "", endDate: "", skills: [], bullets: [{ text: "" }] }])}
                      className="text-sm text-zinc-700 hover:text-zinc-900">+ Add another experience</button>
            </div>
          </Section>

          <Section title="Projects" desc="Personal or academic projects with bullets and links.">
            <div className="grid gap-8">
              {projects.map((p, i) => (
                <div key={i} className="grid gap-3 rounded-xl border border-zinc-200/80 p-4 bg-white/65 shadow-sm hover:shadow transition">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input placeholder="Name" value={p.name} onChange={(e) => setProjects((prev) => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} />
                    <Input placeholder="Link (optional)" value={p.link} onChange={(e) => setProjects((prev) => prev.map((x, idx) => idx === i ? { ...x, link: e.target.value } : x))} />
                    <div className="md:col-span-2">
                      <Textarea placeholder="One-line description" value={p.description} onChange={(e) => setProjects((prev) => prev.map((x, idx) => idx === i ? { ...x, description: e.target.value } : x))} />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <span className="text-sm font-medium text-zinc-800">Bullets</span>
                    {p.bullets.map((b, j) => (
                      <Textarea key={j} placeholder="What you built, how, impact" value={b.text}
                                onChange={(e) => setProjects((prev) => prev.map((x, idx) => {
                                  if (idx !== i) return x;
                                  const bullets = x.bullets.map((bb, jj) => (jj === j ? { text: e.target.value } : bb));
                                  return { ...x, bullets };
                                }))} />
                    ))}
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setProjects((prev) => prev.map((x, idx) => idx === i ? { ...x, bullets: [...x.bullets, { text: "" }] } : x))}
                              className="text-sm text-zinc-700 hover:text-zinc-900">+ Add bullet</button>
                      {p.bullets.length > 1 && (
                        <button type="button" onClick={() => setProjects((prev) => prev.map((x, idx) => {
                          if (idx !== i) return x; return { ...x, bullets: x.bullets.slice(0, -1) };
                        }))} className="text-sm text-zinc-500 hover:text-zinc-700">Remove last</button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <span className="text-sm font-medium text-zinc-800">Project skills</span>
                    <Input
                      placeholder="e.g., Next.js, PostgreSQL"
                      onKeyDown={(e) => {
                        const t = e.target as HTMLInputElement;
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          const raw = t.value.split(",").map((s) => s.trim()).filter(Boolean);
                          if (raw.length) {
                            setProjects((prev) => prev.map((x, idx) => idx === i ? { ...x, skills: [...x.skills, ...raw] } : x));
                            t.value = "";
                          }
                        }
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      {p.skills.map((s, k) => (
                        <Chip key={k} label={s} onRemove={() => setProjects((prev) => prev.map((x, idx) => idx === i ? { ...x, skills: x.skills.filter((_, kk) => kk !== k) } : x))} />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    {projects.length > 1 && (
                      <button type="button" onClick={() => setProjects((prev) => prev.filter((_, idx) => idx !== i))}
                              className="text-sm text-red-600 hover:text-red-700">Remove project</button>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setProjects((prev) => [...prev, { name: "", link: "", description: "", skills: [], bullets: [{ text: "" }] }])}
                      className="text-sm text-zinc-700 hover:text-zinc-900">+ Add another project</button>
            </div>
          </Section>

          <Section title="Achievements" desc="Short one-liners that add punch.">
            <div className="grid gap-3">
              {achievements.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <Input value={a} onChange={(e) => setAchievements((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))} placeholder="e.g., SIH 2024 finalist" />
                  {achievements.length > 1 && (
                    <button type="button" className="text-sm text-red-600 hover:text-red-700" onClick={() => setAchievements((prev) => prev.filter((_, idx) => idx !== i))}>Remove</button>
                  )}
                </div>
              ))}
              <button type="button" className="text-sm text-zinc-700 hover:text-zinc-900" onClick={() => setAchievements((prev) => [...prev, ""])}>+ Add achievement</button>
            </div>
          </Section>

          <Section title="Target Job" desc="This guides tailoring and relevance scoring for experiences, projects, and skills.">
            <div className="grid gap-3">
              <Input placeholder="Job title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
              <Input placeholder="Company (optional)" value={jobCompany} onChange={(e) => setJobCompany(e.target.value)} />
              <Textarea placeholder="Paste the job description…" value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} />
            </div>
          </Section>

          <Section title="Output Options" desc="Control how much goes into the resume.">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Experiences" hint="0–4">
                <NumberField min={0} max={4} value={maxExperiences} onChange={setMaxExperiences} />
              </Field>
              <Field label="Projects" hint="0–4">
                <NumberField min={0} max={4} value={maxProjects} onChange={setMaxProjects} />
              </Field>
              <Field label="Skills" hint="0–15">
                <NumberField min={0} max={15} value={maxSkills} onChange={setMaxSkills} />
              </Field>
              <Field label="Achievements" hint="0–7">
                <NumberField min={0} max={7} value={maxAchievements} onChange={setMaxAchievements} />
              </Field>
            </div>

            {/* New: Tighter resume toggle */}
            <div className="mt-4 flex items-center justify-between rounded-xl border border-zinc-200 bg-white/70 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-zinc-800">Tighter resume</div>
                <div className="text-xs text-zinc-500">
                  Use a denser layout (smaller margins + tighter bullet spacing) while keeping 11pt body size.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTightResume((v) => !v)}
                className={[
                  "relative h-7 w-12 rounded-full transition",
                  tightResume ? "bg-zinc-900" : "bg-zinc-300"
                ].join(" ")}
                aria-pressed={tightResume}
                aria-label="Toggle tighter resume"
              >
                <span
                  className={[
                    "absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    tightResume ? "translate-x-5" : "translate-x-0"
                  ].join(" ")}
                />
              </button>
            </div>
          </Section>

          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton type="submit" disabled={isGeneratingResume}>
              {isGeneratingResume ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                  </svg>
                  Generating…
                </>
              ) : "Generate resume"}
            </PrimaryButton>

            <PrimaryButton
              type="button"
              onClick={startInterview}
              disabled={isStartingInterview}
              className="bg-gradient-to-b from-indigo-600 to-indigo-800"
            >
              {isStartingInterview ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
                Generating…
              </>
              ) : "Start interview"}
            </PrimaryButton>

            {pdfBase64 ? <SecondaryButton type="button" onClick={downloadPdf}>Download PDF</SecondaryButton> : null}
            <SecondaryButton type="button" onClick={() => navigate("/preview")}>Preview last build</SecondaryButton>
            {error ? <span className="text-sm text-red-600">{error}</span> : null}
          </div>
        </form>

        {/* Side card (sticky live summary / debug) */}
        <aside className="grid gap-6 md:sticky md:top-[76px] h-max min-w-0">
          <Section title="Preview info" desc="Quick glance at what you’ve entered.">
            <ul className="space-y-2 text-sm text-zinc-700">
              <li><strong>{name || "—"}</strong> • {location || "—"}</li>
              <li>{email || "—"} • {phone || "—"}</li>
              <li className="truncate">{links.filter((l) => l.url).map((l) => `${l.label}: ${l.url}`).join(" • ") || "—"}</li>
              <li>Education: {educations.filter((e) => e.school.trim()).length}</li>
              <li>Skills: {skills.length}</li>
              <li>Experiences: {experiences.filter((e) => e.title || e.company).length}</li>
              <li>Projects: {projects.filter((p) => p.name).length}</li>
              <li>Achievements: {achievements.filter(Boolean).length}</li>
              <li className="mt-2">Target: <em>{jobTitle || "—"}</em> @ {jobCompany || "—"}</li>
            </ul>

            {latex ? (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-zinc-600">Show LaTeX (debug)</summary>
                {/* constrain width/height so the section never overflows and “pushes” the grid */}
                <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-zinc-950/90 p-3 text-xs text-zinc-50 whitespace-pre-wrap break-words">
                  {latex}
                </pre>
              </details>
            ) : null}
          </Section>
        </aside>
      </main>

      <Toast message={toast} onClose={() => setToast(null)} />
      {startingInterview && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="rounded-2xl bg-white px-10 py-8 text-center shadow-xl border border-zinc-200">
            <div className="text-sm text-zinc-600 mb-2">
              Interview starting in
            </div>
            <div className="text-5xl font-semibold text-zinc-900">
              {countdown}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
