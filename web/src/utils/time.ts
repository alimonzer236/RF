export const nsToFriendly = (ns: number): string => {
  if (ns >= 1_000_000) {
    return `${(ns / 1_000_000).toFixed(3)} ms`;
  }

  if (ns >= 1_000) {
    return `${(ns / 1_000).toFixed(3)} µs`;
  }

  return `${ns} ns`;
};
