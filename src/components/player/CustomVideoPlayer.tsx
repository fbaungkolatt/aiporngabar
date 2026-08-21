import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Crown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { Video, Advertisement } from '../../types/index.ts';

interface CustomVideoPlayerProps {
  video: Video;
  onEnded?: () => void;
  initialProgress?: number;
}

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  video,
  onEnded,
  initialProgress = 0,
}) => {
  const { recordHistory } = useAuth();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(video.duration || 0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [bufferedEnd, setBufferedEnd] = useState<number>(0);
  const [quality, setQuality] = useState<string>('1080p');

  // Ad Pre-roll state
  const [prerollAd, setPrerollAd] = useState<Advertisement | null>(null);
  const [adTimeRemaining, setAdTimeRemaining] = useState<number>(6);
  const [adSkippable, setAdSkippable] = useState<boolean>(false);
  const [isAdPlaying, setIsAdPlaying] = useState<boolean>(false);

  const hideControlsTimer = useRef<any>(null);

  // Format seconds to mm:ss
  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Fetch pre-roll advertisement
  useEffect(() => {
    if (video.isPremium) {
      // Premium subscribers get zero pre-roll ads
      setIsAdPlaying(false);
      return;
    }

    fetch('/api/ads/active?placement=before_video')
      .then((res) => res.json())
      .then((ads: Advertisement[]) => {
        if (ads && ads.length > 0) {
          const ad = ads[0];
          setPrerollAd(ad);
          setIsAdPlaying(true);
          setAdTimeRemaining(5);
          fetch(`/api/ads/${ad.id}/impression`, { method: 'POST' }).catch(() => {});
        }
      })
      .catch(() => {});
  }, [video.id, video.isPremium]);

  // Pre-roll ad countdown
  useEffect(() => {
    if (!isAdPlaying) return;

    const timer = setInterval(() => {
      setAdTimeRemaining((prev) => {
        if (prev <= 1) {
          setAdSkippable(true);
          clearInterval(timer);
          return 0;
        }
        if (prev <= 3) {
          setAdSkippable(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAdPlaying]);

  const skipAd = () => {
    setIsAdPlaying(false);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleAdClick = () => {
    if (prerollAd) {
      fetch(`/api/ads/${prerollAd.id}/click`, { method: 'POST' }).catch(() => {});
      window.open(prerollAd.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Sync Watch History progress periodically
  const lastRecordedTime = useRef<number>(0);
  const syncProgress = useCallback(
    (time: number, totalDur: number) => {
      if (Math.abs(time - lastRecordedTime.current) > 4) {
        lastRecordedTime.current = time;
        recordHistory(video.id, time, totalDur || video.duration);
      }
    },
    [video.id, video.duration, recordHistory]
  );

  // Resume playback from initial progress if provided
  useEffect(() => {
    if (videoRef.current && initialProgress > 0 && initialProgress < video.duration - 5) {
      videoRef.current.currentTime = initialProgress;
      setCurrentTime(initialProgress);
    }
  }, [initialProgress, video.duration]);

  // Play / Pause toggle
  const togglePlay = () => {
    if (isAdPlaying) return;
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      syncProgress(videoRef.current.currentTime, videoRef.current.duration);
    }
  };

  // Video time update handler
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    const dur = videoRef.current.duration || video.duration;
    setCurrentTime(curr);
    setDuration(dur);

    // Buffer progress
    if (videoRef.current.buffered.length > 0) {
      setBufferedEnd(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
    }

    syncProgress(curr, dur);
  };

  // Seek bar handler
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    setCurrentTime(target);
    if (videoRef.current) {
      videoRef.current.currentTime = target;
    }
  };

  // Volume handler
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  // Playback speed
  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSettings(false);
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Auto-hide controls
  const handleMouseMove = () => {
    setControlsVisible(true);
    clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
        setShowSettings(false);
      }
    }, 3000);
  };

  return (
    <div
      id="custom-video-player-container"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setControlsVisible(false)}
      className="relative w-full aspect-video bg-black rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl group select-none"
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        poster={video.thumbnailUrl}
        playsInline
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setIsPlaying(false);
          syncProgress(duration, duration);
          if (onEnded) onEnded();
        }}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Pre-Roll Advertisement Overlay */}
      {isAdPlaying && prerollAd && (
        <div id="preroll-ad-overlay" className="absolute inset-0 z-30 bg-black/90 flex flex-col justify-between p-6 animate-fade-in">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold bg-[#1769FF] px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Ad • 1 of 1</span>
              </span>
              <span className="text-xs text-gray-300 font-medium">Video will begin shortly</span>
            </div>
            {adSkippable ? (
              <button
                id="skip-ad-btn"
                onClick={skipAd}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-gray-900 text-xs font-bold hover:bg-gray-100 shadow-lg transition-all"
              >
                <span>Skip Advertisement</span>
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <div className="px-3.5 py-1.5 rounded-xl bg-white/10 text-xs font-semibold text-white/90 border border-white/20">
                Skip in {adTimeRemaining}s
              </div>
            )}
          </div>

          <div
            onClick={handleAdClick}
            className="max-w-lg mx-auto bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-white cursor-pointer hover:bg-white/15 transition-all text-center space-y-2"
          >
            <img
              src={prerollAd.bannerImage}
              alt={prerollAd.name}
              className="w-full h-40 object-cover rounded-xl mb-3 shadow"
            />
            <h4 className="text-base font-bold text-white">{prerollAd.title || prerollAd.name}</h4>
            <p className="text-xs text-blue-100">{prerollAd.tagline || 'Click to visit official sponsor website'}</p>
            <div className="pt-2 flex items-center justify-center gap-1 text-xs font-bold text-[#1769FF] bg-white py-2 rounded-xl">
              <span>Visit Partner</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="text-center text-[11px] text-gray-400">
            Porn Gabar Originals subscribers enjoy 100% ad-free viewing.
          </div>
        </div>
      )}

      {/* Center Big Play Button (When Paused & Not Ad) */}
      {!isPlaying && !isAdPlaying && (
        <button
          id="center-play-button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-10 bg-black/30 backdrop-blur-[2px] transition-all"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1769FF]/95 text-white flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform">
            <Play className="w-8 h-8 fill-current ml-1" />
          </div>
        </button>
      )}

      {/* Video Controls Bar */}
      {!isAdPlaying && (
        <div
          id="player-controls-bar"
          className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 transition-opacity duration-300 ${
            controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Progress / Seek Bar */}
          <div className="relative group/seek mb-3 flex items-center">
            {/* Background Track */}
            <div className="absolute inset-x-0 h-1.5 bg-white/20 rounded-full overflow-hidden">
              {/* Buffer Bar */}
              <div
                className="h-full bg-white/40 rounded-full"
                style={{ width: `${(bufferedEnd / Math.max(1, duration)) * 100}%` }}
              />
            </div>
            {/* Played Bar */}
            <div
              className="absolute left-0 h-1.5 bg-[#1769FF] rounded-full pointer-events-none"
              style={{ width: `${(currentTime / Math.max(1, duration)) * 100}%` }}
            />
            {/* Input Range Slider */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="relative w-full h-4 opacity-0 cursor-pointer z-10"
              aria-label="Seek video"
            />
          </div>

          {/* Controls Lower Row */}
          <div className="flex items-center justify-between text-white text-xs">
            
            {/* Left: Play/Pause, Volume, Time */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                id="control-play-pause"
                onClick={togglePlay}
                className="p-1.5 text-white hover:text-blue-400 transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              <button
                id="control-rewind-10"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                  }
                }}
                className="p-1 text-gray-300 hover:text-white transition-colors"
                title="Rewind 10 seconds"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Volume Slider */}
              <div className="flex items-center gap-1.5 group/vol">
                <button onClick={toggleMute} className="p-1 text-gray-300 hover:text-white transition-colors">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-14 sm:w-18 h-1 bg-white/30 rounded-lg accent-[#1769FF] cursor-pointer"
                  aria-label="Volume slider"
                />
              </div>

              {/* Time Display */}
              <div className="font-mono text-[11px] text-gray-300">
                <span>{formatTime(currentTime)}</span>
                <span className="mx-1 text-gray-500">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right: Quality, Speed, Settings, Fullscreen */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 relative">
              
              {/* Premium Badge if video is premium */}
              {video.isPremium && (
                <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  <Crown className="w-3 h-3" />
                  <span>4K HDR</span>
                </span>
              )}

              {/* Speed / Quality Settings Popup Toggle */}
              <div className="relative">
                <button
                  id="control-settings-toggle"
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1 text-gray-300 hover:text-white transition-colors"
                  title="Playback Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {showSettings && (
                  <div className="absolute right-0 bottom-8 z-30 w-48 bg-gray-900/95 backdrop-blur-md rounded-xl p-3 border border-white/10 shadow-2xl text-xs space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Playback Speed
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                          <button
                            key={s}
                            onClick={() => changeSpeed(s)}
                            className={`py-1 rounded text-center transition-colors ${
                              playbackSpeed === s ? 'bg-[#1769FF] font-bold text-white' : 'text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            {s}x
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Stream Quality
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {['1080p', '720p', '480p'].map((q) => (
                          <button
                            key={q}
                            onClick={() => {
                              setQuality(q);
                              setShowSettings(false);
                            }}
                            className={`py-1 rounded text-center transition-colors ${
                              quality === q ? 'bg-[#1769FF] font-bold text-white' : 'text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fullscreen Button */}
              <button
                id="control-fullscreen-btn"
                onClick={toggleFullscreen}
                className="p-1 text-gray-300 hover:text-white transition-colors"
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
