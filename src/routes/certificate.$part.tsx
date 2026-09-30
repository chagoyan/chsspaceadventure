import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadSave } from "../game/save";
import type { CertificateData } from "../game/types";

export const Route = createFileRoute("/certificate/$part")({
  head: () => ({
    meta: [
      { title: "Certificate — Oscar's Git Space Adventure" },
      { name: "description", content: "Oscar's Git Space Adventure completion certificate." },
      { property: "og:title", content: "Certificate — Oscar's Git Space Adventure" },
      { property: "og:description", content: "Classroom completion evidence from Oscar's Git Space Adventure." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CertificatePage,
});

function fmtDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}m ${sec}s`;
}

export function CertificateView({ cert }: { cert: CertificateData }) {
  const passTwo = cert.part === 1 && (cert.pass ?? 1) === 2;
  const title =
    cert.part === 1
      ? passTwo
        ? "Part 1 — Midpoint Certificate (Timeline Reset — Pass II)"
        : "Part 1 — Midpoint Certificate"
      : "Part 2 — Final Completion Certificate";
  const achievement =
    cert.part === 1
      ? passTwo
        ? "has mastered the checkpoint workflow and demonstrated timeline resilience — rewinding the active timeline with git reset --hard, re-flying the erased missions, and locking in a fresh midpoint checkpoint on Pass II."
        : "has mastered the checkpoint workflow — inspecting ship state with git status, staging changes with git add ., and recording protected checkpoints with git commit -m."
      : "has completed the full mission — demonstrating checkpoint history (git log --oneline), timeline rewind (git reset --hard), and safe reversal (git revert) under reduced assistance.";
  return (
    <div className="certificate-sheet">
      <div className={passTwo ? "cert-border cert-border-pass2" : "cert-border"}>
        {passTwo && (
          <div className="cert-stamp">
            <span>⟲ TIMELINE RESET · PASS II</span>
            <span>IRON RING RE-CLEARED</span>
          </div>
        )}
        <p className="font-pixel text-[10px] tracking-widest text-muted-foreground">OSCAR'S GIT SPACE ADVENTURE</p>
        <h1 className="mt-2 font-pixel text-xl text-primary">{title}</h1>
        <p className="mt-6 text-sm text-muted-foreground">This certifies that</p>
        <p className="cert-name">{cert.studentName}</p>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-foreground">{achievement}</p>
        <p className="mt-6 text-sm text-muted-foreground">Completed {fmtDate(cert.completedAt)}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">Verification code: {cert.verificationCode}</p>
      </div>

      <div className="evidence-panel">
        <h2 className="font-pixel text-[9px] text-muted-foreground">VERIFICATION EVIDENCE</h2>
        <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Milestone reached</dt>
            <dd className="font-medium">{cert.milestone}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Total play time</dt>
            <dd className="font-medium">{fmtTime(cert.playTimeSeconds)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Commands demonstrated</dt>
            <dd className="font-mono">{cert.commandsDemonstrated.join(" · ")}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Checkpoint evidence (hash — message)</dt>
            <dd className="font-mono">
              {cert.commitEvidence.map((c) => (
                <div key={c.hash}>
                  <span className="hash-flash">{c.hash}</span> — {c.message}
                </div>
              ))}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-[10px] text-muted-foreground">
          Generated locally by Oscar's Git Space Adventure as classroom completion evidence. Not
          cryptographically or server verified.
        </p>
      </div>
    </div>
  );
}

function CertificatePage() {
  const { part } = Route.useParams();
  const partNum = part === "2" ? 2 : 1;
  const [cert, setCert] = useState<CertificateData | null | undefined>(undefined);

  useEffect(() => {
    const save = loadSave();
    setCert(save?.certificates.find((c) => c.part === partNum) ?? null);
  }, [partNum]);

  if (cert === undefined) return null;
  if (cert === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-foreground">
        <p>No Part {partNum} certificate has been earned in this browser yet.</p>
        <Link to="/" className="rounded bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
          Return to game
        </Link>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background p-4 text-foreground md:p-8">
      <div className="no-print mx-auto mb-4 flex max-w-3xl gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          Print Certificate
        </button>
        <Link to="/" className="rounded border border-border px-4 py-2 text-sm text-foreground hover:bg-accent">
          Return to Game
        </Link>
      </div>
      <CertificateView cert={cert} />
    </div>
  );
}
