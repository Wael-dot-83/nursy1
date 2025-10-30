import clsx from 'clsx';

const variants = {
  primary: 'bg-primary-100 text-primary-700 ring-primary-600/20',
  success: 'bg-success-100 text-success-700 ring-success-600/20',
  warning: 'bg-warning-100 text-warning-700 ring-warning-600/20',
  danger: 'bg-danger-100 text-danger-700 ring-danger-600/20',
  gray: 'bg-slate-100 text-slate-700 ring-slate-600/20',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export default function Badge({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  className,
  ...props
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full ring-1 ring-inset',
        'transition-all duration-200',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <svg className="h-1.5 w-1.5 fill-current" viewBox="0 0 6 6">
          <circle cx="3" cy="3" r="3" />
        </svg>
      )}
      {children}
    </span>
  );
}
