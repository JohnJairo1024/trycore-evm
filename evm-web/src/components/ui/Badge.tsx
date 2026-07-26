import type { ReactNode } from 'react';

type BadgeVariant = 'success' | 'danger' | 'info' | 'neutral' | 'warning';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  value: string | number;
  variant: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  subtitle?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-evm-success-light text-evm-success',
  danger: 'bg-evm-danger-light text-evm-danger',
  info: 'bg-evm-info-light text-evm-info',
  neutral: 'bg-evm-neutral-light text-evm-neutral',
  warning: 'bg-evm-warning-light text-evm-warning',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export function Badge({
  value,
  variant,
  size = 'md',
  icon,
  subtitle,
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex flex-col items-center gap-0.5
        rounded-lg font-semibold
        ${variantClasses[variant]}
        ${sizeClasses[size]}
      `}
    >
      <span className="flex items-center gap-1">
        {icon && <span className="text-xs">{icon}</span>}
        <span>{value}</span>
      </span>
      {subtitle && (
        <span className="text-[10px] font-normal opacity-80">{subtitle}</span>
      )}
    </span>
  );
}

/** Versión simplificada del badge (solo texto + color) */
export function MiniBadge({
  value,
  variant,
  size = 'sm',
}: {
  value: string | number;
  variant: BadgeVariant;
  size?: BadgeSize;
}) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full font-semibold
        ${variantClasses[variant]}
        ${sizeClasses[size]}
      `}
    >
      {value}
    </span>
  );
}
