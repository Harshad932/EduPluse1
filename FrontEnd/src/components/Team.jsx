import React, { useState, useEffect } from "react";
import TeamCard from "./TeamCard";
import { getTeamMembersByCategory } from "../services/teamService";
import { Loader2 } from "lucide-react";

// Role priority
const rolePriority = {
  CEO: 1,
  Founder: 1,
  "Co-Founder": 2,
  CTO: 3,
  CMO:3,
  "Project Manager": 4,
  "Team Lead": 5,
  "Lead Developer": 6,
  "Senior Developer": 7,
  Developer: 8,
  "Frontend Developer": 9,
  "Backend Developer": 10,
  "Full Stack Developer": 11,
  "UI/UX Designer": 12,
  Designer: 13,
  Intern: 14,
};

export default function Team() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);

      const res = await getTeamMembersByCategory("team");

      if (res && res.success) {
        const members = res.data || [];

        // Sort team members according to their role
        const sortedMembers = [...members].sort((a, b) => {
          const priorityA = rolePriority[a.role] || 999;
          const priorityB = rolePriority[b.role] || 999;

          return priorityA - priorityB;
        });

        setTeamMembers(sortedMembers);
      }
    } catch (err) {
      console.error("Failed to fetch team members:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="team" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="badge-indigo mb-3.5">Meet The Creators</span>

          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Our Team Members
          </h2>

          <p className="text-slate-400 text-base">
            Passionate developers and designers committed to building
            next-generation educational tools.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12 text-slate-400 gap-2">
            <Loader2 className="animate-spin text-indigo-400" size={24} />
            <span className="text-sm font-medium">Loading team members...</span>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm font-medium">
            No team members added yet. Add team members in the Admin Dashboard!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member) => (
              <TeamCard key={member._id || member.id} member={member} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
