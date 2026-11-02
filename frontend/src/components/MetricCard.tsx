import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  change?: number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "teal" | "blue" | "emerald" | "amber" | "purple";
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  change,
  icon,
  variant = "default",
}) => {
  const getCardClasses = () => {
    switch (variant) {
      case "blue":
        return "kpi-blue";
      case "teal":
      case "emerald":
        return "kpi-teal";
      case "purple":
        return "kpi-purple";
      case "amber":
        return "kpi-amber";
      default:
        return "fintech-card";
    }
  };

  const getIconContainerClasses = () => {
    switch (variant) {
      case "blue":
        return "bg-[#E2ECFF] text-[#3563A6] border border-[#C4D9FF]";
      case "teal":
      case "emerald":
        return "bg-[#DDF5EF] text-[#20A896] border border-[#B2EADF]";
      case "purple":
        return "bg-[#EEE9FF] text-[#8574D6] border border-[#D5CBFB]";
      case "amber":
        return "bg-[#FFF2D9] text-[#D99A35] border border-[#F7DBB4]";
      default:
        return "bg-[#F0F4FA] text-[#3563A6] border border-[#DCE6F5]";
    }
  };

  return (
    <div className={`${getCardClasses()} p-3.5`}>
      <div className="flex items-center justify-between text-[11px] text-[#718096]">
        <span className="font-semibold uppercase tracking-wider">{title}</span>
        {icon && (
          <div className={`flex h-6 w-6 items-center justify-center rounded-md ${getIconContainerClasses()}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-1.5 flex items-baseline justify-between">
        <div className="text-lg sm:text-xl font-bold tracking-tight text-[#24344D] font-mono">
          {value}
        </div>

        {change !== undefined && (
          <div
            className={`flex items-center space-x-0.5 text-xs font-semibold ${
              change > 0 ? "text-[#20A896]" : change < 0 ? "text-[#DC2626]" : "text-[#718096]"
            }`}
          >
            {change > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : change < 0 ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            <span>{change > 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`}</span>
          </div>
        )}
      </div>

      {subtext && <div className="mt-1 text-[11px] text-[#718096] truncate">{subtext}</div>}
    </div>
  );
};
