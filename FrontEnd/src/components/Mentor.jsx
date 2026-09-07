import React, { useState, useEffect } from "react";
import MentorCard from "./MentorCard";
import { GraduationCap, Loader2 } from "lucide-react";
import { getTeamMembersByCategory } from "../services/teamService";

export default function Mentor() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const res = await getTeamMembersByCategory("mentor");
      if (res && res.success) {
        setMentors(res.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch mentors:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="mentor" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="badge-indigo mb-3.5">
            <GraduationCap size={14} /> Expert Advisory
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Our Mentors &amp; Instructors
          </h2>
          <p className="text-slate-400 text-base">
            Guided by industry leaders and educators committed to elevating
            classroom interactive standards.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12 text-slate-400 gap-2">
            <Loader2 className="animate-spin text-cyan-400" size={24} />
            <span className="text-sm font-medium">Loading mentors...</span>
          </div>
        ) : mentors.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm font-medium">
            No mentors added yet. Add mentors in the Admin Dashboard!
          </div>
        ) : (
          <div className={mentors.length === 1 ? "max-w-md mx-auto" : "grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"}>
            {mentors.map((mentor) => (
              <MentorCard key={mentor._id || mentor.id} mentor={mentor} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
