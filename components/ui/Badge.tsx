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
  const baseClasses = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-tight transition-all';

  const variantMap = {
    default: 'bg-slate-800/80 text-slate-300 border border-white/[0.08]',
    success: 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 shadow-sm',
    warning: 'bg-amber-950/70 text-amber-300 border border-amber-500/30 shadow-sm',
    secondary: 'bg-sky-950/70 text-sky-300 border border-sky-500/30 shadow-sm',
    outline: 'border border-slate-700/80 text-slate-400 bg-transparent',
    zone: 'text-white shadow-sm'
  };

  const customStyle = colorHex
    ? { backgroundColor: `${colorHex}18`, color: colorHex, borderColor: `${colorHex}45`, ...style }
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

