import axios from 'axios';
import { getStoredToken, getApiBaseUrl } from './authService';

const API_BASE_URL = getApiBaseUrl();

const courseApi = axios.create({
  baseURL: `${API_BASE_URL}/courses`,
  headers: {
    'Content-Type': 'application/json'
  }
});

const livekitApi = axios.create({
  baseURL: `${API_BASE_URL}/livekit`,
  headers: {
    'Content-Type': 'application/json'
  }
});

const getAuthHeaders = () => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Teacher: Create a new course
 */
export const createCourse = async ({ title, description, duration }) => {
  const response = await courseApi.post(
    '/',
    { title, description, duration },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

/**
 * Teacher: Fetch all courses created by logged-in teacher
 */
export const getTeacherCourses = async () => {
  const response = await courseApi.get('/teacher', {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Teacher: Create an online meeting for a course
 */
export const createCourseMeeting = async (courseId, { title, description, date, time, meetingLink, notes }) => {
  const response = await courseApi.post(
    `/${courseId}/meetings`,
    { title, description, date, time, meetingLink, notes },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

/**
 * Student: Fetch all available courses to register
 */
export const getAvailableCourses = async () => {
  const response = await courseApi.get('/available', {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Student: Fetch student's registered / enrolled courses
 */
export const getStudentEnrolledCourses = async () => {
  const response = await courseApi.get('/enrolled', {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Student: Enroll / Register in a course
 */
export const enrollInCourse = async (courseId) => {
  const response = await courseApi.post(
    `/${courseId}/enroll`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
};

/**
 * Protected: Fetch meeting details for a course or by roomCode
 */
export const getCourseMeeting = async (courseIdOrRoomCode) => {
  const response = await courseApi.get(`/${courseIdOrRoomCode}/meeting`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Protected: Fetch LiveKit AccessToken for roomCode
 */
export const fetchLiveKitToken = async (roomCode) => {
  const response = await livekitApi.post(
    '/token',
    { roomCode },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

/**
 * Teacher: End a meeting room
 */
export const endMeeting = async (roomCode) => {
  const response = await courseApi.post(
    `/meetings/code/${roomCode}/end`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
};

/**
 * Protected: Fetch saved in-meeting messages (for reload persistence)
 */
export const getMeetingMessages = async (roomCode) => {
  const response = await courseApi.get(`/meetings/code/${roomCode}/messages`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Protected: Send in-meeting chat message
 */
export const sendMeetingMessage = async (roomCode, text) => {
  const response = await courseApi.post(
    `/meetings/code/${roomCode}/messages`,
    { text },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

/**
 * Protected: Send WebRTC signaling or Host Action
 */
export const sendMeetingSignal = async (roomCode, payload) => {
  const response = await courseApi.post(
    `/meetings/code/${roomCode}/signal`,
    payload,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

/**
 * Get SSE stream URL for room events with auth token
 */
export const getSSEEventsUrl = (roomCode) => {
  const token = getStoredToken();
  return `${API_BASE_URL}/meetings/code/${roomCode}/events?token=${encodeURIComponent(token || '')}`;
};

export default {
  createCourse,
  getTeacherCourses,
  createCourseMeeting,
  getAvailableCourses,
  getStudentEnrolledCourses,
  enrollInCourse,
  getCourseMeeting,
  fetchLiveKitToken,
  endMeeting,
  getMeetingMessages,
  sendMeetingMessage,
  sendMeetingSignal,
  getSSEEventsUrl
};
