import React from 'react';
import { SessionHistoryEntry } from '../types';

interface ProgressChartProps {
  history: SessionHistoryEntry[];
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ history }) => {
  if (history.length < 2) return null;

  const width = 280;
  const height = 100;
  const padding = { top: 10, right: 10, bottom: 20, left: 30 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = history.map((entry, i) => ({
    x: padding.left + (i / (history.length - 1)) * chartW,
    y: padding.top + chartH - (entry.scorePercentage / 100) * chartH,
    pct: entry.scorePercentage,
  }));

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');

  // Y-axis labels
  const yLabels = [0, 50, 100];

  return (
    <div className="w-full flex justify-center">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[280px]"
        preserveAspectRatio="xMidYMid meet"
      >
        <title>Voortgang sessies</title>
        <desc>Lijngrafiek van scorepercentages over {history.length} sessies</desc>
        {/* Grid lines */}
        {yLabels.map(pct => {
          const y = padding.top + chartH - (pct / 100) * chartH;
          return (
            <g key={pct}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartW}
                y2={y}
                className="stroke-slate-200 dark:stroke-slate-600"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
              <text
                x={padding.left - 4}
                y={y + 3}
                textAnchor="end"
                className="fill-slate-400 dark:fill-slate-500"
                fontSize="8"
              >
                {pct}%
              </text>
            </g>
          );
        })}

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          className="stroke-blue-500 dark:stroke-blue-400"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 4 : 2.5}
            className={
              i === points.length - 1
                ? 'fill-blue-600 dark:fill-blue-300'
                : 'fill-blue-400 dark:fill-blue-500'
            }
          />
        ))}

        {/* Last point label */}
        {points.length > 0 && (
          <text
            x={points[points.length - 1].x}
            y={points[points.length - 1].y - 8}
            textAnchor="middle"
            className="fill-blue-600 dark:fill-blue-300 font-bold"
            fontSize="9"
          >
            {points[points.length - 1].pct}%
          </text>
        )}

        {/* X-axis label */}
        <text
          x={padding.left + chartW / 2}
          y={height - 2}
          textAnchor="middle"
          className="fill-slate-400 dark:fill-slate-500"
          fontSize="8"
        >
          {history.length} sessies
        </text>
      </svg>
    </div>
  );
};
