"use client";

import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportActions() {
  return (
    <div className="print-hidden flex items-center gap-2">
      <Button variant="outline" onClick={() => window.print()}>
        <Printer />
        Print
      </Button>
      <Button variant="premium" onClick={() => window.print()}>
        <Download />
        Download PDF
      </Button>
    </div>
  );
}
