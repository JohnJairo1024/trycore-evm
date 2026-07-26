import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';
import type { ChartDataPoint } from '../../types';
import { formatCurrency, formatYAxis } from '../../utils/formatters';

const CHART_COLORS = {
  pv: '#2563eb',
  ev: '#16a34a',
  ac: '#dc2626',
} as const;

function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-evm-card border border-evm-border shadow-evm-md rounded-lg p-4 animate-fadeIn">
      <p className="font-medium text-evm-text-primary mb-2 text-sm">{label}</p>
      {payload.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center gap-2 text-sm py-0.5"
        >
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-evm-text-secondary">{entry.name}:</span>
          <span className="font-medium text-evm-text-primary tabular-nums">
            {formatCurrency(entry.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface EVMChartProps {
  data: ChartDataPoint[];
}

export function EVMChart({ data }: EVMChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[250px] md:h-[300px] lg:h-[400px] flex items-center justify-center bg-evm-neutral-light/50 rounded-lg border border-dashed border-evm-border">
        <p className="text-sm text-evm-text-muted">
          Sin datos para mostrar la gráfica
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[250px] md:h-[300px] lg:h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
            iconType="rect"
            iconSize={10}
          />
          <Bar
            dataKey="pv"
            name="PV (Planificado)"
            fill={CHART_COLORS.pv}
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
          <Bar
            dataKey="ev"
            name="EV (Ejecutado)"
            fill={CHART_COLORS.ev}
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
          <Bar
            dataKey="ac"
            name="AC (Costo Real)"
            fill={CHART_COLORS.ac}
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
