export default function LoadingAnnouncer({ message = "جاري التحميل..." }) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="flex items-center justify-center py-8">
      <span className="sr-only">{message}</span>
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"
        aria-hidden="true"
      />
    </div>
  );
}
