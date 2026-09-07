const Course = require('../models/Course');
const Meeting = require('../models/Meeting');
const mongoose = require('mongoose');
const { AccessToken } = require('livekit-server-sdk');

// In-memory fallback stores for offline / DB-less execution
const memoryCourses = [];
const memoryMeetings = [];

// Real-time SSE Rooms registry for in-meeting WebRTC signaling & instant chat
// Maps roomCode -> array of { id, res, userId, userName, userRole }
const sseRooms = {};

const broadcastToRoom = (roomCode, eventData, excludeUserId = null) => {
  const normalizedCode = (roomCode || '').toUpperCase().trim();
  const room = sseRooms[normalizedCode];
  if (!room || !room.length) return;

  const dataStr = `data: ${JSON.stringify(eventData)}\n\n`;
  for (let i = room.length - 1; i >= 0; i--) {
    const client = room[i];
    if (excludeUserId && client.userId === excludeUserId) continue;
    try {
      client.res.write(dataStr);
    } catch (err) {
      console.warn(`Error writing to SSE client ${client.id}:`, err.message);
      room.splice(i, 1);
    }
  }
};

const sendToClient = (roomCode, targetUserId, eventData) => {
  const normalizedCode = (roomCode || '').toUpperCase().trim();
  const room = sseRooms[normalizedCode];
  if (!room || !room.length) return false;

  const dataStr = `data: ${JSON.stringify(eventData)}\n\n`;
  let sent = false;
  for (const client of room) {
    if (client.userId === targetUserId) {
      try {
        client.res.write(dataStr);
        sent = true;
      } catch (err) {
        console.warn(`Error writing to SSE client target ${targetUserId}:`, err.message);
      }
    }
  }
  return sent;
};

const closeRoomClients = (roomCode) => {
  const normalizedCode = (roomCode || '').toUpperCase().trim();
  const room = sseRooms[normalizedCode];
  if (room) {
    room.forEach((c) => {
      try {
        c.res.end();
      } catch (e) {}
    });
    delete sseRooms[normalizedCode];
  }
};

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

/**
 * Helper to match IDs (handles ObjectId vs string)
 */
const idEquals = (id1, id2) => {
  if (!id1 || !id2) return false;
  return id1.toString() === id2.toString();
};

/**
 * Helper to generate a unique 6-character room code (e.g. ROOM-4829)
 */
const generateUniqueRoomCode = () => {
  return 'EDUMET-' + Math.floor(1000 + Math.random() * 9000);
};

/**
 * Helper to generate LiveKit Access Token
 */
const generateLiveKitAccessToken = async (roomCode, userId, userName, userRole) => {
  const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
  const apiSecret = process.env.LIVEKIT_API_SECRET || 'secretsecretsecretsecretsecretsecretsecret';
  const wsUrl = process.env.LIVEKIT_WS_URL || process.env.VITE_LIVEKIT_WS_URL || 'wss://demo-livekit.edupulse.org';

  const at = new AccessToken(apiKey, apiSecret, {
    identity: userId.toString(),
    name: userName || 'Participant',
    ttl: '2h'
  });

  at.addGrant({
    roomJoin: true,
    room: roomCode,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: userRole === 'teacher'
  });

  const token = await at.toJwt();
  return { token, wsUrl };
};

/**
 * Teacher: Create a new course
 */
const createCourse = async (req, res) => {
  try {
    const { title, description, duration } = req.body;

    if (!title || !description || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and duration are required'
      });
    }

    const code = 'CRS-' + Math.floor(1000 + Math.random() * 9000);
    const teacherId = req.user._id;
    const teacherName = req.user.name || 'Instructor';

    if (isDbConnected()) {
      const course = await Course.create({
        title,
        description,
        duration,
        code,
        teacher: teacherId,
        teacherName,
        students: []
      });

      return res.status(201).json({
        success: true,
        message: 'Course created successfully',
        course
      });
    } else {
      // In-memory fallback
      const course = {
        _id: 'crs_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        title,
        description,
        duration,
        code,
        teacher: teacherId,
        teacherName,
        students: [],
        createdAt: new Date()
      };
      memoryCourses.push(course);

      return res.status(201).json({
        success: true,
        message: 'Course created successfully (In-Memory)',
        course
      });
    }
  } catch (error) {
    console.error('Error creating course:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating course',
      error: error.message
    });
  }
};

