import React, { useState, useEffect } from 'react';
import {
  ThumbsUp,
  Bookmark,
  Share2,
  Flag,
  ShieldCheck,
  Eye,
  Calendar,
  MessageSquare,
  Send,
  Sparkles,
  Crown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CustomVideoPlayer } from '../components/player/CustomVideoPlayer.tsx';
import { VideoCard } from '../components/common/VideoCard.tsx';
import { AdBanner } from '../components/common/AdBanner.tsx';
import { ShareModal } from '../components/common/ShareModal.tsx';
import { ReportModal } from '../components/common/ReportModal.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import type { Video, Comment } from '../types/index.ts';

interface VideoDetailViewProps {
  video: Video;
  onSelectVideo: (video: Video) => void;
  onNavigate: (view: string, payload?: any) => void;
}

export const VideoDetailView: React.FC<VideoDetailViewProps> = ({
  video,
  onSelectVideo,
  onNavigate,
}) => {
  const { user, token, isFavorite, toggleFavorite, openAuthModal, history } = useAuth();
  const { showToast } = useToast();

  const [currentVideo, setCurrentVideo] = useState<Video>(video);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState(user?.name || '');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes || 0);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Find if user already has watch progress for this video
  const savedHistory = history.find((h) => h.videoId === video.id);
  const initialProgress = savedHistory ? savedHistory.progressSeconds : 0;

  // Load video details, comments, and related videos
  useEffect(() => {
    setCurrentVideo(video);
    setLikeCount(video.likes || 0);
    setIsLiked(false);
    setDescriptionExpanded(false);

    // Fetch video comments
    fetch(`/api/videos/${video.id}/comments`)
      .then((r) => r.json())
      .then((data) => setComments(data || []))
      .catch(() => {});

    // Fetch related videos in same category or trending
    fetch(`/api/videos/${video.id}/related`)
      .then((r) => r.json())
      .then((data) => setRelatedVideos(data || []))
      .catch(() => {});
  }, [video]);

  // Handle Like
  const handleLike = async () => {
    if (isLiked) {
      setLikeCount((prev) => Math.max(0, prev - 1));
      setIsLiked(false);
      return;
    }

    setLikeCount((prev) => prev + 1);
    setIsLiked(true);

    try {
      await fetch(`/api/videos/${currentVideo.id}/like`, { method: 'POST' });
    } catch {
      // rollback if failed
    }
  };

  // Handle Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/videos/${currentVideo.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text: commentText.trim(),
          userName: user?.name || commentAuthor.trim() || 'Porn Gabar Explorer',
        }),
      });

      if (res.ok) {
        const newC: Comment = await res.json();
        setComments((prev) => [newC, ...prev]);
        setCommentText('');
        showToast('Comment published successfully', 'success');
      } else {
        showToast('Failed to post comment', 'error');
      }
    } catch {
      showToast('Network error posting comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const bookmarked = isFavorite(currentVideo.id);

  return (
    <div id="video-detail-view" className="pb-16 max-w-7xl mx-auto space-y-8">
      
      {/* Top Banner Advertisement */}
      <AdBanner placement="top_banner" className="mb-2" />

      {/* Main Grid: Player + Details (Left 8 cols), Sidebar (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. Custom Responsive Video Player */}
          <div className="w-full">
            <CustomVideoPlayer
              key={currentVideo.id}
              video={currentVideo}
              initialProgress={initialProgress}
              onEnded={() => {
                if (relatedVideos.length > 0) {
                  showToast(`Up next: "${relatedVideos[0].title}"`, 'info');
                }
              }}
            />
          </div>

          {/* 2. Video Title & Primary Metadata */}
          <div className="space-y-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#1769FF] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full uppercase tracking-wider text-[10px]">
                {currentVideo.category}
              </span>
              {currentVideo.isPremium && (
                <span className="flex items-center gap-1 text-xs font-bold text-[#1769FF] dark:text-blue-400 bg-[#F5F8FF] dark:bg-slate-800 px-2.5 py-1 rounded-full border border-blue-100 dark:border-slate-700 text-[10px]">
                  <Crown className="w-3.5 h-3.5" />
                  <span>Master 4K HDR</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#111827] dark:text-white leading-tight">
              {currentVideo.title}
            </h1>

            {/* Metrics & Action Buttons Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              
              {/* Views & Date */}
              <div className="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                  <span>{currentVideo.views.toLocaleString()} views</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                  <span>{new Date(currentVideo.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                
                {/* Like Button */}
                <button
                  id="video-like-btn"
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isLiked
                      ? 'bg-[#1769FF] text-white shadow-sm'
                      : 'bg-[#F5F8FF] dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{likeCount.toLocaleString()}</span>
                </button>

                {/* Bookmark / Favorite Button */}
                <button
                  id="video-favorite-btn"
                  onClick={() => toggleFavorite(currentVideo.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    bookmarked
                      ? 'bg-[#1769FF] text-white shadow-sm'
                      : 'bg-[#F5F8FF] dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
                  <span>{bookmarked ? 'Saved' : 'Save'}</span>
                </button>

                {/* Share Button */}
                <button
                  id="video-share-btn"
                  onClick={() => setShareOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F5F8FF] dark:bg-slate-800 text-gray-700 dark:text-slate-200 text-xs font-bold hover:bg-blue-50 dark:hover:bg-slate-700 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>

                {/* Report Button */}
                <button
                  id="video-report-btn"
                  onClick={() => setReportOpen(true)}
                  className="p-2 rounded-xl bg-[#F5F8FF] dark:bg-slate-800 text-gray-400 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Report Content Issue"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>

              </div>
            </div>

            {/* Verified Creator & Copyright Attribution Box */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F5F8FF] dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1769FF] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {currentVideo.contentOwner ? currentVideo.contentOwner[0] : 'P'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#111827] dark:text-white">{currentVideo.contentOwner || 'Porn Gabar Studios'}</span>
                    <ShieldCheck className="w-4 h-4 text-[#1769FF] dark:text-blue-400" />
                  </div>
                  <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">
                    Verified Digital Content Creator • {currentVideo.licenseInfo || 'Standard Broadcast License'}
                  </span>
                </div>
              </div>
            </div>

            {/* Expandable Rich Description */}
            <div className="pt-2 text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
              <p className={descriptionExpanded ? '' : 'line-clamp-2'}>
                {currentVideo.description}
              </p>
              {currentVideo.tags && currentVideo.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {currentVideo.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => onNavigate('search', { query: tag })}
                      className="text-[11px] font-medium text-[#1769FF] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-2 py-0.5 rounded-md transition-colors"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                className="mt-2 text-xs font-bold text-[#1769FF] dark:text-blue-400 flex items-center gap-1 hover:underline"
              >
                <span>{descriptionExpanded ? 'Show Less' : 'Read Full Synopsis'}</span>
                {descriptionExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

          </div>

          {/* 3. Community Comments Section */}
          <div id="comments-section" className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#1769FF] dark:text-blue-400" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Discussion ({comments.length})</h3>
              </div>
              <span className="text-xs text-gray-400 dark:text-slate-400">Respectful community discourse</span>
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="space-y-3">
              {!user && (
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Your Display Name (Guest)"
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value)}
                    className="w-full max-w-xs bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1769FF]"
                  />
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="text-xs font-semibold text-[#1769FF] dark:text-blue-400 hover:underline"
                  >
                    Or Sign In
                  </button>
                </div>
              )}

              <div className="relative">
                <textarea
                  required
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Join the discussion... Share your review or cinematic thoughts."
                  className="w-full bg-[#F5F8FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl p-3 text-xs text-gray-800 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1769FF]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingComment || !commentText.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1769FF] text-white text-xs font-bold hover:bg-[#0B3DCC] disabled:opacity-50 transition-all shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingComment ? 'Posting...' : 'Post Comment'}</span>
                </button>
              </div>
            </form>

            {/* Comments Stream */}
            <div className="space-y-4 pt-2">
              {comments.length === 0 ? (
                <p className="text-center py-6 text-xs text-gray-400 dark:text-slate-500">
                  No comments yet. Be the first to share your thoughts on this production!
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F5F8FF]/60 dark:bg-slate-800/60 border border-blue-50 dark:border-slate-800">
                    <img
                      src={c.userAvatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80`}
                      alt={c.userName}
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-blue-200 dark:border-slate-700"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{c.userName}</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500">
                          {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

        {/* Right Sidebar Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Sidebar Advertisement Unit */}
          <AdBanner placement="sidebar" />

          {/* Related Videos Rail */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#1769FF] dark:text-blue-400" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recommended for You</h3>
            </div>

            <div className="space-y-3.5">
              {relatedVideos.slice(0, 5).map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => {
                    onSelectVideo(rel);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex gap-3 group cursor-pointer p-2 rounded-2xl hover:bg-[#F5F8FF] dark:hover:bg-slate-800 transition-all"
                >
                  <div className="relative w-28 aspect-video rounded-xl overflow-hidden bg-gray-900 shrink-0">
                    <img
                      src={rel.thumbnailUrl}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[9px] font-semibold px-1 rounded">
                      {rel.durationFormatted}
                    </span>
                  </div>
                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100 group-hover:text-[#1769FF] dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
                      {rel.title}
                    </h4>
                    <div className="text-[10px] text-gray-400 dark:text-slate-400 flex items-center justify-between">
                      <span className="truncate">{rel.category}</span>
                      <span>{rel.views >= 1000 ? (rel.views / 1000).toFixed(0) + 'k' : rel.views} views</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Share Modal */}
      <ShareModal
        video={currentVideo}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />

      {/* Report Modal */}
      <ReportModal
        video={currentVideo}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
      />

    </div>
  );
};
