import { useParams } from "react-router-dom";
import videos from "../data/videos";
import { FaEye, FaHeart } from "react-icons/fa";
import { Link } from "react-router-dom";

function VideoDetails() {

    const { id } = useParams();

    const video = videos.find(
        (item) => item.id === Number(id)
    );

    if (!video) {
        return (
            <h1 className="text-3xl font-bold">
                Video Not Found
            </h1>
        );
    }

    return (
        <div className="space-y-8">

            {/* Video Player */}

            <div
                className={`h-[450px] rounded-3xl bg-gradient-to-r ${video.color}
        flex items-center justify-center text-8xl`}
            >
                {video.thumbnail}
            </div>

            {/* Video Info */}

            <div>

                <h1 className="text-4xl font-bold">

                    {video.title}

                </h1>

                <div className="flex gap-10 mt-4 text-gray-400">

                    <span className="flex items-center gap-2">

                        <FaEye />

                        {video.views} Views

                    </span>

                    <span className="flex items-center gap-2">

                        <FaHeart />

                        {video.likes} Likes

                    </span>

                </div>

            </div>
            
            {/* Related Videos */}

            <div>

                <h2 className="text-3xl font-bold mb-6">
                    Related Videos
                </h2>

                <div className="grid grid-cols-2 gap-5">

                    {videos
                        .filter((item) => item.id !== video.id)
                        .map((item) => (

                            <Link
                                key={item.id}
                                to={`/video/${item.id}`}
                            >

                                <div className="bg-zinc-900 rounded-2xl overflow-hidden hover:scale-105 transition duration-300">

                                    <div
                                        className={`h-36 bg-gradient-to-r ${item.color}
              flex items-center justify-center text-5xl`}
                                    >
                                        {item.thumbnail}
                                    </div>

                                    <div className="p-4">

                                        <h3 className="text-lg font-semibold">

                                            {item.title}

                                        </h3>

                                        <p className="text-gray-400 mt-2">

                                            {item.views} Views

                                        </p>

                                    </div>

                                </div>

                            </Link>

                        ))}

                </div>

            </div>

        </div>
    );

}

export default VideoDetails;