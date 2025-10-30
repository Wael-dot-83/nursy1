import clsx from 'clsx';

export default function Card({
  children,
  className,
  padding = 'md',
  shadow = 'soft',
  hover = false,
  ...props
}) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const shadows = {
    none: '',
    soft: 'shadow-soft',
    medium: 'shadow-medium',
    strong: 'shadow-strong',
  };

  return (
    <div
      className={clsx(
        'bg-white rounded-2xl border border-slate-100',
        'transition-all duration-200',
        shadows[shadow],
        paddings[padding],
        hover && 'hover:shadow-medium hover:-translate-y-1 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div
      className={clsx(
        'mb-4 pb-4 border-b border-slate-100',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3
      className={clsx(
        'text-lg font-semibold text-slate-900',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardBody({ children, className, ...props }) {
  return (
    <div className={clsx('', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={clsx(
        'mt-4 pt-4 border-t border-slate-100 flex items-center gap-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
