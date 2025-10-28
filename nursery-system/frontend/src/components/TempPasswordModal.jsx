import React, { useState } from 'react';

export default function TempPasswordModal({ open, onClose, user, tempPassword }) {
  const [revealed, setRevealed] = useState(false);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-xl font-semibold text-slate-800 text-center">تم إنشاء المدير</h3>
        <div className="mb-4">
          <div className="mb-2 text-sm text-slate-700">اسم المستخدم / البريد الإلكتروني:</div>
          <div className="font-mono text-base text-primary-700 bg-slate-100 rounded px-2 py-1">{user?.email}</div>
        </div>
        <div className="mb-4">
          <div className="mb-2 text-sm text-slate-700">كلمة المرور المؤقتة:</div>
          <div className="relative flex items-center">
            <input
              type={revealed ? 'text' : 'password'}
              value={tempPassword}
              readOnly
              className="font-mono text-base text-primary-700 bg-slate-100 rounded px-2 py-1 w-full pr-10"
            />
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              className="absolute right-2 text-primary-600 hover:text-primary-800"
            >
              {revealed ? 'إخفاء' : 'إظهار'}
            </button>
          </div>
          <div className="mt-2 text-xs text-red-600">سيظهر هذا الرمز مرة واحدة فقط. يرجى نسخه وحفظه بأمان.</div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(tempPassword);
            }}
            className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            نسخ كلمة المرور
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
          >
            تم
          </button>
        </div>
      </div>
    </div>
  );
}