/**
 * Teacher: Get all courses created by logged-in teacher
 */
const getTeacherCourses = async (req, res) => {
  try {
    const teacherId = req.user._id;
    let courses = [];
    let meetings = [];

    if (isDbConnected()) {
      courses = await Course.find({ teacher: teacherId }).sort({ createdAt: -1 });
      const courseIds = courses.map((c) => c._id);
      meetings = await Meeting.find({ course: { $in: courseIds } }).sort({ createdAt: -1 });
    } else {
      courses = memoryCourses.filter((c) => idEquals(c.teacher, teacherId));
      const courseIds = courses.map((c) => c._id);
      meetings = memoryMeetings
        .filter((m) => courseIds.some((cid) => idEquals(m.course, cid)))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    // Attach latest meeting details to each course (prefer active/scheduled over ended)
    const formattedCourses = courses.map((course) => {
      const courseObj = course.toObject ? course.toObject() : { ...course };
      const courseMeetings = meetings.filter((m) => idEquals(m.course, courseObj._id));
      const meeting = courseMeetings.find((m) => m.status !== 'ended') || courseMeetings[0] || null;
      return {
        ...courseObj,
        enrolledCount: courseObj.students ? courseObj.students.length : 0,
        meeting: meeting ? (meeting.toObject ? meeting.toObject() : meeting) : null
      };
    });

    return res.json({
      success: true,
      courses: formattedCourses
    });
  } catch (error) {
    console.error('Error fetching teacher courses:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching teacher courses'
    });
  }
};

/**
 * Student: Get all available courses to register
 */
const getAllAvailableCourses = async (req, res) => {
  try {
    const studentId = req.user._id;
    let courses = [];

    if (isDbConnected()) {
      courses = await Course.find({}).sort({ createdAt: -1 });
    } else {
      courses = [...memoryCourses];
    }

    // Format courses and indicate enrollment status without revealing sensitive meeting details
    const formattedCourses = courses.map((course) => {
      const courseObj = course.toObject ? course.toObject() : { ...course };
      const studentsList = courseObj.students || [];
      const isEnrolled = studentsList.some((sId) => idEquals(sId, studentId));

      return {
        _id: courseObj._id,
        title: courseObj.title,
        description: courseObj.description,
        duration: courseObj.duration,
        code: courseObj.code,
        teacherName: courseObj.teacherName,
        enrolledCount: studentsList.length,
        isEnrolled,
        createdAt: courseObj.createdAt
      };
    });

    return res.json({
      success: true,
      courses: formattedCourses
    });
  } catch (error) {
    console.error('Error fetching available courses:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching available courses'
    });
  }
};

/**
 * Student: Enroll / Register in a course
 */
const enrollStudent = async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = req.user._id;

    if (isDbConnected()) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      const isEnrolled = course.students.some((sId) => idEquals(sId, studentId));
      if (!isEnrolled) {
        course.students.push(studentId);
        await course.save();
      }

      return res.json({
        success: true,
        message: 'Successfully enrolled in course',
        courseId: course._id,
        title: course.title
      });
    } else {
      const course = memoryCourses.find((c) => idEquals(c._id, courseId));
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      const isEnrolled = course.students.some((sId) => idEquals(sId, studentId));
      if (!isEnrolled) {
        course.students.push(studentId);
      }

      return res.json({
        success: true,
        message: 'Successfully enrolled in course (In-Memory)',
        courseId: course._id,
        title: course.title
      });
    }
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error enrolling in course'
    });
  }
};

/**
 * Student: Get registered / enrolled courses
 */
