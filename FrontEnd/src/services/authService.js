import axios from 'axios';

export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.protocol}//${window.location.hostname}:5000/api`;
  }
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

const authApi = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json'
  }
});

const TOKEN_KEY = 'edupulse_token';
const USER_KEY = 'edupulse_user';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const getStoredUser = () => {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

export const setStoredAuth = (token, user) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const getAdminHeaders = () => {
  const token = getStoredToken();
  const adminKey = import.meta.env.VITE_ADMIN_KEY || 'admin-secret-token';
  const headers = { 'x-admin-key': adminKey };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Register user (student, teacher, admin)
 */
export const register = async ({ name, email, password, role }) => {
  const response = await authApi.post('/register', { name, email, password, role });
  if (response.data && response.data.token && response.data.approved) {
    setStoredAuth(response.data.token, response.data.user);
  }
  return response.data;
};

/**
 * Login user (student, teacher, admin)
 */
export const login = async ({ email, password, role }) => {
  const response = await authApi.post('/login', { email, password, role });
  if (response.data && response.data.token) {
    setStoredAuth(response.data.token, response.data.user);
  }
  return response.data;
};

/**
 * Fetch current logged-in user profile
 */
export const getMe = async () => {
  const token = getStoredToken();
  if (!token) return null;
  
  const response = await authApi.get('/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

/**
 * Get current system approval mode configuration
 */
export const getApprovalConfig = async () => {
  const response = await authApi.get('/config');
  return response.data;
};

/**
 * Update global system approval mode configuration (Admin only)
 */
export const updateApprovalConfig = async (approval_mode) => {
  const response = await authApi.put('/config', { approval_mode }, { headers: getAdminHeaders() });
  return response.data;
};

/**
 * Fetch all registered users & approval stats (Admin only)
 */
export const getAllUsers = async (role, status) => {
  const params = {};
  if (role) params.role = role;
  if (status) params.status = status;

  const response = await authApi.get('/users', {
    params,
    headers: getAdminHeaders()
  });
  return response.data;
};

/**
 * Approve a user account registration request (Admin only)
 */
export const approveUser = async (id) => {
  const response = await authApi.put(`/users/${id}/approve`, {}, { headers: getAdminHeaders() });
  return response.data;
};

/**
 * Reject a user account registration request (Admin only)
 */
export const rejectUser = async (id, rejection_reason) => {
  const response = await authApi.put(`/users/${id}/reject`, { rejection_reason }, { headers: getAdminHeaders() });
  return response.data;
};

/**
 * Request password reset verification code
 */
export const forgotPassword = async ({ email }) => {
  const response = await authApi.post('/forgot-password', { email });
  return response.data;
};

/**
 * Reset user password with verification code
 */
export const resetPassword = async ({ email, resetToken, newPassword }) => {
  const response = await authApi.post('/reset-password', { email, resetToken, newPassword });
  return response.data;
};

export default {
  register,
  login,
  getMe,
  getApprovalConfig,
  updateApprovalConfig,
  getAllUsers,
  approveUser,
  rejectUser,
  forgotPassword,
  resetPassword,
  getStoredToken,
  getStoredUser,
  setStoredAuth,
  clearStoredAuth
};
