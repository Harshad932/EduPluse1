import axios from 'axios';
import { getStoredToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || 'admin-secret-token';

const videoApi = axios.create({
  baseURL: `${API_BASE_URL}/videos`,
  headers: {
    'Content-Type': 'application/json'
  }
});

const getAdminHeaders = () => {
  const token = getStoredToken();
  const headers = { 'x-admin-key': ADMIN_KEY };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Extract YouTube Video ID from various URL formats
 */
export const extractYouTubeId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.trim().match(regExp);
  return (match && match[2] && match[2].length === 11) ? match[2] : null;
};

/**
 * Fetch all videos (Public fetches active only; pass all=true for Admin to get all)
 */
export const getVideos = async (all = false) => {
  const response = await videoApi.get('', {
    params: { all: all ? 'true' : 'false' }
  });
  return response.data;
};

/**
 * Fetch single video by ID
 */
export const getVideoById = async (id) => {
  const response = await videoApi.get(`/${id}`);
  return response.data;
};

/**
 * Create a new YouTube video (Admin protected)
 */
export const createVideo = async (videoData) => {
  const response = await videoApi.post('', videoData, {
    headers: getAdminHeaders()
  });
  return response.data;
};

/**
 * Update an existing video by ID (Admin protected)
 */
export const updateVideo = async (id, videoData) => {
  const response = await videoApi.put(`/${id}`, videoData, {
    headers: getAdminHeaders()
  });
  return response.data;
};

/**
 * Delete a video by ID (Admin protected)
 */
export const deleteVideo = async (id) => {
  const response = await videoApi.delete(`/${id}`, {
    headers: getAdminHeaders()
  });
  return response.data;
};

export default {
  extractYouTubeId,
  getVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo
};
