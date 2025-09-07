import { cn } from "@/lib/utils";

interface RiskGaugeProps {
  value: number; // 0-100
  size?: number;
  className?: string;
  showValue?: boolean;
  animated?: boolean;
}

export function RiskGauge({ 
  value, 
  size = 120, 
  className, 
  showValue = true, 
  animated = true 
}: RiskGaugeProps) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  // Determine color based on risk level
  const getColor = (score: number) => {
    if (score >= 90) return "hsl(var(--destructive))";
    if (score >= 70) return "hsl(var(--secondary))";
    if (score >= 40) return "hsl(var(--chart-3))";
    return "hsl(var(--accent))";
  };

  const color = getColor(value);
  
  return (
    <div 
      className={cn("gauge-container flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      data-testid="risk-gauge"
    >
      <svg width={size} height={size} className="absolute">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="gauge-bg"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="8"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={animated ? "transition-all duration-500 ease-in-out" : ""}
          data-testid="gauge-fill"
        />
        
        {showValue && (
          <text
            x={size / 2}
            y={size / 2 + 6}
            textAnchor="middle"
            className="text-2xl font-bold fill-current"
            style={{ fill: color }}
            data-testid="gauge-value"
          >
            {Math.round(value)}
          </text>
        )}
      </svg>
    </div>
  );
}
