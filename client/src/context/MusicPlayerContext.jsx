import { createContext, useEffect, useRef, useState, useCallback } from "react";
import { searchMusic, recordRecentlyPlayed, getMusicNextTracks } from "../api/musicApi";

export const MusicPlayerContext = createContext();

// Every Nth track for a free (non-premium) user triggers a simulated ad
// break before playback starts. This is a mock — there's no real ad
// network wired in — but the gating logic (who sees ads, when, and how
// premium suppresses it) is fully real.
const FREE_AD_INTERVAL = 3;
const AD_DURATION_SECONDS = 12;

const AD_CREATIVES = [
    { brand: "VEXA Premium", tagline: "Skip every ad, forever.", house: true },
    { brand: "Northwind Coffee Co.", tagline: "Your next favorite brew is one click away." },
    { brand: "Pixel Trail Sneakers", tagline: "Built for your next run." },
    { brand: "Bloom & Co.", tagline: "Fresh flowers, delivered weekly." },
];

const VOLUME_STORAGE_KEY = "vexa_music_volume";

let youtubeApiPromise = null;

const loadYoutubeApi = () => {
    if (window.YT?.Player) return Promise.resolve(window.YT);

    if (!youtubeApiPromise) {
        youtubeApiPromise = new Promise((resolve) => {
            const tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";
            document.body.appendChild(tag);
            window.onYouTubeIframeAPIReady = () => resolve(window.YT);
        });
    }

    return youtubeApiPromise;
};

