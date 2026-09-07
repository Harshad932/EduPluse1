import React from 'react';
import {
  Target,
  Compass,
  Zap,
  ShieldCheck,
  Award,
  Users,
  BookOpen,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Globe,
  Flame,
  HeartHandshake
} from 'lucide-react';

const coreValues = [
  {
    icon: Zap,
    name: 'Innovation',
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    description: 'Pioneering real-time evaluation tools, dynamic quiz engines, and video integration to modernize digital classrooms.'
  },
  {
    icon: ShieldCheck,
    name: 'Integrity',
    color: 'from-cyan-500 to-blue-600',
    bgColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    description: 'Upholding academic honesty, secure data privacy, and trusted session management for every student and trainer.'
  },
  {
    icon: Award,
    name: 'Excellence',
    color: 'from-purple-500 to-indigo-600',
    bgColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    description: 'Striving for the highest quality in platform performance, user interface aesthetics, and measurable educational outcomes.'
  },
  {
    icon: Users,
    name: 'Collaboration',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    description: 'Fostering interactive two-way communication between trainers and students to turn passive lectures into active participation.'
  },
  {
    icon: BookOpen,
    name: 'Learning',
    color: 'from-indigo-500 to-purple-600',
    bgColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    description: 'Encouraging continuous curiosity, practical knowledge retention, and accessible education for learners everywhere.'
  },
  {
    icon: TrendingUp,
    name: 'Growth',
    color: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    description: 'Empowering students to track their academic progress and equipping educators with instant insights to refine teaching.'
  }
];

export default function VisionMission() {
  return (
    <section id="vision-mission" className="py-24 bg-[#0b0f19] relative overflow-hidden">
      {/* Radial ambient background lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-indigo-600/20 via-cyan-500/15 to-purple-600/20 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* ================= 1. HERO SECTION ================= */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-cyan-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <Sparkles size={15} className="text-cyan-400" />
            <span>Organization Purpose &amp; Values</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-6">
            Our <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">Vision &amp; Mission</span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            At EduPulse, we are dedicated to transforming digital education into a dynamic, two-way interactive experience. Discover our core purpose, future aspirations, and guiding values.
          </p>

          {/* Hero Visual Card / Stats Bar */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400">100%</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Interactive Engagement</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">Real-Time</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">MCQ Evaluation</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">Live</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Video Sessions</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">Seamless</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Role Access</div>
            </div>
          </div>
        </div>

        {/* ================= 2. VISION & MISSION SECTIONS ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-20">
          
          {/* VISION CARD */}
          <div className="glass-card p-8 sm:p-10 relative overflow-hidden border-t-4 border-t-cyan-500 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/95 flex flex-col justify-between group">
            <div className="absolute -right-8 -top-8 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />

            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-lg shrink-0">
                  <Compass size={30} />
                </div>
                <div>
                  <span className="badge-indigo text-[10px] mb-1">Future Outlook</span>
                  <h2 className="text-3xl font-extrabold text-white">Our Vision</h2>
                </div>
              </div>

              {/* Vision Statement Quote */}
              <div className="bg-slate-950/70 border border-cyan-500/30 rounded-2xl p-6 mb-6 shadow-inner">
                <p className="text-lg leading-relaxed text-white font-medium italic">
                  "To create a smart, interactive, and accessible digital learning ecosystem where every student actively participates and every educator delivers impactful, real-time instruction."
                </p>
              </div>

              {/* Vision Explanation */}
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Our long-term goal is to redefine digital classroom dynamics worldwide. We envision a future where location and passive presentation barriers disappear, replaced by active engagement, instant comprehension assessments, and data-backed learning improvements.
              </p>

              {/* Key Vision Pillars */}
              <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                <div className="flex items-center gap-3 text-xs text-slate-200">
                  <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
                  <span>Eliminating passive e-learning through real-time feedback loops</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-200">
                  <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
                  <span>Bridging educators and students through responsive video &amp; quiz tools</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-200">
                  <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
                  <span>Empowering institutions with transparent, data-driven progress analytics</span>
                </div>
              </div>
            </div>
          </div>

          {/* MISSION CARD */}
          <div className="glass-card p-8 sm:p-10 relative overflow-hidden border-t-4 border-t-indigo-500 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/95 flex flex-col justify-between group">
            <div className="absolute -right-8 -top-8 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />

            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-lg shrink-0">
                  <Target size={30} />
                </div>
                <div>
                  <span className="badge-indigo text-[10px] mb-1">Core Objectives</span>
                  <h2 className="text-3xl font-extrabold text-white">Our Mission</h2>
                </div>
              </div>

              {/* Mission Statement Quote */}
              <div className="bg-slate-950/70 border border-indigo-500/30 rounded-2xl p-6 mb-6 shadow-inner">
                <p className="text-lg leading-relaxed text-white font-medium italic">
                  "To empower educational institutions, trainers, and students with real-time interactive tools, instant assessment capabilities, and seamless video learning experiences."
                </p>
              </div>

              {/* Mission Explanation */}
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                We work toward our vision by engineering robust, user-friendly software that streamlines course delivery, dynamic MCQ activity building, live video session hosting, and automated score evaluations for teachers and students alike.
              </p>

              {/* Key Mission Pillars */}
              <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                <div className="flex items-center gap-3 text-xs text-slate-200">
                  <CheckCircle2 size={16} className="text-indigo-400 shrink-0" />
                  <span>Providing instant score evaluation &amp; automated feedback engines</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-200">
                  <CheckCircle2 size={16} className="text-indigo-400 shrink-0" />
                  <span>Streamlining teacher approval workflows &amp; student enrollment</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-200">
                  <CheckCircle2 size={16} className="text-indigo-400 shrink-0" />
                  <span>Curating video lecture galleries for accessible self-paced review</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ================= 3. CORE VALUES SECTION ================= */}
        <div className="pt-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="badge-indigo mb-3.5">Guiding Principles</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Our Core Values
            </h2>
            <p className="text-slate-400 text-base">
              The foundational standards that shape our platform design, community interactions, and educational technology commitment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreValues.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div
                  key={idx}
                  className="glass-card p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between group hover:border-white/20 transition-all duration-300 hover:-translate-y-1.5 shadow-xl"
                >
                  <div>
                    {/* Value Header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className={`p-3.5 rounded-2xl border ${val.bgColor} shadow-md`}>
                        <Icon size={26} />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        0{idx + 1}
                      </span>
                    </div>

                    <h3 className="text-xl font-extrabold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                      {val.name}
                    </h3>

                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                      {val.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                    <Sparkles size={12} className="text-cyan-400" />
                    <span>EduPulse Foundational Value</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
