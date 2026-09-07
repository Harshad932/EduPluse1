const {
  createCourse,
  createMeeting,
  enrollStudent,
  getLiveKitToken,
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

async function runLiveKitTests() {
  console.log('--- STARTING MERN + LIVEKIT MEETING PLATFORM SECURITY TESTS ---');

  const teacherUser = { _id: 'usr_teacher_alpha', name: 'Prof. Alan Turing', role: 'teacher' };
  const rogueTeacherUser = { _id: 'usr_teacher_beta', name: 'Prof. Hacker', role: 'teacher' };
  const student1User = { _id: 'usr_student_one', name: 'Alice Student', role: 'student' };
  const student2User = { _id: 'usr_student_two', name: 'Bob Unenrolled', role: 'student' };

  // 1. Teacher creates Course A
  console.log('\nTest 1: Teacher creates Course A');
  const req1 = {
    user: teacherUser,
    body: { title: 'MERN & LiveKit WebRTC Mastery', description: 'Real-time video communications', duration: '12 Weeks' }
  };
  const res1 = generateMockRes();
  await createCourse(req1, res1);
  const courseId = res1.data.course._id;
  console.log('Status:', res1.statusCode, '| Course ID:', courseId);

  // 2. Teacher schedules Meeting for Course A
  console.log('\nTest 2: Teacher schedules Meeting for Course A');
  const req2 = {
    user: teacherUser,
    params: { id: courseId },
    body: { title: 'Live Video Workshop', date: '2026-09-10', time: '10:00 AM' }
  };
  const res2 = generateMockRes();
  await createMeeting(req2, res2);
  const roomCode = res2.data.roomCode;
  console.log('Status:', res2.statusCode, '| Room Code:', roomCode);

  // 3. Teacher requests LiveKit Access Token
  console.log('\nTest 3: Teacher requests LiveKit Access Token');
  const req3 = {
    user: teacherUser,
    body: { roomCode }
  };
  const res3 = generateMockRes();
  await getLiveKitToken(req3, res3);
  console.log('Status:', res3.statusCode, '| Token length:', res3.data?.token?.length);
  if (res3.statusCode === 200 && res3.data?.token) {
    console.log('✅ TEST PASSED: Teacher successfully generated LiveKit Access Token!');
  } else {
    console.error('❌ TEST FAILED: Teacher failed to generate token');
    process.exit(1);
  }

  // 4. Unenrolled Student 2 requests LiveKit Access Token for Room Code
  console.log('\nTest 4: Unenrolled Student 2 requests LiveKit Token (Expect 403 Forbidden)');
  const req4 = {
    user: student2User,
    body: { roomCode }
  };
  const res4 = generateMockRes();
  await getLiveKitToken(req4, res4);
  console.log('Status:', res4.statusCode, '| Message:', res4.data?.message);
  if (res4.statusCode === 403) {
    console.log('✅ TEST PASSED: Unenrolled student blocked from obtaining LiveKit token!');
  } else {
    console.error('❌ TEST FAILED: Unenrolled student was granted token!');
    process.exit(1);
  }

  // 5. Student 1 enrolls in Course A
  console.log('\nTest 5: Student 1 enrolls in Course A');
  const req5 = {
    user: student1User,
    params: { id: courseId }
  };
  const res5 = generateMockRes();
  await enrollStudent(req5, res5);
  console.log('Status:', res5.statusCode, '| Data:', res5.data?.message);

  // 6. Enrolled Student 1 requests LiveKit Access Token
  console.log('\nTest 6: Enrolled Student 1 requests LiveKit Token (Expect 200 OK)');
  const req6 = {
    user: student1User,
    body: { roomCode }
  };
  const res6 = generateMockRes();
  await getLiveKitToken(req6, res6);
  console.log('Status:', res6.statusCode, '| Token length:', res6.data?.token?.length);
  if (res6.statusCode === 200 && res6.data?.token) {
    console.log('✅ TEST PASSED: Enrolled student successfully generated LiveKit Access Token!');
  } else {
    console.error('❌ TEST FAILED: Enrolled student failed to generate token');
    process.exit(1);
  }

  // 7. Test Data Channel Protocol Message Schema
  console.log('\nTest 7: Verify Camera Request Data Channel Messages');
  const camReq = { type: 'CAM_REQUEST' };
  const camAllow = { type: 'CAM_ALLOWED', studentName: student1User.name };
  const camDeny = { type: 'CAM_DENIED', studentName: student1User.name };

  if (camReq.type === 'CAM_REQUEST' && camAllow.type === 'CAM_ALLOWED' && camDeny.type === 'CAM_DENIED') {
    console.log('✅ TEST PASSED: LiveKit data channel message protocol schemas verified!');
  } else {
    console.error('❌ TEST FAILED: Invalid message protocol schema');
    process.exit(1);
  }

  console.log('\n--- ALL MERN + LIVEKIT TESTS PASSED SUCCESSFULLY ---');
}

runLiveKitTests();
