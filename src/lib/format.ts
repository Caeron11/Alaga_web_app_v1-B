const TZ = "Asia/Manila";

export const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-PH", { timeZone: TZ, month: "short", day: "numeric", year: "numeric" });

export const fmtTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString("en-PH", { timeZone: TZ, hour: "numeric", minute: "2-digit" });

export const fmtDateTime = (iso: string): string => `${fmtDate(iso)}, ${fmtTime(iso)}`;
