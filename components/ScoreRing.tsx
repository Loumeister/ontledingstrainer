import React, { useEffect, useState } from 'react';

interface ScoreRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  percentage,
  size = 140,
  strokeWidth = 10,
}) => {
  const [animatedPct, setAnimatedPct] = useState(0);

  useEffect(() => {
    // Animate from 0 to percentage
    const timer = setTimeout(() => setAnimatedPct(percentage), 50);
    return () => clearTimeout(timer);
  }, [percentage]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPct / 100) * circumference;

  const color =
    percentage >= 80
      ? 'text-green-500 dark:text-green-400'
      : percentage >= 55
      ? 'text-blue-500 dark:text-blue-400'
      : 'text-orange-500 dark:text-orange-400';

  const trackColor = 'text-slate-200 dark:text-slate-700';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={trackColor}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${color} transition-[stroke-dashoffset] duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-black ${color}`}>{percentage}%</span>
      </div>
    </div>
  );
};
