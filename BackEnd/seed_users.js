require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Course = require('./models/Course');
const Meeting = require('./models/Meeting');

async function seedUsers() {
  console.log('Connecting to MongoDB at:', process.env.MONGODB_URI ? 'URI Provided' : 'Local Fallback');
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('Connected to MongoDB successfully!');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    const studentPassword = await bcrypt.hash('student123', 10);

    // Upsert Admin
    const admin = await User.findOneAndUpdate(
      { email: 'admin@edupulse.com' },
      {
        name: 'EduPulse Admin',
        email: 'admin@edupulse.com',
        password: adminPassword,
        role: 'admin',
        approval_status: 'approved',
        approved_at: new Date(),
        approved_by: 'system'
      },
      { upsert: true, new: true }
    );
    console.log('Admin ready: admin@edupulse.com / admin123');

    // 2 Teachers (+ aliases)
    const teachersData = [
      { name: 'Prof. Mayur Raut', email: 'teacher1@edupulse.com' },
      { name: 'Prof. Mayur Raut', email: 'teacher@edupulse.com' },
      { name: 'Dr. Sarah Sharma', email: 'teacher2@edupulse.com' }
    ];

    const teacherDocs = [];
    for (const t of teachersData) {
      const doc = await User.findOneAndUpdate(
        { email: t.email },
        {
          name: t.name,
          email: t.email,
          password: teacherPassword,
          role: 'teacher',
          approval_status: 'approved',
          approved_at: new Date(),
          approved_by: 'system'
        },
        { upsert: true, new: true }
      );
      teacherDocs.push(doc);
      console.log(`Teacher ready: ${t.email} / teacher123 (${t.name})`);
    }

    // 5 Students (+ aliases)
    const studentsData = [
      { name: 'Alex Johnson', email: 'student1@edupulse.com' },
      { name: 'Alex Johnson', email: 'student@edupulse.com' },
      { name: 'Priya Patel', email: 'student2@edupulse.com' },
      { name: 'Michael Chen', email: 'student3@edupulse.com' },
      { name: 'Sara Williams', email: 'student4@edupulse.com' },
      { name: 'David Kim', email: 'student5@edupulse.com' }
    ];

    const studentDocs = [];
    for (const s of studentsData) {
      const doc = await User.findOneAndUpdate(
        { email: s.email },
        {
          name: s.name,
          email: s.email,
          password: studentPassword,
          role: 'student',
          approval_status: 'approved',
          approved_at: new Date(),
          approved_by: 'system'
        },
        { upsert: true, new: true }
      );
      studentDocs.push(doc);
      console.log(`Student ready: ${s.email} / student123 (${s.name})`);
    }

    const allStudentIds = studentDocs.map((s) => s._id);

    // Upsert Course 1 for Teacher 1
    const teacher1 = teacherDocs[0];
    const teacher2 = teacherDocs[2];

    let course1 = await Course.findOne({ title: 'Python Learning & AI' });
    if (!course1) {
      course1 = await Course.create({
        title: 'Python Learning & AI',
        description: 'Comprehensive Python programming, data structures, algorithm design, and modern AI fundamentals.',
        duration: '10 Weeks',
        code: 'CRS-PY101',
        teacher: teacher1._id,
        teacherName: teacher1.name,
        students: allStudentIds
      });
      console.log('Created Course 1: Python Learning & AI');
    } else {
      course1.students = Array.from(new Set([...(course1.students || []), ...allStudentIds]));
      course1.teacher = teacher1._id;
      course1.teacherName = teacher1.name;
      await course1.save();
      console.log('Updated Course 1 with all students enrolled.');
    }

    // Upsert Course 2 for Teacher 2
    let course2 = await Course.findOne({ title: 'Full-Stack WebRTC & Real-Time Engineering' });
    if (!course2) {
      course2 = await Course.create({
        title: 'Full-Stack WebRTC & Real-Time Engineering',
        description: 'Hands-on live video/audio peer-to-peer streaming, screen sharing spotlight, WebSockets, and real-time signalling.',
        duration: '8 Weeks',
        code: 'CRS-RTC202',
        teacher: teacher2._id,
        teacherName: teacher2.name,
        students: allStudentIds
      });
      console.log('Created Course 2: Full-Stack WebRTC & Real-Time Engineering');
    } else {
      course2.students = Array.from(new Set([...(course2.students || []), ...allStudentIds]));
      course2.teacher = teacher2._id;
      course2.teacherName = teacher2.name;
      await course2.save();
      console.log('Updated Course 2 with all students enrolled.');
    }

    console.log('\n--- SEEDING COMPLETED SUCCESSFULLY ---');
    console.log('Login Credentials:');
    console.log('Teacher 1: teacher1@edupulse.com / teacher123 (Prof. Mayur Raut)');
    console.log('Teacher 2: teacher2@edupulse.com / teacher123 (Dr. Sarah Sharma)');
    console.log('Student 1: student1@edupulse.com / student123 (Alex Johnson)');
    console.log('Student 2: student2@edupulse.com / student123 (Priya Patel)');
    console.log('Student 3: student3@edupulse.com / student123 (Michael Chen)');
    console.log('Student 4: student4@edupulse.com / student123 (Sara Williams)');
    console.log('Student 5: student5@edupulse.com / student123 (David Kim)');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('MongoDB seed error:', err.message);
    process.exit(1);
  }
}

seedUsers();
