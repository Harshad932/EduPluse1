import React, { useState, useEffect } from 'react';
import { Play, Calendar, Video, Loader2, AlertCircle, Youtube } from 'lucide-react';
import { getVideos } from '../services/videoService';

export default function Gallery() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeVideoId, setActiveVideoId] = useState(null);

  useEffect(() => {
    fetchGalleryVideos();
  }, []);

  const fetchGalleryVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getVideos(false);
      if (res && res.success) {
        const sorted = [...(res.data || [])].sort((a, b) => {
          const pA = Number(a.priority) || 1;
          const pB = Number(b.priority) || 1;
          if (pA !== pB) return pA - pB;
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        });
        setVideos(sorted);
      } else {
        setError(res?.message || 'Failed to load video gallery');
      }
    } catch (err) {
      console.error('Fetch Gallery Error:', err);
      setError('Unable to connect to video gallery service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="gallery" className="py-20 bg-[#0b0f19] relative overflow-hidden">
      {/* Background radial ambient lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-cyan-500/20 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[250px] bg-gradient-to-br from-amber-500/15 to-rose-500/15 blur-[110px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
            <div className="p-4 rounded-full bg-slate-900/80 border border-white/10 shadow-2xl">
              <Loader2 size={36} className="animate-spin text-rose-500" />
            </div>
            <p className="text-slate-300 font-semibold text-base">Loading gallery videos...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="max-w-md mx-auto p-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-center backdrop-blur-xl">
            <AlertCircle size={40} className="mx-auto text-rose-400 mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Gallery Unavailable</h3>
            <p className="text-xs text-rose-300 mb-4">{error}</p>
            <button
              onClick={fetchGalleryVideos}
              className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all shadow-lg shadow-rose-500/20"
            >
              Retry Loading
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && videos.length === 0 && (
          <div className="max-w-lg mx-auto py-16 px-6 text-center rounded-3xl bg-slate-900/50 border border-white/10 backdrop-blur-xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <Video size={32} />
            </div>
            <h3 className="text-xl font-extrabold text-white">No Videos Added Yet</h3>
            <p className="text-slate-400 text-sm mt-2">
              Check back soon! Our team is curating awesome video content for you.
            </p>
          </div>
        )}

        {/* Video Grid */}
        {!loading && !error && videos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video) => {
              const isPlaying = activeVideoId === video._id;

              return (
                <div
                  key={video._id}
                  className="group rounded-3xl bg-slate-900/70 border border-white/10 hover:border-rose-500/40 transition-all duration-300 overflow-hidden flex flex-col shadow-xl hover:shadow-2xl hover:shadow-rose-950/30 hover:-translate-y-1"
                >
                  {/* Video Player / Thumbnail Preview */}
                  <div className="relative w-full aspect-video bg-slate-950 overflow-hidden">
                    {isPlaying ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${video.youtubeVideoId}?autoplay=1&rel=0`}
                        title={video.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div
                        onClick={() => setActiveVideoId(video._id)}
                        className="relative w-full h-full cursor-pointer group/thumb"
                      >
                        <img
                          src={video.thumbnail || `https://img.youtube.com/vi/${video.youtubeVideoId}/hqdefault.jpg`}
                          alt={video.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-105"
                          onError={(e) => {
                            e.target.src = `https://img.youtube.com/vi/${video.youtubeVideoId}/hqdefault.jpg`;
                          }}
                        />
                        {/* Dark Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent group-hover/thumb:opacity-90 transition-opacity" />

                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-xl shadow-rose-600/50 group-hover/thumb:scale-110 group-hover/thumb:bg-rose-500 transition-all duration-300">
                            <Play size={24} className="ml-1 fill-white" />
                          </div>
                        </div>

                        {/* YouTube Badge */}
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md">
                          <Youtube size={14} className="text-red-500" />
                          <span>YouTube</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-extrabold text-white line-clamp-2 group-hover:text-rose-300 transition-colors leading-snug">
                        {video.title}
                      </h3>

                      {video.description && (
                        <p className="mt-2.5 text-slate-300 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                          {video.description}
                        </p>
                      )}
                    </div>

                    {/* Footer Info */}
                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-500" />
                        <span>
                          {video.createdAt
                            ? new Date(video.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : 'Recently added'}
                        </span>
                      </div>

                      <button
                        onClick={() => setActiveVideoId(isPlaying ? null : video._id)}
                        className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                      >
                        {isPlaying ? 'Close Player' : 'Watch Now →'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
