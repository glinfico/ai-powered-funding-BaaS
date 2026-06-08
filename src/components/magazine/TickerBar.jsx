import { useEffect, useRef, useState } from "react";

const FALLBACK_HEADLINES = [
  "FED HOLDS RATES — PCE AT 2.4% — THIRD STRAIGHT PAUSE EXPECTED IN Q3",
  "S&P 500 HITS RECORD — AI EARNINGS BEAT CONSENSUS BY 12% AVERAGE",
  "IMF RAISES GLOBAL GROWTH FORECAST TO 3.2% FOR 2026",
  "COMMERCIAL REAL ESTATE DEBT WALL: $929 BILLION MATURES IN 2026",
  "TRANSATLANTIC BUSINESS CLASS FARES FALL 22% ON OVERCAPACITY",
  "TERM LIFE PREMIUMS HIT DECADE LOW — $500K COVERAGE FROM $28/MONTH",
];

export default function TickerBar({ articles = [] }) {
  const headlines =
    articles.length > 0
      ? articles.map((a) => `${(a.category || "").toUpperCase()}: ${a.headline}`)
      : FALLBACK_HEADLINES;

  const tickerText = headlines.join("   ·   ");

  return (
    <div className="bg-black text-white overflow-hidden" style={{ height: "32px" }}>
      <div className="flex items-center h-full">
        <span className="bg-red-600 text-white font-sans font-bold text-[10px] tracking-widest px-3 py-1 flex-shrink-0 h-full flex items-center">
          BREAKING
        </span>
        <div className="overflow-hidden flex-1 relative">
          <div
            className="whitespace-nowrap font-sans font-semibold text-[11px] tracking-wide"
            style={{
              display: "inline-block",
              animation: "ticker-scroll 60s linear infinite",
            }}
          >
            {tickerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{tickerText}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}