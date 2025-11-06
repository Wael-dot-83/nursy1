import { useEffect, useRef } from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ErrorAlert({ title, message, onRetry, onDismiss }) {
  const errorRef = useRef(null);

  useEffect(() => {
    errorRef.current?.focus();
  }, []);

  return (
    <div
      ref={errorRef}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      tabIndex={-1}
      className="rounded-xl border border-red-200 bg-red-50 p-4 focus:outline-none"
    >
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-600" aria-hidden="true" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex-shrink-0 rounded-lg p-1 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="إغلاق رسالة الخطأ"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
      {(onRetry || onDismiss) && (
        <div className="mt-3 flex gap-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              إعادة المحاولة
            </button>
          )}
        </div>
      )}
    </div>
  );
}
