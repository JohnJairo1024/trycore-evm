import { Button } from './Button';

interface ErrorStateProps {
  icon?: string;
  title: string;
  message?: string;
  retryLabel?: string;
  onRetry: () => void;
}

export function ErrorState({
  icon = '\u274C',
  title,
  message,
  retryLabel = 'Reintentar',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 animate-fadeIn"
      role="alert"
    >
      <span className="text-5xl mb-4" aria-hidden="true">
        {icon}
      </span>
      <h3 className="text-lg font-semibold text-evm-text-primary mb-2">
        {title}
      </h3>
      {message && (
        <p className="text-sm text-evm-text-secondary text-center max-w-sm mb-6">
          {message}
        </p>
      )}
      <Button variant="primary" onClick={onRetry}>
        {`\u21BB ${retryLabel}`}
      </Button>
    </div>
  );
}
