import { createContext, useCallback, useEffect, useRef, useState } from "react";

export const InAppBrowserContext = createContext();

/**
 * Site-wide "in-app browser" — the same idea as Instagram/Twitter opening
 * outbound links in their own webview instead of kicking you out to
 * Safari/Chrome. Any external link tapped anywhere in VEXA (comments,
 * channel bio links, video descriptions, the chatbot, etc.) opens inside
 * this slide-up panel instead of a new tab, so people never fully leave
 * the app.
 */
function InAppBrowserProvider({ children }) {

    const [isOpen, setIsOpen] = useState(false);
    const [stack, setStack] = useState([]); // history of visited URLs this session
    const [stackIndex, setStackIndex] = useState(-1);
    const [loading, setLoading] = useState(false);
    const [loadFailed, setLoadFailed] = useState(false);
    const containerRef = useRef(null);

    const currentUrl = stackIndex >= 0 ? stack[stackIndex] : null;

    const open = useCallback((url) => {
        if (!url) return;
        setStack((prev) => {
            const next = prev.slice(0, stackIndex + 1);
            next.push(url);
            setStackIndex(next.length - 1);
            return next;
        });
        setLoadFailed(false);
        setLoading(true);
        setIsOpen(true);
    }, [stackIndex]);

    const close = useCallback(() => {
        setIsOpen(false);
        // Reset history a beat after the close animation finishes.
        setTimeout(() => {
            setStack([]);
            setStackIndex(-1);
        }, 300);
    }, []);

    const goBack = useCallback(() => {
        setStackIndex((i) => {
            if (i <= 0) return i;
            setLoading(true);
            setLoadFailed(false);
            return i - 1;
        });
    }, []);

    const goForward = useCallback(() => {
        setStackIndex((i) => {
            if (i >= stack.length - 1) return i;
            setLoading(true);
            setLoadFailed(false);
            return i + 1;
        });
    }, [stack.length]);

    const reload = useCallback(() => {
        setLoadFailed(false);
        setLoading(true);
        // Force the iframe to remount so it actually reloads.
        setStack((prev) => [...prev]);
    }, []);

    // Global click interception: any <a> pointing off-site opens in the
    // in-app browser instead of navigating the tab or window.open-ing.
    useEffect(() => {
        function handleClick(e) {
            const anchor = e.target.closest?.("a[href]");
            if (!anchor) return;

            // Explicit opt-out for links that must behave normally
            // (e.g. "Download", mailto, real internal navigation).
            if (anchor.hasAttribute("data-no-inapp-browser")) return;

            const href = anchor.getAttribute("href");
            if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

            let target;
            try {
                target = new URL(href, window.location.href);
            } catch {
                return;
            }

            if (!/^https?:$/.test(target.protocol)) return;
            if (target.hostname === window.location.hostname) return; // internal link, let router handle it

            e.preventDefault();
            open(target.href);
        }

        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, [open]);

    return (
        <InAppBrowserContext.Provider
            value={{
                isOpen,
                url: currentUrl,
                loading,
                loadFailed,
                canGoBack: stackIndex > 0,
                canGoForward: stackIndex < stack.length - 1,
                open,
                close,
                goBack,
                goForward,
                reload,
                setLoading,
                setLoadFailed,
                containerRef,
            }}
        >
            {children}
        </InAppBrowserContext.Provider>
    );
}

export default InAppBrowserProvider;
