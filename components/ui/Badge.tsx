import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'secondary' | 'outline' | 'zone';
  colorHex?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  colorHex,
  style,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors';

  const variantMap = {
    default: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    secondary: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
    outline: 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300',
    zone: 'text-white shadow-sm'
  };

  const customStyle = colorHex
    ? { backgroundColor: `${colorHex}20`, color: colorHex, borderColor: `${colorHex}50`, ...style }
    : style;

  return (
    <span
      className={cn(baseClasses, variantMap[variant], className)}
      style={customStyle}
      {...props}
    >
      {children}
    </span>
  );
};
