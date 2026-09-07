const {
  createCourse,
  getTeacherCourses,
  getAllAvailableCourses,
  enrollStudent,
  getStudentCourses,
  createMeeting,
  getCourseMeeting,
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

async function runTests() {
  console.log('--- STARTING COURSE & MEETING ACCESS CONTROL TESTS ---');

  // Define Mock Users
  const teacherUser = { _id: 'usr_teacher_alpha', name: 'Prof. Alan Turing', role: 'teacher' };
  const rogueTeacherUser = { _id: 'usr_teacher_beta', name: 'Prof. Rogue', role: 'teacher' };
  const student1User = { _id: 'usr_student_one', name: 'Alice Student', role: 'student' };
  const student2User = { _id: 'usr_student_two', name: 'Bob Unenrolled', role: 'student' };

  // 1. Teacher creates Course A
  console.log('\nTest 1: Teacher creates Course A');
  const req1 = {
    user: teacherUser,
    body: {
      title: 'Quantum Computing 101',
      description: 'Introductory quantum physics and algorithms',
      duration: '10 Weeks'
    }
  };
  const res1 = generateMockRes();
  await createCourse(req1, res1);
  console.log('Status:', res1.statusCode, '| Data:', res1.data);
  const courseId = res1.data.course._id;

  // 2. Teacher creates Meeting A for Course A
  console.log('\nTest 2: Teacher creates Meeting for Course A');
  const req2 = {
    user: teacherUser,
    params: { id: courseId },
    body: {
      title: 'Quantum Mechanics Q&A Session',
      date: '2026-09-15',
      time: '10:00 AM',
      meetingLink: 'https://meet.jit.si/edupulse-quantum-101',
      notes: 'Please bring your notes'
    }
  };
  const res2 = generateMockRes();
  await createMeeting(req2, res2);
  console.log('Status:', res2.statusCode, '| Data:', res2.data);

  // 3. Unauthorized Student 2 attempts to fetch meeting for Course A (URL Tampering / Unauthorized Access)
  console.log('\nTest 3: Unenrolled Student 2 attempts to access Meeting A (Expect 403 Forbidden)');
  const req3 = {
    user: student2User,
    params: { id: courseId }
  };
  const res3 = generateMockRes();
  await getCourseMeeting(req3, res3);
  console.log('Status:', res3.statusCode, '| Data:', res3.data);
  if (res3.statusCode === 403) {
    console.log('✅ TEST PASSED: Access blocked for unenrolled student!');
  } else {
    console.error('❌ TEST FAILED: Security breach! Unenrolled student obtained meeting details.');
    process.exit(1);
  }

  // 4. Student 1 enrolls in Course A
  console.log('\nTest 4: Student 1 enrolls in Course A');
  const req4 = {
    user: student1User,
    params: { id: courseId }
  };
  const res4 = generateMockRes();
  await enrollStudent(req4, res4);
  console.log('Status:', res4.statusCode, '| Data:', res4.data);

  // 5. Enrolled Student 1 fetches meeting for Course A
  console.log('\nTest 5: Enrolled Student 1 accesses Meeting A (Expect 200 OK with Meeting Details)');
  const req5 = {
    user: student1User,
    params: { id: courseId }
  };
  const res5 = generateMockRes();
  await getCourseMeeting(req5, res5);
  console.log('Status:', res5.statusCode, '| Meeting Link:', res5.data?.meeting?.meetingLink);
  if (res5.statusCode === 200 && res5.data?.meeting?.meetingLink === 'https://meet.jit.si/edupulse-quantum-101') {
    console.log('✅ TEST PASSED: Enrolled student successfully retrieved meeting link!');
  } else {
    console.error('❌ TEST FAILED: Enrolled student failed to retrieve meeting link.');
    process.exit(1);
  }

  // 6. Rogue Teacher attempts to schedule meeting for Teacher 1's course
  console.log('\nTest 6: Rogue Teacher attempts to schedule meeting for Course A (Expect 403 Forbidden)');
  const req6 = {
    user: rogueTeacherUser,
    params: { id: courseId },
    body: {
      title: 'Hacked Session',
      date: '2026-09-20',
      time: '12:00 PM',
      meetingLink: 'https://malicious.link'
    }
  };
  const res6 = generateMockRes();
  await createMeeting(req6, res6);
  console.log('Status:', res6.statusCode, '| Data:', res6.data);
  if (res6.statusCode === 403) {
    console.log('✅ TEST PASSED: Teacher course ownership rule strictly enforced!');
  } else {
    console.error('❌ TEST FAILED: Non-owner teacher was able to edit course meeting!');
    process.exit(1);
  }

  console.log('\n--- ALL ACCESS CONTROL TESTS COMPLETED SUCCESSFULLY ---');
}

runTests();
