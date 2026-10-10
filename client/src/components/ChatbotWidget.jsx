import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaRobot, FaTimes, FaPaperPlane, FaMicrophone } from "react-icons/fa";
import { sendChatMessage } from "../api/aiApi";
import VexaLogo from "./VexaLogo";
import { MusicPlayerContext } from "../context/MusicPlayerContext";

// Recognizes "play/search/find <thing>"-style requests so the chatbot
// can jump straight into real results instead of just talking about
// them — and works purely by pattern matching, so it keeps working even
// when the AI provider itself is down or out of credits.
const SEARCH_INTENT_RE = /^(?:please\s+|can you\s+|could you\s+)?(play|search(?:\s+for)?|find(?:\s+me)?|look\s*up|open)\s+(.+)/i;
const MUSIC_KEYWORDS = /\b(song|songs|music|track|tracks|album|artist)\b/i;
const VIDEO_KEYWORDS = /\b(video|videos|movie|clip|shorts?)\b/i;

const detectSearchIntent = (text) => {
    const match = SEARCH_INTENT_RE.exec(text.trim());
    if (!match) return null;

    const query = match[2].trim();
    if (!query) return null;

    // Explicit mentions win; otherwise default to a general video search,
    // since that's the platform's primary content type.
    const type = MUSIC_KEYWORDS.test(query) && !VIDEO_KEYWORDS.test(query) ? "music" : "video";

    return { type, query };
};

function ChatbotWidget() {

    const { currentTrack } = useContext(MusicPlayerContext);
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [listening, setListening] = useState(false);
    const [voiceSupported, setVoiceSupported] = useState(true);
    const recognitionRef = useRef(null);
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

    // ================= VOICE INPUT =================
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setVoiceSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map((result) => result[0].transcript)
                .join("");
            setMessage(transcript);
        };

        recognition.onerror = (event) => {
            console.log("Voice input error:", event.error);
            setListening(false);
        };

        recognition.onend = () => {
            setListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.stop();
        };
    }, []);

    const handleVoiceInput = () => {

        if (!voiceSupported || !recognitionRef.current) {
            alert("Voice input isn't supported in this browser — try Chrome or Edge.");
            return;
        }

        if (listening) {
            recognitionRef.current.stop();
            setListening(false);
            return;
        }

        setMessage("");
        setListening(true);

        try {
            recognitionRef.current.start();
        } catch (error) {
            console.log(error);
        }

    };

    // Auto-send a moment after the mic stops picking up new speech —
    // speak, then it sends, same as Navbar's voice search.
    useEffect(() => {
        if (!listening || !message.trim()) return;

        const timer = setTimeout(() => {
            if (recognitionRef.current) recognitionRef.current.stop();
            handleSend();
        }, 1200);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [message, listening]);

    const handleSend = async () => {

        if (!message.trim()) return;

        if (!loggedIn) {
            setMessages((prev) => [
                ...prev,
                { role: "user", text: message },
                { role: "assistant", text: "Log in first and I can help you find videos and explain features." },
            ]);
            setMessage("");
            return;
        }

        const userText = message;
        setMessage("");

        const nextMessages = [...messages, { role: "user", text: userText }];
        setMessages(nextMessages);

        const intent = detectSearchIntent(userText);

        if (intent) {

            const destination = intent.type === "music"
                ? `/music?q=${encodeURIComponent(intent.query)}`
                : `/search?q=${encodeURIComponent(intent.query)}`;

            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text: intent.type === "music"
                        ? `🎵 Taking you to VEXA Music results for "${intent.query}"...`
                        : `🔍 Taking you to search results for "${intent.query}"...`,
                },
            ]);

            setOpen(false);
            navigate(destination);
            return;
        }

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
                            placeholder={loggedIn ? (listening ? "Listening..." : "Ask me anything, or try \"play ...\"") : "Log in to chat with AI"}
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
                            onClick={handleVoiceInput}
                            title="Voice input"
                            aria-label="Voice input"
                            className="relative w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: "var(--color-surface-2)" }}
                        >
                            {listening && (
                                <span
                                    className="absolute inset-0 rounded-full animate-ping"
                                    style={{ backgroundColor: "var(--color-danger)", opacity: 0.4 }}
                                />
                            )}
                            <FaMicrophone
                                size={13}
                                className="relative"
                                style={{ color: listening ? "var(--color-danger)" : "var(--color-text-faint)" }}
                            />
                        </button>

                        <button
                            onClick={handleSend}
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
