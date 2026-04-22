interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-label="규봇"
      role="img"
    >
      {/* 말풍선 외곽선 */}
      <path
        d="M8 11 Q8 4 15 4 L70 4 Q78 4 78 11 L78 57 Q78 65 70 65 L31 65 L18 81 L18 65 Q8 65 8 57 Z"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* 텍스트 라인 1 */}
      <line
        x1="22"
        y1="28"
        x2="64"
        y2="28"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* 텍스트 라인 2 (빨간색) */}
      <line
        x1="22"
        y1="44"
        x2="50"
        y2="44"
        stroke="#E8473F"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* 의료 십자 - 세로 */}
      <line
        x1="78"
        y1="62"
        x2="78"
        y2="86"
        stroke="#E8473F"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* 의료 십자 - 가로 */}
      <line
        x1="66"
        y1="74"
        x2="90"
        y2="74"
        stroke="#E8473F"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}
