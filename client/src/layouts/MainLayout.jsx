import { useContext, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import ChatbotWidget from "../components/ChatbotWidget";
import MusicPlayerBar from "../components/MusicPlayerBar";
import InAppBrowser from "../components/InAppBrowser";
import { MusicPlayerContext } from "../context/MusicPlayerContext";
import { Outlet, useLocation } from "react-router-dom";

function MainLayout() {

    const { currentTrack } = useContext(MusicPlayerContext);
    const location = useLocation();

    // Sidebar is a static column on large screens (lg+) but an
    // off-canvas drawer on mobile/tablet — closed by default there.
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        // h-screen + overflow-hidden (not min-h-screen) is what actually
        // keeps Sidebar/Navbar fixed in place — min-h-screen let the
        // whole page grow and scroll together, dragging the sidebar
        // along with it. Only the content pane below scrolls now.
        <div
            className="flex h-screen overflow-hidden relative"
            style={{ backgroundColor: "var(--color-ink)" }}
        >

            {/* Ambient animated background glow — signature "living signal" backdrop */}
            <div className="ambient-glow" />

            {/* Backdrop — only shows behind the drawer on mobile/tablet */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 lg:hidden"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar — static column on lg+; off-canvas drawer below
                that, sliding in over the content when opened */}
            <div
                className={`fixed inset-y-0 left-0 z-40 h-screen overflow-y-auto shrink-0 transition-transform duration-200 lg:static lg:z-10 lg:translate-x-0 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </div>

            {/* Right Section */}
            <div className="flex-1 flex flex-col min-w-0 relative z-10 h-screen">

                {/* Navbar — stays static at the top */}
                <Navbar onMenuClick={() => setSidebarOpen((v) => !v)} />

                {/* Pages — the only part that scrolls. Extra bottom
                    padding when the floating music bar is showing so it
                    never covers the last row of content. */}
                <div className={`flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto ${currentTrack ? "pb-28" : ""}`}>
                    <div key={location.pathname} className="animate-page-in">
                        <Outlet />
                    </div>
                </div>

            </div>

            {/* Site-wide AI assistant, available on every page */}
            <ChatbotWidget />

            {/* Persistent mini music player, available on every page —
                floats centered so it never covers the chatbot button */}
            <MusicPlayerBar />

            {/* In-app browser — any external link tapped anywhere in VEXA
                (comments, channel bio, video descriptions) opens here
                instead of leaving the app, the same way Instagram's
                in-app browser keeps outbound links inside its own webview */}
            <InAppBrowser />

        </div>
    );
}

export default MainLayout;
