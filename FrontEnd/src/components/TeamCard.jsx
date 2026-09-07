import React from 'react';
import { Github, Linkedin } from 'lucide-react';

export default function TeamCard({ member }) {
  const { name, role, image, description, github, linkedin, image_url, github_url, linkedin_url } = member;
  const displayImage = image || image_url;
  const displayGithub = github || github_url;
  const displayLinkedin = linkedin || linkedin_url;

  return (
    <div className="glass-card p-8 flex flex-col items-center text-center relative">

      <div className="w-24 h-24 rounded-full overflow-hidden mb-5 border-4 border-indigo-500 shadow-xl shadow-indigo-500/30 bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-extrabold">
        {displayImage ? (
          <img
            src={displayImage}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <span>{name ? name.charAt(0) : '?'}</span>
        )}
      </div>

      <h3 className="text-xl font-extrabold text-white mb-1">{name}</h3>
      <span className="badge-indigo mb-3.5 text-xs">{role}</span>

      {description && (
        <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1">{description}</p>
      )}

      <div className="flex items-center gap-3 mt-auto">
        {displayGithub && (
          <a href={displayGithub} target="_blank" rel="noopener noreferrer" className="btn-secondary py-2 px-3.5 text-xs" title="GitHub Profile">
            <Github size={16} /> GitHub
          </a>
        )}
        {displayLinkedin && (
          <a href={displayLinkedin} target="_blank" rel="noopener noreferrer" className="btn-secondary py-2 px-3.5 text-xs" title="LinkedIn Profile">
            <Linkedin size={16} /> LinkedIn
          </a>
        )}
      </div>
    </div>
  );
}
