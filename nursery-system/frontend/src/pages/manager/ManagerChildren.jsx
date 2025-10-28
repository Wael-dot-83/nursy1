import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, handleApiError } from '../../lib/apiClient';
import { toast } from 'react-hot-toast';

export default function ManagerChildren() {
  const [showParentModal, setShowParentModal] = useState(false);
  const [showChildModal, setShowChildModal] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [parentForm, setParentForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    homeAddress: { street: '', city: '', governorate: '', postalCode: '' },
    workAddress: { street: '', city: '', governorate: '', postalCode: '' },
    emergencyContact: { name: '', phone: '', relation: '' },
    notes: '',
  });
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
    parentIds: [],
    documents: [],
  });

  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['manager-children'],
    queryFn: async () => {
      const response = await apiClient.get('/manager/children');
      return response.data;
    },
  });

  const createParentMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/manager/parents', data);
      return response.data;
    },
    onSuccess: () => {
      setShowParentModal(false);
      setParentForm({
        fullName: '',
        email: '',
        phone: '',
        homeAddress: { street: '', city: '', governorate: '', postalCode: '' },
        workAddress: { street: '', city: '', governorate: '', postalCode: '' },
        emergencyContact: { name: '', phone: '', relation: '' },
        notes: '',
      });
      queryClient.invalidateQueries(['manager-children']);
      toast.success('تم إنشاء ولي الأمر بنجاح');
    },
    onError: (error) => {
      const errorMessage = error?.response?.data?.message || 'حدث خطأ في إنشاء ولي الأمر';
      toast.error(errorMessage);
    },
  });

  const createChildMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/manager/children', data);
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
        parentIds: [],
        documents: [],
      });
      setSelectedParentId(null);
      queryClient.invalidateQueries(['manager-children']);
      toast.success('تم إنشاء الطفل بنجاح');
    },
    onError: (error) => {
      const errorMessage = error?.response?.data?.message || 'حدث خطأ في إنشاء الطفل';
      toast.error(errorMessage);
    },
  });

  const handleParentSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      full_name: parentForm.fullName,
      email: parentForm.email,
      phone: parentForm.phone,
      home_street: parentForm.homeAddress.street || null,
      home_city: parentForm.homeAddress.city || null,
      home_governorate: parentForm.homeAddress.governorate || null,
      home_postal_code: parentForm.homeAddress.postalCode || null,
      work_street: parentForm.workAddress.street || null,
      work_city: parentForm.workAddress.city || null,
      work_company: null, // Not in form
      emergency_name: parentForm.emergencyContact.name || null,
      emergency_phone: parentForm.emergencyContact.phone || null,
      emergency_relation: parentForm.emergencyContact.relation || null,
      notes: parentForm.notes || null,
    };
    createParentMutation.mutate(submitData);
  };

  const handleChildSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      full_name: childForm.fullName,
      date_of_birth: childForm.dateOfBirth,
      gender: childForm.gender || null,
      address_governorate: null, // Not in form
      address_city: null, // Not in form
      address_area: null, // Not in form
      address_street: null, // Not in form
      national_id: childForm.nationalId || null,
      passport_number: childForm.passportNumber || null,
      nationality: childForm.nationality,
      profile_photo_url: childForm.profilePhotoUrl || null,
      branch_id: childForm.branchId ? parseInt(childForm.branchId) : null,
      class_id: childForm.classId ? parseInt(childForm.classId) : null,
      health_notes: childForm.healthNotes || null,
      educational_notes: childForm.educationalNotes || null,
      parent_ids: selectedParentId ? [parseInt(selectedParentId)] : [],
    };
    createChildMutation.mutate(submitData);
  };

  const handleDocumentUpload = async (e, childId) => {
    const files = Array.from(e.target.files);

    for (const file of files) {
      // Validate file type
      if (!['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        toast.error(`نوع ملف غير مدعوم: ${file.name}`);
        continue;
      }

      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`حجم الملف كبير جداً: ${file.name}`);
        continue;
      }

      try {
        // Convert file to base64
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Determine document kind
        let kind = 'other';
        if (file.name.toLowerCase().includes('birth')) kind = 'birth_certificate';
        else if (file.name.toLowerCase().includes('medical') || file.name.toLowerCase().includes('health')) kind = 'medical_certificate';

        const documentData = {
          kind: kind,
          file_name: file.name,
          mime_type: file.type,
          file_content: base64,
        };

        // Upload document
        await apiClient.post(`/manager/children/${childId}/docs`, documentData);
        toast.success(`تم رفع المستند: ${file.name}`);
      } catch (error) {
        toast.error(`فشل في رفع المستند: ${file.name}`);
      }
    }

    // Refresh data
    queryClient.invalidateQueries(['manager-children']);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">إدارة الأطفال</h2>
          <p className="mt-1 text-sm text-slate-500">استعرض بيانات الأطفال وتواصل مع أولياء الأمور</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowParentModal(true)}
            className="btn btn-primary"
          >
            إضافة ولي أمر
          </button>
          <button
            onClick={() => setShowChildModal(true)}
            className="btn btn-secondary"
          >
            إضافة طفل
          </button>
        </div>
      </div>

      {isLoading && <div className="card text-sm text-slate-500">جاري تحميل القائمة ...</div>}
      {isError && <div className="card text-sm text-red-500">{handleApiError(error)}</div>}

      {data?.length ? (
        <div className="grid gap-4">
          {data.map((child) => (
            <div key={child.id} className="card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-800">{child.fullName}</p>
                  <p className="text-xs text-slate-500">
                    تاريخ الميلاد:
                    {' '}
                    {child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString('ar-JO') : 'غير محدد'}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                  {child.isActive ? 'مسجل' : 'غير مفعل'}
                </span>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                <p className="font-medium text-slate-600">أولياء الأمور:</p>
                <ul className="mt-2 space-y-1 text-slate-600">
                  {Array.isArray(child.parents) && child.parents.length ? (
                    child.parents.map((link) => (
                      <li key={link.parent?.id || link.id}>
                        {link.parent?.fullName || '—'}
                        {' '}
                        (
                        {link.parent?.email || 'لا يوجد بريد'}
                        )
                      </li>
                    ))
                  ) : (
                    <li>لا يوجد بيانات</li>
                  )}
                </ul>
              </div>
              {child.documents && child.documents.length > 0 && (
                <div className="rounded-2xl bg-blue-50 p-4 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-blue-600">المستندات:</p>
                    <label className="cursor-pointer text-xs text-blue-600 hover:text-blue-800">
                      <span>+ إضافة مستند</span>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleDocumentUpload(e, child.id)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <ul className="space-y-1 text-blue-600">
                    {child.documents.map((doc) => (
                      <li key={doc.id}>
                        {doc.doc_type === 'birth_certificate' ? 'شهادة الميلاد' :
                         doc.doc_type === 'medical_certificate' ? 'شهادة طبية' : 'مستند آخر'}
                        : {doc.file_name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(!child.documents || child.documents.length === 0) && (
                <div className="rounded-2xl bg-gray-50 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-600">لا توجد مستندات</p>
                    <label className="cursor-pointer text-xs text-blue-600 hover:text-blue-800">
                      <span>+ رفع مستندات</span>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleDocumentUpload(e, child.id)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        !isLoading && <div className="card text-sm text-slate-500">لا يوجد أطفال مسجلين حالياً.</div>
      )}

      {/* Parent Creation Modal */}
      {showParentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800">إضافة ولي أمر جديد</h3>
            <form onSubmit={handleParentSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">الاسم الكامل</label>
                  <input
                    type="text"
                    value={parentForm.fullName}
                    onChange={(e) => setParentForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={parentForm.email}
                    onChange={(e) => setParentForm(prev => ({ ...prev, email: e.target.value }))}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">رقم الهاتف الأردني</label>
                <input
                  type="tel"
                  value={parentForm.phone}
                  onChange={(e) => setParentForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="input"
                  placeholder="0771234567 أو 0798765432"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  أدخل رقم هاتف أردني صالح (مثال: 0771234567 أو 0798765432)
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-slate-700">عنوان المنزل</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="الشارع"
                    value={parentForm.homeAddress.street}
                    onChange={(e) => setParentForm(prev => ({
                      ...prev,
                      homeAddress: { ...prev.homeAddress, street: e.target.value }
                    }))}
                    className="input"
                  />
                  <input
                    type="text"
                    placeholder="المدينة"
                    value={parentForm.homeAddress.city}
                    onChange={(e) => setParentForm(prev => ({
                      ...prev,
                      homeAddress: { ...prev.homeAddress, city: e.target.value }
                    }))}
                    className="input"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-slate-700">عنوان العمل</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="الشارع"
                    value={parentForm.workAddress.street}
                    onChange={(e) => setParentForm(prev => ({
                      ...prev,
                      workAddress: { ...prev.workAddress, street: e.target.value }
                    }))}
                    className="input"
                  />
                  <input
                    type="text"
                    placeholder="المدينة"
                    value={parentForm.workAddress.city}
                    onChange={(e) => setParentForm(prev => ({
                      ...prev,
                      workAddress: { ...prev.workAddress, city: e.target.value }
                    }))}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowParentModal(false)}
                  className="btn btn-secondary"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createParentMutation.isPending}
                  className="btn btn-primary"
                >
                  {createParentMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
