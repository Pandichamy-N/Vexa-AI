import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FaRobot } from "react-icons/fa";
import { searchVideosAI } from "../api/videoApi";
import VideoCard from "../components/VideoCard";
import { LanguageContext } from "../context/LanguageContext";

function SearchResults() {

    const { t } = useContext(LanguageContext);
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q") || "";

    const [results, setResults] = useState([]);
    const [expandedKeywords, setExpandedKeywords] = useState([]);
    const [likelyCategory, setLikelyCategory] = useState(null);
    const [liveResultsCount, setLiveResultsCount] = useState(0);
    const [nextPageToken, setNextPageToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (query) runSearch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    const runSearch = async () => {
        try {
            setLoading(true);
            setError("");

            const res = await searchVideosAI(query);

            setResults(res.data.results);
            setExpandedKeywords(res.data.expandedKeywords || []);
            setLikelyCategory(res.data.likelyCategory);
            setLiveResultsCount(res.data.liveResultsCount || 0);
            setNextPageToken(res.data.nextPageToken || null);

        } catch (err) {
            console.log(err);
            setError(
                err.response?.data?.message ||
                "Search failed. Try again in a moment."
            );
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        if (!nextPageToken || loadingMore) return;

        try {
            setLoadingMore(true);

            const res = await searchVideosAI(query, null, nextPageToken);

            // De-dupe against what's already shown — a video could
            // legitimately surface again from local DB matches.
            const existingIds = new Set(results.map((v) => v._id));
            const fresh = (res.data.results || []).filter((v) => !existingIds.has(v._id));

            setResults((prev) => [...prev, ...fresh]);
            setNextPageToken(res.data.nextPageToken || null);

        } catch (err) {
            console.log(err);
        } finally {
            setLoadingMore(false);
        }
    };

    return (
        <div>

            <h1
                className="text-2xl font-bold mb-1"
                style={{ color: "var(--color-text)" }}
            >
                {t("results_for")} "{query}"
            </h1>

            {!loading && liveResultsCount > 0 && (
                <p className="text-xs mb-2" style={{ color: "#5eead4" }}>
                    Fetched {liveResultsCount} new video{liveResultsCount !== 1 ? "s" : ""} live from YouTube for this search.
                </p>
            )}

            {!loading && expandedKeywords.length > 0 && (
                <p
                    className="flex items-center gap-2 text-sm mb-6 flex-wrap"
                    style={{ color: "var(--color-text-muted)" }}
                >
                    <FaRobot style={{ color: "#5eead4" }} />
                    AI also matched:
                    {expandedKeywords.slice(0, 6).map((k) => (
                        <span
                            key={k}
                            className="ai-chip px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: "var(--color-ai-soft)", color: "#5eead4" }}
                        >
                            {k}
                        </span>
                    ))}
                    {likelyCategory && (
                        <span style={{ color: "var(--color-text-faint)" }}>
                            · likely category: {likelyCategory}
                        </span>
                    )}
                </p>
            )}

            {loading ? (

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-[220px] rounded-2xl animate-pulse"
                            style={{ backgroundColor: "var(--color-surface)" }}
                        />
                    ))}
                </div>

            ) : error ? (

                <p className="text-red-400">{error}</p>

            ) : results.length === 0 ? (

                <div className="text-center mt-16">
                    <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                        No matches
                    </h2>
                    <p style={{ color: "var(--color-text-muted)" }}>
                        Try a different phrase, or a broader topic.
                    </p>
                </div>

            ) : (

                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {results.map((video, index) => (
                            <div
                                key={video._id}
                                className="animate-fade-up"
                                style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
                            >
                                <VideoCard video={video} />
                            </div>
                        ))}
                    </div>

                    {nextPageToken && (
                        <div className="flex justify-center mt-8">
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="ai-btn px-6 py-2.5 rounded-full text-sm disabled:opacity-50"
                            >
                                {loadingMore ? "Loading..." : "Load More Results"}
                            </button>
                        </div>
                    )}
                </>

            )}

        </div>
    );
}

export default SearchResults;
