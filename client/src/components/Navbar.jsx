import { FaSearch, FaUserCircle, FaSyncAlt, FaMicrophone, FaBars } from "react-icons/fa";
import { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SearchContext } from "../context/SearchContext";
import { LanguageContext } from "../context/LanguageContext";
import { autoFetchVideos, quickSearchVideos } from "../api/videoApi";
import NotificationBell from "./NotificationBell";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import VexaLogo from "./VexaLogo";

// Maps app language to a BCP-47 locale the browser's speech recognizer
// understands, so voice search listens in the language you're using.
const SPEECH_LOCALES = {
    en: "en-US",
    ta: "ta-IN",
    hi: "hi-IN",
    ml: "ml-IN",
    te: "te-IN",
};

function Navbar({ onMenuClick }) {

    const { search, setSearch } = useContext(SearchContext);
    const { t, language } = useContext(LanguageContext);
    const navigate = useNavigate();

    const [syncing, setSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState("");

    // ================= VOICE SEARCH =================
    const [listening, setListening] = useState(false);
    const [voiceSupported, setVoiceSupported] = useState(true);
    const recognitionRef = useRef(null);

    // ================= LIVE SEARCH DROPDOWN =================
    const [liveResults, setLiveResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const debounceRef = useRef(null);
    const boxRef = useRef(null);

    useEffect(() => {

        if (!search.trim()) {
            setLiveResults([]);
            setShowDropdown(false);
            return;
        }

        // Debounced — waits for a short pause in typing before hitting
        // the API, so it doesn't fire on every keystroke.
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await quickSearchVideos(search.trim());
                setLiveResults(res.data);
                setShowDropdown(true);
            } catch (error) {
                console.log(error);
            }
        }, 250);

        return () => clearTimeout(debounceRef.current);

    }, [search]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (boxRef.current && !boxRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (!search.trim()) return;
        setShowDropdown(false);
        navigate(`/search?q=${encodeURIComponent(search.trim())}`);
    };

    // ================= VOICE SEARCH =================
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setVoiceSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map((result) => result[0].transcript)
                .join("");
            setSearch(transcript);
        };

        recognition.onerror = (event) => {
            console.log("Voice search error:", event.error);
            setListening(false);
        };

        recognition.onend = () => {
            setListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleVoiceSearch = () => {

        if (!voiceSupported || !recognitionRef.current) {
            alert("Voice search isn't supported in this browser — try Chrome or Edge.");
            return;
        }

        if (listening) {
            recognitionRef.current.stop();
            setListening(false);
            return;
        }

        recognitionRef.current.lang = SPEECH_LOCALES[language] || "en-US";
        setSearch("");
        setListening(true);

        try {
            recognitionRef.current.start();
        } catch (error) {
            // start() throws if called while already running — ignore
            console.log(error);
        }

    };

    // Auto-submit a short moment after the mic stops picking up new
    // speech, so voice search feels like Google/YouTube's — speak, then
    // results appear without needing to press Enter.
    useEffect(() => {
        if (!listening || !search.trim()) return;

        const timer = setTimeout(() => {
            if (recognitionRef.current) recognitionRef.current.stop();
            navigate(`/search?q=${encodeURIComponent(search.trim())}`);
        }, 1200);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, listening]);

    const handleResultClick = (video) => {
        setShowDropdown(false);
        setSearch("");
        navigate(`/video/${video._id}`);
    };

    const handleSync = async () => {

        try {

            setSyncing(true);
            setSyncMessage("");

            const res = await autoFetchVideos();

            const { created } = res.data;

            setSyncMessage(
                created > 0
                    ? `+${created} new video${created !== 1 ? "s" : ""}`
                    : "Already up to date"
            );

            setTimeout(() => setSyncMessage(""), 4000);

        } catch (error) {

            console.log(error);
            setSyncMessage("Sync failed");
            setTimeout(() => setSyncMessage(""), 4000);

        } finally {

            setSyncing(false);

        }

    };

    return (
        <div
            className="flex items-center justify-between gap-2 sm:gap-4 md:gap-6 px-3 sm:px-4 md:px-6 py-3 md:py-3.5 border-b"
            style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
            }}
        >

            {/* Hamburger — only on mobile/tablet, toggles the Sidebar drawer */}
            <button
                onClick={onMenuClick}
                className="lg:hidden shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text)" }}
                aria-label="Menu"
            >
                <FaBars size={15} />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0">

                <VexaLogo size={28} />

                <h1
                    className="hidden sm:block text-lg md:text-xl font-bold tracking-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                >
                    VEX<span className="ai-gradient-text">A</span>
                </h1>

            </Link>

            {/* Search Box */}
            <div ref={boxRef} className="relative flex-1 min-w-0 max-w-[440px]">

                <form
                    onSubmit={handleSearchSubmit}
                    className="flex items-center rounded-full px-3 sm:px-4 py-2 sm:py-2.5 w-full border"
                    style={{
                        backgroundColor: "var(--color-surface-2)",
                        borderColor: "var(--color-border)",
                    }}
                >

                    <button type="submit" aria-label="Search" className="shrink-0">
                        <FaSearch style={{ color: "var(--color-text-faint)" }} />
                    </button>

                    <input
                        type="text"
                        placeholder={listening ? "Listening..." : t("search_placeholder")}
                        className="bg-transparent outline-none ml-2 sm:ml-3 w-full text-sm min-w-0"
                        style={{ color: "var(--color-text)" }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => search.trim() && setShowDropdown(true)}
                    />

                    <button
                        type="button"
                        onClick={handleVoiceSearch}
                        title="Voice search"
                        aria-label="Voice search"
                        className="ml-2 shrink-0 relative"
                    >
                        {listening && (
                            <span
                                className="absolute inset-0 rounded-full animate-ping"
                                style={{ backgroundColor: "var(--color-danger)", opacity: 0.4 }}
                            />
                        )}
                        <FaMicrophone
                            className="relative"
                            style={{ color: listening ? "var(--color-danger)" : "var(--color-text-faint)" }}
                        />
                    </button>

                </form>

                {/* Live results dropdown — updates automatically as you type */}
                {showDropdown && (

                    <div
                        className="absolute left-0 right-0 mt-2 rounded-xl border overflow-hidden z-50 animate-fade-up"
                        style={{
                            backgroundColor: "var(--color-surface)",
                            borderColor: "var(--color-border)",
                            boxShadow: "0 16px 40px -12px rgba(0,0,0,0.55)",
                        }}
                    >

                        {liveResults.length === 0 ? (

                            <p className="p-4 text-sm" style={{ color: "var(--color-text-faint)" }}>
                                No quick matches — press Enter to run a full AI search.
                            </p>

                        ) : (

                            <>
                                {liveResults.map((video) => (
                                    <button
                                        key={video._id}
                                        onClick={() => handleResultClick(video)}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:brightness-125"
                                    >
                                        <img
                                            src={video.thumbnail}
                                            alt={video.title}
                                            className="w-16 h-10 object-cover rounded shrink-0"
                                        />
                                        <div className="min-w-0">
                                            <p
                                                className="text-sm truncate"
                                                style={{ color: "var(--color-text)" }}
                                            >
                                                {video.title}
                                            </p>
                                            <p
                                                className="text-xs truncate"
                                                style={{ color: "var(--color-text-faint)" }}
                                            >
                                                {video.channel}
                                            </p>
                                        </div>
                                    </button>
                                ))}

                                <button
                                    onClick={handleSearchSubmit}
                                    className="w-full text-left px-3 py-2.5 text-xs border-t"
                                    style={{ borderColor: "var(--color-border)", color: "#5eead4" }}
                                >
                                    See all results for "{search}" →
                                </button>
                            </>

                        )}

                    </div>

                )}

            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-5 shrink-0">

                {/* Sync status message — desktop only, would crowd mobile */}
                {syncMessage && (
                    <span
                        className="hidden md:inline text-xs animate-fade-up"
                        style={{ color: "#5eead4" }}
                    >
                        {syncMessage}
                    </span>
                )}

                {/* AI Auto-Sync trigger — icon-only on mobile/tablet, label appears from md up */}
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    title="Auto-fetch new videos from YouTube with AI"
                    className="flex items-center gap-2 text-xs px-2.5 md:px-3 py-2 rounded-full ai-btn disabled:opacity-60"
                >
                    <FaSyncAlt className={syncing ? "animate-spin" : ""} size={12} />
                    <span className="hidden md:inline">{syncing ? t("syncing") : t("sync")}</span>
                </button>

                <div className="hidden sm:block">
                    <LanguageSwitcher />
                </div>

                <ThemeToggle />

                <NotificationBell />

                <Link
                    to="/profile"
                    title="Profile"
                    className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors hover:brightness-125"
                    style={{ backgroundColor: "var(--color-surface-2)" }}
                >
                    <FaUserCircle
                        className="text-xl md:text-2xl"
                        style={{ color: "var(--color-text-muted)" }}
                    />
                </Link>

            </div>

        </div>
    );
}

export default Navbar;