const getStudentCourses = async (req, res) => {
  try {
    const studentId = req.user._id;
    let enrolledCourses = [];
    let meetings = [];

    if (isDbConnected()) {
      enrolledCourses = await Course.find({ students: studentId }).sort({ createdAt: -1 });
      const courseIds = enrolledCourses.map((c) => c._id);
      meetings = await Meeting.find({ course: { $in: courseIds } }).sort({ createdAt: -1 });
    } else {
      enrolledCourses = memoryCourses.filter((c) => c.students.some((sId) => idEquals(sId, studentId)));
      const courseIds = enrolledCourses.map((c) => c._id);
      meetings = memoryMeetings
        .filter((m) => courseIds.some((cid) => idEquals(m.course, cid)))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    const formatted = enrolledCourses.map((course) => {
      const cObj = course.toObject ? course.toObject() : { ...course };
      const courseMeetings = meetings.filter((m) => idEquals(m.course, cObj._id));
      const meeting = courseMeetings.find((m) => m.status !== 'ended') || courseMeetings[0] || null;
      return {
        ...cObj,
        isEnrolled: true,
        meeting: meeting ? (meeting.toObject ? meeting.toObject() : meeting) : null
      };
    });

    return res.json({
      success: true,
      courses: formatted
    });
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching enrolled courses'
    });
  }
};

/**
 * Teacher: Create meeting for a course
 */
const createMeeting = async (req, res) => {
  try {
    const courseId = req.params.id || req.body.courseId;
    const teacherId = req.user._id;
    const { title, description, date, time, meetingLink, notes } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Meeting title is required'
      });
    }

    const roomCode = generateUniqueRoomCode();
    const mDate = date || new Date().toISOString().split('T')[0];
    const mTime = time || '10:00 AM';
    const mLink = meetingLink || `https://meet.jit.si/${roomCode.toLowerCase()}`;

    if (isDbConnected()) {
      let course = null;
      if (courseId) {
        course = await Course.findById(courseId);
        if (course && !idEquals(course.teacher, teacherId)) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden: You can only create meetings for courses you own'
          });
        }
      }

      if (courseId) {
        // Mark any previous active or scheduled meetings for this course as ended
        await Meeting.updateMany(
          { course: courseId, status: { $in: ['scheduled', 'active'] } },
          { status: 'ended', endedAt: new Date(), messages: [] }
        );
      }

      const meeting = await Meeting.create({
        title,
        description: description || '',
        roomCode,
        meetingCode: roomCode,
        date: mDate,
        time: mTime,
        meetingLink: mLink,
        notes: notes || '',
        course: courseId || null,
        teacher: teacherId,
        status: 'scheduled',
        participants: [],
        messages: []
      });

      return res.status(201).json({
        success: true,
        message: 'Meeting scheduled successfully',
        meeting,
        roomCode
      });
    } else {
      if (courseId) {
        const course = memoryCourses.find((c) => idEquals(c._id, courseId));
        if (course && !idEquals(course.teacher, teacherId)) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden: You can only create meetings for courses you own'
          });
        }

        // Mark existing active/scheduled meetings for this course as ended
        memoryMeetings.forEach((m) => {
          if (idEquals(m.course, courseId) && m.status !== 'ended') {
            m.status = 'ended';
            m.endedAt = new Date();
            m.messages = [];
          }
        });
      }

      const meeting = {
        _id: 'mtg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        title,
        description: description || '',
        roomCode,
        meetingCode: roomCode,
        date: mDate,
        time: mTime,
        meetingLink: mLink,
        notes: notes || '',
        course: courseId || null,
        teacher: teacherId,
        status: 'scheduled',
        participants: [],
        messages: [],
        createdAt: new Date()
      };
      memoryMeetings.push(meeting);

      return res.status(201).json({
        success: true,
        message: 'Meeting scheduled successfully (In-Memory)',
        meeting,
        roomCode
      });
    }
  } catch (error) {
    console.error('Error creating meeting:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating meeting'
    });
  }
};

