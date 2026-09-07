import React from 'react';
import { MonitorPlay, Github, Linkedin, Mail } from 'lucide-react';

const navLinks = [
  { name: 'Home', href: '#home' },
  { name: 'About', href: '#about' },
  { name: 'Goal & Vision', href: '#goals' },
  { name: 'Features', href: '#features' },
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'Mentors', href: '#mentor' },
  { name: 'Team', href: '#team' }
];

export default function Footer() {
  return (
    <footer className="bg-slate-950/95 border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">

          <div>
            <a href="#home" className="inline-flex items-center gap-2.5 text-xl font-extrabold text-white mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white">
                <MonitorPlay size={20} />
              </div>
              <span>EduPulse</span>
            </a>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              An interactive learning platform designed to make classroom learning more engaging, collaborative, and effective through live dynamic MCQs and feedback.
            </p>
          </div>

          <div>
            <h4 className="text-base font-bold mb-4 text-white">Quick Navigation</h4>
            <ul className="list-none flex flex-col gap-2.5">
              {navLinks.map((link, idx) => (
                <li key={idx}>
                  <a href={link.href} className="text-slate-400 hover:text-white text-sm transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-base font-bold mb-4 text-white">Connect With Us</h4>
            <p className="text-slate-400 text-sm mb-4">
              Have questions or feedback? Connect with our team on GitHub or LinkedIn.
            </p>
            <div className="flex gap-3">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-200 hover:bg-slate-800 hover:text-white transition-colors">
                <Github size={18} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-200 hover:bg-slate-800 hover:text-white transition-colors">
                <Linkedin size={18} />
              </a>
              <a href="mailto:contact@edupulse.org" className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-200 hover:bg-slate-800 hover:text-white transition-colors">
                <Mail size={18} />
              </a>
            </div>
          </div>

        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div>© 2026 EduPulse Learning Platform. All rights reserved .</div>
          <div>Designed for interactive digital education.</div>
        </div>
      </div>
    </footer>
  );
}
