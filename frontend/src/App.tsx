import React, { useMemo, useState } from "react";

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

/* ---------------- UI atoms ---------------- */
function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
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
      {/* gradient edge glow */}
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

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
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

function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-xl border px-3.5 py-2.75 text-sm text-zinc-900",
        "border-zinc-200 bg-white/70 shadow-inner",
        "placeholder:text-zinc-400",
        "transition",
        "hover:bg-white focus:bg-white",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--accent)]/20",
        className || "",
      ].join(" ")}
    />
  );
}

function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "w-full rounded-xl border px-3.5 py-2.75 text-sm text-zinc-900",
        "border-zinc-200 bg-white/70 shadow-inner min-h-[92px]",
        "placeholder:text-zinc-400",
        "transition",
        "hover:bg-white focus:bg-white",
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

function PrimaryButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
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

function SecondaryButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-900 shadow-sm transition hover:shadow active:translate-y-[1px]"
    >
      {children}
    </button>
  );
}

/* Custom, elegant number input with stacked chevrons */
function NumberField({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  placeholder,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}) {
  function clamp(n: number) {
    return Math.max(min, Math.min(max, n));
  }
  function inc() {
    onChange(clamp((Number.isFinite(value) ? value : 0) + step));
  }
  function dec() {
    onChange(clamp((Number.isFinite(value) ? value : 0) - step));
  }
  function onTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw === "") {
      onChange(min);
      return;
    }
    const n = Number(raw);
    if (!Number.isNaN(n)) onChange(clamp(n));
  }
  return (
    <div className="relative">
      <Input
        type="number"
        inputMode="numeric"
        placeholder={placeholder}
        value={Number.isFinite(value) ? value : min}
        onChange={onTextChange}
        min={min}
        max={max}
        className="pr-16 [appearance:textfield]"
      />
      {/* hide native spin (extra safety for browsers that ignore the CSS below) */}
      <div className="pointer-events-none absolute inset-y-0 right-[3.5rem] hidden" />
      {/* elegant stepper */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={inc}
          aria-label="Increase"
          className="group h-6 w-8 grid place-items-center bg-gradient-to-b from-white to-zinc-50 hover:from-zinc-50 hover:to-white active:from-zinc-100 active:to-zinc-50 transition"
        >
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-zinc-700 group-active:translate-y-[0.5px] transition" fill="currentColor" aria-hidden="true">
            <path d="M5.3 12.7a1 1 0 0 1 1.4 0L10 16l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" transform="rotate(-90 10 10)" />
          </svg>
        </button>
        <div className="h-px bg-zinc-200" />
        <button
          type="button"
          onClick={dec}
          aria-label="Decrease"
          className="group h-6 w-8 grid place-items-center bg-gradient-to-b from-white to-zinc-50 hover:from-zinc-50 hover:to-white active:from-zinc-100 active:to-zinc-50 transition"
        >
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-zinc-700 group-active:-translate-y-[0.5px] transition" fill="currentColor" aria-hidden="true">
            <path d="M5.3 12.7a1 1 0 0 1 1.4 0L10 16l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" transform="rotate(90 10 10)" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ---------------- App ---------------- */
export default function App() {
  // Accent used in rings/glow. tweak to taste.
  const accent = "#0ea5e9"; // sky-500 vibe

  // --- basic profile ---
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  // links
  const [links, setLinks] = useState<LinkItem[]>([
    { label: "GitHub", url: "" },
    { label: "LinkedIn", url: "" },
  ]);

  // skills
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  // experiences
  const [experiences, setExperiences] = useState<Experience[]>([
    {
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "Present",
      skills: [],
      bullets: [{ text: "" }],
    },
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

  // options (defaults remain inside your new max caps)
  const [maxExperiences, setMaxExperiences] = useState(3);
  const [maxProjects, setMaxProjects] = useState(2);
  const [maxSkills, setMaxSkills] = useState(10);
  const [maxAchievements, setMaxAchievements] = useState(3);

  // submit state
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [latex, setLatex] = useState<string | null>(null);

  const canSubmit = useMemo(
    () =>
      !!name &&
      (!!jobTitle || !!jobDesc) &&
      (experiences.some((e) => e.title || e.company) ||
        projects.some((p) => p.name)),
    [name, jobTitle, jobDesc, experiences, projects]
  );

  function addSkill(s: string) {
    const clean = s.trim();
    if (!clean) return;
    if (!skills.includes(clean)) setSkills((prev) => [...prev, clean]);
    setSkillInput("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setPdfBase64(null);
    setLatex(null);

    try {
      const user = {
        name,
        email,
        phone,
        location,
        links: Object.fromEntries(
          links.filter((l) => l.url).map((l) => [l.label.toLowerCase(), l.url])
        ),
        skills,
        experiences: experiences.map((e) => ({
          ...e,
          bullets: e.bullets.map((b) => b.text).filter(Boolean),
        })),
        projects: projects.map((p) => ({
          ...p,
          bullets: p.bullets.map((b) => b.text).filter(Boolean),
        })),
        achievements: achievements.filter(Boolean),
        education: [],
      };

      const job = { title: jobTitle, company: jobCompany, description: jobDesc };
      const options = {
        maxExperiences,
        maxProjects,
        maxSkills,
        maxAchievements,
        compile: true,
      };

      const res = await fetch("/v1/resume/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, job, options }),
      });

      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setPdfBase64(data.pdfBase64 ?? null);
      setLatex(data.latex ?? null);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

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
    <div
      className="min-h-dvh text-zinc-900 antialiased"
      style={{ ["--accent" as any]: "#0ea5e9" }}
    >
      {/* Hide native number spinners so only our custom stepper shows */}
      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
      `}</style>

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
            <span className="text-sm font-semibold tracking-tight">
              Tailored Resume
            </span>
          </div>
          <div className="hidden md:block text-xs text-zinc-500">
            React + Tailwind
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-10 grid gap-6 md:grid-cols-[1fr,22rem]">
        <form onSubmit={onSubmit} className="grid gap-6">
          <Section title="Profile" desc="Your basic info and contact details.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name *">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Dev"
                />
              </Field>
              <Field label="Location">
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Bengaluru, IN"
                />
              </Field>
              <Field label="Email">
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91-90000-00000"
                />
              </Field>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-800">Links</span>
                <button
                  type="button"
                  onClick={() =>
                    setLinks((prev) => [...prev, { label: "Other", url: "" }])
                  }
                  className="text-sm text-zinc-700 hover:text-zinc-900"
                >
                  + Add link
                </button>
              </div>
              {links.map((l, i) => (
                <div key={i} className="grid gap-3 md:grid-cols-2">
                  <Input
                    value={l.label}
                    onChange={(e) => {
                      const v = e.target.value;
                      setLinks((prev) =>
                        prev.map((x, idx) => (idx === i ? { ...x, label: v } : x))
                      );
                    }}
                    placeholder="Label (GitHub, LinkedIn)"
                  />
                  <Input
                    value={l.url}
                    onChange={(e) => {
                      const v = e.target.value;
                      setLinks((prev) =>
                        prev.map((x, idx) => (idx === i ? { ...x, url: v } : x))
                      );
                    }}
                    placeholder="https://…"
                  />
                </div>
              ))}
            </div>
          </Section>

          <Section title="Skills" desc="Press Enter or comma to add.">
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.map((s, i) => (
                <Chip
                  key={i}
                  label={s}
                  onRemove={() =>
                    setSkills((prev) => prev.filter((_, idx) => idx !== i))
                  }
                />
              ))}
            </div>
            <Input
              placeholder="Type a skill and press Enter (e.g., React)"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addSkill(skillInput);
                }
              }}
              onBlur={() => addSkill(skillInput)}
            />
          </Section>

          <Section title="Experiences" desc="Roles with bullets & associated skills.">
            <div className="grid gap-8">
              {experiences.map((exp, i) => (
                <div
                  key={i}
                  className="grid gap-3 rounded-xl border border-zinc-200/80 p-4 bg-white/65 shadow-sm hover:shadow transition"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      placeholder="Title"
                      value={exp.title}
                      onChange={(e) => {
                        const v = e.target.value;
                        setExperiences((prev) =>
                          prev.map((x, idx) => (idx === i ? { ...x, title: v } : x))
                        );
                      }}
                    />
                    <Input
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) => {
                        const v = e.target.value;
                        setExperiences((prev) =>
                          prev.map((x, idx) => (idx === i ? { ...x, company: v } : x))
                        );
                      }}
                    />
                    <Input
                      placeholder="Location"
                      value={exp.location}
                      onChange={(e) => {
                        const v = e.target.value;
                        setExperiences((prev) =>
                          prev.map((x, idx) => (idx === i ? { ...x, location: v } : x))
                        );
                      }}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Start (YYYY-MM)"
                        value={exp.startDate}
                        onChange={(e) => {
                          const v = e.target.value;
                          setExperiences((prev) =>
                            prev.map((x, idx) =>
                              idx === i ? { ...x, startDate: v } : x
                            )
                          );
                        }}
                      />
                      <Input
                        placeholder="End (YYYY-MM or Present)"
                        value={exp.endDate}
                        onChange={(e) => {
                          const v = e.target.value;
                          setExperiences((prev) =>
                            prev.map((x, idx) =>
                              idx === i ? { ...x, endDate: v } : x
                            )
                          );
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <span className="text-sm font-medium text-zinc-800">Bullets</span>
                    {exp.bullets.map((b, j) => (
                      <Textarea
                        key={j}
                        placeholder="Start with an action verb and quantify impact…"
                        value={b.text}
                        onChange={(e) => {
                          const v = e.target.value;
                          setExperiences((prev) =>
                            prev.map((x, idx) => {
                              if (idx !== i) return x;
                              const bullets = x.bullets.map((bb, jj) =>
                                jj === j ? { text: v } : bb
                              );
                              return { ...x, bullets };
                            })
                          );
                        }}
                      />
                    ))}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExperiences((prev) =>
                            prev.map((x, idx) =>
                              idx === i
                                ? { ...x, bullets: [...x.bullets, { text: "" }] }
                                : x
                            )
                          )
                        }
                        className="text-sm text-zinc-700 hover:text-zinc-900"
                      >
                        + Add bullet
                      </button>
                      {exp.bullets.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setExperiences((prev) =>
                              prev.map((x, idx) => {
                                if (idx !== i) return x;
                                const bullets = x.bullets.slice(0, -1);
                                return { ...x, bullets };
                              })
                            )
                          }
                          className="text-sm text-zinc-500 hover:text-zinc-700"
                        >
                          Remove last
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <span className="text-sm font-medium text-zinc-800">
                      Role skills (comma/Enter to add)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {exp.skills.map((s, k) => (
                        <Chip
                          key={k}
                          label={s}
                          onRemove={() => {
                            setExperiences((prev) =>
                              prev.map((x, idx) => {
                                if (idx !== i) return x;
                                return {
                                  ...x,
                                  skills: x.skills.filter((_, kk) => kk !== k),
                                };
                              })
                            );
                          }}
                        />
                      ))}
                    </div>
                    <Input
                      placeholder="e.g., React, AWS, TypeScript"
                      onKeyDown={(e) => {
                        const t = e.target as HTMLInputElement;
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          const raw = t.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                          if (raw.length) {
                            setExperiences((prev) =>
                              prev.map((x, idx) =>
                                idx === i
                                  ? { ...x, skills: [...x.skills, ...raw] }
                                  : x
                              )
                            );
                            t.value = "";
                          }
                        }
                      }}
                    />
                  </div>

                  <div className="flex justify-end">
                    {experiences.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExperiences((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove role
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setExperiences((prev) => [
                    ...prev,
                    {
                      title: "",
                      company: "",
                      location: "",
                      startDate: "",
                      endDate: "",
                      skills: [],
                      bullets: [{ text: "" }],
                    },
                  ])
                }
                className="text-sm text-zinc-700 hover:text-zinc-900"
              >
                + Add another experience
              </button>
            </div>
          </Section>

          <Section title="Projects" desc="Personal or academic projects with bullets and links.">
            <div className="grid gap-8">
              {projects.map((p, i) => (
                <div
                  key={i}
                  className="grid gap-3 rounded-xl border border-zinc-200/80 p-4 bg-white/65 shadow-sm hover:shadow transition"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      placeholder="Name"
                      value={p.name}
                      onChange={(e) => {
                        const v = e.target.value;
                        setProjects((prev) =>
                          prev.map((x, idx) => (idx === i ? { ...x, name: v } : x))
                        );
                      }}
                    />
                    <Input
                      placeholder="Link (optional)"
                      value={p.link}
                      onChange={(e) => {
                        const v = e.target.value;
                        setProjects((prev) =>
                          prev.map((x, idx) => (idx === i ? { ...x, link: v } : x))
                        );
                      }}
                    />
                    <div className="md:col-span-2">
                      <Textarea
                        placeholder="One-line description"
                        value={p.description}
                        onChange={(e) => {
                          const v = e.target.value;
                          setProjects((prev) =>
                            prev.map((x, idx) =>
                              idx === i ? { ...x, description: v } : x
                            )
                          );
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <span className="text-sm font-medium text-zinc-800">Bullets</span>
                    {p.bullets.map((b, j) => (
                      <Textarea
                        key={j}
                        placeholder="What you built, how, impact"
                        value={b.text}
                        onChange={(e) => {
                          const v = e.target.value;
                          setProjects((prev) =>
                            prev.map((x, idx) => {
                              if (idx !== i) return x;
                              const bullets = x.bullets.map((bb, jj) =>
                                jj === j ? { text: v } : bb
                              );
                              return { ...x, bullets };
                            })
                          );
                        }}
                      />
                    ))}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setProjects((prev) =>
                            prev.map((x, idx) =>
                              idx === i
                                ? { ...x, bullets: [...x.bullets, { text: "" }] }
                                : x
                            )
                          )
                        }
                        className="text-sm text-zinc-700 hover:text-zinc-900"
                      >
                        + Add bullet
                      </button>
                      {p.bullets.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setProjects((prev) =>
                              prev.map((x, idx) => {
                                if (idx !== i) return x;
                                const bullets = x.bullets.slice(0, -1);
                                return { ...x, bullets };
                              })
                            )
                          }
                          className="text-sm text-zinc-500 hover:text-zinc-700"
                        >
                          Remove last
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <span className="text-sm font-medium text-zinc-800">
                      Project skills
                    </span>
                    <Input
                      placeholder="e.g., Next.js, PostgreSQL"
                      onKeyDown={(e) => {
                        const t = e.target as HTMLInputElement;
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          const raw = t.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                          if (raw.length) {
                            setProjects((prev) =>
                              prev.map((x, idx) =>
                                idx === i
                                  ? { ...x, skills: [...x.skills, ...raw] }
                                  : x
                              )
                            );
                            t.value = "";
                          }
                        }
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      {p.skills.map((s, k) => (
                        <Chip
                          key={k}
                          label={s}
                          onRemove={() => {
                            setProjects((prev) =>
                              prev.map((x, idx) => {
                                if (idx !== i) return x;
                                return {
                                  ...x,
                                  skills: x.skills.filter((_, kk) => kk !== k),
                                };
                              })
                            );
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    {projects.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setProjects((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove project
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setProjects((prev) => [
                    ...prev,
                    {
                      name: "",
                      link: "",
                      description: "",
                      skills: [],
                      bullets: [{ text: "" }],
                    },
                  ])
                }
                className="text-sm text-zinc-700 hover:text-zinc-900"
              >
                + Add another project
              </button>
            </div>
          </Section>

          <Section title="Achievements & Job">
            <div className="grid gap-4">
              <div className="grid gap-3">
                <span className="text-sm font-medium text-zinc-800">Achievements</span>
                {achievements.map((a, i) => (
                  <div key={i} className="flex gap-3">
                    <Input
                      value={a}
                      onChange={(e) =>
                        setAchievements((prev) =>
                          prev.map((x, idx) => (idx === i ? e.target.value : x))
                        )
                      }
                      placeholder="e.g., SIH 2024 finalist"
                    />
                    {achievements.length > 1 && (
                      <button
                        type="button"
                        className="text-sm text-red-600 hover:text-red-700"
                        onClick={() =>
                          setAchievements((prev) =>
                            prev.filter((_, idx) => idx !== i)
                          )
                        }
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="text-sm text-zinc-700 hover:text-zinc-900"
                  onClick={() => setAchievements((prev) => [...prev, ""])}
                >
                  + Add achievement
                </button>
              </div>

              <div className="grid gap-3">
                <span className="text-sm font-medium text-zinc-800">Target Job</span>
                <Input
                  placeholder="Job title"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
                <Input
                  placeholder="Company (optional)"
                  value={jobCompany}
                  onChange={(e) => setJobCompany(e.target.value)}
                />
                <Textarea
                  placeholder="Paste the job description…"
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                />
              </div>
            </div>
          </Section>

          {/* ----- Output Options with pretty steppers ----- */}
          <Section title="Output Options" desc="Control how much goes into the resume.">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Experiences" hint="0–4">
                <NumberField
                  min={0}
                  max={4}
                  value={maxExperiences}
                  onChange={setMaxExperiences}
                />
              </Field>
              <Field label="Projects" hint="0–4">
                <NumberField
                  min={0}
                  max={4}
                  value={maxProjects}
                  onChange={setMaxProjects}
                />
              </Field>
              <Field label="Skills" hint="0–15">
                <NumberField
                  min={0}
                  max={15}
                  value={maxSkills}
                  onChange={setMaxSkills}
                />
              </Field>
              <Field label="Achievements" hint="0–7">
                <NumberField
                  min={0}
                  max={7}
                  value={maxAchievements}
                  onChange={setMaxAchievements}
                />
              </Field>
            </div>
          </Section>

          <div className="flex items-center gap-3">
            <PrimaryButton type="submit" disabled={!canSubmit || busy}>
              {busy ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      d="M4 12a8 8 0 018-8"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                  Generating…
                </>
              ) : (
                "Generate resume"
              )}
            </PrimaryButton>
            {pdfBase64 ? (
              <SecondaryButton type="button" onClick={downloadPdf}>
                Download PDF
              </SecondaryButton>
            ) : null}
            {error ? <span className="text-sm text-red-600">{error}</span> : null}
          </div>
        </form>

        {/* Side card (sticky live summary / debug) */}
        <aside className="grid gap-6 md:sticky md:top-[76px] h-max">
          <Section title="Preview info" desc="Quick glance at what you’ve entered.">
            <ul className="space-y-2 text-sm text-zinc-700">
              <li>
                <strong>{name || "—"}</strong> • {location || "—"}
              </li>
              <li>
                {email || "—"} • {phone || "—"}
              </li>
              <li className="truncate">
                {links
                  .filter((l) => l.url)
                  .map((l) => `${l.label}: ${l.url}`)
                  .join(" • ") || "—"}
              </li>
              <li>Skills: {skills.length}</li>
              <li>Experiences: {experiences.filter((e) => e.title || e.company).length}</li>
              <li>Projects: {projects.filter((p) => p.name).length}</li>
              <li>Achievements: {achievements.filter(Boolean).length}</li>
              <li className="mt-2">
                Target: <em>{jobTitle || "—"}</em> @ {jobCompany || "—"}
              </li>
            </ul>
            {latex ? (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-zinc-600">
                  Show LaTeX (debug)
                </summary>
                <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-zinc-950/90 p-3 text-xs text-zinc-50">
                  {latex}
                </pre>
              </details>
            ) : null}
          </Section>
        </aside>
      </main>
    </div>
  );
}
