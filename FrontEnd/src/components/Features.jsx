import React from 'react';
import { HelpCircle, Zap, BarChart2, LayoutDashboard, Users, Camera } from 'lucide-react';

const featuresList = [
  {
    icon: HelpCircle,
    title: '1. Dynamic MCQ Quiz',
    description: 'Trainers can create and conduct interactive multiple-choice questions dynamically with custom options, point values, and timers.',
    color: 'text-indigo-400'
  },
  {
    icon: Zap,
    title: '2. Real-Time Interaction',
    description: 'Students participate in live session activities instantly, creating an engaging two-way classroom experience.',
    color: 'text-cyan-400'
  },
  {
    icon: BarChart2,
    title: '3. Instant Results',
    description: 'Results, response distribution charts, and student performance scores are evaluated and displayed on screen immediately.',
    color: 'text-emerald-400'
  },
  {
    icon: LayoutDashboard,
    title: '4. Trainer Dashboard',
    description: 'A comprehensive control center designed to help trainers manage sessions, author dynamic forms, and monitor live responses.',
    color: 'text-purple-400'
  },
  {
    icon: Users,
    title: '5. Student Participation',
    description: 'Students get a dedicated interactive view to solve quizzes, track countdown timers, and receive instant score feedback.',
    color: 'text-amber-400'
  },
  {
    icon: Camera,
    title: '6. Camera Permission',
    description: 'The platform can request camera access from students or trainers when required during live sessions with browser permission.',
    color: 'text-rose-400',
    tag: 'Browser Permission'
  }
];

export default function Features() {
  return (
    <section id="features" className="py-24">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="badge-indigo mb-3.5">Platform Capabilities</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Powerful Features for Interactive Learning
          </h2>
          <p className="text-slate-400 text-base">
            Everything needed to transform traditional lectures into engaging, data-driven learning experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {featuresList.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div key={idx} className="glass-card p-8 flex flex-col h-full">
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-12 h-12 rounded-xl bg-white/5 ${item.color} flex items-center justify-center border border-white/10`}>
                    <IconComp size={24} />
                  </div>
                  {item.tag && <span className="badge-amber text-[10px]">{item.tag}</span>}
                </div>

                <h3 className="text-xl font-bold mb-2.5 text-white">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed flex-1">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
