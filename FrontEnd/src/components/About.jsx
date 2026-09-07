import React from 'react';
import { Zap } from 'lucide-react';

const points = [
  { title: 'Improve Student Engagement', desc: 'Transform passive lectures into active participation with instant live polls.' },
  { title: 'Interactive Learning Environment', desc: 'Foster two-way collaboration between trainers and students in real-time.' },
  { title: 'Empower Trainers', desc: 'Streamline session delivery with dynamic form builders and live video feeds.' },
  { title: 'Instant MCQ Feedback', desc: 'Evaluate understanding on the spot with automated answer validation and charts.' }
];

export default function About() {
  return (
    <section id="about" className="py-24">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="badge-indigo mb-3.5">About The Platform</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Designed for Modern &amp; Effective Digital Education
          </h2>
          <p className="text-slate-400 text-base">
            EduPulse bridges the gap between trainers and students through real-time interaction, dynamic form creation, and instant evaluation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          <div className="flex flex-col gap-5">
            {points.map((pt, idx) => (
              <div key={idx} className="glass-card p-6 flex gap-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
                  <Zap size={22} />
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-1 text-white">{pt.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{pt.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card p-9 bg-gradient-to-br from-slate-900/90 to-slate-950/95">
            <span className="badge-indigo mb-4">Platform Overview</span>

            <h3 className="text-2xl font-bold mb-4 leading-snug text-white">
              Transforming How Knowledge is Delivered and Assessed
            </h3>

            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Traditional e-learning platforms often lack real-time engagement. EduPulse introduces dynamic MCQ activities, camera permissions for session integrity, and instant feedback loops so trainers can gauge student comprehension instantly.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10">
                <div className="text-3xl font-extrabold text-cyan-400">100%</div>
                <div className="text-xs text-slate-400 mt-1">Interactive Classroom</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10">
                <div className="text-3xl font-extrabold text-emerald-400">Real-Time</div>
                <div className="text-xs text-slate-400 mt-1">Score &amp; Results</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
