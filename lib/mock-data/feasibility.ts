import type { Feasibility, Plot } from "@/lib/schemas";

const statusFromPlot = (plot: Plot) => {
  const warnings = [
    plot.intersections.dpReservation ? "DP reservation intersects or influences this plot." : "",
    plot.intersections.waterBody ? "Water body/canal influence requires buffer verification." : "",
    plot.intersections.railway ? "Railway influence requires NOC/setback confirmation." : "",
    plot.intersections.htLine ? "HT line corridor may restrict development envelope." : "",
    plot.nearbyRoadWidthM < 9 ? "Road width is below preferred threshold for higher intensity." : ""
  ].filter(Boolean);

  const hardConstraints = [
    plot.intersections.waterBody,
    plot.intersections.railway && plot.nearbyRoadWidthM < 9,
    plot.restrictionStatus === "Restricted"
  ].filter(Boolean).length;

  const softConstraints = [
    plot.intersections.dpReservation,
    plot.intersections.gamthal,
    plot.intersections.htLine,
    plot.nearbyRoadWidthM < 12
  ].filter(Boolean).length;

  const score = Math.max(28, Math.round(92 - hardConstraints * 22 - softConstraints * 9 + Math.min(plot.fsi, 2.4) * 3));

  return { score, warnings };
};

export function buildFeasibility(plot: Plot): Feasibility {
  const { score, warnings } = statusFromPlot(plot);
  const verdict =
    score >= 78 ? "Strong potential" : score >= 56 ? "Proceed with checks" : "High constraint";

  return {
    plotId: plot.id,
    score,
    verdict,
    developmentPotential:
      score >= 78
        ? "Suitable for early-stage development exploration with routine TPVD and authority verification."
        : score >= 56
          ? "Potentially viable, but constraints should be cleared before design or acquisition commitments."
          : "High-risk plot for immediate development. Resolve statutory and spatial constraints first.",
    permissibleFsi: plot.fsi,
    maxBuiltUpAreaSqM: plot.permissibleBuiltUpAreaSqM,
    roadWidthImpact:
      plot.nearbyRoadWidthM >= 18
        ? "Road frontage supports stronger access and higher-intensity feasibility assumptions."
        : plot.nearbyRoadWidthM >= 12
          ? "Road width is acceptable for moderate development intensity."
          : "Narrow approach road can reduce height, parking, fire access, and redevelopment feasibility.",
    setbacks: plot.setbacks,
    heightLimitM: plot.heightLimitM,
    reservationImpact: plot.intersections.dpReservation
      ? "Reservation influence detected. Confirm affected area, reservation purpose, and compensation/reconstitution treatment."
      : "No mock DP reservation intersection detected.",
    waterBodyImpact: plot.intersections.waterBody
      ? "Water body/canal influence detected. Buffer, flood, and drainage rules require verification."
      : "No mock water body intersection detected.",
    railwayHtImpact:
      plot.intersections.railway || plot.intersections.htLine
        ? "Railway and/or HT utility influence detected. NOC, safety corridor, and height clearance checks may apply."
        : "No mock railway or HT line intersection detected.",
    warnings,
    checklist: [
      {
        id: "road-width",
        label: "Road width supports proposed intensity",
        status: plot.nearbyRoadWidthM >= 12 ? "pass" : "warning",
        note: `${plot.nearbyRoadWidthM} m road width recorded.`
      },
      {
        id: "reservation",
        label: "No DP reservation impact",
        status: plot.intersections.dpReservation ? "warning" : "pass",
        note: plot.intersections.dpReservation ? "Reservation influence must be verified." : "No reservation impact in mock data."
      },
      {
        id: "water",
        label: "No water body constraint",
        status: plot.intersections.waterBody ? "fail" : "pass",
        note: plot.intersections.waterBody ? "Water body/canal influence found." : "No water body intersection in mock data."
      },
      {
        id: "rail-ht",
        label: "No railway or HT corridor conflict",
        status: plot.intersections.railway || plot.intersections.htLine ? "warning" : "pass",
        note:
          plot.intersections.railway || plot.intersections.htLine
            ? "Corridor clearance/NOC likely required."
            : "No railway/HT conflict in mock data."
      },
      {
        id: "fsi",
        label: "FSI calculation available",
        status: plot.fsi > 0 ? "pass" : "fail",
        note: `Permissible FSI ${plot.fsi.toFixed(2)}; buildable area ${plot.permissibleBuiltUpAreaSqM.toLocaleString()} sq m.`
      }
    ],
    risks: [
      {
        label: "Statutory constraint risk",
        level: plot.restrictionStatus === "Restricted" ? "high" : plot.restrictionStatus === "Watch" ? "medium" : "low",
        description: plot.restrictionStatus === "Clear" ? "No major mock restriction flagged." : "Restrictions require authority verification."
      },
      {
        label: "Infrastructure interface",
        level: plot.intersections.railway || plot.intersections.htLine ? "high" : plot.intersections.dpReservation ? "medium" : "low",
        description: "Evaluates rail, HT, reservation, and public infrastructure impacts."
      },
      {
        label: "Access intensity",
        level: plot.nearbyRoadWidthM >= 18 ? "low" : plot.nearbyRoadWidthM >= 9 ? "medium" : "high",
        description: "Road width can affect height, use, parking, fire access, and approvals."
      }
    ]
  };
}
