import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaRobot, FaTimes, FaPaperPlane, FaMicrophone } from "react-icons/fa";
import { sendChatMessage } from "../api/aiApi";
import { searchMusic } from "../api/musicApi";
import { searchVideosAI } from "../api/videoApi";
import { getProfile } from "../services/userService";
import VexaLogo from "./VexaLogo";
import { MusicPlayerContext } from "../context/MusicPlayerContext";
import { InAppBrowserContext } from "../context/InAppBrowserContext";
import { LanguageContext } from "../context/LanguageContext";
import { detectChatIntent } from "../utils/chatIntent";

const SPEECH_LOCALES = {
    en: "en-US",
    ta: "ta-IN",
    hi: "hi-IN",
    ml: "ml-IN",
    te: "te-IN",
};

function ChatbotWidget() {

    const { currentTrack, playTrack } = useContext(MusicPlayerContext);
    const { open: openInAppBrowser } = useContext(InAppBrowserContext);
    const { language } = useContext(LanguageContext);
    const navigate = useNavigate();

    const [open, setOpen] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [listening, setListening] = useState(false);
    const recognitionRef = useRef(null);
    const voiceTextRef = useRef("");
    const handleSendRef = useRef(null);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            text: "Hi! I'm the VEXA AI assistant. Ask me to recommend a video, or ask how any of the AI features work.",
        },
    ]);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef(null);

    const loggedIn = Boolean(localStorage.getItem("token"));

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, open]);

    useEffect(() => {
        if (!loggedIn) return;
        getProfile().then((data) => setIsPremium(Boolean(data.user?.isPremium))).catch(() => {});
    }, [loggedIn]);

    const addAssistantMessage = (text) =>
        setMessages((prev) => [...prev, { role: "assistant", text }]);

    // Close the panel shortly after jumping to a page, so the person
    // actually sees where they landed instead of the chat covering it.
    const closeSoon = () => setTimeout(() => setOpen(false), 900);

    // ================= AUTO-OPEN: songs / videos / links =================
    // Runs for typed AND spoken messages. Returns true if it handled the
    // message (so the normal AI reply is skipped).
    const runIntent = async (intent) => {

        if (intent.type === "link") {
            try {
                const parsed = new URL(intent.url);
                if (parsed.origin === window.location.origin) {
                    addAssistantMessage("Opening that page for you…");
                    navigate(parsed.pathname + parsed.search);
                } else {
                    addAssistantMessage("Opening that link inside VEXA…");
                    openInAppBrowser(intent.url);
                }
                closeSoon();
            } catch {
                addAssistantMessage("That link doesn't look valid — can you check it?");
            }
            return true;
        }

        if (intent.type === "music") {
            addAssistantMessage(`Searching songs for "${intent.query}"…`);
            try {
                const res = await searchMusic(intent.query);
                const tracks = res.data.tracks || [];
                if (!tracks.length) {
                    addAssistantMessage(`I couldn't find any songs for "${intent.query}". Try another name?`);
                    return true;
                }
                playTrack(tracks[0], tracks, isPremium);
                navigate(`/music?q=${encodeURIComponent(intent.query)}`);
                addAssistantMessage(`Playing "${tracks[0].title}" — the full results are on the Music page.`);
                closeSoon();
            } catch (error) {
                console.log(error);
                addAssistantMessage("Couldn't search songs right now. Try again in a moment.");
            }
            return true;
        }

        if (intent.type === "video") {
            addAssistantMessage(`Searching videos for "${intent.query}"…`);
            try {
                const res = await searchVideosAI(intent.query);
                const top = res.data.results?.[0];
                if (top?._id) {
                    navigate(`/video/${top._id}`);
                    addAssistantMessage(`Opening "${top.title}".`);
                } else {
                    navigate(`/search?q=${encodeURIComponent(intent.query)}`);
                    addAssistantMessage(`No exact match — showing search results for "${intent.query}".`);
                }
                closeSoon();
            } catch (error) {
                console.log(error);
                navigate(`/search?q=${encodeURIComponent(intent.query)}`);
                addAssistantMessage(`Showing search results for "${intent.query}".`);
                closeSoon();
            }
            return true;
        }

        return false;
    };

    const handleSend = async (overrideText) => {

        const rawText = typeof overrideText === "string" ? overrideText : message;

        if (!rawText.trim()) return;

        if (!loggedIn) {
            setMessages((prev) => [
                ...prev,
                { role: "user", text: rawText },
                { role: "assistant", text: "Log in first and I can help you find videos and explain features." },
            ]);
            setMessage("");
            return;
        }

        const userText = rawText;
        setMessage("");

        const nextMessages = [...messages, { role: "user", text: userText }];
        setMessages(nextMessages);

        // Songs / videos / links: go straight there, no AI round-trip.
        const handled = await runIntent(detectChatIntent(userText));
        if (handled) return;

        try {

            setSending(true);

            const history = nextMessages
                .slice(-8)
                .map((m) => ({ role: m.role, text: m.text }));

            const data = await sendChatMessage(userText, history);

            setMessages((prev) => [
                ...prev,
                { role: "assistant", text: data.reply },
            ]);

        } catch (error) {

            console.log(error);

            const fallbackText =
                typeof error.response?.data?.message === "string"
                    ? error.response.data.message
                    : "Sorry, something went wrong. Try again in a moment.";

            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text: fallbackText,
                },
            ]);

        } finally {

            setSending(false);

        }

    };

    // Always point at the latest handleSend so the voice callbacks
    // (created once) never use stale messages/state.
    handleSendRef.current = handleSend;

    // ================= VOICE INPUT =================
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map((result) => result[0].transcript)
                .join("");
            voiceTextRef.current = transcript;
            setMessage(transcript);
        };

        recognition.onerror = () => setListening(false);

        // When the mic stops, send whatever was heard — speak, pause, done.
        recognition.onend = () => {
            setListening(false);
            const heard = voiceTextRef.current.trim();
            voiceTextRef.current = "";
            if (heard) handleSendRef.current(heard);
        };

        recognitionRef.current = recognition;
        return () => recognition.abort();
    }, []);

    const handleVoice = () => {
        if (!recognitionRef.current) {
            addAssistantMessage("Voice isn't supported in this browser — try Chrome or Edge.");
            return;
        }
        if (listening) {
            recognitionRef.current.stop();
            return;
        }
        recognitionRef.current.lang = SPEECH_LOCALES[language] || "en-US";
        voiceTextRef.current = "";
        setMessage("");
        setListening(true);
        try {
            recognitionRef.current.start();
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <>

            {/* ================= FLOATING TOGGLE BUTTON ================= */}
            <button
                onClick={() => setOpen(!open)}
                aria-label={open ? "Close AI assistant" : "Open AI assistant"}
                className={`fixed right-4 sm:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 ${
                    currentTrack ? "bottom-24 sm:bottom-28" : "bottom-6"
                }`}
                style={{
                    background: "linear-gradient(135deg, var(--color-ai-from), var(--color-ai-to))",
                    boxShadow: "0 8px 24px -8px rgba(56, 189, 248, 0.6)",
                }}
            >
                {open ? (
                    <FaTimes size={20} color="#06201f" />
                ) : (
                    <FaRobot size={22} color="#06201f" />
                )}

                {!open && (
                    <span
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full animate-ping"
                        style={{ backgroundColor: "var(--color-ai-to)" }}
                    />
                )}
            </button>

            {/* ================= CHAT PANEL ================= */}
            {open && (

                <div
                    className={`fixed right-4 sm:right-6 z-50 w-[360px] max-w-[90vw] rounded-2xl border overflow-hidden flex flex-col animate-chat-in ${
                        currentTrack ? "bottom-44 sm:bottom-48" : "bottom-24"
                    }`}
                    style={{
                        backgroundColor: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                        boxShadow: "0 20px 50px -12px rgba(0,0,0,0.6)",
                        height: "min(480px, 70vh)",
                    }}
                >

                    {/* Header */}
                    <div
                        className="flex items-center gap-3 px-4 py-3 border-b"
                        style={{ borderColor: "var(--color-border)" }}
                    >

                        <VexaLogo size={26} />

                        <div>
                            <p
                                className="text-sm font-semibold"
                                style={{ color: "var(--color-text)" }}
                            >
                                VEXA Assistant
                            </p>
                            <p
                                className="text-xs"
                                style={{ color: "var(--color-text-faint)" }}
                            >
                                {sending ? "Thinking..." : "Online"}
                            </p>
                        </div>

                    </div>

                    {/* Messages */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
                    >

                        {messages.map((m, i) => (

                            <div
                                key={i}
                                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-msg-in`}
                            >

                                <div
                                    className="max-w-[85%] px-3 py-2 rounded-2xl text-sm"
                                    style={
                                        m.role === "user"
                                            ? {
                                                backgroundColor: "var(--color-brand)",
                                                color: "#ffffff",
                                                borderBottomRightRadius: "4px",
                                            }
                                            : {
                                                backgroundColor: "var(--color-surface-2)",
                                                color: "var(--color-text)",
                                                borderBottomLeftRadius: "4px",
                                            }
                                    }
                                >
                                    {m.text}
                                </div>

                            </div>

                        ))}

                        {sending && (
                            <div className="flex justify-start">
                                <div
                                    className="px-3 py-2 rounded-2xl text-sm flex gap-1"
                                    style={{ backgroundColor: "var(--color-surface-2)" }}
                                >
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot" style={{ animationDelay: "0.15s" }}></span>
                                    <span className="typing-dot" style={{ animationDelay: "0.3s" }}></span>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Input */}
                    <div
                        className="flex items-center gap-2 p-3 border-t"
                        style={{ borderColor: "var(--color-border)" }}
                    >

                        <input
                            type="text"
                            placeholder={listening ? "Listening…" : loggedIn ? "Ask, or say “play Anirudh songs”…" : "Log in to chat with AI"}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSend();
                            }}
                            className="flex-1 text-sm px-3 py-2 rounded-full outline-none"
                            style={{
                                backgroundColor: "var(--color-surface-2)",
                                color: "var(--color-text)",
                            }}
                        />

                        <button
                            onClick={handleVoice}
                            aria-label={listening ? "Stop listening" : "Speak to the assistant"}
                            title="Voice"
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${listening ? "animate-pulse" : ""}`}
                            style={{
                                backgroundColor: listening ? "#ef4444" : "var(--color-surface-2)",
                                color: listening ? "#fff" : "var(--color-text-muted)",
                            }}
                        >
                            <FaMicrophone size={13} />
                        </button>

                        <button
                            onClick={() => handleSend()}
                            disabled={sending}
                            className="ai-btn w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        >
                            <FaPaperPlane size={13} />
                        </button>

                    </div>

                </div>

            )}

        </>
    );
}

export default ChatbotWidget;
