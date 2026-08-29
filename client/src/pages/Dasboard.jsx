import { useContext, useEffect, useState } from "react";
import { getDashboard, getDashboardStats } from "../api/videoApi";
import { LanguageContext } from "../context/LanguageContext";

function Dashboard() {

    const { t } = useContext(LanguageContext);
    const [data, setData] = useState(null);
    const [stats, setStats] = useState({
        totalVideos: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
    });

    useEffect(() => {
        loadStats();
        fetchDashboard();
    }, []);

    const loadStats = async () => {
        try {
            const res = await getDashboardStats();
            setStats(res.data);
        } catch (error) {
            console.log(error);
        }
    };

    const fetchDashboard = async () => {
        try {
            const res = await getDashboard();
            setData(res.data);
        } catch (error) {
            console.log(error);
        }
    };

    if (!data) {
        return (
            <div className="p-8 text-xl" style={{ color: "var(--color-text)" }}>
                Loading...
            </div>
        );
    }

    const statCards = [
        { label: "Total Videos", value: stats.totalVideos },
        { label: "Total Views", value: stats.totalViews },
        { label: "Total Likes", value: stats.totalLikes },
        { label: "Total Comments", value: stats.totalComments },
    ];

    return (
        <div className="p-2">

            <h1
                className="text-4xl font-bold mb-8"
                style={{ color: "var(--color-text)" }}
            >
                📊 {t("nav_dashboard")}
            </h1>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">

                {statCards.map((card, i) => (
                    <div
                        key={card.label}
                        className="rounded-xl p-6 border animate-fade-up"
                        style={{
                            backgroundColor: "var(--color-surface)",
                            borderColor: "var(--color-border)",
                            animationDelay: `${i * 60}ms`,
                        }}
                    >
                        <h3 style={{ color: "var(--color-text-muted)" }}>
                            {card.label}
                        </h3>
                        <p
                            className="text-3xl font-bold mt-1"
                            style={{ color: "var(--color-text)" }}
                        >
                            {card.value}
                        </p>
                    </div>
                ))}

            </div>

            <h2
                className="text-2xl font-bold mt-10 mb-5"
                style={{ color: "var(--color-text)" }}
            >
                Recent Uploads
            </h2>

            <div className="space-y-4">

                {data.videos.map((video) => (

                    <div
                        key={video._id}
                        className="rounded-xl p-5 flex justify-between items-center border media-card"
                        style={{
                            backgroundColor: "var(--color-surface)",
                            borderColor: "var(--color-border)",
                        }}
                    >

                        <div>
                            <h3
                                className="font-semibold text-lg"
                                style={{ color: "var(--color-text)" }}
                            >
                                {video.title}
                            </h3>

                            <p style={{ color: "var(--color-text-muted)" }}>
                                {video.views} Views
                            </p>
                        </div>

                        <p style={{ color: "var(--color-brand)" }}>
                            ❤️ {video.likes}
                        </p>

                    </div>

                ))}

            </div>

        </div>
    );
}

export default Dashboard;
