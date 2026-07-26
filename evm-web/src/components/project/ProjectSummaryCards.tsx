import { Card } from '../ui/Card';
import { formatCurrency, formatIndex } from '../../utils/formatters';
import { useEVMColor } from '../../hooks/useEVMColor';

interface ProjectSummaryCardsProps {
  bac: number;
  ac: number;
  ev: number;
  cpi: number | null;
  spi: number | null;
}

function TrendIcon({ direction }: { direction: 'up' | 'down' | 'neutral' }) {
  if (direction === 'neutral') {
    return <span className="text-lg text-evm-neutral">{'\u2014'}</span>;
  }
  return (
    <span
      className={`text-lg ${
        direction === 'up' ? 'text-evm-success' : 'text-evm-danger'
      }`}
      aria-hidden="true"
    >
      {direction === 'up' ? '\u2191' : '\u2193'}
    </span>
  );
}

export function ProjectSummaryCards({
  bac,
  ac,
  ev,
  cpi,
  spi,
}: ProjectSummaryCardsProps) {
  const cpiColor = useEVMColor(cpi, 'cpi');
  const spiColor = useEVMColor(spi, 'spi');

  const cards = [
    {
      label: 'BAC',
      value: formatCurrency(bac),
      color: '',
      bgClass: '',
      icon: <TrendIcon direction="neutral" />,
      subtitle: 'Presupuesto total',
    },
    {
      label: 'Costo Real (AC)',
      value: formatCurrency(ac),
      color: '',
      bgClass: '',
      icon: <TrendIcon direction="neutral" />,
      subtitle: 'Gastado a la fecha',
    },
    {
      label: 'Valor Ganado (EV)',
      value: formatCurrency(ev),
      color: '',
      bgClass: '',
      icon: <TrendIcon direction="neutral" />,
      subtitle: 'Valor ejecutado',
    },
    {
      label: 'CPI',
      value: formatIndex(cpi),
      color: cpiColor.color,
      bgClass: cpiColor.bgClass,
      textClass: cpiColor.textClass,
      icon: <TrendIcon direction={cpiColor.icon} />,
      subtitle: cpiColor.label,
    },
    {
      label: 'SPI',
      value: formatIndex(spi),
      color: spiColor.color,
      bgClass: spiColor.bgClass,
      textClass: spiColor.textClass,
      icon: <TrendIcon direction={spiColor.icon} />,
      subtitle: spiColor.label,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <Card key={card.label} padding="sm">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-evm-text-secondary uppercase tracking-wide">
                {card.label}
              </span>
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-evm-text-primary leading-tight">
              {card.value}
            </p>
            <span
              className="text-xs font-medium"
              style={{ color: card.color || undefined }}
            >
              {card.subtitle}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
