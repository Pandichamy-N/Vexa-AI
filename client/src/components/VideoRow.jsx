import { useRef } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import VideoCard from "./VideoCard";

// A horizontally-scrolling row of videos with a heading — the building
// block for the personalized homepage sections (Recommended, Trending,
// Latest, Most Viewed, Recently Watched, etc).
function VideoRow({ title, icon, subtitle, videos, loading, emptyText }) {

    const scrollRef = useRef(null);

    const scrollBy = (amount) => {
        scrollRef.current?.scrollBy({ left: amount, behavior: "smooth" });
    };

    return (
        <section className="mb-10">

            <div className="flex items-center justify-between mb-3">

                <div>
                    <h2
                        className="text-xl font-bold flex items-center gap-2"
                        style={{ color: "var(--color-text)" }}
                    >
                        {icon}
                        {title}
                    </h2>

                    {subtitle && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-faint)" }}>
                            {subtitle}
                        </p>
                    )}
                </div>

                {videos?.length > 4 && (
                    <div className="hidden sm:flex gap-2">
                        <button
                            onClick={() => scrollBy(-600)}
                            className="w-8 h-8 rounded-full flex items-center justify-center border"
                            style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
                        >
                            <FaChevronLeft size={12} />
                        </button>
                        <button
                            onClick={() => scrollBy(600)}
                            className="w-8 h-8 rounded-full flex items-center justify-center border"
                            style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
                        >
                            <FaChevronRight size={12} />
                        </button>
                    </div>
                )}

            </div>

            {loading ? (

                <div className="flex gap-4 overflow-hidden">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="w-64 h-[190px] rounded-2xl shrink-0 animate-pulse"
                            style={{ backgroundColor: "var(--color-surface)" }}
                        />
                    ))}
                </div>

            ) : !videos || videos.length === 0 ? (

                <p
                    className="text-sm py-6"
                    style={{ color: "var(--color-text-faint)" }}
                >
                    {emptyText || "Nothing here yet."}
                </p>

            ) : (

                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
                >
                    {videos.map((video, index) => (
                        <div
                            key={video._id}
                            className="w-64 shrink-0 animate-fade-up"
                            style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
                        >
                            <VideoCard video={video} />
                        </div>
                    ))}
                </div>

            )}

        </section>
    );
}

export default VideoRow;
