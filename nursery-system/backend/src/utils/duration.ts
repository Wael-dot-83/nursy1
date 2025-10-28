const timeMultipliers: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export function durationToMs(input: string) {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(input.trim());
  if (!match) {
    throw new Error(`Invalid duration format: ${input}`);
  }

  const [, value, unit] = match;
  return parseInt(value, 10) * timeMultipliers[unit];
}
