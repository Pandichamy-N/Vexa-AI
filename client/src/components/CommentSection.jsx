import { useState } from "react";

function CommentSection() {

    const [comment, setComment] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        console.log(comment);

        setComment("");
    };

    return (

        <div className="mt-10">

            <h2 className="text-2xl font-bold text-white mb-6">
                Comments
            </h2>

            {/* Add Comment */}

            <form
                onSubmit={handleSubmit}
                className="flex gap-3 mb-8"
            >

                <input
                    type="text"
                    placeholder="Write a comment..."
                    value={comment}
                    onChange={(e) =>
                        setComment(e.target.value)
                    }
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white outline-none focus:border-purple-500"
                />

                <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 px-6 rounded-lg text-white font-semibold transition"
                >
                    Post
                </button>

            </form>

            {/* Dummy Comments */}

            <div className="space-y-5">

                <div className="bg-zinc-900 rounded-lg p-4">

                    <h3 className="font-semibold text-white">
                        Pandichamy
                    </h3>

                    <p className="text-gray-400 mt-2">
                        🔥 Super tutorial pa
                    </p>

                </div>

                <div className="bg-zinc-900 rounded-lg p-4">

                    <h3 className="font-semibold text-white">
                        Sandhiya
                    </h3>

                    <p className="text-gray-400 mt-2">
                        ❤️ Nice explanation
                    </p>

                </div>

            </div>

        </div>

    );

}

export default CommentSection;