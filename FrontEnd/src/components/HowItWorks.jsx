import React from 'react';
import { UserCheck, Play, HelpCircle, Send, CheckCircle2, BarChart2 } from 'lucide-react';

const steps = [
  { step: '01', title: 'Trainer Creates Session', desc: 'Trainer initializes a live learning session and publishes dynamic MCQ form questions.', icon: UserCheck, color: 'text-indigo-400' },
  { step: '02', title: 'Students Join', desc: 'Students log in to the interactive platform view from their laptops or mobile devices.', icon: Play, color: 'text-cyan-400' },
  { step: '03', title: 'Trainer Conducts MCQs', desc: 'Trainer broadcasts questions with customizable countdown timers and live camera feed.', icon: HelpCircle, color: 'text-purple-400' },
  { step: '04', title: 'Students Submit Answers', desc: 'Individual students select choices and submit their answers within the active time window.', icon: Send, color: 'text-amber-400' },
  { step: '05', title: 'Responses Are Evaluated', desc: 'The dynamic form engine automatically validates answer correctness and calculates point scores.', icon: CheckCircle2, color: 'text-emerald-400' },
  { step: '06', title: 'Results Are Displayed', desc: 'Instant visual charts, class accuracy stats, and student leaderboards update on screen.', icon: BarChart2, color: 'text-rose-400' }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="badge-indigo mb-3.5">Step-By-Step Workflow</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            How The Platform Works
          </h2>
          <p className="text-slate-400 text-base">
            A seamless six-step process for organizing, conducting, and evaluating interactive learning sessions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div key={idx} className="glass-card p-7 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className={`font-heading text-3xl font-extrabold ${item.color}`}>{item.step}</span>
                  <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${item.color}`}>
                    <IconComp size={20} />
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-2 text-white">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
