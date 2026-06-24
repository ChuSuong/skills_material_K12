export function popThenFade(t, baseScale, popStart = 0.82) {
  if (t > popStart) {
    const popT = (t - popStart) / (1 - popStart);
    return {
      scale: baseScale * (1 + popT * 0.9),
      alpha: (1 - popT) * 0.9
    };
  }
  return {
    scale: (1 - t) * baseScale,
    alpha: 1 - t
  };
}
