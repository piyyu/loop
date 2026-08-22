"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePlayerStore } from "@/stores/player-store";
import { useRoomStore } from "@/stores/room-store";
import {
  registerAudioElement,
  unregisterAudioElement,
} from "@/lib/audio-registry";
import { getAudioFile, createBlobUrl } from "@/utils/storage";

/**
 * Audio player hook — bridges the HTML5 Audio element with the player store.
 * Handles stream URL resolution, playback, and MediaSession API.
 */
export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    playbackSpeed,
    progress,
    setProgress,
    setDuration,
    next,
    setLoading,
    setError,
    seek,
    seekTo,
  } = usePlayerStore();

  const lastSongIdRef = useRef<string | null>(null);
  const seekingRef = useRef(false);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
      registerAudioElement(audioRef.current);
    }

    const audio = audioRef.current;

    const onTimeUpdate = () => {
      if (!seekingRef.current) {
        setProgress(audio.currentTime);
      }
    };

    const onDurationChange = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      // In a listen-together room, song advance is a shared state write
      if (useRoomStore.getState().isInRoom()) {
        void useRoomStore.getState().sendAction({ type: "skip" });
        return;
      }
      next();
    };

    const onError = () => {
      setError("Playback error. Trying next track...");
      setTimeout(() => next(), 2000);
    };

    const onLoadStart = () => setLoading(true);
    const onCanPlay = () => setLoading(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("loadstart", onLoadStart);
    audio.addEventListener("canplay", onCanPlay);

    return () => {
      unregisterAudioElement(audio);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("loadstart", onLoadStart);
      audio.removeEventListener("canplay", onCanPlay);
    };
  }, [next, setDuration, setError, setLoading, setProgress]);

  // Load song when currentSong changes
  useEffect(() => {
    if (!currentSong || !audioRef.current) return;
    if (lastSongIdRef.current === currentSong.id) return;

    lastSongIdRef.current = currentSong.id;
    const audio = audioRef.current;

    const loadSong = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check for downloaded version first
        const downloaded = await getAudioFile(currentSong.id);
        if (downloaded) {
          const blobUrl = createBlobUrl(
            downloaded.data,
            downloaded.mimeType
          );
          audio.src = blobUrl;
          audio.load();
          if (isPlaying) await audio.play();
          setLoading(false);
          return;
        }

        // Use stream URL if available on the song
        if (currentSong.streamUrl) {
          audio.src = currentSong.streamUrl;
          audio.load();
          if (isPlaying) await audio.play();
          setLoading(false);
          return;
        }

        // Resolve stream URL through the app's own search API (server-side provider)
        const searchRes = await fetch(
          `/api/music/search?q=${encodeURIComponent(`${currentSong.title} ${currentSong.artist}`)}`
        );

        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const results: Array<{ id: string; streamUrl?: string }> =
            searchData.songs || [];
          const match = results.find((s) => s.streamUrl);

          if (match?.streamUrl) {
            audio.src = match.streamUrl;
            audio.load();
            if (isPlaying) await audio.play();
            setLoading(false);
            return;
          }
        }

        // If search didn't yield a streamUrl, try the stream endpoint directly
        const streamRes = await fetch(
          `/api/music/stream?id=${encodeURIComponent(currentSong.id)}&provider=jiosaavn`
        );

        if (streamRes.ok) {
          const streamData = await streamRes.json();
          if (streamData.streamUrl) {
            audio.src = streamData.streamUrl;
            audio.load();
            if (isPlaying) await audio.play();
            setLoading(false);
            return;
          }
        }

        setError(`Could not find "${currentSong.title}" from provider`);

        setLoading(false);
      } catch (err) {
        console.error("Error loading song:", err);
        setError("Failed to load song");
        setLoading(false);
      }
    };

    loadSong();
  }, [currentSong, isPlaying, setError, setLoading]);

  // Play/Pause
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;

    if (isPlaying) {
      audioRef.current.play().catch(() => {
        // Autoplay blocked — user gesture needed
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSong]);

  // Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Playback speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Listen for external seek requests
  useEffect(() => {
    if (seekTo !== null && audioRef.current) {
      seekingRef.current = true;
      audioRef.current.currentTime = seekTo;
      seek(seekTo);
      usePlayerStore.setState({ seekTo: null });
      seekingRef.current = false;
    }
  }, [seekTo, seek]);

  // Seek handler
  const handleSeek = useCallback(
    (time: number) => {
      if (audioRef.current) {
        seekingRef.current = true;
        audioRef.current.currentTime = time;
        seek(time);
        seekingRef.current = false;
      }
    },
    [seek]
  );

  // MediaSession API for lock screen controls
  useEffect(() => {
    if (!("mediaSession" in navigator) || !currentSong) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist,
      album: currentSong.album || "",
      artwork: currentSong.albumArt
        ? [{ src: currentSong.albumArt, sizes: "512x512", type: "image/jpeg" }]
        : [],
    });

    navigator.mediaSession.setActionHandler("play", () =>
      usePlayerStore.getState().play()
    );
    navigator.mediaSession.setActionHandler("pause", () =>
      usePlayerStore.getState().pause()
    );
    navigator.mediaSession.setActionHandler("previoustrack", () =>
      usePlayerStore.getState().previous()
    );
    navigator.mediaSession.setActionHandler("nexttrack", () =>
      usePlayerStore.getState().next()
    );
  }, [currentSong]);

  return { handleSeek, audioRef };
}
