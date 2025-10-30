import clsx from 'clsx';
import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  secondaryAction,
  secondaryActionLabel,
  className,
}) {
  return (
    <div className={clsx('text-center py-12 px-4 animate-fade-in', className)}>
      {Icon && (
        <div className="mx-auto h-16 w-16 text-slate-400 mb-4 animate-bounce-subtle">
          <Icon className="h-full w-full" />
        </div>
      )}

      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>

      {description && (
        <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">{description}</p>
      )}

      {(action || secondaryAction) && (
        <div className="flex items-center justify-center gap-3">
          {action && (
            <Button onClick={action} variant="primary">
              {actionLabel || 'إضافة عنصر جديد'}
            </Button>
          )}

          {secondaryAction && (
            <Button onClick={secondaryAction} variant="secondary">
              {secondaryActionLabel || 'إلغاء'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
