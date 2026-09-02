import { useState } from "react";
import { Link } from "react-router-dom";
import { FaQuestionCircle, FaChevronDown, FaEnvelope } from "react-icons/fa";

const FAQS = [
    {
        category: "Account",
        items: [
            {
                q: "How do I create an account?",
                a: "Tap Register on the login screen, fill in your name, email, and a password (at least 8 characters, with both letters and numbers). We'll email you a 6-digit code — enter it on the next screen to finish creating your account.",
            },
            {
                q: "I didn't get my verification code",
                a: "Check your Spam/Junk folder first. If it's not there, use the \"Resend\" button on the verification screen to get a new code.",
            },
            {
                q: "I forgot my password",
                a: "Password reset isn't available yet from the login screen — use Contact Support below and we'll help you regain access.",
            },
        ],
    },
    {
        category: "Videos & Shorts",
        items: [
            {
                q: "How do I upload a video?",
                a: "Go to Upload in the sidebar. You can add a video by URL/import or upload your own file, along with a title, description, category, and thumbnail.",
            },
            {
                q: "How do I post a Short?",
                a: "When uploading, check \"Post as a Short\" — vertical videos under 60 seconds show up in the Shorts feed instead of the main video grid. You can also mark an already-uploaded video as a Short from My Uploads.",
            },
            {
                q: "How does the Shorts feed decide what to show me?",
                a: "If you're logged in, it's personalized based on what you've watched, liked, and searched. New accounts (or anyone without history yet) see a random mix.",
            },
        ],
    },
    {
        category: "VEXA Music",
        items: [
            {
                q: "How does auto-play / \"Up Next\" work?",
                a: "When a song from search results, favorites, or recently played finishes, VEXA blends in a related track automatically instead of just playing the next item on a list. Playlists you build yourself play in the exact order you set.",
            },
            {
                q: "Why does music stop when I switch apps or lock my phone?",
                a: "VEXA Music streams through YouTube, and browsers generally pause that kind of embedded playback once you leave the tab or lock the screen — this is a platform limitation, not a bug.",
            },
            {
                q: "What does Premium include?",
                a: "Ad-free listening, shuffle mode, and downloading tracks as ringtones. Check the Premium page for current pricing.",
            },
        ],
    },
    {
        category: "Channel & Privacy",
        items: [
            {
                q: "How do I edit my channel bio and links?",
                a: "Go to Profile → Channel Info → Edit. You can add a bio and up to 5 links (Instagram, website, etc.) that show up on your public channel page.",
            },
            {
                q: "Who can see my channel?",
                a: "Your channel page (videos, bio, links, subscriber count) is public to anyone with the link, same as your uploaded videos.",
            },
        ],
    },
];

function Help() {

    const [openIndex, setOpenIndex] = useState(null);

    const toggle = (key) => {
        setOpenIndex((prev) => (prev === key ? null : key));
    };

    return (
        <div className="max-w-2xl mx-auto p-3 sm:p-4 md:p-6 text-[var(--color-text)]">

            <div className="flex items-center gap-3 mb-2">
                <FaQuestionCircle style={{ color: "var(--color-brand)" }} />
                <h1 className="text-2xl sm:text-3xl font-bold">Help Center</h1>
            </div>
            <p className="mb-6" style={{ color: "var(--color-text-muted)" }}>
                Common questions about VEXA. Can't find what you need?{" "}
                <Link to="/contact" className="font-medium" style={{ color: "var(--color-brand)" }}>
                    Contact Support
                </Link>
            </p>

            {FAQS.map((section) => (
                <div key={section.category} className="mb-6">

                    <h2 className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-text-faint)" }}>
                        {section.category}
                    </h2>

                    <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--color-border)" }}>
                        {section.items.map((item, i) => {
                            const key = `${section.category}-${i}`;
                            const isOpen = openIndex === key;

                            return (
                                <div key={key} style={{ borderTop: i > 0 ? "1px solid var(--color-border-soft)" : "none" }}>
                                    <button
                                        onClick={() => toggle(key)}
                                        className="w-full flex items-center justify-between gap-3 p-4 text-left"
                                        style={{ backgroundColor: "var(--color-surface)" }}
                                    >
                                        <span className="text-sm font-medium">{item.q}</span>
                                        <FaChevronDown
                                            size={12}
                                            className="shrink-0 transition-transform"
                                            style={{ color: "var(--color-text-faint)", transform: isOpen ? "rotate(180deg)" : "none" }}
                                        />
                                    </button>

                                    {isOpen && (
                                        <p className="px-4 pb-4 text-sm" style={{ color: "var(--color-text-muted)", backgroundColor: "var(--color-surface)" }}>
                                            {item.a}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                </div>
            ))}

            <Link
                to="/contact"
                className="flex items-center justify-center gap-2 mt-4 py-3 rounded-lg text-sm font-medium"
                style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text)" }}
            >
                <FaEnvelope size={12} />
                Still need help? Contact Support
            </Link>

        </div>
    );
}

export default Help;
