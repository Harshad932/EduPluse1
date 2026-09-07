import React, { useState, useEffect } from "react";
import { Menu, X, ArrowRight, ShieldCheck, LogIn, LogOut, User, School, GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { name: "Home", href: "#home" },
  { name: "About", href: "#about" },
  { name: "Vision & Mission", href: "#vision-mission" },
  { name: "Features", href: "#features" },
  { name: "How It Works", href: "#how-it-works" },
  { name: "Gallery", href: "#gallery" },
  { name: "Mentors", href: "#mentor" },
  { name: "Team", href: "#team" },
];

export default function Navbar({ onOpenAuth, onOpenDashboard }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("#home");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const sections = navLinks.map((l) => l.href);
      const scrollPosition = window.scrollY + 120;

      for (const sectionId of sections) {
        const el = document.querySelector(sectionId);

        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;

          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveNav(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleNavClick = (href) => {
    setActiveNav(href);
    setMobileMenuOpen(false);
  };

  const getRoleIcon = (role) => {
    if (role === 'admin') return <ShieldCheck size={14} className="text-amber-400" />;
    if (role === 'teacher') return <School size={14} className="text-purple-400" />;
    return <GraduationCap size={14} className="text-cyan-400" />;
  };

  const getRoleLabel = (role) => {
    if (role === 'admin') return 'Admin';
    if (role === 'teacher') return 'Teacher';
    return 'Student';
  };

  const handleDashboardClick = () => {
    if (!user) return;
    if (user.role === 'admin') {
      onOpenDashboard('admin');
    } else if (user.role === 'teacher') {
      onOpenDashboard('teacher');
    } else {
      onOpenDashboard('student');
    }
  };

  return (
    <nav
      className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#0b0f19]/90 backdrop-blur-xl py-3 shadow-2xl shadow-indigo-950/40 border-b border-indigo-500/20"
          : "bg-[#0b0f19]/75 backdrop-blur-lg py-4 border-b border-white/10"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* ================= LOGO ================= */}
        <a
          href="#home"
          onClick={() => handleNavClick("#home")}
          className="flex items-center group relative p-1"
          aria-label="EduPulse Home"
        >
          {/* Vibrant multi-layered ambient radial glow behind logo */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/35 via-white/50 to-cyan-400/35 blur-xl rounded-full opacity-90 group-hover:opacity-100 group-hover:scale-115 transition-all duration-300 pointer-events-none -z-10" />
          <div className="absolute inset-1 bg-white/30 blur-lg rounded-full opacity-90 transition-all duration-300 pointer-events-none -z-10" />

          <img
            src="/edupulse-logo.png"
            alt="EduPulse"
            className="h-16 w-auto object-contain transition-all duration-300 group-hover:scale-105 filter drop-shadow-[0_0_14px_rgba(255,255,255,0.95)] drop-shadow-[0_0_24px_rgba(245,158,11,0.75)]"
          />
        </a>

        {/* ================= DESKTOP NAVIGATION ================= */}
        <ul className="hidden md:flex items-center gap-8 list-none">
          {navLinks.map((link, idx) => {
            const isActive = activeNav === link.href;

            return (
              <li key={idx} className="relative py-1">
                <a
                  href={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className={`text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "text-amber-400 font-bold drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                      : "text-slate-300 hover:text-amber-300"
                  }`}
                >
                  {link.name}
                </a>

                {isActive && (
                  <div className="absolute -bottom-1.5 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.9)] animate-pulse" />
                )}
              </li>
            );
          })}
        </ul>

        {/* ================= RIGHT ACTIONS ================= */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              {/* User Profile Pill & Dashboard Button */}
              <button
                onClick={handleDashboardClick}
                className="btn-secondary py-1.5 px-3 text-xs font-semibold flex items-center gap-2 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                title="Go to Dashboard"
              >
                <div className="p-1 rounded-full bg-slate-800 flex items-center justify-center">
                  {getRoleIcon(user.role)}
                </div>
                <span className="font-bold text-white max-w-[100px] truncate">{user.name}</span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-[10px] uppercase font-bold text-cyan-300">
                  {getRoleLabel(user.role)}
                </span>
              </button>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-2 rounded-xl bg-slate-800/80 border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onOpenAuth && onOpenAuth('student')}
                className="btn-secondary py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
              >
                <LogIn size={15} className="text-cyan-400" />
                <span>Sign In</span>
              </button>

              <button
                onClick={() => onOpenAuth && onOpenAuth('student')}
                className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5"
              >
                <span>Get Started</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-slate-200 p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* ================= MOBILE MENU ================= */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#0b0f19]/95 backdrop-blur-2xl border-b border-white/10 p-6 flex flex-col gap-4 shadow-2xl">
          {navLinks.map((link, idx) => {
            const isActive = activeNav === link.href;

            return (
              <a
                key={idx}
                href={link.href}
                className={`text-base py-2 font-medium flex items-center justify-between border-l-4 pl-3 transition-all ${
                  isActive
                    ? "text-amber-400 font-bold border-amber-400 bg-amber-400/10 rounded-r-lg"
                    : "text-slate-300 border-transparent hover:text-amber-300"
                }`}
                onClick={() => handleNavClick(link.href)}
              >
                <span>{link.name}</span>

                {isActive && (
                  <span className="text-amber-400 text-xs">● Active</span>
                )}
              </a>
            );
          })}

          {isAuthenticated ? (
            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleDashboardClick();
                }}
                className="btn-secondary w-full text-xs font-semibold flex items-center justify-center gap-2 border-cyan-500/30 text-cyan-300"
              >
                {getRoleIcon(user.role)}
                <span>Go to {getRoleLabel(user.role)} Dashboard</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="btn-secondary w-full text-xs font-semibold flex items-center justify-center gap-2 text-rose-300 border-rose-500/30"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth && onOpenAuth('student');
                }}
                className="btn-primary w-full text-xs font-bold"
              >
                <span>Sign In / Register</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

