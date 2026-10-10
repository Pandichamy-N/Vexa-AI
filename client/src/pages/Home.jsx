import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaFire, FaRobot, FaClock, FaEye, FaHistory, FaSearch, FaStar } from "react-icons/fa";
import VideoRow from "../components/VideoRow";
import { LanguageContext } from "../context/LanguageContext";
import {
    getRecommendedVideos,
    getTopPicks,
    getTrendingVideos,
    getLatestVideos,
    getMostViewedVideos,
    getHistory,
} from "../api/videoApi";

function Home() {

    const navigate = useNavigate();
    const { t } = useContext(LanguageContext);
    const loggedIn = Boolean(localStorage.getItem("token"));

    const [topPicks, setTopPicks] = useState({ videos: [], needsOnboarding: false, loading: true });
    const [recommended, setRecommended] = useState({ videos: [], coldStart: true, loading: true });
    const [trending, setTrending] = useState({ videos: [], loading: true });
    const [latest, setLatest] = useState({ videos: [], loading: true });
    const [mostViewed, setMostViewed] = useState({ videos: [], loading: true });
    const [recentlyWatched, setRecentlyWatched] = useState({ videos: [], loading: true });

    useEffect(() => {
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadAll = async () => {

        // Independent sections load in parallel and each resolve on
        // their own, so one slow/failed section never blocks the rest.

        if (loggedIn) {
            getTopPicks()
                .then((res) => setTopPicks({ videos: res.data.videos, needsOnboarding: res.data.needsOnboarding, loading: false }))
                .catch(() => setTopPicks((s) => ({ ...s, loading: false })));

            getRecommendedVideos()
                .then((res) => setRecommended({ videos: res.data.videos, coldStart: res.data.coldStart, loading: false }))
                .catch(() => setRecommended((s) => ({ ...s, loading: false })));

            getHistory(localStorage.getItem("token"))
                .then((res) => setRecentlyWatched({ videos: (res.data.history || []).slice(0, 12).reverse(), loading: false }))
                .catch(() => setRecentlyWatched((s) => ({ ...s, loading: false })));
        } else {
            setTopPicks((s) => ({ ...s, loading: false }));
            setRecommended((s) => ({ ...s, loading: false }));
            setRecentlyWatched((s) => ({ ...s, loading: false }));
        }

        getTrendingVideos()
            .then((res) => setTrending({ videos: res.data.slice(0, 12), loading: false }))
            .catch(() => setTrending((s) => ({ ...s, loading: false })));

        getLatestVideos()
            .then((res) => setLatest({ videos: res.data, loading: false }))
            .catch(() => setLatest((s) => ({ ...s, loading: false })));

        getMostViewedVideos()
            .then((res) => setMostViewed({ videos: res.data, loading: false }))
            .catch(() => setMostViewed((s) => ({ ...s, loading: false })));

    };

    return (
        <div>

            {loggedIn && topPicks.needsOnboarding && (
                <div
                    className="ai-panel rounded-xl p-5 mb-8 flex items-center justify-between flex-wrap gap-3"
                >
                    <div>
                        <p className="font-semibold" style={{ color: "var(--color-text)" }}>
                            Pick your favorite categories
                        </p>
                        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                            Get a homepage built around what you actually like.
                        </p>
                    </div>
                    <Link to="/onboarding" className="brand-btn px-5 py-2 rounded-full text-sm">
                        {t("continue_btn")}
                    </Link>
                </div>
            )}

            {loggedIn && !topPicks.needsOnboarding && (
                <VideoRow
                    title={t("home_top_picks")}
                    icon={<FaStar style={{ color: "var(--color-brand)" }} />}
                    subtitle="Based on the categories you picked."
                    videos={topPicks.videos}
                    loading={topPicks.loading}
                />
            )}

            {loggedIn && (
                <VideoRow
                    title={t("home_recommended")}
                    icon={<FaRobot style={{ color: "#5eead4" }} />}
                    subtitle={
                        recommended.coldStart
                            ? "Watch, like, or search a few videos and this fills in with picks made for you."
                            : "Based on what you've watched, liked, and searched."
                    }
                    videos={recommended.videos}
                    loading={recommended.loading}
                    emptyText="Nothing to recommend yet — explore a few videos first."
                />
            )}

            <VideoRow
                title={t("home_trending")}
                icon={<FaFire style={{ color: "var(--color-brand)" }} />}
                subtitle="Ranked by engagement, growth rate, and search demand."
                videos={trending.videos}
                loading={trending.loading}
            />

            {loggedIn && recentlyWatched.videos.length > 0 && (
                <VideoRow
                    title={t("home_recently_watched")}
                    icon={<FaHistory style={{ color: "var(--color-text-muted)" }} />}
                    videos={recentlyWatched.videos}
                    loading={recentlyWatched.loading}
                />
            )}

            <VideoRow
                title={t("home_latest")}
                icon={<FaClock style={{ color: "var(--color-text-muted)" }} />}
                videos={latest.videos}
                loading={latest.loading}
            />

            <VideoRow
                title={t("home_most_viewed")}
                icon={<FaEye style={{ color: "var(--color-text-muted)" }} />}
                videos={mostViewed.videos}
                loading={mostViewed.loading}
            />

            {!latest.loading && latest.videos.length === 0 && (
                <div className="text-center mt-16">
                    <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                        No videos yet
                    </h2>
                    <p style={{ color: "var(--color-text-muted)" }}>
                        Videos auto-sync from YouTube shortly after the server starts, or{" "}
                        <Link to="/upload" style={{ color: "var(--color-brand)" }}>upload one</Link>.
                    </p>
                </div>
            )}

        </div>
    );
}

export default Home;
