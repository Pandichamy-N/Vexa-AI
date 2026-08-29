import mongoose from "mongoose";

// One row per search performed. Aggregated for "Most Searched" and used
// as a signal in the trending algorithm (search popularity).
const searchLogSchema = new mongoose.Schema(
    {
        query: {
            type: String,
            required: true,
            trim: true,
        },

        // Lowercased/trimmed for grouping — "React Hooks" and "react hooks"
        // should count as the same search.
        normalizedQuery: {
            type: String,
            required: true,
            index: true,
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        // AI-expanded keywords used for that search, kept for debugging /
        // future re-ranking rather than re-calling AI each time.
        expandedKeywords: {
            type: [String],
            default: [],
        },

        // AI's best guess at the category this search was about — feeds
        // the trending algorithm's "search popularity" signal.
        likelyCategory: {
            type: String,
            default: null,
        },

        resultCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("SearchLog", searchLogSchema);
