import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient, handleApiError } from '../../lib/apiClient';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfilePage() {
  const { user, role, actions } = useAuth();
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [profileForm, setProfileForm] = useState({
    homeAddress: { street: '', city: '', governorate: '', postalCode: '' },
    workAddress: { street: '', city: '', company: '' },
    emergencyContact: { name: '', phone: '', relation: '' },
    notes: '',
  });

  const profileQuery = useQuery({
    enabled: role === 'parent',
    queryKey: ['parent-profile'],
    queryFn: async () => {
      const response = await apiClient.get('/parent/profile');
      return response.data;
    },
    onSuccess: (data) => {
      if (role === 'parent' && data) {
        setProfileForm({
          homeAddress: {
            street: data.homeStreet || '',
            city: data.homeCity || '',
            governorate: data.homeGovernorate || '',
            postalCode: data.homePostalCode || '',
          },
          workAddress: {
            street: data.workStreet || '',
            city: data.workCity || '',
            company: data.workCompany || '',
          },
          emergencyContact: {
            name: data.emergencyName || '',
            phone: data.emergencyPhone || '',
            relation: data.emergencyRelation || '',
          },
          notes: data.notes || '',
        });
      }
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.put('/parent/profile', profileForm);
      return response.data;
    },
    onSuccess: (updatedProfile) => {
      if (updatedProfile) {
        setProfileForm({
          homeAddress: {
            street: updatedProfile.homeStreet || '',
            city: updatedProfile.homeCity || '',
            governorate: updatedProfile.homeGovernorate || '',
            postalCode: updatedProfile.homePostalCode || '',
          },
          workAddress: {
            street: updatedProfile.workStreet || '',
            city: updatedProfile.workCity || '',
            company: updatedProfile.workCompany || '',
          },
          emergencyContact: {
            name: updatedProfile.emergencyName || '',
            phone: updatedProfile.emergencyPhone || '',
            relation: updatedProfile.emergencyRelation || '',
          },
          notes: updatedProfile.notes || '',
        });
      }
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: () => actions.changePassword(passwords),
    onSuccess: () => {
      setPasswords({ currentPassword: '', newPassword: '' });
      window.alert('تم تحديث كلمة المرور بنجاح');
    },
    onError: (error) => {
      window.alert(handleApiError(error));
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">الملف الشخصي</h2>
        <p className="mt-1 text-sm text-slate-500">إدارة معلوماتك الشخصية وتحديث كلمة المرور</p>
      </div>

      <section className="card space-y-4">
        <div>
          <h3 className="card-title">معلومات الحساب</h3>
          <p className="card-subtitle">تفاصيل المستخدم الأساسية</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-400">الاسم</p>
            <p className="text-sm font-medium text-slate-700">{user?.fullName || 'غير متوفر'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">البريد الإلكتروني</p>
            <p className="text-sm font-medium text-slate-700">{user?.email || 'غير متوفر'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">الدور</p>
            <p className="text-sm font-medium text-slate-700">{role}</p>
          </div>
        </div>
      </section>

      <section className="card space-y-4">
        <div>
          <h3 className="card-title">تغيير كلمة المرور</h3>
          <p className="card-subtitle">قم بتحديث كلمة المرور بشكل دوري لحماية حسابك</p>
        </div>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            changePasswordMutation.mutate();
          }}
        >
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-slate-600" htmlFor="currentPassword">
              كلمة المرور الحالية
            </label>
            <input
              id="currentPassword"
              type="password"
              required
              value={passwords.currentPassword}
              onChange={(event) => setPasswords((prev) => ({ ...prev, currentPassword: event.target.value }))}
              className="mt-1 block w-full rounded-2xl border-slate-200 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
              autoComplete="current-password"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-slate-600" htmlFor="newPassword">
              كلمة المرور الجديدة
            </label>
            <input
              id="newPassword"
              type="password"
              required
              value={passwords.newPassword}
              onChange={(event) => setPasswords((prev) => ({ ...prev, newPassword: event.target.value }))}
              className="mt-1 block w-full rounded-2xl border-slate-200 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            className="sm:col-span-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            disabled={changePasswordMutation.isLoading}
          >
            {changePasswordMutation.isLoading ? 'جاري التحديث...' : 'حفظ كلمة المرور'}
          </button>
        </form>
      </section>

      {role === 'parent' && (
        <section className="card space-y-4">
          <div>
            <h3 className="card-title">بيانات التواصل</h3>
            <p className="card-subtitle">حدث عناوينك وبيانات الطوارئ</p>
          </div>
          {profileQuery.isError && <p className="text-sm text-red-500">{handleApiError(profileQuery.error)}</p>}
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              updateProfileMutation.mutate(profileForm);
            }}
          >
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-slate-600">العنوان الرئيسي</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-2xl border-slate-200 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="الشارع"
                  value={profileForm.homeAddress.street}
                  onChange={(event) => setProfileForm((prev) => ({
                    ...prev,
                    homeAddress: { ...prev.homeAddress, street: event.target.value },
                  }))}
                  autoComplete="address-line1"
                />
                <input
                  className="rounded-2xl border-slate-200 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="المدينة"
                  value={profileForm.homeAddress.city}
                  onChange={(event) => setProfileForm((prev) => ({
                    ...prev,
                    homeAddress: { ...prev.homeAddress, city: event.target.value },
                  }))}
                  autoComplete="address-level2"
                />
                <input
                  className="rounded-2xl border-slate-200 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="المحافظة"
                  value={profileForm.homeAddress.governorate}
                  onChange={(event) => setProfileForm((prev) => ({
                    ...prev,
                    homeAddress: { ...prev.homeAddress, governorate: event.target.value },
                  }))}
                  autoComplete="address-level1"
                />
                <input
                  className="rounded-2xl border-slate-200 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="الرمز البريدي"
                  value={profileForm.homeAddress.postalCode}
                  onChange={(event) => setProfileForm((prev) => ({
                    ...prev,
                    homeAddress: { ...prev.homeAddress, postalCode: event.target.value },
                  }))}
                  autoComplete="postal-code"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-slate-600">بيانات الطوارئ</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                <input
                  className="rounded-2xl border-slate-200 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="اسم جهة الطوارئ"
                  value={profileForm.emergencyContact.name}
                  onChange={(event) => setProfileForm((prev) => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, name: event.target.value },
                  }))}
                />
                <input
                  className="rounded-2xl border-slate-200 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="رقم الهاتف (مثال: 0771234567)"
                  value={profileForm.emergencyContact.phone}
                  onChange={(event) => setProfileForm((prev) => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, phone: event.target.value },
                  }))}
                  autoComplete="tel"
                />
                <input
                  className="rounded-2xl border-slate-200 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="صلة القرابة"
                  value={profileForm.emergencyContact.relation}
                  onChange={(event) => setProfileForm((prev) => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, relation: event.target.value },
                  }))}
                />
              </div>
            </div>

            <textarea
              rows={3}
              className="sm:col-span-2 rounded-2xl border-slate-200 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="ملاحظات إضافية"
              value={profileForm.notes}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, notes: event.target.value }))}
            />

            <button
              type="submit"
              className="sm:col-span-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
              disabled={updateProfileMutation.isLoading}
            >
              {updateProfileMutation.isLoading ? 'جاري الحفظ...' : 'حفظ البيانات'}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
