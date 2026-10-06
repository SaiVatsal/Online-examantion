import React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercent?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'warning' | 'destructive';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercent = false,
  size = 'md',
  variant = 'primary',
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const variants = {
    primary: 'bg-primary',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    destructive: 'bg-red-500',
  };

  return (
    <div className={cn('w-full space-y-1', className)}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          {label && <span className="font-medium text-foreground">{label}</span>}
          {showPercent && <span>{percentage}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn('h-full transition-all duration-300 rounded-full', variants[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
