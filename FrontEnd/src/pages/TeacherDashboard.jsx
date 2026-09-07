import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getTeacherCourses,
  createCourse,
  createCourseMeeting,
  endMeeting
} from '../services/courseService';
import MeetingRoom from '../components/MeetingRoom';
import {
  School,
  Users,
  PlusCircle,
  Play,
  CheckCircle2,
  BarChart,
  ArrowLeft,
  LogOut,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  BookOpen,
  Video,
  Calendar,
  Clock,
  ExternalLink,
  Plus,
  Loader2,
  X,
  Radio,
  Copy,
  Check,
  Share2,
  PhoneOff
} from 'lucide-react';

export default function TeacherDashboard({ onBackToPublic }) {
  const { user, logout } = useAuth();
  
  // Dashboard tab state: 'courses' or 'sessions'
  const [activeTab, setActiveTab] = useState('courses');

  // Active WebRTC LiveKit Meeting State
  const [activeMeeting, setActiveMeeting] = useState(null);

  // Interactive Quiz Session state (preserved)
  const [sessionTitle, setSessionTitle] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [createdCode, setCreatedCode] = useState('');
  const [creatingSession, setCreatingSession] = useState(false);

  // Courses state
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseMsg, setCourseMsg] = useState({ type: '', text: '' });

  // Create Course form state
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseDuration, setCourseDuration] = useState('8 Weeks');
  const [creatingCourse, setCreatingCourse] = useState(false);

  // Meeting Modal state
  const [meetingModalCourse, setMeetingModalCourse] = useState(null);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [schedulingMeeting, setSchedulingMeeting] = useState(false);

  // Share Meeting Modal state
  const [shareModalMeeting, setShareModalMeeting] = useState(null);
  const [copiedShareCode, setCopiedShareCode] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [notifiedStudents, setNotifiedStudents] = useState(false);

  const teacherName = user?.name || 'Instructor';

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const res = await getTeacherCourses();
      if (res.success) {
        setCourses(res.courses || []);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateSession = (e) => {
    e.preventDefault();
    if (!sessionTitle) return;

    setCreatingSession(true);
    setTimeout(() => {
      const code = 'EDU-' + Math.floor(100 + Math.random() * 900);
      setCreatedCode(code);
      setCreatingSession(false);
    }, 800);
  };

  const handleCreateCourseSubmit = async (e) => {
    e.preventDefault();
    if (!courseTitle || !courseDesc || !courseDuration) return;

    setCreatingCourse(true);
    setCourseMsg({ type: '', text: '' });
    try {
      const res = await createCourse({
        title: courseTitle,
        description: courseDesc,
        duration: courseDuration
      });

      if (res.success) {
        setCourseMsg({ type: 'success', text: `Course "${res.course?.title}" created successfully!` });
        setCourseTitle('');
        setCourseDesc('');
        setCourseDuration('8 Weeks');
        fetchCourses();
      } else {
        setCourseMsg({ type: 'error', text: res.message || 'Failed to create course' });
      }
    } catch (err) {
      setCourseMsg({
        type: 'error',
        text: err.response?.data?.message || 'Error creating course'
      });
    } finally {
      setCreatingCourse(false);
    }
  };

  const openMeetingModal = (course) => {
    setMeetingModalCourse(course);
    const isEnded = course.meeting?.status === 'ended';
    if (course.meeting && !isEnded) {
      setMeetingTitle(course.meeting.title || '');
      setMeetingDate(course.meeting.date || '');
      setMeetingTime(course.meeting.time || '');
      setMeetingLink(course.meeting.meetingLink || '');
      setMeetingNotes(course.meeting.notes || '');
    } else {
      setMeetingTitle(`${course.title} - Live Class`);
      setMeetingDate(new Date().toISOString().split('T')[0]);
      setMeetingTime('10:00 AM');
      setMeetingLink('');
      setMeetingNotes('');
    }
  };

  const handleEndMeeting = async (roomCode) => {
    if (!window.confirm('Are you sure you want to end this meeting? All participants will be disconnected and chat will be deleted.')) return;
    try {
      await endMeeting(roomCode);
      setCourseMsg({
        type: 'success',
        text: `Meeting ${roomCode} has been ended and in-meeting chat deleted.`
      });
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to end meeting');
    }
  };

  const handleScheduleMeetingSubmit = async (e) => {
    e.preventDefault();
    if (!meetingModalCourse || !meetingTitle || !meetingDate || !meetingTime) return;

    setSchedulingMeeting(true);
    try {
      const res = await createCourseMeeting(meetingModalCourse._id, {
        title: meetingTitle,
        description: meetingModalCourse.description,
        date: meetingDate,
        time: meetingTime,
        meetingLink: meetingLink || `https://meet.jit.si/${(meetingModalCourse.code || 'room').toLowerCase()}`,
        notes: meetingNotes
      });

      if (res.success) {
        setCourseMsg({
          type: 'success',
          text: `Online meeting created with room code "${res.roomCode || res.meeting?.roomCode}"!`
        });
        setMeetingModalCourse(null);
        fetchCourses();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to schedule meeting');
    } finally {
      setSchedulingMeeting(false);
    }
  };

  // If inside an active LiveKit WebRTC meeting, render MeetingRoom component
  if (activeMeeting) {
    return (
      <MeetingRoom
        roomCode={activeMeeting.roomCode}
        meetingTitle={activeMeeting.title}
        userRole="teacher"
        onLeave={() => {
          setActiveMeeting(null);
          fetchCourses();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
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
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <School size={20} />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white leading-none">Teacher Console</h1>
              <span className="text-[11px] text-purple-400 font-medium">Instructor Control Hub</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-white/10 flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">{teacherName}</span>
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] uppercase font-bold">
              Teacher
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
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'courses'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen size={16} />
            <span>Course &amp; Live Meeting Management</span>
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'sessions'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles size={16} />
            <span>Live MCQ Sessions</span>
          </button>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <BookOpen size={24} />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">My Courses</span>
              <h3 className="text-xl font-extrabold text-white mt-0.5">{courses.length} Courses</h3>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Users size={24} />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Enrolled Students</span>
              <h3 className="text-xl font-extrabold text-white mt-0.5">
                {courses.reduce((acc, c) => acc + (c.enrolledCount || 0), 0)} Enrolled
              </h3>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Video size={24} />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Scheduled Meetings</span>
              <h3 className="text-xl font-extrabold text-white mt-0.5">
                {courses.filter((c) => c.meeting).length} Active
              </h3>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <BarChart size={24} />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Avg Class Score</span>
              <h3 className="text-xl font-extrabold text-white mt-0.5">88%</h3>
            </div>
          </div>
        </div>

        {/* System Message Banner */}
        {courseMsg.text && (
          <div
            className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between ${
              courseMsg.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            <span>{courseMsg.text}</span>
            <button onClick={() => setCourseMsg({ type: '', text: '' })} className="p-1 hover:opacity-75">
              <X size={16} />
            </button>
          </div>
        )}

        {/* TAB 1: COURSE & ONLINE MEETING MANAGEMENT */}
        {activeTab === 'courses' && (
          <div className="flex flex-col gap-8">
            {/* Create New Course Panel */}
            <div className="relative rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-8 border border-white/10 overflow-hidden shadow-2xl">
              <div className="absolute -right-12 -top-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300 mb-3">
                  <PlusCircle size={14} className="text-purple-400" /> Teacher Dashboard
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                  Create a New Course &amp; Launch LiveKit Online Meetings
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Add course details so students can register. Once created, schedule LiveKit video rooms with camera request permissions.
                </p>

                <form onSubmit={handleCreateCourseSubmit} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">Course Name / Title</label>
                    <input
                      type="text"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      placeholder="e.g. Advanced Web Architecture & Microservices"
                      className="w-full px-4 py-3 bg-slate-950 border border-purple-500/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">Duration</label>
                    <select
                      value={courseDuration}
                      onChange={(e) => setCourseDuration(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-purple-500/30 rounded-xl text-sm text-white focus:outline-none focus:border-purple-400"
                    >
                      <option value="4 Weeks">4 Weeks</option>
                      <option value="8 Weeks">8 Weeks</option>
                      <option value="12 Weeks">12 Weeks</option>
                      <option value="16 Weeks">16 Weeks / Full Semester</option>
                      <option value="Self-Paced">Self-Paced</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={creatingCourse}
                      className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm hover:from-purple-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                    >
                      {creatingCourse ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                      <span>Create Course</span>
                    </button>
                  </div>

                  <div className="sm:col-span-3 lg:col-span-4">
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">Course Description</label>
                    <textarea
                      value={courseDesc}
                      onChange={(e) => setCourseDesc(e.target.value)}
                      rows={2}
                      placeholder="Comprehensive course covering modern full-stack development, API authorization, database relationships..."
                      className="w-full px-4 py-3 bg-slate-950 border border-purple-500/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 resize-none"
                      required
                    />
                  </div>
                </form>
              </div>
            </div>

            {/* Created Courses List */}
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <BookOpen size={18} className="text-purple-400" />
                    <span>My Created Courses</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage online meeting links and WebRTC video rooms for your course cohorts
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold">
                  {courses.length} Courses
                </span>
              </div>

              {loadingCourses ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
                  <Loader2 size={24} className="animate-spin text-purple-400" />
                  <span className="text-xs">Loading course catalog...</span>
                </div>
              ) : courses.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-white/5 text-slate-400">
                  <BookOpen size={32} className="mx-auto mb-2 text-slate-600" />
                  <p className="text-sm font-semibold text-white">No courses created yet</p>
                  <p className="text-xs mt-1">Use the form above to launch your first course!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {courses.map((course) => (
                    <div
                      key={course._id}
                      className="bg-slate-950/80 border border-white/10 rounded-2xl p-6 flex flex-col justify-between gap-5 relative overflow-hidden group hover:border-purple-500/40 transition-all shadow-lg"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="px-2.5 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono text-[10px] uppercase font-bold">
                              {course.code || 'CS-COURSE'}
                            </span>
                            <h4 className="text-lg font-extrabold text-white mt-1">{course.title}</h4>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-white/10 text-slate-300 text-xs font-medium flex items-center gap-1">
                            <Clock size={12} className="text-purple-400" /> {course.duration}
                          </span>
                        </div>

                        <p className="text-slate-300 text-xs leading-relaxed line-clamp-2">
                          {course.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-white/5">
                          <span className="flex items-center gap-1.5">
                            <Users size={14} className="text-indigo-400" />
                            <strong className="text-white">{course.enrolledCount || 0}</strong> Registered Students
                          </span>
                        </div>

                        {/* Attached Meeting Status */}
                        <div className="mt-2 p-3.5 rounded-xl bg-slate-900 border border-white/10 flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-300 flex items-center gap-1.5">
                              <Video size={14} className="text-cyan-400" />
                              Online Meeting Room
                            </span>
                            {course.meeting ? (
                              course.meeting.status === 'ended' ? (
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/10 text-[10px] font-bold">
                                  Previous Ended
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Ready: {course.meeting.roomCode}
                                </span>
                              )
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                Not Scheduled
                              </span>
                            )}
                          </div>

                          {course.meeting ? (
                            course.meeting.status === 'ended' ? (
                              <div className="text-xs text-slate-400 flex flex-col gap-2 mt-1">
                                <p className="text-[11px] leading-relaxed">
                                  Previous meeting <strong className="text-slate-300 font-mono">({course.meeting.roomCode})</strong> has ended. All participants were disconnected and chat was deleted. You can create a new meeting for this course anytime!
                                </p>
                                <button
                                  onClick={() => openMeetingModal(course)}
                                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25"
                                >
                                  <Plus size={14} />
                                  <span>Start New Meeting for this Course</span>
                                </button>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-300 flex flex-col gap-2 mt-1 font-sans">
                                <div className="font-bold text-white text-sm">{course.meeting.title}</div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                                  <span>📅 {course.meeting.date}</span>
                                  <span>⏰ {course.meeting.time}</span>
                                  <span className="font-mono text-cyan-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-cyan-500/20">
                                    {course.meeting.roomCode}
                                  </span>
                                </div>

                                {/* Join Meeting Button */}
                                <button
                                  onClick={() =>
                                    setActiveMeeting({
                                      roomCode: course.meeting.roomCode,
                                      title: course.meeting.title
                                    })
                                  }
                                  className="mt-1 w-full py-2.5 rounded-lg bg-cyan-500 text-slate-950 font-black text-xs hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20"
                                >
                                  <Radio size={14} className="animate-pulse" />
                                  <span>Start / Host WebRTC Live Meeting</span>
                                </button>

                                {/* Quick Meeting Actions: Share Link / Code & End Meeting */}
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                  <button
                                    onClick={() => {
                                      setShareModalMeeting(course.meeting);
                                      setNotifiedStudents(false);
                                    }}
                                    className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold flex items-center justify-center gap-1.5 border border-white/10 transition-colors"
                                  >
                                    <Share2 size={12} />
                                    <span>Share Link / Code</span>
                                  </button>

                                  <button
                                    onClick={() => handleEndMeeting(course.meeting.roomCode)}
                                    className="py-1.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-bold flex items-center justify-center gap-1.5 border border-rose-500/20 transition-colors"
                                  >
                                    <PhoneOff size={12} />
                                    <span>End Meeting</span>
                                  </button>
                                </div>
                              </div>
                            )
                          ) : (
                            <div className="flex flex-col gap-2 mt-1">
                              <p className="text-[11px] text-slate-400 italic">
                                No meeting created yet. Only registered students will see the link once created.
                              </p>
                              <button
                                onClick={() => openMeetingModal(course)}
                                className="w-full py-2.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-200 hover:bg-purple-600 hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-2"
                              >
                                <Video size={14} />
                                <span>Schedule Online Meeting</span>
                              </button>
                            </div>
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

        {/* TAB 2: LIVE MCQ SESSIONS (PRESERVED) */}
        {activeTab === 'sessions' && (
          <div className="flex flex-col gap-8">
            <div className="relative rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-8 border border-white/10 overflow-hidden shadow-2xl">
              <div className="absolute -right-12 -top-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-3xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300 mb-3">
                  <Sparkles size={14} className="text-purple-400" /> Educator Hub
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
                  Launch Live MCQ Session &amp; Monitor Real-Time Classroom Responses
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Create a new interactive quiz code, broadcast to students in real-time, and view automated evaluation results.
                </p>

                <form onSubmit={handleCreateSession} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    placeholder="Session Title (e.g. Midterm MCQ Revision)"
                    className="px-4 py-3 bg-slate-950 border border-purple-500/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                    required
                  />
                  <input
                    type="number"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    placeholder="Question Count"
                    min="1"
                    max="50"
                    className="px-4 py-3 bg-slate-950 border border-purple-500/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="submit"
                    disabled={creatingSession}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm hover:from-purple-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                  >
                    {creatingSession ? 'Generating Code...' : 'Create Live Session'}
                    <PlusCircle size={16} />
                  </button>
                </form>

                {createdCode && (
                  <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-purple-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <span className="text-xs text-slate-400">Session Broadcast Code Ready:</span>
                        <h4 className="text-xl font-mono font-black text-cyan-300 tracking-wider">{createdCode}</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 transition-colors flex items-center gap-1.5">
                        <Play size={14} /> Start Broadcast
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sessions Table */}
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <FileSpreadsheet size={18} className="text-purple-400" />
                  <span>Recent Interactive Quiz Sessions</span>
                </h3>
                <span className="text-xs text-slate-400">Live Reports</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th className="p-3.5">Session Code</th>
                      <th className="p-3.5">Topic / Title</th>
                      <th className="p-3.5">Participants</th>
                      <th className="p-3.5">Avg Score</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { code: 'EDU-901', title: 'Data Structures & Algorithms', count: 42, score: '91%', status: 'Completed' },
                      { code: 'EDU-742', title: 'Web Architecture MCQ Evaluation', count: 38, score: '84%', status: 'Completed' },
                      { code: 'EDU-310', title: 'Database Indexing & Queries', count: 45, score: '89%', status: 'Live' }
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-cyan-300">{row.code}</td>
                        <td className="p-3.5 font-semibold text-white">{row.title}</td>
                        <td className="p-3.5">{row.count} Students</td>
                        <td className="p-3.5 font-bold text-emerald-400">{row.score}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              row.status === 'Live'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-white/10'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button className="px-3 py-1 rounded bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600 hover:text-white transition-colors text-[11px] font-bold">
                            View Analytics
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* SCHEDULE MEETING MODAL */}
      {meetingModalCourse && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative animate-fadeIn">
            <button
              onClick={() => setMeetingModalCourse(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Video size={24} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Schedule Online Meeting</h3>
                <p className="text-xs text-purple-300 font-semibold">{meetingModalCourse.title}</p>
              </div>
            </div>

            <form onSubmit={handleScheduleMeetingSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Meeting Title</label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Weekly Live Lecture & Q&A"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-purple-500/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-purple-500/30 rounded-xl text-sm text-white focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">Time</label>
                  <input
                    type="text"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    placeholder="e.g. 10:00 AM"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-purple-500/30 rounded-xl text-sm text-white focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">
                  Optional Custom WebRTC / Video Link
                </label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="e.g. https://meet.jit.si/edupulse-room-1"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-purple-500/30 rounded-xl text-sm text-cyan-300 font-mono placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Meeting Notes / Agenda (Optional)</label>
                <textarea
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  rows={2}
                  placeholder="Bring your questions on module 2 assignment..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-purple-500/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setMeetingModalCourse(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulingMeeting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs hover:from-purple-500 hover:to-indigo-500 transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20"
                >
                  {schedulingMeeting ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />}
                  <span>Save &amp; Generate Room Code</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE MEETING LINK & CODE MODAL */}
      {shareModalMeeting && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-fadeIn flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Share2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Share Live Meeting</h3>
                  <p className="text-xs text-slate-400">{shareModalMeeting.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShareModalMeeting(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Room Code Box */}
            <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-400">Meeting Room Code</span>
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-mono font-black text-cyan-300 tracking-wider">
                  {shareModalMeeting.roomCode}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareModalMeeting.roomCode);
                    setCopiedShareCode(true);
                    setTimeout(() => setCopiedShareCode(false), 2000);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  {copiedShareCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedShareCode ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            {/* Direct Link Box */}
            <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-400">Direct Meeting Link</span>
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/?meeting=${shareModalMeeting.roomCode}`}
                  className="bg-transparent text-xs font-mono text-slate-300 w-full focus:outline-none truncate"
                />
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/?meeting=${shareModalMeeting.roomCode}`;
                    navigator.clipboard.writeText(link);
                    setCopiedShareLink(true);
                    setTimeout(() => setCopiedShareLink(false), 2000);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-colors shrink-0 shadow-md shadow-cyan-500/20"
                >
                  {copiedShareLink ? <Check size={14} className="text-slate-950" /> : <Sparkles size={14} />}
                  <span>{copiedShareLink ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Simulated Notification to Enrolled Students */}
            {notifiedStudents ? (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Notification and meeting access code sent to all enrolled students!</span>
              </div>
            ) : (
              <button
                onClick={() => setNotifiedStudents(true)}
                className="py-2.5 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Users size={14} />
                <span>Send Code &amp; Link to All Enrolled Students</span>
              </button>
            )}

            {/* Launch Meeting Action */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShareModalMeeting(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMeeting({
                    roomCode: shareModalMeeting.roomCode,
                    title: shareModalMeeting.title
                  });
                  setShareModalMeeting(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
              >
                <Radio size={14} className="animate-pulse" />
                <span>Launch Meeting Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
