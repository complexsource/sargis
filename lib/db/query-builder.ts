import type { SearchFilters } from "@/lib/schemas";

export class QB {
  readonly clauses: string[] = [];
  readonly params: unknown[] = [];

  push(clause: string, ...values: unknown[]) {
    let idx = this.params.length + 1;
    this.clauses.push(clause.replace(/\?/g, () => `$${idx++}`));
    this.params.push(...values);
    return this;
  }

  ilike(field: string, value: string | undefined) {
    if (!value) return this;
    return this.push(`${field} ILIKE ?`, `%${value}%`);
  }

  eq(field: string, value: string | number | undefined) {
    if (value === undefined || value === null || value === "") return this;
    return this.push(`${field} = ?`, value);
  }

  gte(field: string, value: number | undefined) {
    if (value === undefined) return this;
    return this.push(`${field} >= ?`, value);
  }

  lte(field: string, value: number | undefined) {
    if (value === undefined) return this;
    return this.push(`${field} <= ?`, value);
  }

  bool(field: string, value: boolean | undefined) {
    if (value === undefined) return this;
    return this.push(`${field} = ?`, value);
  }

  where() {
    return this.clauses.length ? `WHERE ${this.clauses.join(" AND ")}` : "";
  }
}

export function buildTpsWhere(qb: QB, filters: SearchFilters, prefix = "") {
  const p = prefix ? `${prefix}.` : "";
  if (filters.query) {
    qb.push(
      `(${p}district ILIKE ? OR ${p}city ILIKE ? OR ${p}authority ILIKE ? OR ${p}village ILIKE ? OR ${p}tps_name ILIKE ? OR ${p}title ILIKE ? OR ${p}tps_no ILIKE ?)`,
      ...Array(7).fill(`%${filters.query}%`)
    );
  }
  if (filters.district) {
    qb.push(
      `(${p}district ILIKE ? OR ${p}city ILIKE ? OR ${p}village ILIKE ? OR ${p}tps_name ILIKE ? OR ${p}title ILIKE ?)`,
      ...Array(5).fill(`%${filters.district}%`)
    );
  }
  qb.eq(`${p}city`, filters.city);
  qb.eq(`${p}authority`, filters.urbanAuthority);
  qb.ilike(`${p}village`, filters.village);
  qb.ilike(`${p}tps_no`, filters.tpsNumber);
  if (filters.tpsName) {
    qb.push(`(${p}tps_name ILIKE ? OR ${p}title ILIKE ?)`, `%${filters.tpsName}%`, `%${filters.tpsName}%`);
  }
  return qb;
}

export function buildPlotWhere(qb: QB, filters: SearchFilters, prefix = "fp") {
  const p = `${prefix}.`;
  if (filters.query) {
    qb.push(
      `(${p}fp_no ILIKE ? OR ${p}tps_name ILIKE ? OR ${p}city ILIKE ? OR ${p}district ILIKE ?)`,
      ...Array(4).fill(`%${filters.query}%`)
    );
  }
  if (filters.district) {
    qb.push(
      `(${p}district ILIKE ? OR ${p}city ILIKE ? OR ${p}village ILIKE ?)`,
      ...Array(3).fill(`%${filters.district}%`)
    );
  }
  qb.eq(`${p}city`, filters.city);
  qb.eq(`${p}authority`, filters.urbanAuthority);
  qb.ilike(`${p}village`, filters.village);
  qb.eq(`${p}tps_no`, filters.tpsNumber);
  qb.ilike(`${p}tps_name`, filters.tpsName);
  qb.ilike(`${p}fp_no`, filters.finalPlotNumber);
  if (filters.plotId) {
    const numId = Number(filters.plotId);
    if (Number.isInteger(numId) && String(numId) === filters.plotId) {
      qb.push(`(${p}gid = ? OR ${p}fp_no ILIKE ?)`, numId, `%${filters.plotId}%`);
    } else {
      qb.ilike(`${p}fp_no`, filters.plotId);
    }
  }
  if (filters.reservationType) {
    qb.push(`(${p}reser_type ILIKE ? OR ${p}reser_use ILIKE ?)`, `%${filters.reservationType}%`, `%${filters.reservationType}%`);
  }
  qb.gte(`${p}fp_area_sqm`, filters.minArea);
  qb.lte(`${p}fp_area_sqm`, filters.maxArea);
  qb.bool("pc.water_body_affected", filters.waterBodyAffected);
  qb.bool("pc.gamthal_affected", filters.gamthalAffected);
  qb.bool("pc.dp_reservation_affected", filters.dpReservationAffected);
  qb.bool("pc.railway_affected", filters.railwayAffected);
  qb.bool("pc.ht_line_affected", filters.htLineAffected);
  return qb;
}

export function usesFinalPlots(filters: SearchFilters) {
  return !!(
    filters.plotId ||
    filters.finalPlotNumber ||
    filters.reservationType ||
    (filters.minArea !== undefined && filters.minArea > 0) ||
    (filters.maxArea !== undefined && filters.maxArea > 0) ||
    filters.waterBodyAffected !== undefined ||
    filters.gamthalAffected !== undefined ||
    filters.dpReservationAffected !== undefined ||
    filters.railwayAffected !== undefined ||
    filters.htLineAffected !== undefined
  );
}
