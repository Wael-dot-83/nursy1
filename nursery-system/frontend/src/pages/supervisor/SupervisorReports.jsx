import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { apiClient, handleApiError } from '../../lib/apiClient';

export default function SupervisorReports({ mode = 'list' }) {
  const queryClient = useQueryClient();

  const childrenQuery = useQuery({
    queryKey: ['supervisor-children'],
    queryFn: async () => {
      const response = await apiClient.get('/supervisor/children');
      return response.data;
    },
  });

  const reportsQuery = useQuery({
    enabled: mode !== 'create',
    queryKey: ['supervisor-reports'],
    queryFn: async () => {
      const response = await apiClient.get('/supervisor/reports');
      return response.data;
    },
  });

  const [form, setForm] = useState({
    childId: '',
    reportDate: dayjs().format('YYYY-MM-DD'),
    attendance: {
      checkIn: '',
      checkOut: '',
      status: 'present',
    },
    meals: {
      breakfast: '',
      lunch: '',
      snacks: [],
    },
    naps: [],
    diaperChanges: [],
    activities: [],
    healthObservations: {
      notes: '',
    },
    behaviorNotes: '',
  });

  const createReportMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        childId: Number(form.childId),
        reportDate: form.reportDate,
        attendance: {
          checkIn: form.attendance.checkIn || null,
          checkOut: form.attendance.checkOut || null,
          status: form.attendance.status,
        },
        meals: {
          breakfast: form.meals.breakfast || undefined,
          lunch: form.meals.lunch || undefined,
          snacks: form.meals.snacks.filter(snack => snack.trim()),
        },
        naps: form.naps.filter(nap => nap.startTime && nap.endTime),
        diaperChanges: form.diaperChanges.filter(change => change.time && change.type),
        activities: form.activities.filter(activity => activity.title && activity.title.trim()),
        healthObservations: {
          notes: form.healthObservations.notes || undefined,
        },
        behaviorNotes: form.behaviorNotes || undefined,
        status: 'submitted',
      };
      const response = await apiClient.post('/supervisor/reports', payload);
      return response.data;
    },
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['supervisor-reports'] });
      window.alert('تم إرسال التقرير إلى المدير بنجاح');
    },
    onError: (error) => {
      window.alert(handleApiError(error));
    },
  });

  const resetForm = () => {
    setForm({
      childId: '',
      reportDate: dayjs().format('YYYY-MM-DD'),
      attendance: {
        checkIn: '',
        checkOut: '',
        status: 'present',
      },
      meals: {
        breakfast: '',
        lunch: '',
        snacks: [],
      },
      naps: [],
      diaperChanges: [],
      activities: [],
      healthObservations: {
        notes: '',
      },
      behaviorNotes: '',
    });
  };

  const childrenOptions = useMemo(() => (
    Array.isArray(childrenQuery.data) ? childrenQuery.data : []
  ), [childrenQuery.data]);

  const addActivity = () => {
    setForm({
      ...form,
      activities: [...form.activities, { title: '', description: '' }],
    });
  };

  const updateActivity = (index, field, value) => {
    const updatedActivities = [...form.activities];
    updatedActivities[index] = { ...updatedActivities[index], [field]: value };
    setForm({ ...form, activities: updatedActivities });
  };

  const removeActivity = (index) => {
    const updatedActivities = form.activities.filter((_, i) => i !== index);
    setForm({ ...form, activities: updatedActivities });
  };

  const addSnack = () => {
    setForm({
      ...form,
      meals: {
        ...form.meals,
        snacks: [...form.meals.snacks, ''],
      },
    });
  };

  const updateSnack = (index, value) => {
    const updatedSnacks = [...form.meals.snacks];
    updatedSnacks[index] = value;
    setForm({
      ...form,
      meals: { ...form.meals, snacks: updatedSnacks },
    });
  };

  const removeSnack = (index) => {
    const updatedSnacks = form.meals.snacks.filter((_, i) => i !== index);
    setForm({
      ...form,
      meals: { ...form.meals, snacks: updatedSnacks },
    });
  };

  const addSleepPeriod = () => {
    setForm({
      ...form,
      naps: [...form.naps, { startTime: '', endTime: '', quality: 'good' }],
    });
  };

  const updateSleepPeriod = (index, field, value) => {
    const updatedNaps = [...form.naps];
    updatedNaps[index] = { ...updatedNaps[index], [field]: value };
    setForm({ ...form, naps: updatedNaps });
  };

  const removeSleepPeriod = (index) => {
    const updatedNaps = form.naps.filter((_, i) => i !== index);
    setForm({ ...form, naps: updatedNaps });
  };

  const addDiaperChange = () => {
    setForm({
      ...form,
      diaperChanges: [...form.diaperChanges, { time: '', type: 'wet', notes: '' }],
    });
  };

  const updateDiaperChange = (index, field, value) => {
    const updatedDiaperChanges = [...form.diaperChanges];
    updatedDiaperChanges[index] = { ...updatedDiaperChanges[index], [field]: value };
    setForm({ ...form, diaperChanges: updatedDiaperChanges });
  };

  const removeDiaperChange = (index) => {
    const updatedDiaperChanges = form.diaperChanges.filter((_, i) => i !== index);
    setForm({ ...form, diaperChanges: updatedDiaperChanges });
  };

  const getDayName = (dateString) => {
    const date = new Date(dateString);
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[date.getDay()];
  };

  if (mode === 'create') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">إنشاء تقرير يومي</h2>
          <p className="mt-1 text-sm text-slate-500">قم بتعبئة تفاصيل اليوم الكامل للطفل وإرسالها إلى المدير للمراجعة.</p>
        </div>

        <form
          className="card space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            createReportMutation.mutate();
          }}
        >
          {/* Child Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-600" htmlFor="childId">
              اختيار الطفل
            </label>
            <select
              id="childId"
              required
              value={form.childId}
              onChange={(event) => setForm((prev) => ({ ...prev, childId: event.target.value }))}
              className="mt-1 block w-full rounded-2xl border-slate-200 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">اختر الطفل</option>
              {childrenOptions.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Day */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-600" htmlFor="reportDate">
                تاريخ التقرير
              </label>
              <input
                id="reportDate"
                type="date"
                required
                value={form.reportDate}
                onChange={(event) => setForm((prev) => ({ ...prev, reportDate: event.target.value }))}
                className="mt-1 block w-full rounded-2xl border-slate-200 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">
                اليوم
              </label>
              <input
                type="text"
                readOnly
                value={form.reportDate ? getDayName(form.reportDate) : ''}
                className="mt-1 block w-full rounded-2xl border-slate-200 bg-slate-50 text-sm shadow-sm"
              />
            </div>
          </div>

          {/* Attendance Times */}
          <div className="rounded-lg border border-slate-200 p-4">
            <h4 className="text-md font-semibold text-slate-700 mb-4">أوقات الحضور والانصراف</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  وقت الحضور
                </label>
                <input
                  type="time"
                  value={form.attendance.checkIn}
                  onChange={(e) => setForm({
                    ...form,
                    attendance: { ...form.attendance, checkIn: e.target.value }
                  })}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  وقت الانصراف
                </label>
                <input
                  type="time"
                  value={form.attendance.checkOut}
                  onChange={(e) => setForm({
                    ...form,
                    attendance: { ...form.attendance, checkOut: e.target.value }
                  })}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  حالة الحضور
                </label>
                <select
                  value={form.attendance.status}
                  onChange={(e) => setForm({
                    ...form,
                    attendance: { ...form.attendance, status: e.target.value }
                  })}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="present">حاضر</option>
                  <option value="absent">غائب</option>
                  <option value="late">متأخر</option>
                </select>
              </div>
            </div>
          </div>

          {/* Meals and Snacks */}
          <div className="rounded-lg border border-slate-200 p-4">
            <h4 className="text-md font-semibold text-slate-700 mb-4">وجبات الطعام والوجبات الخفيفة</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">الفطور</label>
                <input
                  type="text"
                  placeholder="مثال: شوفان مع فواكه"
                  value={form.meals.breakfast}
                  onChange={(e) => setForm({
                    ...form,
                    meals: { ...form.meals, breakfast: e.target.value }
                  })}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">الغداء</label>
                <input
                  type="text"
                  placeholder="مثال: دجاج مع أرز"
                  value={form.meals.lunch}
                  onChange={(e) => setForm({
                    ...form,
                    meals: { ...form.meals, lunch: e.target.value }
                  })}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">الوجبات الخفيفة</label>
                <button
                  type="button"
                  onClick={addSnack}
                  className="rounded bg-primary-600 px-3 py-1 text-sm text-white hover:bg-primary-700"
                >
                  إضافة وجبة خفيفة
                </button>
              </div>
              <div className="space-y-2">
                {form.meals.snacks.map((snack, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="اسم الوجبة الخفيفة"
                      value={snack}
                      onChange={(e) => updateSnack(index, e.target.value)}
                      className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeSnack(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sleep Times */}
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-semibold text-slate-700">أوقات النوم والقيلولة</h4>
              <button
                type="button"
                onClick={addSleepPeriod}
                className="rounded bg-primary-600 px-3 py-1 text-sm text-white hover:bg-primary-700"
              >
                إضافة وقت نوم
              </button>
            </div>
            <div className="space-y-3">
              {form.naps.map((nap, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1 space-y-2">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          وقت البداية
                        </label>
                        <input
                          type="time"
                          value={nap.startTime}
                          onChange={(e) => updateSleepPeriod(index, 'startTime', e.target.value)}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          وقت النهاية
                        </label>
                        <input
                          type="time"
                          value={nap.endTime}
                          onChange={(e) => updateSleepPeriod(index, 'endTime', e.target.value)}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          جودة النوم
                        </label>
                        <select
                          value={nap.quality}
                          onChange={(e) => updateSleepPeriod(index, 'quality', e.target.value)}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                        >
                          <option value="good">جيد</option>
                          <option value="fair">متوسط</option>
                          <option value="poor">ضعيف</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSleepPeriod(index)}
                    className="text-red-500 hover:text-red-700 mt-6"
                  >
                    حذف
                  </button>
                </div>
              ))}
              {form.naps.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  لم يتم إضافة أوقات نوم بعد
                </p>
              )}
            </div>
          </div>

          {/* Diaper Changes */}
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-semibold text-slate-700">تغييرات الحفاضات</h4>
              <button
                type="button"
                onClick={addDiaperChange}
                className="rounded bg-primary-600 px-3 py-1 text-sm text-white hover:bg-primary-700"
              >
                إضافة تغيير حفاضة
              </button>
            </div>
            <div className="space-y-3">
              {form.diaperChanges.map((change, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1 space-y-2">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          وقت التغيير
                        </label>
                        <input
                          type="time"
                          value={change.time}
                          onChange={(e) => updateDiaperChange(index, 'time', e.target.value)}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          نوع التغيير
                        </label>
                        <select
                          value={change.type}
                          onChange={(e) => updateDiaperChange(index, 'type', e.target.value)}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                        >
                          <option value="wet">مبلل</option>
                          <option value="soiled">متسخ</option>
                          <option value="both">مبلل ومتسخ</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          ملاحظات (اختياري)
                        </label>
                        <input
                          type="text"
                          placeholder="أي ملاحظات إضافية"
                          value={change.notes}
                          onChange={(e) => updateDiaperChange(index, 'notes', e.target.value)}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDiaperChange(index)}
                    className="text-red-500 hover:text-red-700 mt-6"
                  >
                    حذف
                  </button>
                </div>
              ))}
              {form.diaperChanges.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  لم يتم إضافة تغييرات حفاضات بعد
                </p>
              )}
            </div>
          </div>

          {/* Activities */}
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-semibold text-slate-700">النشاطات</h4>
              <button
                type="button"
                onClick={addActivity}
                className="rounded bg-primary-600 px-3 py-1 text-sm text-white hover:bg-primary-700"
              >
                إضافة نشاط
              </button>
            </div>
            <div className="space-y-3">
              {form.activities.map((activity, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="عنوان النشاط"
                      value={activity.title}
                      onChange={(e) => updateActivity(index, 'title', e.target.value)}
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="وصف النشاط (اختياري)"
                      value={activity.description}
                      onChange={(e) => updateActivity(index, 'description', e.target.value)}
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeActivity(index)}
                    className="text-red-500 hover:text-red-700 mt-2"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Health and Behavior Notes */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4">
              <h4 className="text-md font-semibold text-slate-700 mb-4">الملاحظات الصحية</h4>
              <textarea
                value={form.healthObservations.notes}
                onChange={(e) => setForm({
                  ...form,
                  healthObservations: { ...form.healthObservations, notes: e.target.value }
                })}
                rows={3}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                placeholder="أي ملاحظات صحية أو طبية..."
              />
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <h4 className="text-md font-semibold text-slate-700 mb-4">الملاحظات السلوكية</h4>
              <textarea
                value={form.behaviorNotes}
                onChange={(e) => setForm({ ...form, behaviorNotes: e.target.value })}
                rows={3}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                placeholder="ملاحظات حول سلوك الطفل..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createReportMutation.isLoading}
            className="w-full rounded-full bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:bg-primary-300"
          >
            {createReportMutation.isLoading ? 'جاري الإرسال...' : 'إرسال التقرير إلى المدير'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">تقاريري اليومية</h2>
        <p className="mt-1 text-sm text-slate-500">سجل نشاطاتك اليومية مع الأطفال وتابع حالة التقارير.</p>
      </div>

      {reportsQuery.isLoading && <div className="card text-sm text-slate-500">جاري تحميل التقارير ...</div>}
      {reportsQuery.isError && <div className="card text-sm text-red-500">{handleApiError(reportsQuery.error)}</div>}

      {Array.isArray(reportsQuery.data) && reportsQuery.data.length ? (
        <div className="grid gap-4">
          {reportsQuery.data.map((report) => (
            <div key={report.id} className="card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-800">{report.child?.fullName}</p>
                  <p className="text-xs text-slate-500">
                    بتاريخ
                    {' '}
                    {report.reportDate ? new Date(report.reportDate).toLocaleDateString('ar-JO') : '—'}
                  </p>
                </div>
                <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600">
                  {report.status === 'approved'
                    ? 'معتمد'
                    : report.status === 'submitted'
                      ? 'بانتظار المراجعة'
                      : report.status === 'revision_needed'
                        ? 'مطلوب تعديل'
                        : 'مسودة'}
                </span>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-600">النشاطات</p>
                <ul className="mt-2 list-disc space-y-1 pr-4 text-sm text-slate-600">
                  {Array.isArray(report.activities) && report.activities.length
                    ? report.activities.map((activity, index) => (
                      <li key={index}>{activity.name || activity}</li>
                    ))
                    : <li>لم يتم إدخال نشاطات</li>}
                </ul>
              </div>

              {report.managerNotes && (
                <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-600">
                  ملاحظة المدير:
                  {' '}
                  {report.managerNotes}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        !reportsQuery.isLoading && <div className="card text-sm text-slate-500">لا توجد تقارير مسجلة بعد.</div>
      )}
    </div>
  );
}
