export function formatArea(value: number) {
  return `${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })} sq m`;
}

export function formatHa(value: number) {
  return `${value.toLocaleString("en-IN", { maximumFractionDigits: 1 })} ha`;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function formatNumber(value: number, maximumFractionDigits = 0) {
  return value.toLocaleString("en-IN", { maximumFractionDigits });
}
