import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-[#060913] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.97] cursor-pointer';

    const variantClasses = {
      primary:
        'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 border border-emerald-400/40',
      secondary:
        'bg-slate-850 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/[0.08] hover:border-white/[0.15] shadow-sm',
      outline:
        'border border-slate-700/80 hover:border-slate-500/80 bg-slate-900/50 hover:bg-slate-800 text-slate-300 hover:text-white backdrop-blur-md',
      danger:
        'bg-rose-600/90 hover:bg-rose-500 text-white shadow-md shadow-rose-600/25 border border-rose-500/30',
      ghost:
        'hover:bg-white/[0.06] text-slate-400 hover:text-white',
      success:
        'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/25 border border-emerald-300/30',
      glass:
        'bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.12] backdrop-blur-md shadow-sm'
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs gap-1.5 tracking-tight',
      md: 'px-4 py-2 text-xs sm:text-sm gap-2',
      lg: 'px-5 py-2.5 text-sm sm:text-base gap-2.5 font-bold',
      icon: 'p-2 w-10 h-10 rounded-xl'
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

