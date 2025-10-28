import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, handleApiError } from '../../lib/apiClient';

export default function ParentChildren() {
  const [showChildModal, setShowChildModal] = useState(false);
  const [childForm, setChildForm] = useState({
    fullName: '',
    dateOfBirth: '',
    nationalId: '',
    passportNumber: '',
    nationality: 'Jordanian',
    profilePhotoUrl: '',
    branchId: '',
    classId: '',
    healthNotes: '',
    educationalNotes: '',
    documents: [],
  });

  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['parent-children'],
    queryFn: async () => {
      const response = await apiClient.get('/parent/children');
      return response.data;
    },
  });

  const createChildMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/parent/children', data);
      return response.data;
    },
    onSuccess: () => {
      setShowChildModal(false);
      setChildForm({
        fullName: '',
        dateOfBirth: '',
        nationalId: '',
        passportNumber: '',
        nationality: 'Jordanian',
        profilePhotoUrl: '',
        branchId: '',
        classId: '',
        healthNotes: '',
        educationalNotes: '',
        documents: [],
      });
      queryClient.invalidateQueries(['parent-children']);
    },
  });

  const handleChildSubmit = (e) => {
    e.preventDefault();
    createChildMutation.mutate(childForm);
  };

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    // In a real implementation, you would upload files to storage and get URLs
    // For now, we'll simulate with placeholder URLs
    const documents = files.map((file, index) => ({
      type: file.name.includes('birth') ? 'birth_certificate' :
            file.name.includes('health') ? 'health_clearance' : 'other',
      fileName: file.name,
      fileUrl: `https://example.com/uploads/${file.name}`, // Placeholder
    }));
    setChildForm(prev => ({ ...prev, documents: [...prev.documents, ...documents] }));
  };

  if (isLoading) {
    return <div className="card text-sm text-slate-500">جاري تحميل بيانات الأطفال ...</div>;
  }

  if (isError) {
    return <div className="card text-sm text-red-500">{handleApiError(error)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">أطفالي</h2>
          <p className="mt-1 text-sm text-slate-500">استعرض معلومات أطفالك وتابع تقاريرهم</p>
        </div>
        <button
          onClick={() => setShowChildModal(true)}
          className="btn btn-primary"
        >
          إضافة طفل
        </button>
      </div>

      {data?.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.map((child) => (
            <div key={child.id} className="card space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-800">{child.fullName}</p>
                <span className="text-xs text-slate-500">
                  {child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString('ar-JO') : 'غير محدد'}
                </span>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  الجنسية:
                  {' '}
                  {child.nationality || 'أردني'}
                </p>
                <p>
                  الفرع:
                  {' '}
                  {child.branch?.name || '—'}
                </p>
                <p>
                  القاعة:
                  {' '}
                  {child.classroom?.name || '—'}
                </p>
              </div>
              {child.documents && child.documents.length > 0 && (
                <div className="rounded-2xl bg-blue-50 p-4 text-sm">
                  <p className="font-medium text-blue-600">المستندات:</p>
                  <ul className="mt-2 space-y-1 text-blue-600">
                    {child.documents.map((doc) => (
                      <li key={doc.id}>
                        {doc.docType === 'birth_certificate' ? 'شهادة الميلاد' :
                         doc.docType === 'health_clearance' ? 'شهادة الخلو من الأمراض' : 'مستند آخر'}
                        : {doc.fileName}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-sm text-slate-500">لم يتم تسجيل أطفال في حسابك بعد.</div>
      )}

      {/* Child Creation Modal */}
      {showChildModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800">إضافة طفل جديد</h3>
            <form onSubmit={handleChildSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">الاسم الكامل للطفل</label>
                  <input
                    type="text"
                    value={childForm.fullName}
                    onChange={(e) => setChildForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">تاريخ الميلاد</label>
                  <input
                    type="date"
                    value={childForm.dateOfBirth}
                    onChange={(e) => setChildForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">الرقم الوطني</label>
                  <input
                    type="text"
                    value={childForm.nationalId}
                    onChange={(e) => setChildForm(prev => ({ ...prev, nationalId: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">رقم جواز السفر</label>
                  <input
                    type="text"
                    value={childForm.passportNumber}
                    onChange={(e) => setChildForm(prev => ({ ...prev, passportNumber: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">الجنسية</label>
                  <input
                    type="text"
                    value={childForm.nationality}
                    onChange={(e) => setChildForm(prev => ({ ...prev, nationality: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">رابط صورة الطفل</label>
                  <input
                    type="url"
                    value={childForm.profilePhotoUrl}
                    onChange={(e) => setChildForm(prev => ({ ...prev, profilePhotoUrl: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">ملاحظات صحية</label>
                <textarea
                  value={childForm.healthNotes}
                  onChange={(e) => setChildForm(prev => ({ ...prev, healthNotes: e.target.value }))}
                  className="input"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">ملاحظات تعليمية</label>
                <textarea
                  value={childForm.educationalNotes}
                  onChange={(e) => setChildForm(prev => ({ ...prev, educationalNotes: e.target.value }))}
                  className="input"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">رفع المستندات</label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleDocumentUpload}
                  className="input"
                />
                <p className="text-xs text-slate-500 mt-1">يرجى رفع شهادة الميلاد وشهادة الخلو من الأمراض</p>
                {childForm.documents.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {childForm.documents.map((doc, index) => (
                      <li key={index} className="text-sm text-slate-600">
                        {doc.type === 'birth_certificate' ? 'شهادة الميلاد' :
                         doc.type === 'health_clearance' ? 'شهادة الخلو من الأمراض' : 'مستند آخر'}: {doc.fileName}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowChildModal(false)}
                  className="btn btn-secondary"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createChildMutation.isPending}
                  className="btn btn-primary"
                >
                  {createChildMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
