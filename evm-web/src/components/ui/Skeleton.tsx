interface SkeletonProps {
  className?: string;
}

/** Base skeleton animado */
function SkeletonBlock({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse-evm bg-evm-neutral-lighter rounded ${className}`}
      aria-hidden="true"
    />
  );
}

/** Skeleton para una ProjectCard */
export function SkeletonCard() {
  return (
    <div className="bg-evm-card rounded-lg border border-evm-border p-6">
      <div className="space-y-4">
        <SkeletonBlock className="h-5 w-3/4" />
        <SkeletonBlock className="h-3 w-1/2" />
        <div className="flex gap-4 pt-2">
          <SkeletonBlock className="h-14 w-20 rounded-lg" />
          <SkeletonBlock className="h-14 w-20 rounded-lg" />
        </div>
        <SkeletonBlock className="h-3 w-1/3" />
      </div>
    </div>
  );
}

/** Skeleton para el grid de project cards */
export function SkeletonProjectGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** Skeleton para summary cards (5 indicadores) */
export function SkeletonSummaryCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="bg-evm-card rounded-lg border border-evm-border p-4">
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-8 w-24" />
            <SkeletonBlock className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton para la tabla de actividades */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-evm-border">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex gap-4 pb-3 border-b border-evm-border">
          {Array.from({ length: 7 }, (_, i) => (
            <SkeletonBlock key={i} className="h-4 w-20" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: 7 }, (_, j) => (
              <SkeletonBlock key={j} className="h-4 w-20" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton para la gráfica */
export function SkeletonChart() {
  return (
    <SkeletonBlock className="w-full h-[250px] md:h-[300px] lg:h-[400px]" />
  );
}

/** Skeleton para detalle de proyecto completo */
export function SkeletonProjectDetail() {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="h-8 w-48" />
      <SkeletonSummaryCards />
      <SkeletonTable />
      <SkeletonChart />
    </div>
  );
}
