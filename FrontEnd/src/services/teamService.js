import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// NOTE: this admin key is sent from the browser, so it is visible to anyone
// who opens dev tools — fine for a local/demo project, but for a real
// deployment put the admin dashboard behind a proper login (e.g. a
// server-issued session token) instead of a hardcoded shared secret.
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || 'admin-secret-token';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-admin-key': ADMIN_KEY
  }
});

/**
 * Get all team members
 */
export const getTeamMembers = async () => {
  const response = await api.get('/team');
  return response.data;
};

/**
 * Get team members by category ('team', 'student', 'teacher', 'mentor')
 */
export const getTeamMembersByCategory = async (category) => {
  const response = await api.get('/team', { params: { category } });
  return response.data;
};

/**
 * Create a new team member (supports FormData for image upload)
 */
export const createTeamMember = async (memberData) => {
  const isFormData = memberData instanceof FormData;
  const response = await api.post('/team', memberData, {
    headers: isFormData ? { 'Content-Type': undefined } : {}
  });
  return response.data;
};

/**
 * Update an existing team member by ID (supports FormData for image update)
 */
export const updateTeamMember = async (id, memberData) => {
  const isFormData = memberData instanceof FormData;
  const response = await api.put(`/team/${id}`, memberData, {
    headers: isFormData ? { 'Content-Type': undefined } : {}
  });
  return response.data;
};

/**
 * Delete a team member by ID
 */
export const deleteTeamMember = async (id) => {
  const response = await api.delete(`/team/${id}`);
  return response.data;
};

export default {
  getTeamMembers,
  getTeamMembersByCategory,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember
};
