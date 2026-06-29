export function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function smoothstep01(t) {
  const value = clamp01(t);
  return value * value * (3 - 2 * value);
}

export function segment(t, start, end) {
  if (end === start) {
    return t >= end ? 1 : 0;
  }
  return clamp01((t - start) / (end - start));
}

export function sequenceProgress(t, segments) {
  return segments.map(({ start, end, easing }) => {
    const value = segment(t, start, end);
    return easing ? easing(value) : value;
  });
}
