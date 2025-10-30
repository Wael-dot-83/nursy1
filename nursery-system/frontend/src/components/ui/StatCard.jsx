import clsx from 'clsx';
import Card from './Card';

export default function StatCard({
  title,
  value,
  change,
  changeType = 'neutral', // 'increase', 'decrease', 'neutral'
  icon: Icon,
  iconColor = 'primary',
  trend,
  loading = false,
  className,
}) {
  const iconColors = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-success-100 text-success-600',
    warning: 'bg-warning-100 text-warning-600',
    danger: 'bg-danger-100 text-danger-600',
    slate: 'bg-slate-100 text-slate-600',
  };

  const changeColors = {
    increase: 'text-success-600',
    decrease: 'text-danger-600',
    neutral: 'text-slate-600',
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-slate-200 rounded w-24 mb-3" />
            <div className="h-8 bg-slate-200 rounded w-32" />
          </div>
          <div className="h-12 w-12 bg-slate-200 rounded-xl" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={clsx(
        'group hover:shadow-medium transition-all duration-300',
        'hover:-translate-y-1 cursor-default',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mb-2">{value}</p>

          {(change !== undefined || trend) && (
            <div className="flex items-center gap-2">
              {change !== undefined && (
                <span className={clsx('text-sm font-medium flex items-center gap-1', changeColors[changeType])}>
                  {changeType === 'increase' && (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  )}
                  {changeType === 'decrease' && (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                  )}
                  {change}
                </span>
              )}
              {trend && (
                <span className="text-xs text-slate-500">{trend}</span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={clsx(
              'p-3 rounded-xl transition-transform duration-300 group-hover:scale-110',
              iconColors[iconColor]
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </Card>
  );
}
