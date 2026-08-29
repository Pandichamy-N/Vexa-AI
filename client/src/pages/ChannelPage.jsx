import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getChannelVideos } from "../api/videoApi";
import { LanguageContext } from "../context/LanguageContext";

function ChannelPage() {

    const { t } = useContext(LanguageContext);

    const { userId } = useParams();

    const [videos, setVideos] = useState([]);

    useEffect(() => {
        fetchChannelVideos();
    }, [userId]);

    const fetchChannelVideos = async () => {
        try {
            const res = await getChannelVideos(userId);
            setVideos(res.data.videos);
        } catch (err) {
            console.log(err);
        }
    };

    if (videos.length === 0) {
        return (
            <div className="text-[var(--color-text)] p-8">
                No videos found.
            </div>
        );
    }

    const channel = videos[0];

    return (
        <div className="p-6 text-[var(--color-text)]">

            {/* Channel Header */}
            <div className="bg-[var(--color-surface)] rounded-xl p-6 mb-8">

                <div className="flex items-center gap-5">

                    <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center text-3xl font-bold">
                        {channel.channel.charAt(0)}
                    </div>

                    <div>
                        <h1 className="text-3xl font-bold">
                            {channel.channel}
                        </h1>

                        <p className="text-[var(--color-text-muted)] mt-2">
                            {videos.length} {t("nav_myuploads_short")}
                        </p>
                    </div>

                </div>

            </div>

            {/* Videos */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {videos.map((video) => (

                    <Link
                        key={video._id}
                        to={`/video/${video._id}`}
                    >
                        <div className="bg-[var(--color-surface)] rounded-xl overflow-hidden hover:scale-105 transition">

                            <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-full h-48 object-cover"
                            />

                            <div className="p-4">

                                <h2 className="font-semibold">
                                    {video.title}
                                </h2>

                                <p className="text-[var(--color-text-muted)] text-sm mt-2">
                                    {video.views} Views • {video.time}
                                </p>

                            </div>

                        </div>
                    </Link>

                ))}

            </div>

        </div>
    );
}

export default ChannelPage;