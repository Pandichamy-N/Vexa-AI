import { useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    FaArrowLeft,
    FaArrowRight,
    FaTimes,
    FaRedoAlt,
    FaExternalLinkAlt,
    FaLock,
} from "react-icons/fa";
import { InAppBrowserContext } from "../context/InAppBrowserContext";

function hostLabel(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return url;
    }
}

function InAppBrowser() {
    const {
        isOpen,
        url,
        loading,
        loadFailed,
        canGoBack,
        canGoForward,
        close,
        goBack,
        goForward,
        reload,
        setLoading,
        setLoadFailed,
    } = useContext(InAppBrowserContext);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                >
                    {/* Scrim */}
                    <div
                        className="absolute inset-0"
                        style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                        onClick={close}
                    />

                    {/* Panel — slides up from the bottom, like Instagram's in-app browser sheet */}
                    <motion.div
                        className="relative w-full sm:w-[min(92vw,860px)] h-[92vh] sm:h-[86vh] flex flex-col overflow-hidden"
                        style={{
                            backgroundColor: "var(--color-surface)",
                            borderTop: "1px solid var(--color-border)",
                            borderLeft: "1px solid var(--color-border)",
                            borderRight: "1px solid var(--color-border)",
                            borderRadius: "18px 18px 0 0",
                            boxShadow: "0 -8px 40px rgba(0,0,0,0.35)",
                        }}
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 32, stiffness: 320 }}
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center pt-2 pb-1 sm:hidden">
                            <div
                                className="w-10 h-1 rounded-full"
                                style={{ backgroundColor: "var(--color-border)" }}
                            />
                        </div>

                        {/* Address bar */}
                        <div
                            className="flex items-center gap-2 px-3 py-2 shrink-0"
                            style={{ borderBottom: "1px solid var(--color-border-soft)" }}
                        >
                            <div
                                className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-full min-w-0"
                                style={{ backgroundColor: "var(--color-surface-2)" }}
                            >
                                <FaLock size={11} style={{ color: "var(--color-text-faint)" }} />
                                <span
                                    className="truncate text-sm"
                                    style={{ color: "var(--color-text)" }}
                                    title={url || ""}
                                >
                                    {url ? hostLabel(url) : ""}
                                </span>
                            </div>

                            <a
                                href={url || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-no-inapp-browser="true"
                                className="p-2 rounded-full transition-colors"
                                style={{ color: "var(--color-text-muted)" }}
                                title="Open in browser"
                            >
                                <FaExternalLinkAlt size={14} />
                            </a>

                            <button
                                onClick={close}
                                className="p-2 rounded-full transition-colors"
                                style={{ color: "var(--color-text-muted)" }}
                                title="Close"
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>

                        {/* Loading progress bar */}
                        {loading && (
                            <div className="h-0.5 w-full overflow-hidden shrink-0" style={{ backgroundColor: "var(--color-surface-2)" }}>
                                <motion.div
                                    className="h-full w-1/3"
                                    style={{ background: "linear-gradient(90deg, var(--color-ai-from), var(--color-ai-to))" }}
                                    animate={{ x: ["-100%", "220%"] }}
                                    transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                                />
                            </div>
                        )}

                        {/* Webview */}
                        <div className="flex-1 relative min-h-0">
                            {url && !loadFailed && (
                                <iframe
                                    key={url}
                                    src={url}
                                    title="In-app browser"
                                    className="w-full h-full border-0"
                                    referrerPolicy="no-referrer"
                                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                                    onLoad={() => setLoading(false)}
                                    onError={() => {
                                        setLoading(false);
                                        setLoadFailed(true);
                                    }}
                                />
                            )}

                            {loadFailed && (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
                                    <p style={{ color: "var(--color-text)" }}>
                                        This site can't be shown inside VEXA.
                                    </p>
                                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                                        Some sites block being opened inside another app.
                                    </p>
                                    <a
                                        href={url || "#"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        data-no-inapp-browser="true"
                                        className="mt-1 px-4 py-2 rounded-full text-sm font-medium"
                                        style={{ backgroundColor: "var(--color-brand)", color: "#ffffff" }}
                                    >
                                        Open in browser instead
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Bottom nav — back / forward / reload */}
                        <div
                            className="flex items-center justify-around px-4 py-2.5 shrink-0"
                            style={{ borderTop: "1px solid var(--color-border-soft)" }}
                        >
                            <button
                                onClick={goBack}
                                disabled={!canGoBack}
                                className="p-2.5 rounded-full"
                                style={{ color: canGoBack ? "var(--color-text)" : "var(--color-text-faint)" }}
                            >
                                <FaArrowLeft size={16} />
                            </button>
                            <button
                                onClick={goForward}
                                disabled={!canGoForward}
                                className="p-2.5 rounded-full"
                                style={{ color: canGoForward ? "var(--color-text)" : "var(--color-text-faint)" }}
                            >
                                <FaArrowRight size={16} />
                            </button>
                            <button
                                onClick={reload}
                                className="p-2.5 rounded-full"
                                style={{ color: "var(--color-text)" }}
                            >
                                <FaRedoAlt size={14} />
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default InAppBrowser;
