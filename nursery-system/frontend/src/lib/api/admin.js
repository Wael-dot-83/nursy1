import apiClient from '../apiClient';

/**
 * Admin API functions for system analytics and management
 */

// Get comprehensive analytics data for admin dashboard
export const getAdminAnalytics = async () => {
  const response = await apiClient.get('/system/analytics');
  return response.data;
};

// Get system health metrics
export const getSystemHealth = async () => {
  const response = await apiClient.get('/system/system-health');
  return response.data;
};

// Export all functions as default
export default {
  getAdminAnalytics,
  getSystemHealth,
};