import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  GraduationCap,
  ShieldCheck,
  Plus,
  Edit3,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Github,
  Linkedin,
  ArrowLeft,
  UploadCloud,
  Image as ImageIcon,
  Clock,
  Check,
  XCircle,
  Settings,
  Zap,
  Filter,
  AlertTriangle,
  UserX,
  Video
} from 'lucide-react';
import AdminVideoManagement from '../components/AdminVideoManagement';
import {
  getTeamMembersByCategory,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember
} from '../services/teamService';
import {
  getAllUsers,
  getApprovalConfig,
  updateApprovalConfig,
  approveUser,
  rejectUser
} from '../services/authService';

const CATEGORIES = [
  { key: 'student', label: 'Student', icon: GraduationCap, color: 'from-cyan-500 to-blue-600' },
  { key: 'teacher', label: 'Teacher', icon: UserCheck, color: 'from-purple-500 to-indigo-600' },
  { key: 'team', label: 'Team', icon: Users, color: 'from-indigo-500 to-purple-600' },
  { key: 'mentor', label: 'Mentor', icon: ShieldCheck, color: 'from-amber-500 to-rose-600' }
];

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const EMPTY_FORM = {
  name: '',
  role: '',
  category: 'student',
  description: '',
  github_url: '',
  linkedin_url: ''
};