/**
 * Protected: Get meeting details by roomCode or course ID
 */
const getCourseMeeting = async (req, res) => {
  try {
    const targetParam = req.params.id; // Can be courseId or roomCode
    const userId = req.user._id;
    const userRole = req.user.role;

    let meeting = null;
    let course = null;

    if (isDbConnected()) {
      meeting = await Meeting.findOne({
        $or: [{ roomCode: targetParam.toUpperCase() }, { course: targetParam }, { _id: mongoose.isValidObjectId(targetParam) ? targetParam : null }]
      }).populate('course');

      if (meeting && meeting.course) {
        course = meeting.course;
      } else if (mongoose.isValidObjectId(targetParam)) {
        course = await Course.findById(targetParam);
      }
    } else {
      meeting = memoryMeetings.find(
        (m) =>
          m.roomCode === targetParam.toUpperCase() ||
          idEquals(m.course, targetParam) ||
          idEquals(m._id, targetParam)
      );
      if (meeting && meeting.course) {
        course = memoryCourses.find((c) => idEquals(c._id, meeting.course));
      } else {
        course = memoryCourses.find((c) => idEquals(c._id, targetParam));
      }
    }

    if (!meeting && !course) {
      return res.status(404).json({
        success: false,
        message: 'Meeting or Course not found'
      });
    }

    // Backend Authorization Check
    if (course) {
      if (userRole === 'teacher') {
        if (!idEquals(course.teacher, userId)) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden: You do not own this course'
          });
        }
      } else if (userRole === 'student') {
        const isEnrolled = course.students.some((sId) => idEquals(sId, userId));
        if (!isEnrolled) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: You must be registered for this course to view the online meeting details'
          });
        }
      }
    }

    if (!meeting) {
      return res.json({
        success: true,
        hasMeeting: false,
        message: 'No online meeting scheduled yet'
      });
    }

    const meetingObj = meeting.toObject ? meeting.toObject() : { ...meeting };

    return res.json({
      success: true,
      hasMeeting: true,
      meeting: meetingObj
    });
  } catch (error) {
    console.error('Error fetching course meeting:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching course meeting'
    });
  }
};

/**
 * Endpoint: POST /api/livekit/token (or /api/meetings/token)
 * Generates LiveKit Access Token after validating meeting permissions
 */
const getLiveKitToken = async (req, res) => {
  try {
    const { roomCode } = req.body;
    const userId = req.user._id;
    const userName = req.user.name || 'Participant';
    const userRole = req.user.role;

    if (!roomCode) {
      return res.status(400).json({
        success: false,
        message: 'roomCode is required to generate a LiveKit token'
      });
    }

    const normalizedCode = roomCode.toUpperCase().trim();
    let meeting = null;
    let course = null;

    if (isDbConnected()) {
      meeting = await Meeting.findOne({ roomCode: normalizedCode });
      if (meeting && meeting.course) {
        course = await Course.findById(meeting.course);
      }
    } else {
      meeting = memoryMeetings.find((m) => m.roomCode === normalizedCode);
      if (meeting && meeting.course) {
        course = memoryCourses.find((c) => idEquals(c._id, meeting.course));
      }
    }

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: `Meeting room '${normalizedCode}' not found`
      });
    }

    // Permission Verification
    if (userRole === 'teacher') {
      if (!idEquals(meeting.teacher, userId) && course && !idEquals(course.teacher, userId)) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You are not authorized to host this meeting'
        });
      }
    } else if (userRole === 'student') {
      if (course) {
        const isEnrolled = course.students.some((sId) => idEquals(sId, userId));
        if (!isEnrolled) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: You must be registered for this course to join its meeting room'
          });
        }
      }
    }

    // Log student participant entry if DB is connected
    if (isDbConnected() && userRole === 'student') {
      const alreadyLogged = meeting.participants.some((p) => idEquals(p.studentId, userId));
      if (!alreadyLogged) {
        meeting.participants.push({ studentId: userId, joinedAt: new Date() });
        meeting.status = 'active';
        if (!meeting.startedAt) meeting.startedAt = new Date();
        await meeting.save();
      }
    } else if (!isDbConnected() && userRole === 'student' && meeting.participants) {
      const alreadyLogged = meeting.participants.some((p) => idEquals(p.studentId, userId));
      if (!alreadyLogged) {
        meeting.participants.push({ studentId: userId, joinedAt: new Date() });
        meeting.status = 'active';
      }
    }

    // Generate token via LiveKit Server SDK
    const { token, wsUrl } = await generateLiveKitAccessToken(normalizedCode, userId, userName, userRole);

    return res.json({
      success: true,
      token,
      wsUrl,
      roomCode: normalizedCode,
      meetingTitle: meeting.title,
      user: {
        identity: userId.toString(),
        name: userName,
        role: userRole
      }
    });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate LiveKit access token',
      error: error.message
    });
  }
};

