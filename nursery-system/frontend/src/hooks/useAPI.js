import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import * as authAPI from './api/auth';
import * as nurseryAPI from './api/nursery';
import * as userAPI from './api/user';
import * as childrenAPI from './api/children';
import * as attendanceAPI from './api/attendance';
import * as reportsAPI from './api/reports';
import * as fileAPI from './api/file';
import * as notificationsAPI from './api/notifications';
import * as adminAPI from './api/admin';

// Authentication hooks
export const useLogin = () => {
  return useMutation({
    mutationFn: authAPI.login,
    onSuccess: (data) => {
      toast.success('تم تسجيل الدخول بنجاح');
    },
    onError: (error) => {
      toast.error(error.message || 'فشل في تسجيل الدخول');
    },
  });
};

export const useRequestOTP = () => {
  return useMutation({
    mutationFn: authAPI.requestOTP,
    onSuccess: () => {
      toast.success('تم إرسال رمز التحقق');
    },
    onError: (error) => {
      toast.error(error.message || 'فشل في إرسال رمز التحقق');
    },
  });
};

export const useVerifyOTP = () => {
  return useMutation({
    mutationFn: authAPI.verifyOTP,
    onSuccess: () => {
      toast.success('تم التحقق من رمز OTP بنجاح');
    },
    onError: (error) => {
      toast.error(error.message || 'فشل في التحقق من رمز OTP');
    },
  });
};

// Nursery hooks
export const useNurseries = (params) => {
  return useQuery({
    queryKey: ['nurseries', params],
    queryFn: () => nurseryAPI.getNurseries(params),
  });
};

export const useCreateNursery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: nurseryAPI.createNursery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurseries'] });
      toast.success('تم إنشاء الحضانة بنجاح');
    },
    onError: (error) => {
      toast.error(error.message || 'فشل في إنشاء الحضانة');
    },
  });
};

export const useUpdateNursery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => nurseryAPI.updateNursery(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurseries'] });
      toast.success('تم تحديث الحضانة بنجاح');
    },
    onError: (error) => {
      toast.error(error.message || 'فشل في تحديث الحضانة');
    },
  });
};

export const useDeleteNursery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: nurseryAPI.deleteNursery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurseries'] });
      toast.success('تم حذف الحضانة بنجاح');
    },
    onError: (error) => {
      toast.error(error.message || 'فشل في حذف الحضانة');
    },
  });
};

// User hooks
export const useUsers = (params) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => userAPI.getUsers(params),
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userAPI.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('تم إنشاء المستخدم بنجاح');
    },
    onError: (error) => {
      toast.error(error.message || 'فشل في إنشاء المستخدم');
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => userAPI.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('تم تحديث المستخدم بنجاح');
    },
    onError: (error) => {
      toast.error(error.message || 'فشل في تحديث المستخدم');
    },
  });
};

// Children hooks
export const useChildren = (params) => {
  return useQuery({
    queryKey: ['children', params],
    queryFn: () => childrenAPI.getChildren(params),
  });
};

export const useCreateChild = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: childrenAPI.createChild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      toast.success('تم إضافة الطفل بنجاح');
    },
    onError: (error) => {
      toast.error(error.message || 'فشل في إضافة الطفل');
    },
  });
};

export const useUpdateChild = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => childrenAPI.updateChild(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      toast.success('تم تحديث بيانات الطفل بنجاح');
    },
    onError: (error) => {
      toast.error(error.message || 'فشل في تحديث بيانات الطفل');
    },
  });
};

// Attendance hooks
export const useAttendance = (params) => {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: () => attendanceAPI.getAttendance(params),
  });
};

export const useCheckInChild = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attendanceAPI.checkInChild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('تم تسجيل دخول الطفل بنجاح');
    },
    onError: (error) => {
      toast.error(error.message || 'فشل في تسجيل دخول الطفل');
    },
  });
};

export const useCheckOutChild = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attendanceAPI.checkOutChild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('تم تسجيل خروج الطفل بنجاح');
    },
    onError: (error) => {
      toast.error(error.message || 'فشل في تسجيل خروج الطفل');
    },
  });
};

// Reports hooks
export const useDailyReports = (params) => {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: () => reportsAPI.getDailyReports(params),
  });
};

export const useCreateDailyReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reportsAPI.createDailyReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('تم إنشاء التقرير اليومي بنجاح');
    },
    onError: (error) => {
      toast.error(error.message || 'فشل في إنشاء التقرير اليومي');
    },
  });
};

export const useNurseryStats = () => {
  return useQuery({
    queryKey: ['nursery-stats'],
    queryFn: reportsAPI.getNurseryStats,
  });
};

export const useChildrenStats = () => {
  return useQuery({
    queryKey: ['children-stats'],
    queryFn: reportsAPI.getChildrenStats,
  });
};

// Health check hook
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => fetch('/health').then(res => res.json()),
    refetchInterval: 30000, // Check every 30 seconds
  });
};

// Admin hooks
export const useAdminAnalytics = () => {
  return useQuery({
    queryKey: ['admin-analytics'],
    queryFn: adminAPI.getAdminAnalytics,
    refetchInterval: 300000, // Refetch every 5 minutes
  });
};

export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: adminAPI.getSystemHealth,
    refetchInterval: 60000, // Refetch every minute
  });
};