function MusicPlayerProvider({ children }) {

    // Playback engine: YouTube IFrame Player for YouTube-sourced tracks.
    // A native <audio> element is also kept around generically (chosen
    // by track.source) in case a non-YouTube stream URL is ever set.
    const audioRef = useRef(null);
    const ytPlayerRef = useRef(null);
    const ytReadyRef = useRef(false);

    const [currentTrack, setCurrentTrack] = useState(null);
    const [queue, setQueue] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [autoNext, setAutoNext] = useState(true);
    const [shuffle, setShuffle] = useState(false);
    const [repeat, setRepeat] = useState("off"); // "off" | "all" | "one"
    const [volume, setVolumeState] = useState(() => {
        const saved = localStorage.getItem(VOLUME_STORAGE_KEY);
        return saved !== null ? parseFloat(saved) : 0.8;
    });
    const [queueLoading, setQueueLoading] = useState(false);

    // ================= AD BREAK STATE =================
    const [adActive, setAdActive] = useState(false);
    const [adSecondsLeft, setAdSecondsLeft] = useState(AD_DURATION_SECONDS);
    const [currentAd, setCurrentAd] = useState(AD_CREATIVES[0]);
    const playsSinceAdRef = useRef(0);
    const pendingTrackRef = useRef(null);
    const adIntervalRef = useRef(null);
    const progressIntervalRef = useRef(null);

    // "Latest ref" pattern — long-lived event listeners/intervals must
    // never read stale closures (that exact bug broke auto-next once
    // before). Kept in sync every render.
    const currentTrackRef = useRef(null);
    const currentSourceRef = useRef("list"); // "playlist" | "list" — see playTrack
    const queueRef = useRef([]);
    const autoNextRef = useRef(true);
    const repeatRef = useRef("off");
    const shuffleRef = useRef(false);

    useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
    useEffect(() => { queueRef.current = queue; }, [queue]);
    useEffect(() => { autoNextRef.current = autoNext; }, [autoNext]);
    useEffect(() => { repeatRef.current = repeat; }, [repeat]);
    useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);

    // ================= INIT NATIVE AUDIO (once) =================
    useEffect(() => {

        const audio = new Audio();
        audio.volume = volume;
        audioRef.current = audio;

        const handlePlay = () => { if (currentTrackRef.current?.source !== "youtube") setIsPlaying(true); };
        const handlePause = () => { if (currentTrackRef.current?.source !== "youtube") setIsPlaying(false); };
        const handleEnded = () => {
            if (currentTrackRef.current?.source === "youtube") return;
            handleTrackEnded();
        };

        audio.addEventListener("play", handlePlay);
        audio.addEventListener("pause", handlePause);
        audio.addEventListener("ended", handleEnded);

        return () => {
            audio.removeEventListener("play", handlePlay);
            audio.removeEventListener("pause", handlePause);
            audio.removeEventListener("ended", handleEnded);
            audio.pause();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ================= INIT YOUTUBE PLAYER (once) =================
    useEffect(() => {

        loadYoutubeApi().then((YT) => {

            ytPlayerRef.current = new YT.Player("vexa-music-youtube-player", {
                height: "0",
                width: "0",
                playerVars: { playsinline: 1 },
                events: {
                    onReady: () => {
                        ytReadyRef.current = true;
                        ytPlayerRef.current.setVolume(Math.round(volume * 100));
                    },
                    onStateChange: (event) => {
                        if (currentTrackRef.current?.source !== "youtube") return;

                        if (event.data === YT.PlayerState.ENDED) {
                            handleTrackEnded();
                        }

                        setIsPlaying(event.data === YT.PlayerState.PLAYING);
                    },
                },
            });

        });

        return () => {
            clearInterval(adIntervalRef.current);
            clearInterval(progressIntervalRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ================= PROGRESS POLLING (works for either engine) =================
    useEffect(() => {

        if (!isPlaying) {
            clearInterval(progressIntervalRef.current);
            return;
        }

        progressIntervalRef.current = setInterval(() => {

            const track = currentTrackRef.current;
            if (!track) return;

            if (track.source === "youtube") {
                const player = ytPlayerRef.current;
                if (player?.getCurrentTime) {
                    setProgress(player.getCurrentTime() || 0);
                    setDuration(player.getDuration() || 0);
                }
            } else {
                const audio = audioRef.current;
                if (audio) {
                    setProgress(audio.currentTime || 0);
                    setDuration(audio.duration || 0);
                }
            }

        }, 500);

        return () => clearInterval(progressIntervalRef.current);

    }, [isPlaying]);

    // ================= VOLUME =================
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
        if (ytReadyRef.current && ytPlayerRef.current?.setVolume) {
            ytPlayerRef.current.setVolume(Math.round(volume * 100));
        }
        localStorage.setItem(VOLUME_STORAGE_KEY, String(volume));
    }, [volume]);

    // ================= ACTUALLY START A TRACK (after any ad) =================
    const startTrack = useCallback((track) => {

        if (track.source === "youtube") {
            audioRef.current?.pause();
            if (ytReadyRef.current && ytPlayerRef.current?.loadVideoById) {
                ytPlayerRef.current.loadVideoById(track.youtubeId);
            }
        } else {
            ytPlayerRef.current?.stopVideo?.();
            const audio = audioRef.current;
            if (audio) {
                audio.src = track.streamUrl;
                audio.play().catch((err) => console.log("Playback failed:", err));
            }
        }

        setCurrentTrack(track);
        setProgress(0);
        setDuration(track.duration || 0);
        setIsPlaying(true);
        playsSinceAdRef.current += 1;

        recordRecentlyPlayed(track._id).catch(() => {});

    }, []);

    const pickNextIndex = (currentQueue, currentIdx) => {
        if (shuffleRef.current && currentQueue.length > 1) {
            let next;
            do {
                next = Math.floor(Math.random() * currentQueue.length);
            } while (next === currentIdx);
            return next;
        }
        return currentIdx + 1;
    };

    const skipNextRef = useRef(() => {});
    skipNextRef.current = async () => {

        const track = currentTrackRef.current;
        const currentQueue = queueRef.current;

        if (!track) return;

        // Playlists are a deliberately sequenced listen — keep marching
        // through them in order, same as before.
        if (currentSourceRef.current === "playlist") {

            const currentIdx = currentQueue.findIndex((t) => t._id === track._id);
            const nextIdx = pickNextIndex(currentQueue, currentIdx);
            const next = currentQueue[nextIdx];

            if (next) {
                startTrack(next);
                return;
            }

            if (repeatRef.current === "all" && currentQueue.length > 0) {
                startTrack(currentQueue[0]);
                return;
            }

            setIsPlaying(false);
            return;
        }

        // Everything else (search results, favorites, recently played,
        // an artist's tracks) — blend mode. Play forward through
        // whatever's already sitting in the queue first (the AI curator
        // already ordered a batch of up to 8 last time); only ask it
        // for a fresh continuation once we actually reach the end.
        const currentIdx = currentQueue.findIndex((t) => t._id === track._id);
        const alreadyQueuedNext = currentQueue[currentIdx + 1];

        if (alreadyQueuedNext) {
            startTrack(alreadyQueuedNext);
            return;
        }

        // Queue exhausted — ask the AI curator for a related
        // continuation, excluding everything already played this
        // session so a same-artist search can't loop back to a track
        // that already played.
        const playedIds = currentQueue.map((t) => t._id);

        try {

            setQueueLoading(true);

            const res = await getMusicNextTracks(track._id, playedIds);
            const aiTracks = res.data?.tracks || [];

            if (aiTracks.length > 0) {
                const extendedQueue = [...currentQueue, ...aiTracks];
                queueRef.current = extendedQueue;
                setQueue(extendedQueue);
                startTrack(aiTracks[0]);
                return;
            }

        } catch (error) {
            console.log("AI blend next-up failed, falling back to artist search:", error);
        } finally {
            setQueueLoading(false);
        }

        // AI blending unavailable or came back empty — fall back to a
        // plain same-artist search, same as the previous behavior.
        try {
            setQueueLoading(true);

            const res = await searchMusic(track.artist || track.title);
            const more = (res.data?.tracks || []).filter((t) => !playedIds.includes(t._id));

            if (more.length > 0) {
                const extendedQueue = [...currentQueue, ...more];
                queueRef.current = extendedQueue;
                setQueue(extendedQueue);
                startTrack(more[0]);
            } else {
                setIsPlaying(false);
            }

        } catch (error) {
            console.log(error);
            setIsPlaying(false);
        } finally {
            setQueueLoading(false);
        }

    };

    const handleTrackEnded = () => {
        if (repeatRef.current === "one") {
            startTrack(currentTrackRef.current);
        } else if (autoNextRef.current) {
            skipNextRef.current();
        } else {
            setIsPlaying(false);
        }
    };

    const skipNext = useCallback(() => {
        skipNextRef.current();
    }, []);

    const skipPrevious = useCallback(() => {

        const track = currentTrackRef.current;
        const currentQueue = queueRef.current;

        if (!track) return;

        const getCurrentTime = () =>
            track.source === "youtube"
                ? ytPlayerRef.current?.getCurrentTime?.() || 0
                : audioRef.current?.currentTime || 0;

        // Spotify-style: if more than 3s in, restart the current track
        // instead of actually going back.
        if (getCurrentTime() > 3) {
            if (track.source === "youtube") {
                ytPlayerRef.current?.seekTo?.(0, true);
            } else if (audioRef.current) {
                audioRef.current.currentTime = 0;
            }
            return;
        }

        const currentIdx = currentQueue.findIndex((t) => t._id === track._id);
        const prev = currentQueue[currentIdx - 1];

        if (prev) {
            startTrack(prev);
        } else if (track.source === "youtube") {
            ytPlayerRef.current?.seekTo?.(0, true);
        } else if (audioRef.current) {
            audioRef.current.currentTime = 0;
        }

    }, [startTrack]);

    // ================= LOCK-SCREEN / OS MEDIA CONTROLS =================
    useEffect(() => {

        if (!("mediaSession" in navigator) || !currentTrack) return;

        navigator.mediaSession.metadata = new window.MediaMetadata({
            title: currentTrack.title,
            artist: currentTrack.artist,
            album: currentTrack.album || "VEXA Music",
            artwork: currentTrack.cover
                ? [{ src: currentTrack.cover, sizes: "512x512", type: "image/jpeg" }]
                : [],
        });

        navigator.mediaSession.setActionHandler("play", () => togglePlayInternal(true));
        navigator.mediaSession.setActionHandler("pause", () => togglePlayInternal(false));
        navigator.mediaSession.setActionHandler("previoustrack", () => skipPrevious());
        navigator.mediaSession.setActionHandler("nexttrack", () => skipNextRef.current());
        navigator.mediaSession.setActionHandler("stop", () => closePlayer());

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTrack, skipPrevious]);

    useEffect(() => {
        if ("mediaSession" in navigator) {
            navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
        }
    }, [isPlaying]);

    const togglePlayInternal = (shouldPlay) => {
        const track = currentTrackRef.current;
        if (!track) return;

        if (track.source === "youtube") {
            if (shouldPlay) ytPlayerRef.current?.playVideo?.();
            else ytPlayerRef.current?.pauseVideo?.();
        } else if (audioRef.current) {
            if (shouldPlay) audioRef.current.play().catch(() => {});
            else audioRef.current.pause();
        }
    };

    // ================= AD BREAK =================
    const runAdBreak = useCallback((track) => {

        pendingTrackRef.current = track;
        setCurrentAd(AD_CREATIVES[Math.floor(Math.random() * AD_CREATIVES.length)]);
        setAdActive(true);
        setAdSecondsLeft(AD_DURATION_SECONDS);

        clearInterval(adIntervalRef.current);
        adIntervalRef.current = setInterval(() => {
            setAdSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(adIntervalRef.current);
                    setAdActive(false);
                    playsSinceAdRef.current = 0;
                    if (pendingTrackRef.current) {
                        startTrack(pendingTrackRef.current);
                        pendingTrackRef.current = null;
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

    }, [startTrack]);

    // ================= PUBLIC: PLAY A TRACK =================
    // source: "playlist" preserves the queue's exact order on auto-next
    // (a playlist is a deliberately sequenced listen). Anything else —
    // search results, favorites, recently played, an artist's tracks —
    // defaults to AI-blended continuation instead of just marching
    // through whatever order that list happened to come back in.
    const playTrack = useCallback((track, trackQueue = [], isPremium = false, source = "list") => {

        if (trackQueue.length) setQueue(trackQueue);
        currentSourceRef.current = source;

        if (!isPremium && playsSinceAdRef.current >= FREE_AD_INTERVAL) {
            runAdBreak(track);
            return;
        }

        startTrack(track);

    }, [runAdBreak, startTrack]);

    const togglePlay = useCallback(() => {
        togglePlayInternal(!isPlaying);
    }, [isPlaying]);

    const seekTo = useCallback((seconds) => {
        const track = currentTrackRef.current;
        if (!track) return;

        if (track.source === "youtube") {
            ytPlayerRef.current?.seekTo?.(seconds, true);
        } else if (audioRef.current) {
            audioRef.current.currentTime = seconds;
        }

        setProgress(seconds);
    }, []);

    const closePlayer = useCallback(() => {
        audioRef.current?.pause();
        ytPlayerRef.current?.stopVideo?.();
        setCurrentTrack(null);
        setIsPlaying(false);
        setAdActive(false);
        clearInterval(adIntervalRef.current);
    }, []);

    const toggleAutoNext = useCallback(() => setAutoNext((prev) => !prev), []);
    const toggleShuffle = useCallback(() => setShuffle((prev) => !prev), []);
    const cycleRepeat = useCallback(() => {
        setRepeat((prev) => (prev === "off" ? "all" : prev === "all" ? "one" : "off"));
    }, []);
    const setVolume = useCallback((v) => setVolumeState(v), []);

    return (
        <MusicPlayerContext.Provider
            value={{
                currentTrack,
                queue,
                isPlaying,
                progress,
                duration,
                autoNext,
                queueLoading,
                shuffle,
                repeat,
                volume,
                adActive,
                adSecondsLeft,
                adDuration: AD_DURATION_SECONDS,
                currentAd,
                playTrack,
                togglePlay,
                skipNext,
                skipPrevious,
                seekTo,
                closePlayer,
                toggleAutoNext,
                toggleShuffle,
                cycleRepeat,
                setVolume,
            }}
        >

            {children}

            {/* Hidden YouTube player — used for YouTube-sourced tracks.
                Kept at 1x1px rather than 0x0: Chrome on Android treats a
                genuinely zero-sized iframe as fully invisible content and
                is more aggressive about suspending it once the tab is
                backgrounded, which can silently stop playback. */}
            <div style={{ position: "fixed", bottom: 0, left: 0, width: 1, height: 1, overflow: "hidden", opacity: 0.01, pointerEvents: "none" }}>
                <div id="vexa-music-youtube-player"></div>
            </div>

        </MusicPlayerContext.Provider>
    );
}

export default MusicPlayerProvider;