/**
 * Teacher: End a meeting
 */
const endMeetingByCode = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const userId = req.user._id;

    const normalizedCode = roomCode.toUpperCase().trim();

    if (isDbConnected()) {
      const meeting = await Meeting.findOne({ roomCode: normalizedCode });
      if (!meeting) {
        return res.status(404).json({ success: false, message: 'Meeting not found' });
      }

      if (!idEquals(meeting.teacher, userId) && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Forbidden: You do not own this meeting' });
      }

      meeting.status = 'ended';
      meeting.endedAt = new Date();
      // Chat is deleted after meeting is closed / ended
      meeting.messages = [];
      await meeting.save();

      // Broadcast to any active SSE clients that the meeting was ended by host
      broadcastToRoom(normalizedCode, {
        type: 'MEETING_ENDED',
        message: 'The host has ended this meeting.'
      });
      closeRoomClients(normalizedCode);

      return res.json({ success: true, message: 'Meeting ended successfully and chat cleared', meeting });
    } else {
      const meeting = memoryMeetings.find((m) => m.roomCode === normalizedCode);
      if (!meeting) {
        return res.status(404).json({ success: false, message: 'Meeting not found' });
      }

      if (!idEquals(meeting.teacher, userId) && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Forbidden: You do not own this meeting' });
      }

      meeting.status = 'ended';
      meeting.endedAt = new Date();
      // Chat is deleted after meeting is closed / ended
      meeting.messages = [];

      broadcastToRoom(normalizedCode, {
        type: 'MEETING_ENDED',
        message: 'The host has ended this meeting.'
      });
      closeRoomClients(normalizedCode);

      return res.json({ success: true, message: 'Meeting ended successfully (In-Memory) and chat cleared', meeting });
    }
  } catch (error) {
    console.error('Error ending meeting:', error);
    return res.status(500).json({ success: false, message: 'Server error ending meeting' });
  }
};

/**
 * Protected: Get all saved messages for an active meeting (persists across page reloads)
 */
const getMeetingMessages = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const normalizedCode = (roomCode || '').toUpperCase().trim();

    let meeting = null;
    if (isDbConnected()) {
      meeting = await Meeting.findOne({ roomCode: normalizedCode });
    } else {
      meeting = memoryMeetings.find((m) => m.roomCode === normalizedCode);
    }

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: `Meeting '${normalizedCode}' not found`
      });
    }

    return res.json({
      success: true,
      roomCode: normalizedCode,
      messages: meeting.messages || []
    });
  } catch (error) {
    console.error('Error fetching meeting messages:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching messages'
    });
  }
};

/**
 * Protected: Save a new chat message into meeting and broadcast in real-time
 */
