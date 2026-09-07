import React, { useState, useEffect } from 'react';
import {
  Video,
  Plus,
  Edit3,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Youtube,
  Eye,
  EyeOff,
  Calendar,
  ExternalLink,
  Sparkles,
  Search,
  Check
} from 'lucide-react';
import {
  getVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  extractYouTubeId
} from '../services/videoService';

const EMPTY_FORM = {
  title: '',
  youtubeUrl: '',
  description: '',
  priority: 1,
  thumbnail: '',
  isActive: true
};

export default function AdminVideoManagement() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null); // null = creating
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Live extracted YouTube Video ID state for modal preview
  const [liveVideoId, setLiveVideoId] = useState(null);

  // Delete modal state
  const [deletingVideo, setDeletingVideo] = useState(null);

  // Preview modal state (for watching directly in admin list)
  const [previewVideo, setPreviewVideo] = useState(null);

  useEffect(() => {
    fetchVideosList();
  }, []);

  const fetchVideosList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getVideos(true); // pass all=true to get active & inactive videos
      if (res && res.success) {
        setVideos(res.data || []);
      } else {
        setError(res?.message || 'Unable to load videos list.');
      }
    } catch (err) {
      console.error('Fetch Admin Videos Error:', err);
      setError('Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle URL input changes & live YouTube ID extraction for preview
  const handleUrlChange = (urlValue) => {
    setFormData((prev) => ({ ...prev, youtubeUrl: urlValue }));
    setFormError('');
    if (urlValue.trim()) {
      const extractedId = extractYouTubeId(urlValue.trim());
      setLiveVideoId(extractedId);
      if (!extractedId) {
        setFormError('Invalid YouTube URL format. Enter a valid YouTube video link.');
      }
    } else {
      setLiveVideoId(null);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingVideo(null);
    setFormData(EMPTY_FORM);
    setLiveVideoId(null);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title || '',
      youtubeUrl: video.youtubeUrl || '',
      description: video.description || '',
      priority: video.priority !== undefined && video.priority !== null ? video.priority : 1,
      thumbnail: video.thumbnail || '',
      isActive: video.isActive !== undefined ? video.isActive : true
    });
    setLiveVideoId(video.youtubeVideoId || extractYouTubeId(video.youtubeUrl));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim()) {
      setFormError('Video title is required.');
      return;
    }

    if (!formData.youtubeUrl.trim()) {
      setFormError('YouTube URL is required.');
      return;
    }

    const extractedId = extractYouTubeId(formData.youtubeUrl);
    if (!extractedId) {
      setFormError('Invalid YouTube URL. Please enter a valid YouTube video link.');
      return;
    }

    const priorityVal = Number(formData.priority);
    if (
      formData.priority === '' ||
      formData.priority === null ||
      formData.priority === undefined ||
      isNaN(priorityVal) ||
      !Number.isInteger(priorityVal) ||
      priorityVal < 1 ||
      String(formData.priority).includes('.')
    ) {
      setFormError('Priority must be a positive integer (1, 2, 3, etc.).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        youtubeUrl: formData.youtubeUrl.trim(),
        description: formData.description.trim(),
        priority: priorityVal,
        thumbnail: formData.thumbnail.trim(),
        isActive: formData.isActive
      };

      if (editingVideo) {
        const res = await updateVideo(editingVideo._id, payload);
        if (res.success) {
          showNotification('Video updated successfully.', 'success');
          setIsModalOpen(false);
          fetchVideosList();
        } else {
          setFormError(res.message || 'Failed to update video.');
        }
      } else {
        const res = await createVideo(payload);
        if (res.success) {
          showNotification('Video added successfully to Gallery.', 'success');
          setIsModalOpen(false);
          fetchVideosList();
        } else {
          setFormError(res.message || 'Failed to add video.');
        }
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Server error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick toggle Active/Inactive status
  const handleToggleStatus = async (video) => {
    setSubmitting(true);
    try {
      const res = await updateVideo(video._id, { isActive: !video.isActive });
      if (res.success) {
        showNotification(
          `Video set to ${!video.isActive ? 'ACTIVE (visible in Gallery)' : 'INACTIVE (hidden from Gallery)'}`,
          'success'
        );
        fetchVideosList();
      } else {
        showNotification(res.message || 'Failed to update status.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error updating video status.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingVideo) return;
    setSubmitting(true);
    try {
      const res = await deleteVideo(deletingVideo._id);
      if (res.success) {
        showNotification('Video deleted successfully.', 'success');
        setDeletingVideo(null);
        fetchVideosList();
      } else {
        showNotification(res.message || 'Failed to delete video.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error deleting video.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter videos
  const filteredVideos = videos.filter((v) => {
    const matchesSearch =
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && v.isActive) ||
      (statusFilter === 'inactive' && !v.isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 backdrop-blur-md transition-all ${
            notification.type === 'error'
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
          }`}
        >
          {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span className="font-semibold text-sm">{notification.msg}</span>
        </div>
      )}

      {/* Action Header & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-white/10">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos by title or description..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-white/10 text-xs">
            {['all', 'active', 'inactive'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Add Video Button */}
        <button
          onClick={handleOpenCreateModal}
          className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all shrink-0"
        >
          <Plus size={16} />
          <span>Add New YouTube Video</span>
        </button>
      </div>

      {/* Videos List Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-500/15 text-red-400">
              <Youtube size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">YouTube Videos Catalog</h2>
              <p className="text-xs text-slate-400">Manage videos displayed in the public Gallery page</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1.5 rounded-full border border-white/10">
            Total Videos: {videos.length} ({videos.filter((v) => v.isActive).length} Active)
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-red-500" />
            <p className="text-base font-medium">Loading video list...</p>
          </div>
        ) : error ? (
          <div className="p-16 text-center text-rose-400 flex flex-col items-center justify-center gap-3">
            <AlertCircle size={36} />
            <p className="text-base font-semibold">{error}</p>
            <button onClick={fetchVideosList} className="btn-secondary text-xs mt-2 py-2 px-4">
              Retry
            </button>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Video size={40} className="text-slate-600" />
            <p className="text-base font-medium text-slate-300">No YouTube videos found.</p>
            <button onClick={handleOpenCreateModal} className="btn-primary text-xs py-2 px-4 mt-1">
              Add Your First Video
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-slate-950/40 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Preview & Title</th>
                  <th className="py-4 px-6 text-center">Priority</th>
                  <th className="py-4 px-6">YouTube URL / ID</th>
                  <th className="py-4 px-6">Date Added</th>
                  <th className="py-4 px-6">Gallery Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredVideos.map((video) => (
                  <tr key={video._id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Title & Preview */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div
                          onClick={() => setPreviewVideo(video)}
                          className="relative w-24 h-14 rounded-xl overflow-hidden bg-slate-950 border border-white/10 shrink-0 cursor-pointer group/thumb shadow-sm"
                        >
                          <img
                            src={video.thumbnail || `https://img.youtube.com/vi/${video.youtubeVideoId}/hqdefault.jpg`}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                            onError={(e) => {
                              e.target.src = `https://img.youtube.com/vi/${video.youtubeVideoId}/hqdefault.jpg`;
                            }}
                          />
                          <div className="absolute inset-0 bg-slate-950/40 group-hover/thumb:bg-slate-950/20 transition-all flex items-center justify-center">
                            <Eye size={16} className="text-white drop-shadow-md" />
                          </div>
                        </div>

                        <div className="max-w-md">
                          <div className="font-extrabold text-white line-clamp-1 hover:text-cyan-300 transition-colors">
                            {video.title}
                          </div>
                          {video.description && (
                            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                              {video.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Priority Badge */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-block px-3 py-1 rounded-lg bg-slate-800 border border-cyan-500/30 text-cyan-300 font-mono font-extrabold text-xs">
                        #{video.priority !== undefined && video.priority !== null ? video.priority : 1}
                      </span>
                    </td>

                    {/* YouTube URL / Video ID */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <a
                          href={video.youtubeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1 max-w-[220px] truncate"
                        >
                          <span>{video.youtubeUrl}</span>
                          <ExternalLink size={12} className="shrink-0" />
                        </a>
                        <span className="text-[10px] font-mono text-slate-500">
                          ID: {video.youtubeVideoId}
                        </span>
                      </div>
                    </td>

                    {/* Date Added */}
                    <td className="py-4 px-6 text-slate-400 text-xs font-mono">
                      {video.createdAt
                        ? new Date(video.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'N/A'}
                    </td>

                    {/* Status Badge & Toggle */}
                    <td className="py-4 px-6">
                      <button
                        disabled={submitting}
                        onClick={() => handleToggleStatus(video)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                          video.isActive
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}
                        title="Click to toggle Active/Inactive"
                      >
                        {video.isActive ? (
                          <>
                            <Eye size={13} /> Active
                          </>
                        ) : (
                          <>
                            <EyeOff size={13} /> Inactive
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(video)}
                          className="p-2 rounded-xl bg-slate-800 border border-white/10 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/30 transition-all"
                          title="Edit Video"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => setDeletingVideo(video)}
                          className="p-2 rounded-xl bg-slate-800 border border-white/10 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/30 transition-all"
                          title="Delete Video"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= ADD / EDIT VIDEO MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0b0f19] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400">
                  <Youtube size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">
                    {editingVideo ? 'Edit YouTube Video' : 'Add New YouTube Video'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Provide title, URL, and optional details to display in Gallery.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error banner */}
            {formError && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Video Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Full-Stack Web Development Overview"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Priority Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Display Priority <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  placeholder="1"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Lower number means higher display priority (1 = Highest Priority).
                </p>
              </div>

              {/* YouTube URL */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  YouTube URL <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.youtubeUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="e.g. https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Supported formats: <code className="text-cyan-400">youtube.com/watch?v=...</code>,{' '}
                  <code className="text-cyan-400">youtu.be/...</code>,{' '}
                  <code className="text-cyan-400">youtube.com/embed/...</code>
                </p>
              </div>

              {/* Live Preview Box */}
              {liveVideoId && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-300 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={14} /> Live YouTube Video Preview
                    </span>
                    <span className="font-mono text-[10px] bg-cyan-500/20 px-2 py-0.5 rounded text-cyan-200">
                      ID: {liveVideoId}
                    </span>
                  </div>
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${liveVideoId}`}
                      title="Live YouTube Preview"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Short Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide a brief summary of what students will learn from this video..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Custom Thumbnail URL (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Custom Thumbnail Image URL <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  placeholder="Leave empty to use high-res YouTube default thumbnail"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Active Status Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-white/10">
                <div>
                  <span className="text-sm font-bold text-white block">Gallery Visibility</span>
                  <span className="text-xs text-slate-400">
                    Active videos are immediately visible on the public Gallery page.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    formData.isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {formData.isActive ? (
                    <>
                      <Check size={14} /> Active
                    </>
                  ) : (
                    'Inactive'
                  )}
                </button>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold hover:from-red-500 hover:to-rose-500 shadow-lg shadow-rose-600/20 flex items-center gap-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  <span>{editingVideo ? 'Update Video' : 'Save Video'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deletingVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#0b0f19] border border-rose-500/30 rounded-3xl p-6 shadow-2xl">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={26} />
              </div>
              <h3 className="text-lg font-extrabold text-white">Delete Video</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-white">"{deletingVideo.title}"</span>?
                This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setDeletingVideo(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 flex items-center gap-2"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                <span>Delete Video</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADMIN FULL-SCREEN PREVIEW MODAL ================= */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-[#0b0f19] border border-white/15 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Youtube size={20} className="text-red-500" />
                <h3 className="text-base font-extrabold text-white max-w-xl truncate">
                  {previewVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${previewVideo.youtubeVideoId}?autoplay=1`}
                title={previewVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
