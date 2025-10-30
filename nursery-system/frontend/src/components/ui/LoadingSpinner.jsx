import clsx from 'clsx';

const sizes = {
  xs: 'h-3 w-3 border-2',
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-3',
  lg: 'h-12 w-12 border-4',
  xl: 'h-16 w-16 border-4',
};

const colors = {
  primary: 'border-primary-500 border-t-transparent',
  white: 'border-white border-t-transparent',
  slate: 'border-slate-500 border-t-transparent',
};

export default function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className,
  fullScreen = false,
  text,
}) {
  const spinner = (
    <div className={clsx('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={clsx(
          'animate-spin rounded-full',
          sizes[size],
          colors[color]
        )}
      />
      {text && (
        <p className="text-sm text-slate-600 font-medium animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export function LoadingSkeleton({ className, rows = 1 }) {
  return (
    <div className={clsx('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-200 rounded-lg animate-pulse"
          style={{ width: `${Math.random() * 30 + 70}%` }}
        />
      ))}
    </div>
  );
}

export function LoadingCard({ className }) {
  return (
    <div className={clsx('bg-white rounded-2xl shadow-soft p-6 animate-pulse', className)}>
      <div className="flex items-center space-x-4 space-x-reverse">
        <div className="rounded-full bg-slate-200 h-12 w-12" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}
