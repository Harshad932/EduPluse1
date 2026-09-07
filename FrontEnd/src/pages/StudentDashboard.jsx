import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAvailableCourses,
  getStudentEnrolledCourses,
  enrollInCourse,
  getCourseMeeting
} from '../services/courseService';
import MeetingRoom from '../components/MeetingRoom';
import {
  GraduationCap,
  BookOpen,
  CheckCircle,
  Clock,
  Play,
  Award,
  ArrowLeft,
  LogOut,
  Sparkles,
  TrendingUp,
  Brain,
  Video,
  UserCheck,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Radio
} from 'lucide-react';

export default function StudentDashboard({ onBackToPublic }) {
  const { user, logout } = useAuth();

  // Navigation tab state: 'enrolled', 'catalog', 'interactive'
  const [activeTab, setActiveTab] = useState('enrolled');

  // Active WebRTC LiveKit Meeting state
  const [activeMeeting, setActiveMeeting] = useState(null);

  // Quick Meeting Code Join state
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [joiningRoom, setJoiningRoom] = useState(false);

  // Interactive Session state (preserved)
  const [sessionCode, setSessionCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState('');

  // Course management states
  const [availableCourses, setAvailableCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const studentName = user?.name || 'Student';

  const loadStudentData = async () => {
    try {
      setLoadingCourses(true);
      const [availRes, enrolledRes] = await Promise.all([
        getAvailableCourses(),
        getStudentEnrolledCourses()
      ]);

      if (availRes.success) setAvailableCourses(availRes.courses || []);
      if (enrolledRes.success) setEnrolledCourses(enrolledRes.courses || []);
    } catch (err) {
      console.error('Error fetching student course data:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  const handleJoinSession = (e) => {
    e.preventDefault();
    if (!sessionCode) return;
    setJoining(true);
    setTimeout(() => {
      setJoining(false);
      setJoinMsg(`Connected to interactive classroom session #${sessionCode.toUpperCase()}!`);
    }, 1000);
  };

  const handleJoinMeetingByCodeSubmit = async (e) => {
    e.preventDefault();
    if (!roomCodeInput) return;

    setJoiningRoom(true);
    setStatusMsg({ type: '', text: '' });
    try {
      const code = roomCodeInput.trim().toUpperCase();
      const res = await getCourseMeeting(code);
      if (res.success && res.hasMeeting) {
        setActiveMeeting({
          roomCode: code,
          title: res.meeting?.title || 'Live Online Meeting'
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: `Meeting code '${code}' not found or access denied. Please verify your course registration.`
        });
      }
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to join meeting. Access denied.'
      });
    } finally {
      setJoiningRoom(false);
    }
  };

  const handleEnroll = async (courseId, title) => {
    setEnrollingId(courseId);
    setStatusMsg({ type: '', text: '' });
    try {
      const res = await enrollInCourse(courseId);
      if (res.success) {
        setStatusMsg({
          type: 'success',
          text: `Successfully enrolled in "${title}"! Check your registered courses below for online meeting rooms.`
        });
        await loadStudentData();
      }
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to enroll in course'
      });
    } finally {
      setEnrollingId(null);
    }
  };

  // If inside an active LiveKit WebRTC meeting, render MeetingRoom component
  if (activeMeeting) {
    return (
      <MeetingRoom
        roomCode={activeMeeting.roomCode}
        meetingTitle={activeMeeting.title}
        userRole="student"
        onLeave={() => {
          setActiveMeeting(null);
          loadStudentData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToPublic}
            className="p-2 rounded-xl bg-slate-800 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-2 text-xs font-semibold"
          >
            <ArrowLeft size={16} />
            <span>Public Site</span>
          </button>
          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <GraduationCap size={20} />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white leading-none">Student Portal</h1>
              <span className="text-[11px] text-cyan-400 font-medium">EduPulse Interactive Learning</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-white/10 flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">{studentName}</span>
            <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] uppercase font-bold">
              Student
            </span>
          </div>

          <button
            onClick={() => {
              logout();
              if (onBackToPublic) onBackToPublic();
            }}
            className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 transition-colors text-xs font-semibold flex items-center gap-1.5"
            title="Sign Out"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col gap-8">
        {/* Section Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <button
            onClick={() => setActiveTab('enrolled')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'enrolled'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen size={16} />
            <span>My Registered Courses &amp; Meetings ({enrolledCourses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap size={16} />
            <span>Course Catalog &amp; Enrollment</span>
          </button>

          <button
            onClick={() => setActiveTab('interactive')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'interactive'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles size={16} />
            <span>Live MCQ Quizzes</span>
          </button>
        </div>

        {/* Quick Meeting Code Join Form */}
        <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Video size={22} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">Join LiveKit Meeting via Code</h4>
              <p className="text-xs text-slate-400">Have a meeting room code from your teacher? Enter it below to join.</p>
            </div>
          </div>

          <form onSubmit={handleJoinMeetingByCodeSubmit} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              placeholder="e.g. EDUMET-4829"
              className="px-4 py-2.5 bg-slate-950 border border-cyan-500/30 rounded-xl text-xs font-mono text-cyan-300 uppercase placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              required
            />
            <button
              type="submit"
              disabled={joiningRoom}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-500/20 whitespace-nowrap"
            >
              {joiningRoom ? <Loader2 size={14} className="animate-spin" /> : <Radio size={14} />}
              <span>Join Room</span>
            </button>
          </form>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <BookOpen size={24} />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">My Registered Courses</span>
              <h3 className="text-xl font-extrabold text-white mt-0.5">{enrolledCourses.length} Courses</h3>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Video size={24} />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Online Meetings</span>
              <h3 className="text-xl font-extrabold text-white mt-0.5">
                {enrolledCourses.filter((c) => c.meeting).length} Accessible
              </h3>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Award size={24} />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Overall Accuracy</span>
              <h3 className="text-xl font-extrabold text-white mt-0.5">92.5%</h3>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Attendance Score</span>
              <h3 className="text-xl font-extrabold text-white mt-0.5">98%</h3>
            </div>
          </div>
        </div>

        {/* Status Notification Message */}
        {statusMsg.text && (
          <div
            className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between animate-fadeIn ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{statusMsg.text}</span>
            </div>
            <button onClick={() => setStatusMsg({ type: '', text: '' })} className="p-1 hover:opacity-75">
              <X size={16} />
            </button>
          </div>
        )}

        {/* TAB 1: MY REGISTERED COURSES & MEETING ACCESS */}
        {activeTab === 'enrolled' && (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <BookOpen size={18} className="text-cyan-400" />
                    <span>My Registered Courses &amp; Online Classrooms</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Meeting links and WebRTC video rooms are securely provided only for courses you are officially registered for
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-500 hover:text-slate-950 transition-all flex items-center gap-1.5"
                >
                  <GraduationCap size={14} />
                  <span>Browse More Courses</span>
                </button>
              </div>

              {loadingCourses ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
                  <Loader2 size={24} className="animate-spin text-cyan-400" />
                  <span className="text-xs">Loading registered courses...</span>
                </div>
              ) : enrolledCourses.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-white/5 text-slate-400 flex flex-col items-center gap-3">
                  <BookOpen size={36} className="text-slate-600" />
                  <div>
                    <h4 className="text-base font-bold text-white">You haven't registered for any courses yet</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Browse available courses and register to get access to online meeting rooms.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('catalog')}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
                  >
                    View Available Courses
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {enrolledCourses.map((course) => (
                    <div
                      key={course._id}
                      className="bg-slate-950/80 border border-white/10 rounded-2xl p-6 flex flex-col justify-between gap-5 relative overflow-hidden group hover:border-cyan-500/40 transition-all shadow-lg"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] uppercase font-bold flex items-center gap-1 w-fit mb-1">
                              <UserCheck size={10} /> Registered
                            </span>
                            <h4 className="text-lg font-extrabold text-white">{course.title}</h4>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-white/10 text-slate-300 text-xs font-medium flex items-center gap-1">
                            <Clock size={12} className="text-cyan-400" /> {course.duration}
                          </span>
                        </div>

                        <p className="text-slate-300 text-xs leading-relaxed line-clamp-2">
                          {course.description}
                        </p>

                        <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-white/5">
                          <span>Instructor: <strong className="text-white">{course.teacherName || 'Faculty'}</strong></span>
                          <span className="font-mono text-cyan-300 text-[11px] font-bold">{course.code}</span>
                        </div>

                        {/* Secured Meeting Box */}
                        <div className="mt-2 p-4 rounded-xl bg-slate-900 border border-cyan-500/30 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                              <Video size={14} className="text-cyan-400" />
                              Course Online Meeting Room
                            </span>
                            {course.meeting ? (
                              course.meeting.status === 'ended' ? (
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/10 text-[10px] font-bold">
                                  Session Ended
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Ready: {course.meeting.roomCode}
                                </span>
                              )
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/10 text-[10px]">
                                No Schedule
                              </span>
                            )}
                          </div>

                          {course.meeting ? (
                            course.meeting.status === 'ended' ? (
                              <div className="flex flex-col gap-1.5 bg-slate-950 p-3 rounded-lg border border-white/5 text-xs text-slate-400">
                                <span className="font-bold text-slate-300">{course.meeting.title}</span>
                                <p className="text-[11px] leading-relaxed">
                                  The previous meeting has concluded and chat was closed. Please check back when your instructor schedules the next live class session!
                                </p>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2 bg-slate-950 p-3 rounded-lg border border-white/5">
                                <h5 className="text-xs font-bold text-white">{course.meeting.title}</h5>
                                <div className="flex items-center gap-4 text-[11px] text-slate-300 font-medium">
                                  <span>📅 {course.meeting.date}</span>
                                  <span>⏰ {course.meeting.time}</span>
                                  <span className="font-mono text-cyan-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-cyan-500/20">
                                    {course.meeting.roomCode}
                                  </span>
                                </div>
                                {course.meeting.notes && (
                                  <p className="text-[11px] text-slate-400 italic">"{course.meeting.notes}"</p>
                                )}

                                {/* WebRTC Video Room Join Button */}
                                <button
                                  onClick={() =>
                                    setActiveMeeting({
                                      roomCode: course.meeting.roomCode,
                                      title: course.meeting.title
                                    })
                                  }
                                  className="mt-1 w-full py-2.5 px-3 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20"
                                >
                                  <Radio size={14} className="animate-pulse" />
                                  <span>Join Live Video Room Now</span>
                                </button>
                              </div>
                            )
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">
                              Your instructor has not scheduled an online meeting for this course yet. Check back soon!
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: COURSE CATALOG & REGISTRATION */}
        {activeTab === 'catalog' && (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <GraduationCap size={18} className="text-cyan-400" />
                    <span>All Available EduPulse Courses</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Register for courses to unlock instant access to online meeting rooms and learning modules
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold">
                  {availableCourses.length} Courses Offered
                </span>
              </div>

              {loadingCourses ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
                  <Loader2 size={24} className="animate-spin text-cyan-400" />
                  <span className="text-xs">Loading course catalog...</span>
                </div>
              ) : availableCourses.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-white/5 text-slate-400">
                  <BookOpen size={32} className="mx-auto mb-2 text-slate-600" />
                  <p className="text-sm font-semibold text-white">No courses available right now</p>
                  <p className="text-xs mt-1">Please check back later when teachers create new courses.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableCourses.map((course) => (
                    <div
                      key={course._id}
                      className="bg-slate-950/80 border border-white/10 rounded-2xl p-6 flex flex-col justify-between gap-5 relative overflow-hidden group hover:border-cyan-500/40 transition-all shadow-lg"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] uppercase font-bold">
                              {course.code || 'CRS'}
                            </span>
                            <h4 className="text-base font-extrabold text-white mt-1">{course.title}</h4>
                          </div>
                        </div>

                        <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">
                          {course.description}
                        </p>

                        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                          <span>Instructor: <strong className="text-white">{course.teacherName || 'Faculty'}</strong></span>
                          <span>{course.duration}</span>
                        </div>
                      </div>

                      {/* Enrollment Action */}
                      {course.isEnrolled ? (
                        <div className="w-full py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                          <CheckCircle size={16} />
                          <span>Registered &amp; Access Granted</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course._id, course.title)}
                          disabled={enrollingId === course._id}
                          className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                        >
                          {enrollingId === course._id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <GraduationCap size={16} />
                          )}
                          <span>Register for Course</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: INTERACTIVE QUIZZES (PRESERVED) */}
        {activeTab === 'interactive' && (
          <div className="flex flex-col gap-8">
            <div className="relative rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-cyan-950 p-8 border border-white/10 overflow-hidden shadow-2xl">
              <div className="absolute -right-12 -top-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 mb-3">
                  <Sparkles size={14} className="text-cyan-400" /> Live MCQ Session
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
                  Participate in Real-Time MCQ Practice
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Enter your session code provided by your instructor to participate in real-time camera-evaluated quizzes.
                </p>

                <form onSubmit={handleJoinSession} className="flex flex-col sm:flex-row gap-3 max-w-md">
                  <input
                    type="text"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value)}
                    placeholder="Enter 6-digit session code (e.g. EDU99)"
                    className="flex-1 px-4 py-3 bg-slate-950 border border-cyan-500/30 rounded-xl text-sm text-white placeholder-slate-500 uppercase font-mono tracking-wider focus:outline-none focus:border-cyan-400 shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={joining}
                    className="px-6 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    {joining ? 'Connecting...' : 'Join Session'}
                    <Play size={16} />
                  </button>
                </form>

                {joinMsg && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-fadeIn flex items-center gap-2">
                    <CheckCircle size={16} />
                    <span>{joinMsg}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