export default function AdminDashboard({ onBackToPublic }) {
  const [adminTab, setAdminTab] = useState('approvals'); // 'approvals' | 'members'
  const [activeCategory, setActiveCategory] = useState('student');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Category & Approval counts
  const [counts, setCounts] = useState({ student: 0, teacher: 0, team: 0, mentor: 0, pending: 0, approved: 0, rejected: 0, totalUsers: 0 });

  // Registered User Accounts (For Approvals Tab)
  const [allUserAccounts, setAllUserAccounts] = useState([]);
  const [userStatusFilter, setUserStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // 'all' | 'student' | 'teacher' | 'admin'
  const [approvalMode, setApprovalMode] = useState('manual');
  const [updatingMode, setUpdatingMode] = useState(false);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null); // null == creating
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Rejection modal state
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Image upload / preview state
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Delete confirmation modal state
  const [deletingMember, setDeletingMember] = useState(null);

  // Form data state
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    fetchInitialData();
  }, [activeCategory, userStatusFilter, userRoleFilter]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch approval configuration
      const configRes = await getApprovalConfig();
      if (configRes && configRes.approval_mode) {
        setApprovalMode(configRes.approval_mode);
      }

      // 2. Fetch all registered users
      const userRes = await getAllUsers(null, null);
      let regUsers = [];
      if (userRes && userRes.success) {
        regUsers = userRes.data || [];
        setAllUserAccounts(regUsers);
      }

      // 3. Fetch category items from teamService
      const res = await getTeamMembersByCategory(activeCategory);
      let catData = (res && res.success) ? (res.data || []) : [];

      // Format registered users as table items for active category
      let formattedUsers = [];
      if (activeCategory === 'student' || activeCategory === 'teacher') {
        const matchingRegUsers = regUsers.filter((u) => u.role === activeCategory && (u.approval_status || 'approved') === 'approved');
        formattedUsers = matchingRegUsers.map((u) => ({
          _id: u._id,
          name: u.name,
          role: u.role === 'student' ? 'Registered Student' : 'Registered Teacher',
          category: u.role,
          description: `Account Email: ${u.email}`,
          image_url: '',
          github_url: '',
          linkedin_url: '',
          isRegisteredUser: true
        }));
      }

      const combined = [...catData, ...formattedUsers.filter(u => !catData.some(c => c.name === u.name || c._id === u._id))];
      setMembers(combined);

      // Compute counts across all categories and approval statuses
      const [teamRes, mentorRes, studentRes, teacherRes] = await Promise.allSettled([
        getTeamMembersByCategory('team'),
        getTeamMembersByCategory('mentor'),
        getTeamMembersByCategory('student'),
        getTeamMembersByCategory('teacher')
      ]);

      const teamCount = (teamRes.status === 'fulfilled' && teamRes.value?.data) ? teamRes.value.data.length : 0;
      const mentorCount = (mentorRes.status === 'fulfilled' && mentorRes.value?.data) ? mentorRes.value.data.length : 0;
      const studentCatCount = (studentRes.status === 'fulfilled' && studentRes.value?.data) ? studentRes.value.data.length : 0;
      const teacherCatCount = (teacherRes.status === 'fulfilled' && teacherRes.value?.data) ? teacherRes.value.data.length : 0;

      const regStudentCount = regUsers.filter((u) => u.role === 'student').length;
      const regTeacherCount = regUsers.filter((u) => u.role === 'teacher').length;
      const pendingCount = regUsers.filter((u) => u.approval_status === 'pending').length;
      const approvedCount = regUsers.filter((u) => (u.approval_status || 'approved') === 'approved').length;
      const rejectedCount = regUsers.filter((u) => u.approval_status === 'rejected').length;

      setCounts({
        student: Math.max(studentCatCount, regStudentCount, (studentCatCount + regStudentCount)),
        teacher: Math.max(teacherCatCount, regTeacherCount, (teacherCatCount + regTeacherCount)),
        team: teamCount,
        mentor: mentorCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        totalUsers: regUsers.length
      });
    } catch (err) {
      console.error(err);
      setError('Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Toggle approval mode between manual and automatic
  const handleToggleMode = async (newMode) => {
    if (newMode === approvalMode) return;
    setUpdatingMode(true);
    try {
      const res = await updateApprovalConfig(newMode);
      if (res && res.success) {
        setApprovalMode(res.approval_mode);
        showNotification(`Global approval mode set to ${newMode.toUpperCase()} mode.`, 'success');
      } else {
        showNotification(res?.message || 'Unable to update approval mode.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Server error updating approval mode.', 'error');
    } finally {
      setUpdatingMode(false);
    }
  };

  // Approve a pending user account
  const handleApproveUserAction = async (userId) => {
    setSubmitting(true);
    try {
      const res = await approveUser(userId);
      if (res && res.success) {
        showNotification(res.message || 'User account approved successfully.', 'success');
        fetchInitialData();
      } else {
        showNotification(res?.message || 'Failed to approve user account.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error approving user account.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Reject a pending user account
  const handleRejectUserSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingUser) return;
    setSubmitting(true);
    try {
      const res = await rejectUser(rejectingUser._id, rejectionReason);
      if (res && res.success) {
        showNotification(res.message || 'Registration request rejected.', 'success');
        setRejectingUser(null);
        setRejectionReason('');
        fetchInitialData();
      } else {
        showNotification(res?.message || 'Failed to reject registration.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error rejecting registration request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingMember(null);
    setFormData({ ...EMPTY_FORM, category: activeCategory });
    setSelectedFile(null);
    setImagePreview('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name || '',
      role: member.role || '',
      category: member.category || activeCategory,
      description: member.description || '',
      github_url: member.github_url || '',
      linkedin_url: member.linkedin_url || ''
    });
    setSelectedFile(null);
    setImagePreview(member.image_url || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFormError('Invalid file format. Please upload JPG, PNG, or WEBP images.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFormError('File size exceeds 5 MB limit.');
      return;
    }

    setFormError('');
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.role.trim()) {
      setFormError('Name and Role are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('role', formData.role.trim());
      payload.append('category', formData.category.trim());
      payload.append('description', formData.description.trim());
      payload.append('github_url', formData.github_url.trim());
      payload.append('linkedin_url', formData.linkedin_url.trim());

      if (selectedFile) {
        payload.append('image', selectedFile);
      }

      if (editingMember) {
        const res = await updateTeamMember(editingMember._id, payload);
        if (res.success) {
          showNotification('Member updated successfully.', 'success');
          setIsModalOpen(false);
          fetchInitialData();
        } else {
          setFormError(res.message || 'Unable to update member.');
        }
      } else {
        const res = await createTeamMember(payload);
        if (res.success) {
          showNotification('Member created successfully.', 'success');
          setIsModalOpen(false);
          fetchInitialData();
        } else {
          setFormError(res.message || 'Unable to create member.');
        }
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Server error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMember) return;
    setSubmitting(true);
    try {
      const res = await deleteTeamMember(deletingMember._id);
      if (res.success) {
        showNotification('Member deleted successfully.', 'success');
        setDeletingMember(null);
        fetchInitialData();
      } else {
        showNotification(res.message || 'Unable to delete member.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Unable to delete member.', 'error');
    } flexFinally: {
      setSubmitting(false);
    }
  };

  // Filter user accounts for Approvals Table
  const filteredUserAccounts = allUserAccounts.filter((u) => {
    const matchesStatus = userStatusFilter === 'all' || (u.approval_status || 'approved') === userStatusFilter;
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesStatus && matchesRole;
  });

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-body py-10 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3">
              {onBackToPublic && (
                <button
                  onClick={onBackToPublic}
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Back to Public Site"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
                Admin Control Center
              </h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Manage account registration approvals, approval modes, and platform content.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAdminTab('approvals')}
              className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                adminTab === 'approvals'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ShieldCheck size={16} />
              <span>Account Approvals ({counts.pending})</span>
            </button>
            <button
              onClick={() => setAdminTab('members')}
              className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                adminTab === 'members'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Users size={16} />
              <span>Platform Members</span>
            </button>
            <button
              onClick={() => setAdminTab('videos')}
              className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                adminTab === 'videos'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Video size={16} />
              <span>Video Management</span>
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 backdrop-blur-md transition-all ${
            notification.type === 'error'
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
          }`}>
            {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <span className="font-semibold text-sm">{notification.msg}</span>
          </div>
        )}

        {/* Overview Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = counts[cat.key] || 0;
            const isActive = adminTab === 'members' && activeCategory === cat.key;
            return (
              <div
                key={cat.key}
                onClick={() => {
                  setAdminTab('members');
                  setActiveCategory(cat.key);
                }}
                className={`cursor-pointer p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
                  isActive
                    ? 'bg-slate-900 border-cyan-500/50 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                    : 'bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-tr ${cat.color} text-white shadow-lg`}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 capitalize">{cat.label}s</span>
                    <h3 className="text-2xl font-black text-white mt-0.5">{count} Total</h3>
                  </div>
                </div>
                <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                  {cat.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ================= TAB 1: ACCOUNT APPROVALS & SETTINGS ================= */}
        {adminTab === 'approvals' && (
          <div className="flex flex-col gap-8">
            {/* Approval Mode Control Panel */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-cyan-500/30 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  <Settings size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-white">Global Registration Approval Mode</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black border ${
                      approvalMode === 'automatic'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {approvalMode === 'automatic' ? '⚡ Automatic Mode' : '⚙️ Manual Mode'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    {approvalMode === 'automatic'
                      ? 'New Student, Teacher, and Admin registrations are automatically approved upon submission.'
                      : 'All new Student, Teacher, and Admin account requests require explicit Admin review and approval before accessing dashboards.'}
                  </p>
                </div>
              </div>

              {/* Toggle Buttons */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950 border border-white/10 shrink-0">
                <button
                  type="button"
                  disabled={updatingMode}
                  onClick={() => handleToggleMode('manual')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    approvalMode === 'manual'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock size={14} />
                  <span>Manual Approval</span>
                </button>
                <button
                  type="button"
                  disabled={updatingMode}
                  onClick={() => handleToggleMode('automatic')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    approvalMode === 'automatic'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap size={14} />
                  <span>Automatic Approval</span>
                </button>
              </div>
            </div>

            {/* Pending Alert Banner */}
            {counts.pending > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 flex items-center justify-between gap-4 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={20} className="text-amber-400 shrink-0" />
                  <span className="text-xs font-bold">
                    There are currently {counts.pending} pending account registration request(s) awaiting your approval.
                  </span>
                </div>
                <button
                  onClick={() => setUserStatusFilter('pending')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shrink-0"
                >
                  View Pending Only
                </button>
              </div>
            )}

            {/* Filter Controls & Account Table */}
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>Account Registration Requests</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Filter by registration status or account role</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Status Filter */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-white/10 text-xs">
                    {['all', 'pending', 'approved', 'rejected'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setUserStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                          userStatusFilter === st
                            ? 'bg-cyan-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {/* Role Filter */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-white/10 text-xs">
                    {['all', 'student', 'teacher', 'admin'].map((rl) => (
                      <button
                        key={rl}
                        onClick={() => setUserRoleFilter(rl)}
                        className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                          userRoleFilter === rl
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {rl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                  <Loader2 size={32} className="animate-spin text-cyan-400" />
                  <p className="text-base font-medium">Loading user accounts...</p>
                </div>
              ) : filteredUserAccounts.length === 0 ? (
                <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                  <UserX size={40} className="text-slate-600" />
                  <p className="text-base font-medium text-slate-300">No account requests found matching filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-slate-950/40 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-4 px-6">User Account</th>
                        <th className="py-4 px-6">Requested Role</th>
                        <th className="py-4 px-6">Registration Date</th>
                        <th className="py-4 px-6">Approval Status</th>
                        <th className="py-4 px-6 text-right">Approval Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {filteredUserAccounts.map((u) => {
                        const status = u.approval_status || 'approved';
                        return (
                          <tr key={u._id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white text-base">
                                  {u.name ? u.name.charAt(0) : '?'}
                                </div>
                                <div>
                                  <div className="font-extrabold text-white">{u.name}</div>
                                  <div className="text-xs text-slate-400">{u.email}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                                u.role === 'admin'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : u.role === 'teacher'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              }`}>
                                {u.role}
                              </span>
                            </td>

                            <td className="py-4 px-6 text-slate-400 text-xs font-mono">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                            </td>

                            <td className="py-4 px-6">
                              <div className="flex flex-col items-start gap-1">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize ${
                                  status === 'approved'
                                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                    : status === 'pending'
                                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                                    : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                                }`}>
                                  {status === 'approved' && <CheckCircle2 size={14} />}
                                  {status === 'pending' && <Clock size={14} />}
                                  {status === 'rejected' && <XCircle size={14} />}
                                  <span>{status}</span>
                                </span>
                                {u.rejection_reason && (
                                  <span className="text-[10px] text-rose-400 italic">Reason: {u.rejection_reason}</span>
                                )}
                              </div>
                            </td>

                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {status !== 'approved' && (
                                  <button
                                    disabled={submitting}
                                    onClick={() => handleApproveUserAction(u._id)}
                                    className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-sm"
                                    title="Approve Account"
                                  >
                                    <Check size={14} /> Approve
                                  </button>
                                )}

                                {status !== 'rejected' && (
                                  <button
                                    disabled={submitting}
                                    onClick={() => setRejectingUser(u)}
                                    className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl text-xs font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                    title="Reject Request"
                                  >
                                    <X size={14} /> Reject
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: PLATFORM MEMBERS & CONTENT ================= */}
        {adminTab === 'members' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              {/* Category Tabs */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-2 rounded-2xl border border-white/5">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.key;
                  const count = counts[cat.key] || 0;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setActiveCategory(cat.key)}
                      className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-heading font-semibold text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{cat.label}s</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button onClick={handleOpenCreateModal} className="btn-primary py-2.5 px-5 text-sm flex items-center gap-2">
                <Plus size={18} />
                <span>Add Member</span>
              </button>
            </div>

            {/* Data Table */}
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white capitalize">{activeCategory} Members</h2>
                <span className="text-xs text-slate-400 font-semibold bg-slate-800 px-3 py-1 rounded-full border border-white/5">
                  Total: {members.length}
                </span>
              </div>

              {loading ? (
                <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                  <Loader2 size={32} className="animate-spin text-indigo-400" />
                  <p className="text-base font-medium">Loading members...</p>
                </div>
              ) : error ? (
                <div className="p-16 text-center text-rose-400 flex flex-col items-center justify-center gap-3">
                  <AlertCircle size={36} />
                  <p className="text-base font-semibold">{error}</p>
                  <button onClick={() => fetchInitialData()} className="btn-secondary text-xs mt-2 py-2 px-4">
                    Retry
                  </button>
                </div>
              ) : members.length === 0 ? (
                <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                  <Users size={40} className="text-slate-600" />
                  <p className="text-base font-medium text-slate-300">No members found in this category.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-slate-950/40 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-4 px-6">Member</th>
                        <th className="py-4 px-6">Role</th>
                        <th className="py-4 px-6">Category</th>
                        <th className="py-4 px-6">Socials</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {members.map((member) => (
                        <tr key={member._id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-white text-base">
                                {member.image_url ? (
                                  <img
                                    src={member.image_url}
                                    alt={member.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                ) : (
                                  <span>{member.name ? member.name.charAt(0) : '?'}</span>
                                )}
                              </div>
                              <div>
                                <div className="font-extrabold text-white">{member.name}</div>
                                {member.description && (
                                  <div className="text-xs text-slate-400 line-clamp-1 max-w-xs">{member.description}</div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6 font-medium text-slate-300">{member.role}</td>

                          <td className="py-4 px-6">
                            <span className="badge-indigo text-[11px] uppercase tracking-wider">{member.category}</span>
                          </td>

                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              {member.github_url ? (
                                <a href={member.github_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors" title="GitHub Profile">
                                  <Github size={16} />
                                </a>
                              ) : (
                                <span className="text-slate-600 text-xs">-</span>
                              )}
                              {member.linkedin_url && (
                                <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition-colors" title="LinkedIn Profile">
                                  <Linkedin size={16} />
                                </a>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!member.isRegisteredUser && (
                                <>
                                  <button
                                    onClick={() => handleOpenEditModal(member)}
                                    className="inline-flex items-center gap-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all"
                                    title="Edit Member"
                                  >
                                    <Edit3 size={14} /> Edit
                                  </button>
                                  <button
                                    onClick={() => setDeletingMember(member)}
                                    className="inline-flex items-center gap-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-600 hover:text-white transition-all"
                                    title="Delete Member"
                                  >
                                    <Trash2 size={14} /> Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: VIDEO MANAGEMENT ================= */}
        {adminTab === 'videos' && <AdminVideoManagement />}
      </div>

      {/* Rejection Reason Modal */}
      {rejectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-lg font-extrabold text-white mb-2">Reject Registration Request</h3>
            <p className="text-xs text-slate-400 mb-4">
              Rejecting account request for <span className="text-white font-bold">{rejectingUser.name}</span> ({rejectingUser.role}).
            </p>

            <form onSubmit={handleRejectUserSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Rejection Reason (Optional)
                </label>
                <textarea
                  rows="3"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Unverified academic credentials provided."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setRejectingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 transition-colors"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl relative my-8">

            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <h3 className="text-xl font-black text-white">{editingMember ? 'Edit Member' : 'Create New Member'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Role <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors capitalize"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="team">Team</option>
                  <option value="mentor">Mentor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description / Bio
                </label>
                <textarea
                  rows="3"
                  placeholder="Short bio or description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              {/* Social URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/username"
                    value={formData.github_url}
                    onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Profile Photo (JPG, PNG, WEBP &lt; 5MB)
                </label>

                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-indigo-500 shadow-md">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <label className="flex-1 cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-indigo-500/60 rounded-xl p-4 transition-colors bg-slate-950/40">
                    <UploadCloud size={24} className="text-indigo-400 mb-1" />
                    <span className="text-xs font-bold text-slate-300">
                      {selectedFile ? selectedFile.name : 'Click to select image file'}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-2"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>{editingMember ? 'Update Member' : 'Create Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Delete Member</h3>
            <p className="text-xs text-slate-400 mb-6">
              Are you sure you want to delete <span className="text-white font-semibold">{deletingMember.name}</span>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeletingMember(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={handleDeleteConfirm}
                className="py-2.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
