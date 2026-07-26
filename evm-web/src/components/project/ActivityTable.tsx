import type { ActivityWithEVM } from '../../types';
import { formatCurrency, formatPercentage, formatIndex } from '../../utils/formatters';
import { Button } from '../ui/Button';

interface ActivityTableProps {
  activities: ActivityWithEVM[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function getRowClassName(activity: ActivityWithEVM): string {
  const isHealthy =
    (activity.cpi ?? 1) >= 1 && (activity.spi ?? 1) >= 1;
  return isHealthy
    ? 'bg-evm-success-light/40'
    : 'bg-evm-danger-light/40';
}

function CellColor({
  value,
  isNegative,
}: {
  value: string;
  isNegative?: boolean;
}) {
  if (isNegative === undefined) {
    return <span className="tabular-nums">{value}</span>;
  }
  return (
    <span
      className={`tabular-nums font-medium ${
        isNegative ? 'text-evm-danger' : 'text-evm-success'
      }`}
    >
      {value}
    </span>
  );
}

export function ActivityTable({
  activities,
  onEdit,
  onDelete,
}: ActivityTableProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-evm-border rounded-lg bg-evm-surface">
        <p className="text-sm text-evm-text-muted">
          No hay actividades registradas
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-evm-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-evm-neutral-light border-b border-evm-border">
            <th className="px-4 py-3 text-left font-medium text-evm-text-secondary whitespace-nowrap text-xs uppercase tracking-wide">
              Actividad
            </th>
            <th className="px-4 py-3 text-right font-medium text-evm-text-secondary whitespace-nowrap text-xs uppercase tracking-wide">
              BAC
            </th>
            <th className="px-4 py-3 text-right font-medium text-evm-text-secondary whitespace-nowrap text-xs uppercase tracking-wide">
              % Planif.
            </th>
            <th className="px-4 py-3 text-right font-medium text-evm-text-secondary whitespace-nowrap text-xs uppercase tracking-wide">
              % Real
            </th>
            <th className="px-4 py-3 text-right font-medium text-evm-text-secondary whitespace-nowrap text-xs uppercase tracking-wide">
              PV
            </th>
            <th className="px-4 py-3 text-right font-medium text-evm-text-secondary whitespace-nowrap text-xs uppercase tracking-wide">
              EV
            </th>
            <th className="px-4 py-3 text-right font-medium text-evm-text-secondary whitespace-nowrap text-xs uppercase tracking-wide">
              AC
            </th>
            <th className="px-4 py-3 text-right font-medium text-evm-text-secondary whitespace-nowrap text-xs uppercase tracking-wide">
              CV
            </th>
            <th className="px-4 py-3 text-right font-medium text-evm-text-secondary whitespace-nowrap text-xs uppercase tracking-wide">
              SV
            </th>
            <th className="px-4 py-3 text-right font-medium text-evm-text-secondary whitespace-nowrap text-xs uppercase tracking-wide">
              CPI
            </th>
            <th className="px-4 py-3 text-right font-medium text-evm-text-secondary whitespace-nowrap text-xs uppercase tracking-wide">
              SPI
            </th>
            <th className="px-4 py-3 text-right font-medium text-evm-text-secondary whitespace-nowrap text-xs uppercase tracking-wide">
              EAC
            </th>
            <th className="px-4 py-3 text-center font-medium text-evm-text-secondary whitespace-nowrap text-xs uppercase tracking-wide">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => {
            const cpiValue = activity.cpi ?? 0;
            const spiValue = activity.spi ?? 0;
            const isHealthy = cpiValue >= 1 && spiValue >= 1;

            return (
              <tr
                key={activity.id}
                className={`border-b border-evm-border-light transition-colors hover:opacity-85 ${getRowClassName(activity)}`}
              >
                <td className="px-4 py-3 whitespace-nowrap font-medium text-evm-text-primary">
                  {activity.name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right tabular-nums">
                  {formatCurrency(activity.bac)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right tabular-nums">
                  {formatPercentage(activity.plannedPercentage)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right tabular-nums">
                  {formatPercentage(activity.actualPercentage)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right tabular-nums text-evm-info">
                  {formatCurrency(activity.pv)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right tabular-nums text-evm-success font-medium">
                  {formatCurrency(activity.ev)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right tabular-nums text-evm-danger font-medium">
                  {formatCurrency(activity.ac)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <CellColor
                    value={formatCurrency(activity.cv)}
                    isNegative={activity.cv < 0}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <CellColor
                    value={formatCurrency(activity.sv)}
                    isNegative={activity.sv < 0}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <CellColor
                    value={formatIndex(activity.cpi)}
                    isNegative={!isHealthy}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <CellColor
                    value={formatIndex(activity.spi)}
                    isNegative={!isHealthy}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right tabular-nums">
                  {formatCurrency(activity.eac)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(activity.id)}
                      aria-label={`Editar ${activity.name}`}
                    >
                      {'\uD83D\uDD8A\uFE0F'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(activity.id)}
                      aria-label={`Eliminar ${activity.name}`}
                    >
                      {'\uD83D\uDDD1\uFE0F'}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
