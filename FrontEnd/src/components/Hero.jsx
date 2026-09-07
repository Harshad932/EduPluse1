import React, { useState } from 'react';
import {
  ArrowRight,
  Play,
  Sparkles,
  CheckCircle2,
  Users,
  Video,
  BarChart3,
  Clock,
  Award,
  Zap,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import heroBg from '../assets/hero-bg.jpeg';

export default function Hero() {
  const [selectedChoice, setSelectedChoice] = useState(0);

  const pollOptions = [
    { label: 'UDP / DTLS Protocol Layer', votes: 88, isCorrect: true },
    { label: 'HTTP/2 Long Polling', votes: 8, isCorrect: false },
    { label: 'Raw WebSocket TCP', votes: 4, isCorrect: false }
  ];

  return (
    <section id="home" className="relative pt-16 pb-24 overflow-hidden">
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-radial from-indigo-500/25 via-cyan-500/15 to-transparent blur-3xl pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">

        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 rounded-full px-4 py-1.5 text-xs font-bold text-indigo-300 flex items-center gap-2 shadow-lg shadow-indigo-500/20">
              <Sparkles size={16} className="text-cyan-400" />
              Next-Gen Interactive Classroom Engine
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent tracking-tight">
            Transform Lectures Into Live Interactive Experiences.
          </h1>

          <p className="text-lg md:text-xl text-slate-400 leading-relaxed mb-9 max-w-2xl mx-auto">
            Engage students in real-time, launch dynamic MCQ polls, stream live trainer video feeds, and evaluate response analytics instantly.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <a href="#features" className="btn-primary text-base px-8 py-3.5">
              Get Started Free <ArrowRight size={20} />
            </a>
            <a href="#how-it-works" className="btn-secondary text-base px-7 py-3.5">
              <Play size={18} className="fill-current" /> Watch Live Demo
            </a>
          </div>
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div
            className="rounded-3xl p-6 border border-white/15 shadow-2xl shadow-indigo-500/20 relative"
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(11, 15, 25, 0.88) 0%, rgba(21, 30, 49, 0.92) 100%), url(${heroBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-white ml-1.5 hidden sm:inline">
                  EduPulse Live Studio • Interactive Classroom Session #2026
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="badge-live px-3 py-1">
                  <span className="badge-live-dot" />
                  STREAM &amp; POLL ACTIVE
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                      <Video size={16} /> LIVE TRAINER FEED
                    </div>
                    <span className="badge-emerald text-[10px]">1080p HD</span>
                  </div>

                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-tr from-indigo-950 to-indigo-900 flex items-center justify-center mb-4 border border-white/10">
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-xl mx-auto mb-2 shadow-lg shadow-indigo-500/50">
                        TR
                      </div>
                      <span className="text-sm font-semibold text-white">Prof. Jonathan Vance</span>
                    </div>

                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] text-emerald-400">
                      <span>● Mic Active</span>
                      <span>Signal: 100%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-xl text-xs text-slate-400">
                  <span className="text-white font-semibold">Trainer Note:</span> Broadcasting question #1 with 30s countdown.
                </div>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                      <HelpCircle size={16} /> MCQ QUESTION #01
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                      <Clock size={14} /> 24s left
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-white mb-4 leading-snug">
                    Which protocol layer enables low-latency media streaming in WebRTC?
                  </h3>

                  <div className="flex flex-col gap-2.5">
                    {pollOptions.map((opt, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedChoice(idx)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedChoice === idx ? 'bg-indigo-500/20 border-indigo-500' : 'bg-slate-800/60 border-white/5 hover:border-white/15'
                        }`}
                      >
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span>{String.fromCharCode(65 + idx)}. {opt.label}</span>
                          <span className={opt.isCorrect ? 'text-emerald-400' : 'text-slate-400'}>{opt.votes}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${opt.isCorrect ? 'bg-emerald-400' : 'bg-indigo-500'}`}
                            style={{ width: `${opt.votes}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Users size={16} className="text-cyan-400" />
                    <span><strong className="text-white">42 Students</strong> Voted</span>
                  </div>
                  <span className="badge-emerald text-[10px]">
                    <CheckCircle2 size={12} /> Live Evaluated
                  </span>
                </div>
              </div>

            </div>
          </div>

          <div className="hidden sm:flex absolute -top-5 -left-5 bg-slate-900/95 border border-emerald-500/40 rounded-2xl p-3.5 items-center gap-3 shadow-2xl z-20">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Zap size={20} />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Real-Time Latency</div>
              <div className="text-xs font-extrabold text-emerald-300">&lt; 50ms Response</div>
            </div>
          </div>

          <div className="hidden sm:flex absolute -bottom-5 -right-5 bg-slate-900/95 border border-indigo-500/40 rounded-2xl p-3.5 items-center gap-3 shadow-2xl z-20">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <BarChart3 size={20} />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Instant Evaluation</div>
              <div className="text-xs font-extrabold text-indigo-300">Automatic Scoring</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-20">
          {[
            { metric: '50K+', label: 'Active Dynamic Quizzes Launched', icon: HelpCircle, color: 'text-indigo-400' },
            { metric: '99.9%', label: 'Real-Time Sync Accuracy', icon: ShieldCheck, color: 'text-cyan-400' },
            { metric: '100+', label: 'Schools & Training Academies', icon: Award, color: 'text-emerald-400' },
            { metric: '< 1 sec', label: 'Instant Score Calculation', icon: Zap, color: 'text-amber-400' }
          ].map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div key={idx} className="glass-card p-5 text-center">
                <div className={`w-10 h-10 rounded-xl bg-white/5 ${item.color} flex items-center justify-center mx-auto mb-3`}>
                  <IconComp size={20} />
                </div>
                <div className="text-2xl font-extrabold text-white mb-0.5">{item.metric}</div>
                <div className="text-xs text-slate-400">{item.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
