import { Card } from '../ui/Card';
import { MiniBadge } from '../ui/Badge';
import { formatIndex, formatDate } from '../../utils/formatters';
import { useEVMColor } from '../../hooks/useEVMColor';

interface ProjectCardProps {
  id: string;
  name: string;
  activityCount: number;
  cpi: number | null;
  spi: number | null;
  createdAt: string;
  onClick: (id: string) => void;
}

export function ProjectCard({
  id,
  name,
  activityCount,
  cpi,
  spi,
  createdAt,
  onClick,
}: ProjectCardProps) {
  const cpiColor = useEVMColor(cpi, 'cpi');
  const spiColor = useEVMColor(spi, 'spi');

  return (
    <Card hover padding="md" onClick={() => onClick(id)} role="article" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(id); } }}
      aria-label={`Proyecto ${name}, CPI ${formatIndex(cpi)}, SPI ${formatIndex(spi)}`}
    >
      <div className="space-y-3">
        {/* Nombre */}
        <div className="flex items-start gap-2">
          <span className="text-lg mt-0.5" aria-hidden="true">{'\uD83D\uDCC1'}</span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-evm-text-primary truncate">
              {name}
            </h3>
            <p className="text-xs text-evm-text-secondary">
              {activityCount} {activityCount === 1 ? 'actividad' : 'actividades'}
            </p>
          </div>
        </div>

        {/* CPI / SPI */}
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-[10px] font-medium text-evm-text-muted uppercase tracking-wide mb-1">
              CPI
            </p>
            <MiniBadge
              value={formatIndex(cpi)}
              variant={cpiColor.textClass === 'text-evm-success' ? 'success' : 'danger'}
              size="md"
            />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-medium text-evm-text-muted uppercase tracking-wide mb-1">
              SPI
            </p>
            <MiniBadge
              value={formatIndex(spi)}
              variant={spiColor.textClass === 'text-evm-success' ? 'success' : 'danger'}
              size="md"
            />
          </div>
        </div>

        {/* Fecha */}
        <p className="text-xs text-evm-text-muted">
          Creado: {formatDate(createdAt)}
        </p>
      </div>
    </Card>
  );
}
