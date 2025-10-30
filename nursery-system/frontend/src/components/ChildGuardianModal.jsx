
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition, Tab, Combobox } from '@headlessui/react';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';
import Button from './ui/Button';
import Input from './ui/Input';
import { uploadFile } from '../lib/api/file';
import { apiClient, handleApiError } from '../lib/apiClient';

const nationalities = [
  { value: 'Jordanian', label: '?????/?' },
  { value: 'Palestinian', label: '???????/?' },
  { value: 'Syrian', label: '????/?' },
  { value: 'Iraqi', label: '?????/?' },
  { value: 'Egyptian', label: '????/?' },
  { value: 'Other', label: '????? ????' },
];

const cities = [
  '????',
  '????',
  '???????',
  '?????',
  '?????',
  '?????',
  '???',
  '?????',
  '??????',
  '???????',
  '????',
  '??????',
];

const allowedDocumentMimeTypes = ['application/pdf', 'image/png', 'image/jpeg'];
const allowedDocumentExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
const maxDocumentSizeBytes = 5 * 1024 * 1024;
const maxPhotoSizeBytes = 3 * 1024 * 1024;

const arabicErrors = {
  required: '??? ????? ??????.',
  invalidBirthDate: '?????? ????? ????? ????? ????.',
  ageRange: '????? ??? ?? ???? ??? 70 ????? ?4 ????? ?8 ????.',
  nationalId: '????? ?????? ??? ?? ?????? ?? 10 ?????.',
  phone: '??? ?????? ??????? ??? ????. ????: 0798765432.',
  fileType: '??? ????? ??? ?????. ????? ??? ?? PDF, PNG, JPG.',
  fileSize: '??? ????? ?????? 5MB.',
  photoSize: '??? ?????? ?????? 3MB.',
  photoType: '??? ?????? ??? ?????. ????? ??? ?? PNG ?? JPG.',
};

const emailRegex =
  // eslint-disable-next-line no-control-regex
  /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|\[(?:(?:(2(5[0-5]|[0-4]\d))|1?\d?\d)\.){3}(?:(2(5[0-5]|[0-4]\d))|1?\d?\d|[a-zA-Z-]*[a-zA-Z]:.+)\])$/;

const jordanianPhoneRegex = /^07\d{8}$/;
const jordanianNationalIdRegex = /^\d{10}$/;
const passportRegex = /^[^\s]{5,20}$/;

