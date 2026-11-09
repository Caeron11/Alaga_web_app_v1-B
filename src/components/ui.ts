/** Shared class strings: deterministic 3-tier buttons, focus ring, fields, badges. */
export const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

const BASE_BTN =
  "inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-control px-4 text-sm font-medium transition-colors duration-150 ease-alaga disabled:cursor-not-allowed disabled:opacity-50";

export const BTN_ACTIVE = `${BASE_BTN} bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-500 ${FOCUS}`;
export const BTN_GHOST = `${BASE_BTN} bg-slate-800/80 text-slate-200 border border-slate-700/80 hover:bg-slate-700 hover:text-white hover:border-slate-500 ${FOCUS}`;
export const BTN_DANGER = `${BASE_BTN} bg-rose-600 text-white font-semibold hover:bg-rose-500 ${FOCUS}`;

export const FIELD =
  `min-h-[44px] w-full rounded-control border border-slate-700/80 bg-slate-800/80 px-3 text-sm text-slate-100 placeholder:text-slate-400 transition-colors duration-150 ease-alaga hover:border-slate-500 ${FOCUS}`;

/** Badge protection: never wraps inside its pill. */
export const BADGE =
  "inline-flex min-w-fit items-center justify-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold";

export const HAIRLINE = "border-white/[0.08]";
