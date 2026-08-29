import { useEffect, useRef, useState } from "react";
import { FaTimes, FaPlay, FaPause, FaCut, FaSpinner, FaDownload, FaShareAlt } from "react-icons/fa";

const MAX_CLIP_SECONDS = 30;
let lamejsPromise = null;

const loadLamejs = () => {
    if (window.lamejs) return Promise.resolve(window.lamejs);

    if (!lamejsPromise) {
        lamejsPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/lamejs@1.2.0/lame.min.js";
            script.onload = () => resolve(window.lamejs);
            script.onerror = () => reject(new Error("Couldn't load the MP3 encoder"));
            document.body.appendChild(script);
        });
    }

    return lamejsPromise;
};

// Converts a Float32 PCM channel to Int16 PCM (what lamejs expects).
const floatTo16BitPCM = (floatSamples) => {
    const out = new Int16Array(floatSamples.length);
    for (let i = 0; i < floatSamples.length; i++) {
        const s = Math.max(-1, Math.min(1, floatSamples[i]));
        out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
};

function RingtoneTrimmerModal({ track, onClose }) {

    const canvasRef = useRef(null);
    const audioCtxRef = useRef(null);
    const audioBufferRef = useRef(null);
    const sourceRef = useRef(null);
    const dragTargetRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [duration, setDuration] = useState(0);
    const [start, setStart] = useState(0);
    const [end, setEnd] = useState(0);
    const [previewPlaying, setPreviewPlaying] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportedBlob, setExportedBlob] = useState(null);

    useEffect(() => {
        loadAudio();
        return () => {
            sourceRef.current?.stop?.();
            audioCtxRef.current?.close?.();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        drawWaveform();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [start, end, duration]);

    const loadAudio = async () => {
        try {
            setLoading(true);
            setError("");

            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            audioCtxRef.current = ctx;

            const res = await fetch(track.downloadUrl || track.videoUrl);
            const arrayBuffer = await res.arrayBuffer();
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

            audioBufferRef.current = audioBuffer;
            setDuration(audioBuffer.duration);
            setStart(0);
            setEnd(Math.min(MAX_CLIP_SECONDS, audioBuffer.duration));

        } catch (err) {
            console.log(err);
            setError("Couldn't load this audio file for trimming.");
        } finally {
            setLoading(false);
        }
    };

    const drawWaveform = () => {

        const canvas = canvasRef.current;
        const buffer = audioBufferRef.current;
        if (!canvas || !buffer) return;

        const ctx = canvas.getContext("2d");
        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);

        const data = buffer.getChannelData(0);
        const bucketCount = 200;
        const bucketSize = Math.floor(data.length / bucketCount);

        ctx.fillStyle = "rgba(255,255,255,0.15)";
        for (let i = 0; i < bucketCount; i++) {
            let max = 0;
            for (let j = 0; j < bucketSize; j++) {
                const v = Math.abs(data[i * bucketSize + j] || 0);
                if (v > max) max = v;
            }
            const barHeight = Math.max(2, max * height);
            const x = (i / bucketCount) * width;
            ctx.fillRect(x, (height - barHeight) / 2, width / bucketCount - 1, barHeight);
        }

        // Selected range highlight
        const startX = (start / duration) * width;
        const endX = (end / duration) * width;
        ctx.fillStyle = "rgba(59,130,246,0.18)";
        ctx.fillRect(startX, 0, endX - startX, height);

        ctx.fillStyle = "#3B82F6";
        ctx.fillRect(startX - 1.5, 0, 3, height);
        ctx.fillRect(endX - 1.5, 0, 3, height);

    };

    const handleDragStart = (which) => (e) => {
        e.preventDefault();
        dragTargetRef.current = which;
    };

    const handleDragMove = (e) => {
        if (!dragTargetRef.current || !duration) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const time = ratio * duration;

        if (dragTargetRef.current === "start") {
            setStart(Math.min(time, end - 1));
        } else {
            const maxEnd = Math.min(duration, start + MAX_CLIP_SECONDS);
            setEnd(Math.max(Math.min(time, maxEnd), start + 1));
        }
    };

    const handleDragEnd = () => {
        dragTargetRef.current = null;
    };

    const handlePreview = () => {
        const ctx = audioCtxRef.current;
        const buffer = audioBufferRef.current;
        if (!ctx || !buffer) return;

        sourceRef.current?.stop?.();

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0, start, end - start);
        source.onended = () => setPreviewPlaying(false);
        sourceRef.current = source;
        setPreviewPlaying(true);
    };

    const handleStopPreview = () => {
        sourceRef.current?.stop?.();
        setPreviewPlaying(false);
    };

    const handleExport = async () => {

        const buffer = audioBufferRef.current;
        if (!buffer) return;

        try {
            setExporting(true);
            setError("");

            const lamejs = await loadLamejs();

            const sampleRate = buffer.sampleRate;
            const startSample = Math.floor(start * sampleRate);
            const endSample = Math.floor(end * sampleRate);
            const numChannels = Math.min(buffer.numberOfChannels, 2);

            const left = floatTo16BitPCM(buffer.getChannelData(0).slice(startSample, endSample));
            const right = numChannels > 1
                ? floatTo16BitPCM(buffer.getChannelData(1).slice(startSample, endSample))
                : null;

            const encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, 128);
            const chunks = [];
            const blockSize = 1152;

            for (let i = 0; i < left.length; i += blockSize) {
                const leftChunk = left.subarray(i, i + blockSize);
                const mp3buf = right
                    ? encoder.encodeBuffer(leftChunk, right.subarray(i, i + blockSize))
                    : encoder.encodeBuffer(leftChunk);
                if (mp3buf.length > 0) chunks.push(new Int8Array(mp3buf));
            }

            const finalBuf = encoder.flush();
            if (finalBuf.length > 0) chunks.push(new Int8Array(finalBuf));

            const blob = new Blob(chunks, { type: "audio/mp3" });
            setExportedBlob(blob);

        } catch (err) {
            console.log(err);
            setError("Couldn't export the clip. Try a shorter selection.");
        } finally {
            setExporting(false);
        }

    };

    const filename = `${(track.artist ? `${track.artist} - ${track.title}` : track.title || "vexa-ringtone").replace(/[^\w\- ]/g, "").slice(0, 60)}-ringtone.mp3`;

    const handleDownload = () => {
        if (!exportedBlob) return;
        const url = URL.createObjectURL(exportedBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const handleShare = async () => {
        if (!exportedBlob) return;
        const file = new File([exportedBlob], filename, { type: "audio/mp3" });

        if (navigator.canShare?.({ files: [file] })) {
            try {
                await navigator.share({ files: [file], title: filename });
            } catch (err) {
                console.log(err);
            }
        } else {
            handleDownload();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
        >
            <div
                className="w-full max-w-lg rounded-2xl border p-6 relative animate-fade-up"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >

                <button onClick={onClose} className="absolute top-4 right-4" style={{ color: "var(--color-text-faint)" }}>
                    <FaTimes />
                </button>

                <div className="flex items-center gap-2 mb-1">
                    <FaCut style={{ color: "var(--color-brand)" }} />
                    <h2 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
                        Trim a Ringtone
                    </h2>
                </div>
                <p className="text-xs mb-4 truncate" style={{ color: "var(--color-text-muted)" }}>
                    {track.artist ? `${track.artist} — ${track.title}` : track.title}
                </p>

                {loading ? (
                    <div className="text-center py-10">
                        <FaSpinner className="mx-auto animate-spin mb-2" style={{ color: "var(--color-brand)" }} />
                        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Loading audio...</p>
                    </div>
                ) : error && !duration ? (
                    <p className="text-red-400 text-sm py-6">{error}</p>
                ) : (
                    <>
                        <div className="relative select-none" style={{ touchAction: "none" }}>
                            <canvas
                                ref={canvasRef}
                                width={440}
                                height={100}
                                className="w-full rounded-lg"
                                style={{ backgroundColor: "var(--color-surface-2)" }}
                            />
                            <div
                                onMouseDown={handleDragStart("start")}
                                onTouchStart={handleDragStart("start")}
                                className="absolute top-0 bottom-0 w-3 -ml-1.5 cursor-ew-resize"
                                style={{ left: `${(start / duration) * 100}%` }}
                            />
                            <div
                                onMouseDown={handleDragStart("end")}
                                onTouchStart={handleDragStart("end")}
                                className="absolute top-0 bottom-0 w-3 -ml-1.5 cursor-ew-resize"
                                style={{ left: `${(end / duration) * 100}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-between text-xs mt-2 mb-4" style={{ color: "var(--color-text-faint)" }}>
                            <span>{start.toFixed(1)}s</span>
                            <span>{(end - start).toFixed(1)}s selected (max {MAX_CLIP_SECONDS}s)</span>
                            <span>{end.toFixed(1)}s</span>
                        </div>

                        <div className="flex items-center gap-3 mb-5">
                            <button
                                onClick={previewPlaying ? handleStopPreview : handlePreview}
                                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                                style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text)" }}
                            >
                                {previewPlaying ? <FaPause size={12} /> : <FaPlay size={12} style={{ marginLeft: "1px" }} />}
                            </button>
                            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Preview selection</span>
                        </div>

                        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

                        {!exportedBlob ? (
                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                className="w-full ai-btn py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
                            >
                                {exporting ? <FaSpinner className="animate-spin" /> : <FaCut />}
                                {exporting ? "Encoding MP3..." : "Export MP3 Clip"}
                            </button>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDownload}
                                    className="flex-1 brand-btn py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
                                >
                                    <FaDownload size={12} />
                                    Download MP3
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="flex-1 ai-btn py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
                                >
                                    <FaShareAlt size={12} />
                                    Share / Set as Ringtone
                                </button>
                            </div>
                        )}

                        {exportedBlob && (
                            <p className="text-[11px] mt-3" style={{ color: "var(--color-text-faint)" }}>
                                On Android, "Share" then pick a ringtone-setting app, or open Settings → Sound → Ringtone and choose the downloaded file.
                            </p>
                        )}
                    </>
                )}

            </div>
        </div>
    );
}

export default RingtoneTrimmerModal;
