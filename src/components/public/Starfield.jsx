import { useMemo } from "react";

export default function Starfield() {
  const stars = useMemo(() =>
    Array.from({ length: 120 }, (_, i) => ({
      x: ((i * 137.508) % 100).toFixed(2),
      y: ((i * 97.314 + i * 0.4) % 100).toFixed(2),
      r: ((i % 3) * 0.6 + 0.4).toFixed(1),
      opacity: ((i % 8) * 0.07 + 0.1).toFixed(2),
      delay: ((i % 5) * 0.9).toFixed(1),
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.r}px`,
            height: `${s.r}px`,
            opacity: s.opacity,
            animationDelay: `${s.delay}s`,
            animationDuration: `${2 + (i % 4) * 0.8}s`,
          }}
        />
      ))}
    </div>
  );
}