import { LoadingSpinner } from './LoadingSpinner';

export default function LoadingOverlay({ message = 'جاري التحميل...' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-center text-slate-700 font-medium">{message}</p>
      </div>
    </div>
  );
}
