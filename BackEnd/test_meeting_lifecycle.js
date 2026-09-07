const {
  createCourse,
  createMeeting,
  getTeacherCourses,
  enrollStudent,
  getStudentCourses,
  getCourseMeeting,
  getMeetingMessages,
  saveMeetingMessage,
  endMeetingByCode,
  memoryCourses,
  memoryMeetings
} = require('./controllers/courseController');

const generateMockRes = () => {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.data = obj;
      return this;
    }
  };
  return res;
};

async function testMeetingLifecycle() {
  console.log('--- STARTING MEETING LIFECYCLE & IN-MEETING CHAT TESTS ---');

  const teacher = { _id: 'teacher_101', name: 'Dr. Sarah Connor', role: 'teacher' };
  const student = { _id: 'student_202', name: 'John Connor', role: 'student' };

  // 1. Teacher creates Course
  console.log('\nStep 1: Teacher creates "Cybersecurity & WebRTC" Course');
  const courseReq = {
    user: teacher,
    body: {
      title: 'Cybersecurity & WebRTC',
      description: 'Advanced real-time systems and security',
      duration: '8 Weeks'
    }
  };
  const courseRes = generateMockRes();
  await createCourse(courseReq, courseRes);
  const courseId = courseRes.data.course._id;
  console.log('Course Created:', courseId, '| Title:', courseRes.data.course.title);

  // 2. Student enrolls in Course
  console.log('\nStep 2: Student enrolls in Course');
  const enrollReq = { user: student, params: { id: courseId } };
  const enrollRes = generateMockRes();
  await enrollStudent(enrollReq, enrollRes);
  console.log('Enroll Status:', enrollRes.statusCode, enrollRes.data.message);

  // 3. Teacher creates Meeting 1 for Course
  console.log('\nStep 3: Teacher creates Meeting 1 for Course');
  const meet1Req = {
    user: teacher,
    params: { id: courseId },
    body: {
      title: 'Lecture 1: WebRTC Architectures',
      date: '2026-09-07',
      time: '11:00 AM'
    }
  };
  const meet1Res = generateMockRes();
  await createMeeting(meet1Req, meet1Res);
  const roomCode1 = meet1Res.data.roomCode;
  console.log('Meeting 1 Created | Room Code:', roomCode1);

  // 4. Send chat messages to Meeting 1
  console.log('\nStep 4: Teacher and Student send chat messages');
  const msg1Req = {
    user: teacher,
    params: { roomCode: roomCode1 },
    body: { text: 'Welcome everyone to Lecture 1!' }
  };
  const msg1Res = generateMockRes();
  await saveMeetingMessage(msg1Req, msg1Res);
  console.log('Teacher Message Saved:', msg1Res.data.message.text);

  const msg2Req = {
    user: student,
    params: { roomCode: roomCode1 },
    body: { text: 'Hello Professor! Screen is crystal clear.' }
  };
  const msg2Res = generateMockRes();
  await saveMeetingMessage(msg2Req, msg2Res);
  console.log('Student Message Saved:', msg2Res.data.message.text);

  // 5. Verify chat persistence across reloads
  console.log('\nStep 5: Simulating page reload - Fetch saved messages for Meeting 1');
  const getMsgsReq = {
    user: student,
    params: { roomCode: roomCode1 }
  };
  const getMsgsRes = generateMockRes();
  await getMeetingMessages(getMsgsReq, getMsgsRes);
  console.log('Fetched Messages Count:', getMsgsRes.data.messages.length);
  if (getMsgsRes.data.messages.length === 2) {
    console.log('✅ TEST PASSED: Chat messages persisted and retrieved successfully!');
  } else {
    console.error('❌ TEST FAILED: Chat messages not persisted');
    process.exit(1);
  }

  // 6. Teacher ends Meeting 1
  console.log('\nStep 6: Teacher ends Meeting 1');
  const endReq = {
    user: teacher,
    params: { roomCode: roomCode1 }
  };
  const endRes = generateMockRes();
  await endMeetingByCode(endReq, endRes);
  console.log('End Meeting Status:', endRes.statusCode, endRes.data.message);

  // Verify chat deleted after meeting closing
  const getMsgsAfterEndReq = {
    user: teacher,
    params: { roomCode: roomCode1 }
  };
  const getMsgsAfterEndRes = generateMockRes();
  await getMeetingMessages(getMsgsAfterEndReq, getMsgsAfterEndRes);
  console.log('Messages remaining after end:', getMsgsAfterEndRes.data.messages.length);
  if (getMsgsAfterEndRes.data.messages.length === 0) {
    console.log('✅ TEST PASSED: In-meeting chat deleted after meeting closed!');
  } else {
    console.error('❌ TEST FAILED: Chat messages were not deleted on meeting close');
    process.exit(1);
  }

  // Verify getTeacherCourses marks course meeting as ended
  const teacherCoursesReq = { user: teacher };
  const teacherCoursesRes = generateMockRes();
  await getTeacherCourses(teacherCoursesReq, teacherCoursesRes);
  const courseAfterEnd = teacherCoursesRes.data.courses.find(c => c._id === courseId);
  console.log('Course meeting status after end:', courseAfterEnd.meeting?.status);
  if (courseAfterEnd.meeting?.status === 'ended') {
    console.log('✅ TEST PASSED: Course reflects ended meeting status!');
  } else {
    console.error('❌ TEST FAILED: Course did not reflect ended meeting status');
    process.exit(1);
  }

  // 7. Teacher creates Meeting 2 for the SAME Course
  console.log('\nStep 7: Teacher creates Meeting 2 for the SAME Course');
  const meet2Req = {
    user: teacher,
    params: { id: courseId },
    body: {
      title: 'Lecture 2: Peer-to-Peer Encryption',
      date: '2026-09-08',
      time: '02:00 PM'
    }
  };
  const meet2Res = generateMockRes();
  await createMeeting(meet2Req, meet2Res);
  const roomCode2 = meet2Res.data.roomCode;
  console.log('Meeting 2 Created | Room Code:', roomCode2);
  if (roomCode1 !== roomCode2) {
    console.log('✅ TEST PASSED: New meeting created for same course with fresh unique roomCode!');
  } else {
    console.error('❌ TEST FAILED: Room codes match between old and new meetings');
    process.exit(1);
  }

  // Verify course now shows Meeting 2
  const teacherCourses2Res = generateMockRes();
  await getTeacherCourses(teacherCoursesReq, teacherCourses2Res);
  const courseAfterRecreate = teacherCourses2Res.data.courses.find(c => c._id === courseId);
  console.log('Course meeting roomCode now:', courseAfterRecreate.meeting?.roomCode);
  if (courseAfterRecreate.meeting?.roomCode === roomCode2 && courseAfterRecreate.meeting?.status === 'scheduled') {
    console.log('✅ TEST PASSED: Course now displays active Meeting 2!');
  } else {
    console.error('❌ TEST FAILED: Course did not update to new meeting');
    process.exit(1);
  }

  // 8. Student checks course and fetches Meeting 2
  console.log('\nStep 8: Student checks course meeting details');
  const studentCoursesReq = { user: student };
  const studentCoursesRes = generateMockRes();
  await getStudentCourses(studentCoursesReq, studentCoursesRes);
  const studentCourse = studentCoursesRes.data.courses.find(c => c._id === courseId);
  console.log('Student sees course meeting:', studentCourse.meeting?.roomCode);
  if (studentCourse.meeting?.roomCode === roomCode2) {
    console.log('✅ TEST PASSED: Student seamlessly sees the new meeting code for the course!');
  } else {
    console.error('❌ TEST FAILED: Student does not see the new meeting code');
    process.exit(1);
  }

  console.log('\n--- ALL LIFECYCLE & CHAT TESTS PASSED WITH 100% SUCCESS ---');
}

testMeetingLifecycle();
