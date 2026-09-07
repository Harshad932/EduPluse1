import React from 'react';
import { Target, Compass, CheckCircle2, Sparkles } from 'lucide-react';

const goalPoints = [
  'Make classroom & online learning genuinely interactive',
  'Encourage active student participation during live sessions',
  'Empower trainers to easily conduct engaging MCQ activities',
  'Provide immediate feedback to both students and trainers',
  'Elevate overall learning outcomes and knowledge retention'
];

export default function Goals() {
  return (
    <section id="goals" className="py-24">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="badge-indigo mb-3.5">Mission &amp; Purpose</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Our Goal &amp; Vision
          </h2>
          <p className="text-slate-400 text-base">
            Pioneering a smarter digital learning ecosystem built on active participation and instant feedback.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          <div className="glass-card p-9 relative overflow-hidden border-t-4 border-t-indigo-500">
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-13 h-13 rounded-2xl bg-indigo-500/18 text-indigo-400 flex items-center justify-center p-3">
                <Target size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-white">Platform Goal</h3>
                <p className="text-slate-400 text-xs">Core Objectives &amp; Targets</p>
              </div>
            </div>

            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Our primary goal is to redefine digital classroom dynamics by combining live trainer engagement with dynamic MCQ evaluations.
            </p>

            <ul className="list-none flex flex-col gap-3.5">
              {goalPoints.map((pt, idx) => (
                <li key={idx} className="flex items-center gap-2.5 text-sm text-slate-200">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card p-9 relative overflow-hidden border-t-4 border-t-cyan-500 bg-gradient-to-br from-slate-900/80 to-slate-950/95">
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-13 h-13 rounded-2xl bg-cyan-500/18 text-cyan-400 flex items-center justify-center p-3">
                <Compass size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-white">Long-Term Vision</h3>
                <p className="text-slate-400 text-xs">Future Outlook</p>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-cyan-500/30 rounded-xl p-6 mb-6">
              <p className="text-lg leading-relaxed text-white font-medium italic">
                "To create a smart, interactive, and accessible learning environment where students actively participate and trainers can effectively evaluate learning outcomes."
              </p>
            </div>

            <div className="flex items-center gap-3 text-slate-400 text-sm">
              <Sparkles size={18} className="text-cyan-400" />
              <span>Building the future of interactive educational tech</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
