const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createCourse,
  getTeacherCourses,
  getAllAvailableCourses,
  enrollStudent,
  getStudentCourses,
  createMeeting,
  getCourseMeeting,
  getLiveKitToken,
  endMeetingByCode,
  getMeetingMessages,
  saveMeetingMessage,
  subscribeMeetingEvents,
  sendMeetingSignal
} = require('../controllers/courseController');

// Teacher routes
router.post('/', protect, authorize('teacher'), createCourse);
router.get('/teacher', protect, authorize('teacher'), getTeacherCourses);
router.post('/:id/meetings', protect, authorize('teacher'), createMeeting);
router.post('/:id/meeting', protect, authorize('teacher'), createMeeting);
router.post('/meetings/code/:roomCode/end', protect, authorize('teacher', 'admin'), endMeetingByCode);
router.post('/code/:roomCode/end', protect, authorize('teacher', 'admin'), endMeetingByCode);

// In-Meeting Chat Routes (Protected: Teacher, Student, Admin)
router.get('/meetings/code/:roomCode/messages', protect, getMeetingMessages);
router.get('/code/:roomCode/messages', protect, getMeetingMessages);
router.post('/meetings/code/:roomCode/messages', protect, saveMeetingMessage);
router.post('/code/:roomCode/messages', protect, saveMeetingMessage);

// Real-Time SSE Meeting Events & WebRTC Signaling Routes (Protected)
router.get('/meetings/code/:roomCode/events', protect, subscribeMeetingEvents);
router.get('/code/:roomCode/events', protect, subscribeMeetingEvents);
router.post('/meetings/code/:roomCode/signal', protect, sendMeetingSignal);
router.post('/code/:roomCode/signal', protect, sendMeetingSignal);

// Student routes
router.get('/available', protect, authorize('student'), getAllAvailableCourses);
router.get('/enrolled', protect, authorize('student'), getStudentCourses);
router.post('/:id/enroll', protect, authorize('student'), enrollStudent);

// LiveKit token generator endpoint (Protected)
router.post('/livekit/token', protect, getLiveKitToken);
router.post('/meetings/token', protect, getLiveKitToken);

// Protected course meeting authorization route (Teacher or Student)
router.get('/:id/meeting', protect, getCourseMeeting);
router.get('/meetings/code/:roomCode', protect, getCourseMeeting);
router.get('/code/:roomCode', protect, getCourseMeeting);

module.exports = router;
