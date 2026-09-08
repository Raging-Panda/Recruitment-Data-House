export function FingerprintPattern() {
  const rings = [90, 78, 66, 54, 42, 30, 18];
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 400 400"
      fill="none"
      aria-hidden
    >
      <g stroke="#5A18D6" strokeOpacity="0.12" strokeWidth="2">
        {rings.map((r, i) => (
          <path
            key={r}
            d={`M ${200 - r} 200 a ${r} ${r} 0 1 1 ${r * 2} 0`}
            strokeDasharray={i % 2 === 0 ? "40 14" : "60 20"}
            transform={`rotate(${i * 11} 200 200)`}
          />
        ))}
      </g>
    </svg>
  );
}
