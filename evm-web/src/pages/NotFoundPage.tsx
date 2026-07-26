import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-24 px-4 animate-fadeIn">
        <span className="text-7xl mb-6" aria-hidden="true">
          {'\uD83D\uDD0D'}
        </span>
        <h1 className="text-4xl font-bold text-evm-text-primary mb-3">
          404
        </h1>
        <p className="text-lg text-evm-text-secondary mb-2">
          Página no encontrada
        </p>
        <p className="text-sm text-evm-text-muted mb-8 text-center max-w-sm">
          La página que buscas no existe o ha sido movida.
        </p>
        <Button variant="primary" onClick={() => navigate('/')}>
          Volver al inicio
        </Button>
      </div>
    </AppLayout>
  );
}