const saveMeetingMessage = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { text } = req.body;
    const userId = req.user._id;
    const userName = req.user.name || 'Participant';
    const userRole = req.user.role || 'student';

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text cannot be empty'
      });
    }

    const normalizedCode = (roomCode || '').toUpperCase().trim();
    let meeting = null;
    if (isDbConnected()) {
      meeting = await Meeting.findOne({ roomCode: normalizedCode });
    } else {
      meeting = memoryMeetings.find((m) => m.roomCode === normalizedCode);
    }

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: `Meeting '${normalizedCode}' not found`
      });
    }

    if (meeting.status === 'ended') {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to an ended meeting'
      });
    }

    const newMessage = {
      _id: new mongoose.Types.ObjectId(),
      senderId: userId.toString(),
      senderName: userName,
      senderRole: userRole,
      text: text.trim(),
      timestamp: new Date()
    };

    if (!meeting.messages) {
      meeting.messages = [];
    }
    meeting.messages.push(newMessage);

    if (isDbConnected() && meeting.save) {
      await meeting.save();
    }

    // Broadcast chat message to all other participants via SSE (exclude the sender)
    broadcastToRoom(
      normalizedCode,
      {
        type: 'CHAT_MESSAGE',
        message: newMessage
      },
      userId.toString()
    );

    return res.status(201).json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    console.error('Error saving meeting message:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error saving message'
    });
  }
};

/**
 * SSE endpoint: Real-time meeting events, participant management & WebRTC signaling
 */
const subscribeMeetingEvents = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const normalizedCode = (roomCode || '').toUpperCase().trim();
    const userId = req.user._id.toString();
    const userName = req.user.name || 'Participant';
    const userRole = req.user.role || 'student';

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write('\n');

    if (!sseRooms[normalizedCode]) {
      sseRooms[normalizedCode] = [];
    }

    const clientId = `${userId}_${Date.now()}`;
    const clientObj = { id: clientId, res, userId, userName, userRole };
    sseRooms[normalizedCode].push(clientObj);

    // Collect list of existing connected peers
    const existingPeers = sseRooms[normalizedCode]
      .filter((c) => c.userId !== userId)
      .map((c) => ({ identity: c.userId, name: c.userName, role: c.userRole }));

    // Send initial greeting with current peers
    res.write(
      `data: ${JSON.stringify({
        type: 'INIT_ROOM',
        roomCode: normalizedCode,
        identity: userId,
        name: userName,
        role: userRole,
        peers: existingPeers
      })}\n\n`
    );

    // Notify other peers that someone joined
    broadcastToRoom(
      normalizedCode,
      {
        type: 'PEER_JOINED',
        peer: { identity: userId, name: userName, role: userRole }
      },
      userId
    );

    // Keep-alive heartbeat ping every 25 seconds
    const pingInterval = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch (e) {
        clearInterval(pingInterval);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(pingInterval);
      if (sseRooms[normalizedCode]) {
        sseRooms[normalizedCode] = sseRooms[normalizedCode].filter((c) => c.id !== clientId);
        if (sseRooms[normalizedCode].length === 0) {
          delete sseRooms[normalizedCode];
        } else {
          broadcastToRoom(normalizedCode, {
            type: 'PEER_LEFT',
            identity: userId
          });
        }
      }
    });
  } catch (error) {
    console.error('Error in SSE events subscription:', error);
    try {
      res.status(500).end();
    } catch (e) {}
  }
};

/**
 * Signal endpoint: Relay WebRTC SDP/ICE signals and Host Control commands
 */
const sendMeetingSignal = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { type, targetIdentity, signalData, payload } = req.body;
    const normalizedCode = (roomCode || '').toUpperCase().trim();
    const senderIdentity = req.user._id.toString();
    const senderName = req.user.name || 'Participant';
    const senderRole = req.user.role || 'student';

    const eventPayload = {
      type,
      senderIdentity,
      senderName,
      senderRole,
      signalData,
      payload
    };

    if (targetIdentity) {
      sendToClient(normalizedCode, targetIdentity, eventPayload);
    } else {
      broadcastToRoom(normalizedCode, eventPayload, senderIdentity);
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Error sending meeting signal:', error);
    return res.status(500).json({ success: false, message: 'Failed to send signal' });
  }
};

module.exports = {
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
  sendMeetingSignal,
  memoryCourses,
  memoryMeetings
};
