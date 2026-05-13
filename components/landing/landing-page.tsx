import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FileText,
  Layers3,
  MapPinned,
  ShieldCheck,
  Sparkles,
  Table2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: MapPinned,
    title: "TPS + Plot Discovery",
    text: "Search by TP scheme, village, survey, original plot, final plot, road, and district context."
  },
  {
    icon: Layers3,
    title: "TPVD-Style Layer Stack",
    text: "Inspect plot boundaries, TPS boundaries, survey lines, roads, water bodies, Gamtal, DP reservation, rail, and HT corridors."
  },
  {
    icon: Table2,
    title: "Map-Synced Results",
    text: "Move between GIS features, TPS tables, plot rows, and selected plot details without losing context."
  },
  {
    icon: FileText,
    title: "Report-Ready Analysis",
    text: "Generate a structured feasibility snapshot with zoning, intersections, FSI, setbacks, warnings, and disclaimers."
  }
];

const audiences = [
  "Town planners",
  "Architects",
  "Developers",
  "Citizens",
  "Government teams",
  "Legal due diligence"
];

const workflow = [
  "Search a TPS or final plot",
  "Toggle civic GIS constraints",
  "Review plot and source metadata",
  "Score feasibility and print a report"
];

const stats = [
  { value: "25+", label: "GIS layers" },
  { value: "Live", label: "TPVD WMS data" },
  { value: "WFS", label: "Real-time queries" },
  { value: "PDF", label: "Report output" }
];

