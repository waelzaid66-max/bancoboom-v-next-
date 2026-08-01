/**
 * Shared ?map=1 deep-link latch helpers (MOB-07 / MAP-01).
 * SectionSearchApp + BookingStaysApp must agree: open as soon as results exist;
 * never wait for page pins (server clusters fill gaps).
 */

/** Normalize Expo Router `map` query (string | string[]) into a latch boolean. */
export function wantsMapFromParam(
  mapParam: string | string[] | undefined | null,
): boolean {
  const v = Array.isArray(mapParam) ? mapParam[0] : mapParam;
  return v === "1" || v === "true";
}

/**
 * Header / FAB map press: open immediately when results are ready, otherwise
 * latch until the browse lands on results (or empty/error clears the latch).
 */
export function openOrLatchMap(opts: {
  inResultsView: boolean;
  setMapMode: (open: boolean) => void;
  setWantMap: (want: boolean) => void;
}): void {
  if (opts.inResultsView) {
    opts.setMapMode(true);
    opts.setWantMap(false);
  } else {
    opts.setWantMap(true);
  }
}

/**
 * Resolve a pending Discover/?map=1 latch once the host has a results (or
 * empty/error) view. Call from a useEffect depending on wantMap + viewState.
 */
export function resolveMapLatch(opts: {
  wantMap: boolean;
  inResultsView: boolean;
  viewState: string;
  setMapMode: (open: boolean) => void;
  setWantMap: (want: boolean) => void;
}): void {
  if (!opts.wantMap) return;
  if (opts.inResultsView) {
    opts.setMapMode(true);
    opts.setWantMap(false);
  } else if (opts.viewState === "empty" || opts.viewState === "error") {
    opts.setWantMap(false);
  }
}
