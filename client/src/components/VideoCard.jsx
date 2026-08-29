import { useNavigate } from "react-router-dom";
import { FaRegEye, FaRobot, FaPlay } from "react-icons/fa";

function VideoCard({ video }) {

    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/video/${video._id}`);
    };

    return (
        <div
            onClick={handleClick}
            className="group media-card rounded-2xl overflow-hidden cursor-pointer border"
            style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border-soft)",
            }}
        >

            <div className="relative overflow-hidden">

                <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-[180px] object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                />

                {/* Hover overlay + play icon — subtle, appears only on hover */}
                <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.55) 100%)" }}
                >
                    <span
                        className="w-11 h-11 rounded-full flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-200"
                        style={{ backgroundColor: "var(--color-brand)", color: "#ffffff" }}
                    >
                        <FaPlay size={14} style={{ marginLeft: "2px" }} />
                    </span>
                </div>

                {video.duration && (
                    <span
                        className="absolute bottom-2 right-2 text-xs px-1.5 py-0.5 rounded font-mono"
                        style={{
                            backgroundColor: "rgba(18,18,18,0.85)",
                            color: "var(--color-text)",
                        }}
                    >
                        {video.duration}
                    </span>
                )}

                {video.aiSummary?.length > 0 && (
                    <span
                        className="absolute top-2 left-2 flex items-center gap-1 text-[10px] px-2 py-1 rounded-full ai-panel"
                        style={{ color: "#5eead4" }}
                    >
                        <FaRobot size={10} />
                        AI Summary
                    </span>
                )}

            </div>

            <div className="p-3">

                <h2
                    className="font-semibold text-sm line-clamp-2 transition-colors duration-200 group-hover:text-[var(--color-brand)]"
                    style={{ color: "var(--color-text)" }}
                >
                    {video.title}
                </h2>

                <p
                    className="text-xs mt-1"
                    style={{ color: "var(--color-text-muted)" }}
                >
                    {video.channel}
                </p>

                <div
                    className="flex items-center gap-2 text-xs mt-2"
                    style={{ color: "var(--color-text-faint)" }}
                >
                    <FaRegEye />
                    <span>{video.views} views</span>
                    <span>•</span>
                    <span>{video.time}</span>
                </div>

                {video.category && (
                    <span
                        className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full border transition-colors duration-200 group-hover:border-[var(--color-brand)]"
                        style={{
                            borderColor: "var(--color-border)",
                            color: "var(--color-text-muted)",
                        }}
                    >
                        {video.category}
                    </span>
                )}

            </div>
        </div>

    );
}

export default VideoCard;