function SargisLogo({ size = "md", onDark = false }: { size?: "sm" | "md" | "lg"; onDark?: boolean }) {
  const iconSize = size === "sm" ? "h-7 w-7 text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-9 w-9 text-sm";
  const textSize = size === "sm" ? "text-base" : size === "lg" ? "text-3xl" : "text-xl";
  const subSize = size === "sm" ? "text-[9px]" : "text-[10px]";

  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex ${iconSize} items-center justify-center rounded-lg bg-blue-600 font-black text-white shadow-md`}>
        S
      </div>
      <div className="flex flex-col leading-none">
        <span className={`${textSize} font-black tracking-tight`}>
          <span className={onDark ? "text-white" : "text-slate-950"}>SAR</span>
          <span className={onDark ? "text-blue-400" : "text-blue-600"}>GIS</span>
        </span>
        {size !== "sm" && (
          <span className={`${subSize} font-medium uppercase tracking-widest mt-0.5 ${onDark ? "text-slate-400" : "text-slate-500"}`}>
            Spatial GIS Platform
          </span>
        )}
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">

      {/* ── Header ── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur md:px-8">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
          <Link href="/">
            <SargisLogo size="sm" />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-950 transition-colors">Features</a>
            <a href="#workflow" className="hover:text-slate-950 transition-colors">Workflow</a>
            <a href="#audiences" className="hover:text-slate-950 transition-colors">Users</a>
          </nav>
          <Button asChild variant="premium">
            <Link href="/analyzer">
              Open Analyzer
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </header>

      {/* ── Hero Banner — color only, no image ── */}
      <section className="relative min-h-[92vh] overflow-hidden bg-slate-950 pt-16">
        {/* Background atmosphere — CSS only */}
        <div className="pointer-events-none absolute inset-0">
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
          {/* Color glows */}
          <div className="absolute -top-32 right-0 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute bottom-0 left-0 h-[400px] w-[500px] rounded-full bg-indigo-700/10 blur-[100px]" />
          <div className="absolute right-1/4 top-1/2 h-[300px] w-[300px] rounded-full bg-sky-500/8 blur-[80px]" />
        </div>

        {/* Hero content — centered */}
        <div className="relative z-10 mx-auto flex min-h-[calc(92vh-4rem)] max-w-5xl flex-col items-center justify-center px-4 py-24 text-center md:px-8">

          {/* Brand mark */}
          <div className="mb-8 flex justify-center">
            <SargisLogo size="lg" onDark />
          </div>

          <Badge variant="secondary" className="mb-6 bg-white/10 text-slate-200 hover:bg-white/15">
            Live TPVD WMS · Gujarat Spatial Planning Intelligence
          </Badge>

          <h1 className="max-w-4xl text-5xl font-black leading-[1.1] tracking-tight text-white md:text-7xl">
            Civic-grade plot intelligence{" "}
            <span className="bg-gradient-to-r from-blue-400 to-sky-300 bg-clip-text text-transparent">
              from map to report.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Search town planning schemes and plots, inspect civic GIS constraints, evaluate zoning feasibility, and prepare a professional planning report — all from one map-first workspace.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg">
              <Link href="/analyzer">
                Launch GIS Analyzer
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/8 text-white hover:bg-white/15">
              <a href="#features">View capabilities</a>
            </Button>
          </div>

          {/* Stats row */}
          <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
                <div className="text-2xl font-black text-blue-400">{stat.value}</div>
                <div className="mt-0.5 text-xs font-medium text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Workflow steps */}
          <div className="mt-10 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {workflow.map((item, index) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur">
                <div className="mb-2 text-xs font-black text-blue-400">0{index + 1}</div>
                <div className="text-sm font-semibold text-white">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-24 md:px-8">
        <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <Badge variant="outline">Built for planning due diligence</Badge>
            <h2 className="mt-4 max-w-xl text-3xl font-black tracking-tight md:text-5xl">
              A professional GIS desk, not a cloned portal.
            </h2>
          </div>
          <p className="max-w-md text-base leading-7 text-slate-600">
            SARGIS reinterprets TPVD-style functions into a modern civic-tech workspace with stronger hierarchy, faster inspection, and report-ready outputs.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="shadow-subtle border-slate-200 transition-shadow hover:shadow-md">
                <CardHeader>
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <CardTitle className="text-base font-bold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-slate-600">{feature.text}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Workflow ── */}
      <section id="workflow" className="bg-white py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 md:grid-cols-[0.9fr_1.1fr] md:items-center md:px-8">
          <div>
            <Badge variant="secondary">Analysis workflow</Badge>
            <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
              From cadastral signal to development risk.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              SARGIS connects spatial query, constraint analysis, zoning rules, and risk scoring into a single workflow — from raw WFS data to a printable due-diligence report.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Layer intersections", "Water bodies, Gamtal, DP reservations, railway, HT line, roads, and survey context."],
              ["Zoning calculations", "FSI, built-up area, road-width impacts, setbacks, height limits, and reservation notes."],
              ["Compliance checklist", "Pass, warning, and fail signals make early-stage risk easier to communicate."],
              ["Print report", "A PDF-ready page captures plot overview, maps, rules, calculations, warnings, and disclaimer."]
            ].map(([title, text]) => (
              <div key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-5 transition-colors hover:bg-blue-50/50">
                <CheckCircle2 className="mb-3 h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Audiences ── */}
      <section id="audiences" className="mx-auto max-w-7xl px-4 py-24 md:px-8">
        <div className="overflow-hidden rounded-2xl bg-slate-950 p-8 shadow-xl md:p-14">
          <div className="grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-center">
            <div>
              <Badge className="bg-blue-600/20 text-blue-300 hover:bg-blue-600/30">Multi-stakeholder clarity</Badge>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-5xl">
                Designed for people who need the same parcel truth.
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-400">
                A shared, searchable map workspace helps planning teams, consultants, landowners, and reviewers discuss the same scheme, boundary, and constraint context.
              </p>
              <Button asChild className="mt-8 bg-blue-600 hover:bg-blue-500 text-white">
                <Link href="/analyzer">
                  Open SARGIS Analyzer
                  <Sparkles />
                </Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {audiences.map((audience) => (
                <div key={audience} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10">
                  <BadgeCheck className="h-5 w-5 shrink-0 text-blue-400" />
                  <span className="font-semibold text-white">{audience}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white px-4 py-8 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <SargisLogo size="sm" />
            <span className="hidden h-4 w-px bg-slate-200 md:block" />
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Live TPVD data. Verify before production decisions.
            </div>
          </div>
          <Link href="/analyzer" className="text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors">
            Open GIS Analyzer →
          </Link>
        </div>
      </footer>
    </main>
  );
}
