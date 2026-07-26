import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon = '\uD83D\uDCED',
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 animate-fadeIn"
      role="status"
    >
      <span className="text-5xl mb-4" aria-hidden="true">
        {icon}
      </span>
      <h3 className="text-lg font-semibold text-evm-text-primary mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-evm-text-secondary text-center max-w-sm mb-6">
          {description}
        </p>
      )}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
