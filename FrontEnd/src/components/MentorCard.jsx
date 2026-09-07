import React from 'react';
import { Linkedin, Github, GraduationCap } from 'lucide-react';

export default function MentorCard({ mentor = {} }) {
  const name = mentor.name || '';
  const role = mentor.role || mentor.title || 'Mentor & Advisor';
  const description = mentor.description || mentor.bio || '';
  const image = mentor.image_url || mentor.image || '';
  const linkedin = mentor.linkedin_url || mentor.linkedin || '';
  const github = mentor.github_url || mentor.github || '';

  return (
    <div className="group relative bg-slate-900/90 backdrop-blur-2xl border border-indigo-500/20 rounded-2xl p-8 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1 flex flex-col items-center text-center overflow-hidden h-full">
      
      {/* Background ambient lighting */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-br from-indigo-500/15 to-cyan-500/15 rounded-full blur-3xl group-hover:from-indigo-500/25 group-hover:to-cyan-500/25 transition-all duration-500 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* Avatar Container */}
      <div className="relative mb-6 z-10">
        <div className="w-28 h-28 p-1 rounded-2xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 group-hover:shadow-cyan-500/40 transition-all duration-300">
          <div className="w-full h-full rounded-[12px] overflow-hidden bg-slate-950 flex items-center justify-center border border-white/10">
            {image ? (
              <img
                src={image}
                alt={name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <span className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                {name ? name.charAt(0) : '?'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Name and Role */}
      <div className="relative z-10 mb-4 flex flex-col items-center">
        <h3 className="text-2xl font-extrabold text-white group-hover:text-cyan-300 transition-colors duration-300 tracking-tight mb-2">
          {name}
        </h3>
        
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
          <GraduationCap size={14} className="text-indigo-400" />
          {role}
        </span>
      </div>

      {/* Description / Bio */}
      {description && (
        <div className="relative z-10 w-full bg-slate-950/60 rounded-xl p-4 border border-white/5 mb-6 text-center flex-1 flex items-center justify-center">
          <p className="text-slate-300 text-sm leading-relaxed italic">
            "{description}"
          </p>
        </div>
      )}

      {/* Social Links (only provided form options) */}
      {(linkedin || github) && (
        <div className="relative z-10 flex items-center justify-center gap-3 mt-auto pt-2">
          {linkedin && (
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-200 shadow-sm"
              title="LinkedIn Profile"
            >
              <Linkedin size={15} />
              <span>LinkedIn</span>
            </a>
          )}
          {github && (
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 border border-white/10 text-slate-200 hover:bg-slate-700 hover:text-white hover:border-white/20 transition-all duration-200 shadow-sm"
              title="GitHub Profile"
            >
              <Github size={15} />
              <span>GitHub</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