function normalize(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isBirthDateInAllowedRange(birthDateInput, todayInput = new Date()) {
  const today = normalize(todayInput);
  const birth = normalize(birthDateInput);

  if (Number.isNaN(birth.getTime())) return { ok: false, reason: 'invalid' };
  if (birth > today) return { ok: false, reason: 'future' };

  const minAllowedBirth = new Date(today);
  minAllowedBirth.setFullYear(minAllowedBirth.getFullYear() - 4);
  minAllowedBirth.setMonth(minAllowedBirth.getMonth() - 8);

  const maxAllowedBirth = new Date(today);
  maxAllowedBirth.setDate(maxAllowedBirth.getDate() - 70);

  const ok = birth >= minAllowedBirth && birth <= maxAllowedBirth;
  return { ok, minAllowedBirth, maxAllowedBirth };
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

const createInitialChildState = () => ({
  fullName: '',
  birthDate: '',
  nationality: 'Jordanian',
  nationalId: '',
  passportNumber: '',
  photoOption: 'url',
  photoUrl: '',
  photoFile: null,
  healthNotes: '',
  educationNotes: '',
});

const createInitialGuardianState = () => ({
  fullName: '',
  email: '',
  phone: '',
  nationality: 'Jordanian',
  nationalId: '',
  passportNumber: '',
  homeAddress: { city: '', street: '' },
  workAddress: { city: '', street: '' },
});

const createInitialDocumentsState = () => ({
  birthCertificate: { file: null },
  medicalClearance: { file: null },
});

export default function ChildGuardianModal({ open, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState('child');
  const [childForm, setChildForm] = useState(createInitialChildState);
  const [guardianForm, setGuardianForm] = useState(createInitialGuardianState);
  const [documents, setDocuments] = useState(createInitialDocumentsState);
  const [childErrors, setChildErrors] = useState({});
  const [guardianErrors, setGuardianErrors] = useState({});
  const [childTouched, setChildTouched] = useState({});
  const [guardianTouched, setGuardianTouched] = useState({});
  const [documentTouched, setDocumentTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setActiveTab('child');
      setChildForm(createInitialChildState());
      setGuardianForm(createInitialGuardianState());
      setDocuments(createInitialDocumentsState());
      setChildErrors({});
      setGuardianErrors({});
      setChildTouched({});
      setGuardianTouched({});
      setDocumentTouched({});
    }
  }, [open]);

  useEffect(() => {
    setChildErrors(validateChildForm(childForm, documents));
  }, [childForm, documents]);

  useEffect(() => {
    setGuardianErrors(validateGuardianForm(guardianForm));
  }, [guardianForm]);

  const childFormValid = useMemo(() => isErrorMapEmpty(childErrors), [childErrors]);
  const guardianFormValid = useMemo(() => isErrorMapEmpty(guardianErrors), [guardianErrors]);
  const canSave = childFormValid && guardianFormValid && documents.birthCertificate.file && documents.medicalClearance.file;

  const handleChildChange = (field, value) => {
    setChildForm(prev => {
      if (field === 'nationality') {
        const next = {
          ...prev,
          [field]: value,
        };
        if (value === 'Jordanian') {
          next.passportNumber = '';
        } else {
          next.nationalId = '';
        }
        return next;
      }
      if (field === 'photoOption') {
        return {
          ...prev,
          photoOption: value,
          photoUrl: value === 'url' ? prev.photoUrl : '',
          photoFile: value === 'file' ? prev.photoFile : null,
        };
      }
      if (field === 'photoUrl') {
        return { ...prev, photoUrl: value, photoFile: null };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleGuardianChange = (field, value) => {
    setGuardianForm(prev => {
      if (field === 'nationality') {
        const next = {
          ...prev,
          [field]: value,
        };
        if (value === 'Jordanian') {
          next.passportNumber = '';
        } else {
          next.nationalId = '';
        }
        return next;
      }
      return { ...prev, [field]: value };
    });
  };

  const handleGuardianAddressChange = (type, key, value) => {
    setGuardianForm(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: value,
      },
    }));
  };

  const handleCopyAddress = () => {
    setGuardianForm(prev => ({
      ...prev,
      workAddress: { ...prev.homeAddress },
    }));
    setGuardianTouched(prev => ({
      ...prev,
      'workAddress.city': true,
      'workAddress.street': true,
    }));
  };

  const handlePhotoFile = (file) => {
    setChildTouched(prev => ({ ...prev, photo: true }));
    if (!file) {
      setChildForm(prev => ({ ...prev, photoFile: null }));
      return;
    }
    const { error } = validatePhotoFile(file);
    if (error) {
      toast.error(error);
      setChildForm(prev => ({ ...prev, photoFile: null }));
      return;
    }
    setChildForm(prev => ({
      ...prev,
      photoFile: file,
      photoUrl: '',
      photoOption: 'file',
    }));
  };

  const handleDocumentFile = (key, file) => {
    setDocumentTouched(prev => ({ ...prev, [key]: true }));
    setDocuments(prev => ({
      ...prev,
      [key]: { file: null },
    }));
    if (!file) return;
    const validation = validateDocumentFile(file);
    if (!validation.ok) {
      toast.error(validation.error);
      return;
    }
    setDocuments(prev => ({
      ...prev,
      [key]: { file },
    }));
  };

  const handleDocumentDrop = (key, event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    handleDocumentFile(key, file);
  };

  const handleSubmit = async () => {
    setChildTouched(prev => ({
      ...prev,
      fullName: true,
      birthDate: true,
      nationality: true,
      nationalId: true,
      passportNumber: true,
      photo: true,
    }));
    setGuardianTouched(prev => ({
      ...prev,
      fullName: true,
      email: true,
      phone: true,
      nationality: true,
      nationalId: true,
      passportNumber: true,
      'homeAddress.city': true,
      'homeAddress.street': true,
      'workAddress.city': true,
      'workAddress.street': true,
    }));
    setDocumentTouched(prev => ({
      ...prev,
      birthCertificate: true,
      medicalClearance: true,
    }));

    if (!canSave) {
      toast.error('?????? ????? ??????? ??? ?????.');
      return;
    }

    try {
      setIsSubmitting(true);

      const [birthCertificateUrl, medicalClearanceUrl, photoUrl] = await uploadAllFiles({
        birthCertificate: documents.birthCertificate.file,
        medicalClearance: documents.medicalClearance.file,
        photoFile: childForm.photoOption === 'file' ? childForm.photoFile : null,
      });

      const payload = buildPayload({
        childForm,
        guardianForm,
        birthCertificateUrl,
        medicalClearanceUrl,
        photoUrlOverride: photoUrl,
      });

      await apiClient.post('/manager/enrollments', payload);

      toast.success('?? ????? ?????.');
      if (onSuccess) {
        onSuccess(payload);
      }
      onClose();
    } catch (error) {
      const message = handleApiError(error);
      toast.error(message || '??? ??? ??? ?????.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose} dir="rtl" lang="ar">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-6 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-6 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white text-right shadow-2xl">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-primary-400 via-primary-500 to-primary-600" />
                <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                  <div>
                    <Dialog.Title className="text-2xl font-bold text-slate-900">????? ??? ???? ???</Dialog.Title>
                    <p className="mt-1 text-sm text-slate-500">
                      ???? ????? ?????? ??????? ?????? ?????? ?? ?????? ????? ???????.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    aria-label="?????"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10l-4.95-4.95A1 1 0 116.05 3.636L11 8.586z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                <div className="px-6 pb-6 pt-2 sm:px-8">
                  <Tab.Group
                    selectedIndex={activeTab === 'child' ? 0 : 1}
                    onChange={index => setActiveTab(index === 0 ? 'child' : 'guardian')}
                  >
                    <Tab.List className="mb-6 inline-flex rounded-full bg-slate-100 p-1 text-sm font-semibold text-slate-500">
                      <Tab as={Fragment}>
                        {({ selected }) => (
                          <button
                            type="button"
                            className={clsx(
                              'rounded-full px-4 py-2 transition',
                              selected ? 'bg-white text-primary-600 shadow-sm' : 'hover:text-slate-700',
                            )}
                          >
                            ????? ???
                          </button>
                        )}
                      </Tab>
                      <Tab as={Fragment}>
                        {({ selected }) => (
                          <button
                            type="button"
                            className={clsx(
                              'rounded-full px-4 py-2 transition',
                              selected ? 'bg-white text-primary-600 shadow-sm' : 'hover:text-slate-700',
                            )}
                          >
                            ????? ??? ???
                          </button>
                        )}
                      </Tab>
                    </Tab.List>

                    <Tab.Panels>
                      <Tab.Panel>
                        <section className="space-y-6">
                          <div className="grid gap-6 md:grid-cols-2">
                            <Input
                              required
                              label="????? ??????"
                              placeholder="???? ????? ?????? ?????"
                              value={childForm.fullName}
                              onChange={event => handleChildChange('fullName', event.target.value)}
                              onBlur={() => setChildTouched(prev => ({ ...prev, fullName: true }))}
                              error={childTouched.fullName && childErrors.fullName}
                            />

                            <Input
                              required
                              type="date"
                              label="????? ???????"
                              placeholder="???? ????? ???????"
                              value={childForm.birthDate}
                              onChange={event => handleChildChange('birthDate', event.target.value)}
                              onBlur={() => setChildTouched(prev => ({ ...prev, birthDate: true }))}
                              error={childTouched.birthDate && (childErrors.birthDate || childErrors.ageRange)}
                            />
                          </div>

                          <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-1.5">
                              <label className="block text-sm font-medium text-slate-700">
                                ???????<span className="mr-1 text-danger-500">*</span>
                              </label>
                              <select
                                className={clsx(
                                  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200',
                                  childTouched.nationality && childErrors.nationality && 'border-danger-300 focus:border-danger-400 focus:ring-danger-200',
                                )}
                                value={childForm.nationality}
                                onChange={event => handleChildChange('nationality', event.target.value)}
                                onBlur={() => setChildTouched(prev => ({ ...prev, nationality: true }))}
                              >
                                {nationalities.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              {childTouched.nationality && childErrors.nationality && (
                                <p className="text-sm text-danger-600">{childErrors.nationality}</p>
                              )}
                            </div>

                            {childForm.nationality === 'Jordanian' ? (
                              <Input
                                required
                                label="????? ??????"
                                placeholder="???? ????? ?????? (10 ?????)"
                                value={childForm.nationalId}
                                onChange={event => handleChildChange('nationalId', event.target.value)}
                                onBlur={() => setChildTouched(prev => ({ ...prev, nationalId: true }))}
                                error={childTouched.nationalId && childErrors.nationalId}
                              />
                            ) : (
                              <Input
                                required
                                label="??? ???? ?????"
                                placeholder="???? ??? ?????? (5 - 20 ????)"
                                value={childForm.passportNumber}
                                onChange={event => handleChildChange('passportNumber', event.target.value)}
                                onBlur={() => setChildTouched(prev => ({ ...prev, passportNumber: true }))}
                                error={childTouched.passportNumber && childErrors.passportNumber}
                              />
                            )}
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                            <h3 className="text-base font-semibold text-slate-800">???? ?????</h3>
                            <p className="mt-1 text-sm text-slate-500">
                              ????? ????? ???? ????? ?????? ?? ????? ??? (PNG ?? JPG ??? ???? 3MB).
                            </p>

                            <div className="mt-4 flex flex-col gap-4 lg:flex-row">
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                  <input
                                    type="radio"
                                    name="photoOption"
                                    value="url"
                                    checked={childForm.photoOption === 'url'}
                                    onChange={event => handleChildChange('photoOption', event.target.value)}
                                  />
                                  ????? ????
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                  <input
                                    type="radio"
                                    name="photoOption"
                                    value="file"
                                    checked={childForm.photoOption === 'file'}
                                    onChange={event => handleChildChange('photoOption', event.target.value)}
                                  />
                                  ????? ????
                                </label>
                              </div>

                              {childForm.photoOption === 'url' ? (
                                <Input
                                  required
                                  type="url"
                                  placeholder="https://example.com/photo.jpg"
                                  value={childForm.photoUrl}
                                  onChange={event => handleChildChange('photoUrl', event.target.value)}
                                  onBlur={() => setChildTouched(prev => ({ ...prev, photo: true }))}
                                  error={childTouched.photo && childErrors.photo}
                                  containerClassName="flex-1"
                                />
                              ) : (
                                <div className="flex w-full flex-col gap-3 rounded-2xl border-2 border-dashed border-primary-200 bg-white p-6 text-center text-sm text-primary-600 transition hover:border-primary-300 hover:bg-primary-50/40">
                                  <input
                                    type="file"
                                    accept=".png,.jpg,.jpeg"
                                    id="child-photo-upload"
                                    className="hidden"
                                    onChange={event => {
                                      handlePhotoFile(event.target.files?.[0]);
                                      event.target.value = '';
                                    }}
                                  />
                                  <label htmlFor="child-photo-upload" className="cursor-pointer font-medium">
                                    ???? ?????? ??? ?? ???? ????????
                                  </label>
                                  <p className="text-xs text-slate-500">??????? ??????? ???: PNG, JPG — ???? ?????? 3MB</p>
                                  {childForm.photoFile && (
                                    <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-100 px-4 py-2 text-right text-sm text-slate-700">
                                      <span className="truncate">{childForm.photoFile.name}</span>
                                      <span className="text-xs text-slate-500">{formatBytes(childForm.photoFile.size)}</span>
                                    </div>
                                  )}
                                  {childTouched.photo && childErrors.photo && (
                                    <p className="text-sm text-danger-600">{childErrors.photo}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-1.5">
                              <label className="block text-sm font-medium text-slate-700">??????? ???? (???????)</label>
                              <textarea
                                rows={3}
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                                placeholder="???? ??????? ???? ???? ?? ????"
                                value={childForm.healthNotes}
                                onChange={event => handleChildChange('healthNotes', event.target.value)}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-sm font-medium text-slate-700">??????? ??????? (???????)</label>
                              <textarea
                                rows={3}
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                                placeholder="???? ?? ??????? ??????? ?? ??????"
                                value={childForm.educationNotes}
                                onChange={event => handleChildChange('educationNotes', event.target.value)}
                              />
                            </div>
                          </div>
                        </section>
                      </Tab.Panel>

                      <Tab.Panel>
                        <section className="space-y-6">
                          <div className="grid gap-6 md:grid-cols-2">
                            <Input
                              required
                              label="????? ??????"
                              placeholder="???? ????? ?????? ???? ?????"
                              value={guardianForm.fullName}
                              onChange={event => handleGuardianChange('fullName', event.target.value)}
                              onBlur={() => setGuardianTouched(prev => ({ ...prev, fullName: true }))}
                              error={guardianTouched.fullName && guardianErrors.fullName}
                            />

                            <Input
                              label="?????? ??????????"
                              placeholder="name@example.com"
                              value={guardianForm.email}
                              onChange={event => handleGuardianChange('email', event.target.value)}
                              onBlur={() => setGuardianTouched(prev => ({ ...prev, email: true }))}
                              error={guardianTouched.email && guardianErrors.email}
                            />
                          </div>

                          <div className="grid gap-6 md:grid-cols-2">
                            <Input
                              required
                              label="??? ??????"
                              placeholder="0798765432"
                              value={guardianForm.phone}
                              onChange={event => handleGuardianChange('phone', event.target.value)}
                              onBlur={() => setGuardianTouched(prev => ({ ...prev, phone: true }))}
                              error={guardianTouched.phone && guardianErrors.phone}
                            />

                            <div className="space-y-1.5">
                              <label className="block text-sm font-medium text-slate-700">
                                ???????<span className="mr-1 text-danger-500">*</span>
                              </label>
                              <select
                                className={clsx(
                                  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200',
                                  guardianTouched.nationality && guardianErrors.nationality && 'border-danger-300 focus:border-danger-400 focus:ring-danger-200',
                                )}
                                value={guardianForm.nationality}
                                onChange={event => handleGuardianChange('nationality', event.target.value)}
                                onBlur={() => setGuardianTouched(prev => ({ ...prev, nationality: true }))}
                              >
                                {nationalities.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              {guardianTouched.nationality && guardianErrors.nationality && (
                                <p className="text-sm text-danger-600">{guardianErrors.nationality}</p>
                              )}
                            </div>
                          </div>

                          <div className="grid gap-6 md:grid-cols-2">
                            {guardianForm.nationality === 'Jordanian' ? (
                              <Input
                                required
                                label="????? ??????"
                                placeholder="???? ????? ?????? (10 ?????)"
                                value={guardianForm.nationalId}
                                onChange={event => handleGuardianChange('nationalId', event.target.value)}
                                onBlur={() => setGuardianTouched(prev => ({ ...prev, nationalId: true }))}
                                error={guardianTouched.nationalId && guardianErrors.nationalId}
                              />
                            ) : (
                              <Input
                                required
                                label="??? ???? ?????"
                                placeholder="???? ??? ?????? (5 - 20 ????)"
                                value={guardianForm.passportNumber}
                                onChange={event => handleGuardianChange('passportNumber', event.target.value)}
                                onBlur={() => setGuardianTouched(prev => ({ ...prev, passportNumber: true }))}
                                error={guardianTouched.passportNumber && guardianErrors.passportNumber}
                              />
                            )}
                          </div>

                          <div className="grid gap-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 md:grid-cols-2">
                            <div className="space-y-4">
                              <h3 className="text-sm font-semibold text-slate-800">????? ?????</h3>
                              <CityCombobox
                                value={guardianForm.homeAddress.city}
                                onChange={(val) => {
                                  handleGuardianAddressChange('homeAddress', 'city', val);
                                  setGuardianTouched(prev => ({ ...prev, 'homeAddress.city': true }));
                                }}
                                onBlur={() => setGuardianTouched(prev => ({ ...prev, 'homeAddress.city': true }))}
                                error={guardianTouched['homeAddress.city'] && guardianErrors.homeAddress?.city}
                              />
                              <Input
                                required
                                label="??????"
                                placeholder="??? ?????? / ???????"
                                value={guardianForm.homeAddress.street}
                                onChange={event => handleGuardianAddressChange('homeAddress', 'street', event.target.value)}
                                onBlur={() => setGuardianTouched(prev => ({ ...prev, 'homeAddress.street': true }))}
                                error={guardianTouched['homeAddress.street'] && guardianErrors.homeAddress?.street}
                              />
                            </div>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-800">????? ?????</h3>
                                <button
                                  type="button"
                                  className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700 transition hover:bg-primary-200"
                                  onClick={handleCopyAddress}
                                >
                                  ??? ????? ????? ?????
                                </button>
                              </div>
                              <CityCombobox
                                value={guardianForm.workAddress.city}
                                onChange={(val) => {
                                  handleGuardianAddressChange('workAddress', 'city', val);
                                  setGuardianTouched(prev => ({ ...prev, 'workAddress.city': true }));
                                }}
                                onBlur={() => setGuardianTouched(prev => ({ ...prev, 'workAddress.city': true }))}
                                error={guardianTouched['workAddress.city'] && guardianErrors.workAddress?.city}
                              />
                              <Input
                                required
                                label="??????"
                                placeholder="??? ?????? / ???????"
                                value={guardianForm.workAddress.street}
                                onChange={event => handleGuardianAddressChange('workAddress', 'street', event.target.value)}
                                onBlur={() => setGuardianTouched(prev => ({ ...prev, 'workAddress.street': true }))}
                                error={guardianTouched['workAddress.street'] && guardianErrors.workAddress?.street}
                              />
                            </div>
                          </div>
                        </section>
                      </Tab.Panel>
                    </Tab.Panels>
                  </Tab.Group>

                  <section className="mt-8 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">??????? ????? ????????</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        ????? ????? ????? ??????? ?????? ??????? ?????? ???? PDF ?? PNG ?? JPG (?? ???? 5MB ??? ???).
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <DocumentUploader
                        label="????? ???????"
                        description="PDF, PNG, JPG — ??? 5MB"
                        documentKey="birthCertificate"
                        documentState={documents.birthCertificate}
                        onDrop={event => handleDocumentDrop('birthCertificate', event)}
                        onFileSelect={file => handleDocumentFile('birthCertificate', file)}
                        onRemove={() => handleDocumentFile('birthCertificate', null)}
                        error={documentTouched.birthCertificate && childErrors.documents?.birthCertificate}
                      />
                      <DocumentUploader
                        label="????? ??????? ??????"
                        description="PDF, PNG, JPG — ??? 5MB"
                        documentKey="medicalClearance"
                        documentState={documents.medicalClearance}
                        onDrop={event => handleDocumentDrop('medicalClearance', event)}
                        onFileSelect={file => handleDocumentFile('medicalClearance', file)}
                        onRemove={() => handleDocumentFile('medicalClearance', null)}
                        error={documentTouched.medicalClearance && childErrors.documents?.medicalClearance}
                      />
                    </div>
                  </section>

                  <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
                    <div className="text-xs text-slate-500">
                      ??? ????? ?? ????? ???????? ??? ?????? ???? ?????? ??????? ?? ?????.
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        ?????
                      </Button>
                      <Button
                        variant="primary"
                        className="bg-gradient-to-l from-primary-500 via-primary-600 to-primary-700 shadow-md hover:from-primary-600 hover:via-primary-700 hover:to-primary-800"
                        onClick={handleSubmit}
                        disabled={!canSave}
                        loading={isSubmitting}
                      >
                        ???
                      </Button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function validateChildForm(form, documents) {
  const errors = {};

  if (!form.fullName.trim()) {
    errors.fullName = arabicErrors.required;
  } else if (form.fullName.trim().length < 3 || form.fullName.trim().length > 80) {
    errors.fullName = '????? ??? ?? ?????? ??? 3 ?80 ?????.';
  }

  if (!form.birthDate) {
    errors.birthDate = arabicErrors.invalidBirthDate;
  } else {
    const birthDateCheck = isBirthDateInAllowedRange(form.birthDate);
    if (!birthDateCheck.ok) {
      if (birthDateCheck.reason === 'invalid') {
        errors.birthDate = arabicErrors.invalidBirthDate;
      } else if (birthDateCheck.reason === 'future') {
        errors.birthDate = arabicErrors.invalidBirthDate;
      } else {
        errors.ageRange = arabicErrors.ageRange;
      }
    }
  }

  if (!form.nationality) {
    errors.nationality = arabicErrors.required;
  }

  if (form.nationality === 'Jordanian') {
    if (!form.nationalId) {
      errors.nationalId = arabicErrors.required;
    } else if (!jordanianNationalIdRegex.test(form.nationalId)) {
      errors.nationalId = arabicErrors.nationalId;
    }
  } else {
    if (!form.passportNumber) {
      errors.passportNumber = arabicErrors.required;
    } else if (!passportRegex.test(form.passportNumber) || form.passportNumber.trim().length !== form.passportNumber.length) {
      errors.passportNumber = '??? ???? ????? ??? ?? ?????? ??? 5 ?20 ????? ???? ?????? ?? ??????? ?? ???????.';
    }
  }

  if (form.photoOption === 'url') {
    if (!form.photoUrl) {
      errors.photo = arabicErrors.required;
    } else {
      try {
        // eslint-disable-next-line no-new
        new URL(form.photoUrl);
      } catch {
        errors.photo = '?????? ????? ???? ???? ????.';
      }
    }
  } else {
    if (!form.photoFile) {
      errors.photo = arabicErrors.required;
    } else {
      const { error } = validatePhotoFile(form.photoFile);
      if (error) {
        errors.photo = error;
      }
    }
  }

  const documentErrors = {};
  if (!documents.birthCertificate.file) {
    documentErrors.birthCertificate = arabicErrors.required;
  } else {
    const validation = validateDocumentFile(documents.birthCertificate.file);
    if (!validation.ok) {
      documentErrors.birthCertificate = validation.error;
    }
  }

  if (!documents.medicalClearance.file) {
    documentErrors.medicalClearance = arabicErrors.required;
  } else {
    const validation = validateDocumentFile(documents.medicalClearance.file);
    if (!validation.ok) {
      documentErrors.medicalClearance = validation.error;
    }
  }

  if (Object.keys(documentErrors).length > 0) {
    errors.documents = documentErrors;
  }

  return errors;
}

function validateGuardianForm(form) {
  const errors = {};

  if (!form.fullName.trim()) {
    errors.fullName = arabicErrors.required;
  } else if (form.fullName.trim().length < 3 || form.fullName.trim().length > 80) {
    errors.fullName = '????? ??? ?? ?????? ??? 3 ?80 ?????.';
  }

  if (form.email) {
    if (!emailRegex.test(form.email)) {
      errors.email = '???? ?????? ?????????? ??? ?????.';
    }
  }

  if (!form.phone) {
    errors.phone = arabicErrors.required;
  } else if (!jordanianPhoneRegex.test(form.phone)) {
    errors.phone = arabicErrors.phone;
  }

  if (!form.nationality) {
    errors.nationality = arabicErrors.required;
  }

  if (form.nationality === 'Jordanian') {
    if (!form.nationalId) {
      errors.nationalId = arabicErrors.required;
    } else if (!jordanianNationalIdRegex.test(form.nationalId)) {
      errors.nationalId = arabicErrors.nationalId;
    }
  } else {
    if (!form.passportNumber) {
      errors.passportNumber = arabicErrors.required;
    } else if (!passportRegex.test(form.passportNumber) || form.passportNumber.trim().length !== form.passportNumber.length) {
      errors.passportNumber = '??? ???? ????? ??? ?? ?????? ??? 5 ?20 ????? ???? ?????? ?? ??????? ?? ???????.';
    }
  }

  const homeErrors = {};
  if (!form.homeAddress.city) {
    homeErrors.city = arabicErrors.required;
  }
  if (!form.homeAddress.street.trim()) {
    homeErrors.street = arabicErrors.required;
  } else if (form.homeAddress.street.trim().length < 3 || form.homeAddress.street.trim().length > 80) {
    homeErrors.street = '?????? ??? ?? ?????? ??? 3 ?80 ?????.';
  }

  if (Object.keys(homeErrors).length > 0) {
    errors.homeAddress = homeErrors;
  }

  const workErrors = {};
  if (!form.workAddress.city) {
    workErrors.city = arabicErrors.required;
  }
  if (!form.workAddress.street.trim()) {
    workErrors.street = arabicErrors.required;
  } else if (form.workAddress.street.trim().length < 3 || form.workAddress.street.trim().length > 80) {
    workErrors.street = '?????? ??? ?? ?????? ??? 3 ?80 ?????.';
  }

  if (Object.keys(workErrors).length > 0) {
    errors.workAddress = workErrors;
  }

  return errors;
}

function isErrorMapEmpty(errorMap) {
  if (!errorMap || typeof errorMap !== 'object') return true;
  return Object.values(errorMap).every(value => {
    if (!value) return true;
    if (typeof value === 'object') {
      return isErrorMapEmpty(value);
    }
    return false;
  });
}

function validateDocumentFile(file) {
  if (!file) return { ok: false, error: arabicErrors.required };

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const typeValid = allowedDocumentMimeTypes.includes(file.type) || allowedDocumentExtensions.includes(extension);
  if (!typeValid) {
    return { ok: false, error: arabicErrors.fileType };
  }

  if (file.size > maxDocumentSizeBytes) {
    return { ok: false, error: arabicErrors.fileSize };
  }

  return { ok: true };
}

function validatePhotoFile(file) {
  if (!file) return { ok: false, error: arabicErrors.required };
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const isValidType = ['image/png', 'image/jpeg'].includes(file.type) || ['png', 'jpg', 'jpeg'].includes(extension);
  if (!isValidType) {
    return { ok: false, error: arabicErrors.photoType };
  }
  if (file.size > maxPhotoSizeBytes) {
    return { ok: false, error: arabicErrors.photoSize };
  }
  return { ok: true };
}

async function uploadAllFiles({ birthCertificate, medicalClearance, photoFile }) {
  const uploads = await Promise.all([
    uploadFile(birthCertificate, { category: 'birth_certificate' }),
    uploadFile(medicalClearance, { category: 'medical_clearance' }),
    photoFile ? uploadFile(photoFile, { category: 'child_photo' }) : Promise.resolve(null),
  ]);

  return uploads.map(result => result?.data?.url ?? null);
}

function buildPayload({ childForm, guardianForm, birthCertificateUrl, medicalClearanceUrl, photoUrlOverride }) {
  return {
    child: {
      full_name: childForm.fullName.trim(),
      birth_date: childForm.birthDate,
      nationality: childForm.nationality,
      national_id: childForm.nationality === 'Jordanian' ? childForm.nationalId : null,
      passport_number: childForm.nationality === 'Jordanian' ? null : childForm.passportNumber.trim(),
      photo_url: childForm.photoOption === 'url' ? childForm.photoUrl.trim() : photoUrlOverride,
      documents: {
        birth_certificate_url: birthCertificateUrl,
        medical_clearance_url: medicalClearanceUrl,
      },
      health_notes: childForm.healthNotes.trim() || null,
      education_notes: childForm.educationNotes.trim() || null,
    },
    guardian: {
      full_name: guardianForm.fullName.trim(),
      email: guardianForm.email.trim() || null,
      phone: guardianForm.phone,
      nationality: guardianForm.nationality,
      national_id: guardianForm.nationality === 'Jordanian' ? guardianForm.nationalId : null,
      passport_number: guardianForm.nationality === 'Jordanian' ? null : guardianForm.passportNumber.trim(),
      home_address: {
        city: guardianForm.homeAddress.city,
        street: guardianForm.homeAddress.street.trim(),
      },
      work_address: {
        city: guardianForm.workAddress.city,
        street: guardianForm.workAddress.street.trim(),
      },
    },
  };
}

function DocumentUploader({ label, description, documentState, onDrop, onFileSelect, onRemove, error, documentKey }) {
  const fileInputId = `${documentKey}-file-input`;

  return (
    <div
      onDragOver={event => event.preventDefault()}
      onDragEnter={event => event.preventDefault()}
      onDrop={onDrop}
      className={clsx(
        'flex h-full flex-col justify-between rounded-2xl border-2 border-dashed border-slate-200 bg-white p-5 text-sm transition',
        'hover:border-primary-300 hover:bg-primary-50/40',
        error && 'border-danger-300 bg-danger-50/40',
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-base font-semibold text-slate-800">{label}</p>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
          <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-medium text-primary-600">??????</span>
        </div>

        <label
          htmlFor={fileInputId}
          className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50/60 px-4 py-6 text-primary-600 transition hover:border-primary-300 hover:bg-primary-100/70"
        >
          <svg className="h-8 w-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M24 32V16m0 0l-6 6m6-6l6 6M10 28a6 6 0 016-6h16a6 6 0 016 6v10H10V28z" />
          </svg>
          <div className="text-sm font-medium">???? ????? ??? ?? ???? ????????</div>
          <div className="text-xs text-slate-500">???? ???? PDF ?? ??? PNG/JPG ??? ???? 5MB</div>
        </label>
        <input
          id={fileInputId}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={event => {
            onFileSelect(event.target.files?.[0] ?? null);
            event.target.value = '';
          }}
        />

        {documentState.file && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-100 px-4 py-2 text-slate-700">
            <div className="flex flex-col text-right">
              <span className="text-sm font-medium">{documentState.file.name}</span>
              <span className="text-xs text-slate-500">{formatBytes(documentState.file.size)}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg bg-white px-3 py-1 text-xs font-medium text-primary-600 shadow-sm ring-1 ring-primary-100 transition hover:bg-primary-50"
                onClick={() => document.getElementById(fileInputId)?.click()}
              >
                ???????
              </button>
              <button
                type="button"
                className="rounded-lg bg-danger-100 px-3 py-1 text-xs font-medium text-danger-600 transition hover:bg-danger-200"
                onClick={onRemove}
              >
                ?????
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-2 text-sm text-danger-600">{error}</p>}
      </div>
    </div>
  );
}

function CityCombobox({ value, onChange, onBlur, error }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!query.trim()) return cities;
    return cities.filter(city => city.includes(query.trim())) || cities;
  }, [query]);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">
        ???????<span className="mr-1 text-danger-500">*</span>
      </label>
      <Combobox value={value} onChange={onChange}>
        <div className="relative mt-1">
          <Combobox.Input
            displayValue={city => city}
            onChange={event => setQuery(event.target.value)}
            onBlur={onBlur}
            className={clsx(
              'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200',
              error && 'border-danger-300 focus:border-danger-400 focus:ring-danger-200',
            )}
            placeholder="???? ???????"
          />
          {filtered.length > 0 && (
            <Combobox.Options className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg">
              {filtered.map(city => (
                <Combobox.Option
                  key={city}
                  value={city}
                  className={({ active }) =>
                    clsx(
                      'cursor-pointer select-none px-4 py-2 text-right transition',
                      active ? 'bg-primary-50 text-primary-700' : 'text-slate-700',
                    )
                  }
                >
                  {city}
                </Combobox.Option>
              ))}
            </Combobox.Options>
          )}
        </div>
      </Combobox>
      {error && <p className="text-sm text-danger-600">{error}</p>}
    </div>
  );
}
