import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import MeetingRoom from './components/MeetingRoom';
import AuthModal from './components/AuthModal';

function MainApp() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('public');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalInitialRole, setAuthModalInitialRole] = useState('student');
  const [activeMeetingLink, setActiveMeetingLink] = useState(null);

  useEffect(() => {
    if (!user) {
      setCurrentView('public');
    }

    // Check for direct meeting link query parameter: ?meeting=EDUMET-xxxx
    const params = new URLSearchParams(window.location.search);
    const meetingCodeParam =
      params.get('meeting') ||
      params.get('room') ||
      (window.location.hash.startsWith('#meeting=') ? window.location.hash.replace('#meeting=', '') : null);

    if (meetingCodeParam) {
      const code = meetingCodeParam.trim().toUpperCase();
      if (user) {
        setActiveMeetingLink({ roomCode: code, title: `Meeting ${code}` });
      } else {
        setAuthModalInitialRole('student');
        setAuthModalOpen(true);
      }
    }
  }, [user]);

  const handleOpenAuth = (role = 'student') => {
    setAuthModalInitialRole(role);
    setAuthModalOpen(true);
  };

  const handleOpenDashboard = (view) => {
    setCurrentView(view);
  };

  const handleLoginSuccess = (userPayload) => {
    const params = new URLSearchParams(window.location.search);
    const meetingCodeParam =
      params.get('meeting') ||
      params.get('room') ||
      (window.location.hash.startsWith('#meeting=') ? window.location.hash.replace('#meeting=', '') : null);

    if (meetingCodeParam) {
      const code = meetingCodeParam.trim().toUpperCase();
      setActiveMeetingLink({ roomCode: code, title: `Meeting ${code}` });
      return;
    }

    if (userPayload?.role === 'admin') {
      setCurrentView('admin');
    } else if (userPayload?.role === 'teacher') {
      setCurrentView('teacher');
    } else if (userPayload?.role === 'student') {
      setCurrentView('student');
    } else {
      setCurrentView('public');
    }
  };

  // If directly joining via meeting link and logged in
  if (activeMeetingLink && user) {
    return (
      <MeetingRoom
        roomCode={activeMeetingLink.roomCode}
        meetingTitle={activeMeetingLink.title}
        userRole={user.role}
        onLeave={() => {
          setActiveMeetingLink(null);
          window.history.replaceState({}, document.title, window.location.pathname);
          if (user.role === 'teacher') setCurrentView('teacher');
          else if (user.role === 'student') setCurrentView('student');
          else setCurrentView('public');
        }}
      />
    );
  }

  return (
    <>
      {currentView === 'admin' ? (
        <AdminDashboard onBackToPublic={() => setCurrentView('public')} />
      ) : currentView === 'teacher' ? (
        <TeacherDashboard onBackToPublic={() => setCurrentView('public')} />
      ) : currentView === 'student' ? (
        <StudentDashboard onBackToPublic={() => setCurrentView('public')} />
      ) : (
        <Home
          onOpenAuth={handleOpenAuth}
          onOpenDashboard={handleOpenDashboard}
        />
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialRole={authModalInitialRole}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
