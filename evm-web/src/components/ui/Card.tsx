import type { HTMLAttributes } from 'react';

type CardPadding = 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: CardPadding;
}

const paddingClasses: Record<CardPadding, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  hover = false,
  padding = 'md',
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`
        bg-evm-card rounded-lg border border-evm-border shadow-evm-card
        ${paddingClasses[padding]}
        ${
          hover
            ? 'hover:shadow-evm-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer'
            : ''
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
