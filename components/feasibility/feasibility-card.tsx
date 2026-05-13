"use client";

import { AlertTriangle, CheckCircle2, CircleX, Gauge, ShieldAlert } from "lucide-react";
import type { ChecklistStatus, Feasibility } from "@/lib/schemas";
import { formatArea } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const checklistIcon = {
  pass: CheckCircle2,
  warning: AlertTriangle,
  fail: CircleX
};

const checklistClass: Record<ChecklistStatus, string> = {
  pass: "text-emerald-700",
  warning: "text-amber-700",
  fail: "text-red-700"
};

export function FeasibilityCard({ feasibility, compact = false }: { feasibility: Feasibility; compact?: boolean }) {
  const scoreTone =
    feasibility.score >= 78 ? "bg-emerald-600" : feasibility.score >= 56 ? "bg-amber-500" : "bg-red-600";
  const checklistCounts = feasibility.checklist.reduce(
    (counts, item) => ({
      ...counts,
      [item.status]: counts[item.status] + 1
    }),
    { pass: 0, warning: 0, fail: 0 } as Record<ChecklistStatus, number>
  );
  const visibleRisks = compact ? feasibility.risks.filter((risk) => risk.level !== "low").slice(0, 2) : feasibility.risks;
  const visibleChecklist = compact ? feasibility.checklist.slice(0, 4) : feasibility.checklist;

  return (
    <Card className="shadow-none">
      <CardHeader className={compact ? "p-4 pb-2" : undefined}>
        <CardTitle className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            Feasibility Score
          </span>
          <Badge variant={feasibility.score >= 78 ? "success" : feasibility.score >= 56 ? "warning" : "danger"}>
            {feasibility.verdict}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className={compact ? "space-y-4 p-4 pt-0" : "space-y-4"}>
        <div>
          <div className="mb-2 flex items-end justify-between">
            <span className="text-3xl font-bold text-slate-950">{feasibility.score}</span>
            <span className="text-xs font-semibold uppercase text-slate-500">out of 100</span>
          </div>
          <Progress value={feasibility.score} indicatorClassName={scoreTone} />
          <p className="mt-2 text-sm leading-5 text-slate-600">{feasibility.developmentPotential}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs text-slate-500">Permissible FSI</div>
            <div className="text-lg font-semibold text-slate-900">{feasibility.permissibleFsi.toFixed(2)}</div>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs text-slate-500">Max built-up</div>
            <div className="text-lg font-semibold text-slate-900">{formatArea(feasibility.maxBuiltUpAreaSqM)}</div>
          </div>
        </div>

        <div className="rounded-md border border-blue-100 bg-blue-50 p-3">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-blue-950">
            <ShieldAlert className="h-4 w-4" />
            {compact ? "Key review items" : "Risk indicators"}
          </div>
          {compact ? (
            <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-md bg-white/70 p-2 font-semibold text-emerald-700">{checklistCounts.pass} pass</div>
              <div className="rounded-md bg-white/70 p-2 font-semibold text-amber-700">{checklistCounts.warning} warn</div>
              <div className="rounded-md bg-white/70 p-2 font-semibold text-red-700">{checklistCounts.fail} fail</div>
            </div>
          ) : null}
          <div className="space-y-2">
            {visibleRisks.map((risk) => (
              <div key={risk.label} className="flex items-start justify-between gap-3 text-xs">
                <span>
                  <span className="block font-semibold text-slate-800">{risk.label}</span>
                  {!compact ? <span className="text-slate-500">{risk.description}</span> : null}
                </span>
                <Badge variant={risk.level === "low" ? "success" : risk.level === "medium" ? "warning" : "danger"}>
                  {risk.level}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {visibleChecklist.map((item) => {
            const Icon = checklistIcon[item.status];
            return (
              <div key={item.id} className="flex gap-2 rounded-md border bg-white p-2">
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${checklistClass[item.status]}`} />
                <div>
                  <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                  <div className="text-xs leading-5 text-slate-500">{item.note}</div>
                </div>
              </div>
            );
          })}
          {compact && feasibility.checklist.length > visibleChecklist.length ? (
            <div className="rounded-md border border-dashed bg-slate-50 p-2 text-xs font-medium text-slate-500">
              Full compliance checklist is included in the printable report.
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
