import React from 'react';

type Variant = 'primary' | 'ghost' | 'danger' | 'secondary';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
}

const variantClass: Record<Variant, string> = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600 border-transparent',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-transparent',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 border-transparent',
  danger: 'bg-red-500 text-white hover:bg-red-600 border-transparent',
};

export function Button({ variant = 'secondary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded border font-medium transition-colors disabled:opacity-50 ${variantClass[variant]} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
