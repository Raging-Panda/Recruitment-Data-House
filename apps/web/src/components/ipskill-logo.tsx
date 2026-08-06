export function IPSkillLogo({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
      <circle cx="50" cy="50" r="48" stroke="#7C3AED" strokeWidth="1.5" opacity="0.25" />
      {[42, 36, 30, 24, 18].map((r, i) => (
        <path
          key={r}
          d={`M ${50 - r} 50 a ${r} ${r} 0 1 1 ${r * 2} 0`}
          stroke="#A855F7"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity={1 - i * 0.12}
        />
      ))}
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fontSize="24"
        fontWeight={800}
        fill="#F5F5FA"
        fontFamily="Inter, sans-serif"
      >
        IP
      </text>
    </svg>
  );
}
