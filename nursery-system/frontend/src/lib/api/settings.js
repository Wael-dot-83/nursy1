import { apiClient, getEndpoint } from '../apiClient';

// Settings API
export const getGovernorates = () => apiClient.get(getEndpoint('/admin/settings/governorates'));
