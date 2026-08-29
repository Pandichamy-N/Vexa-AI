import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

// ================= CORE HELPER =================
// Shared call to the OpenRouter chat completions endpoint used by every
// AI feature in this file. Keeping this in one place means the model
// name, auth, and error handling only need to live in one spot.
const callAI = async (prompt, { temperature = 0.5, max_tokens = 600 } = {}) => {
    try {
        const response = await axios.post(
            OPENROUTER_URL,
            {
                model: MODEL,
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                max_tokens,
                temperature,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data.choices[0].message.content;

    } catch (error) {

        console.error(
            "AI Service Error:",
            error.response?.data || error.message
        );

        throw error;

    }
};

// Strips ```json / ``` fences the model sometimes adds and parses the
// result. Falls back to null instead of throwing so callers can decide
// how to degrade gracefully.
const safeParseJSON = (raw) => {
    if (!raw) return null;

    const cleaned = raw
        .trim()
        .replace(/^```json/i, "")
        .replace(/^```/, "")
        .replace(/```$/, "")
        .trim();

    try {
        return JSON.parse(cleaned);
    } catch (error) {
        console.error("AI JSON parse failed:", error.message, "\nRaw:", raw);
        return null;
    }
};

// ================= 1. VIDEO SUMMARY =================
// Returns structured data (not raw markdown) so it can be cached on the
// Video document and reused by the UI, tags, and Q&A context.
export const generateSummary = async (title, description = "") => {

    const prompt = `
You are an AI Educational Assistant for a video platform.

Video Title:
${title}

Video Description:
${description || "(no description provided)"}

Based on the title and description, respond with ONLY a raw JSON object
(no markdown fences, no commentary) in exactly this shape:

{
  "summary": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "keyConcepts": ["concept 1", "concept 2", "concept 3"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "difficulty": "Beginner" | "Intermediate" | "Advanced"
}

"summary" must have exactly 5 short bullet points. Keep everything concise.
`;

    const raw = await callAI(prompt, { temperature: 0.6, max_tokens: 600 });
    const parsed = safeParseJSON(raw);

    if (!parsed) {
        // Degrade gracefully: still return something usable rather than
        // failing the whole request if the model didn't return clean JSON.
        return {
            summary: [raw?.slice(0, 500) || "Summary unavailable."],
            keyConcepts: [],
            tags: [],
            difficulty: "",
        };
    }

    return {
        summary: Array.isArray(parsed.summary) ? parsed.summary : [],
        keyConcepts: Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts : [],
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        difficulty: typeof parsed.difficulty === "string" ? parsed.difficulty : "",
    };
};

// ================= 2. UPLOAD SUGGESTIONS (auto-tag/category) =================
// Used on the upload form before the video even exists, so nothing is
// persisted here — the creator reviews and accepts/edits the suggestions.
const ALLOWED_CATEGORIES = [
    "Education",
    "Programming",
    "Gaming",
    "Music",
    "Technology",
    "Entertainment",
    "Sports",
    "General",
];

export const generateUploadSuggestions = async (title, description = "") => {

    const prompt = `
You are helping a creator fill out an upload form for a video platform.

Video Title:
${title}

Video Description:
${description || "(no description provided)"}

Respond with ONLY a raw JSON object (no markdown fences, no commentary) in
exactly this shape:

{
  "category": one of ${JSON.stringify(ALLOWED_CATEGORIES)},
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Pick the single best-fitting category from the list. Tags should be short,
lowercase, and relevant for search/discovery.
`;

    const raw = await callAI(prompt, { temperature: 0.4, max_tokens: 250 });
    const parsed = safeParseJSON(raw);

    if (!parsed) {
        return { category: "General", tags: [] };
    }

    const category = ALLOWED_CATEGORIES.includes(parsed.category)
        ? parsed.category
        : "General";

    return {
        category,
        tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
    };
};

// ================= 3. VIDEO Q&A CHAT =================
// Answers a viewer question grounded only in the video's own title,
// description, and (if available) cached AI summary — it will not
// speculate about content that isn't described anywhere.
export const answerVideoQuestion = async (videoContext, question) => {

    const { title, description, summary } = videoContext;

    const prompt = `
You are an AI assistant answering a viewer's question about a specific video
on a video platform. Only use the context below. If the context doesn't
contain enough information to answer, say so honestly instead of guessing.

Video Title:
${title}

Video Description:
${description || "(no description provided)"}

${summary?.length ? `Video Summary:\n${summary.map((s) => `- ${s}`).join("\n")}` : ""}

Viewer Question:
${question}

Give a direct, concise answer (2-4 sentences). Plain text, no markdown.
`;

    const answer = await callAI(prompt, { temperature: 0.5, max_tokens: 300 });
    return answer.trim();
};

// ================= 5. UPLOAD DESCRIPTION WRITER =================
// Used by the AI YouTube Import flow: oEmbed gives a title but no
// description, so this drafts a short, editable one for the creator.
export const generateVideoDescription = async (title, channel = "") => {

    const prompt = `
Write a short, natural video description (2-3 sentences, plain text, no
markdown, no hashtags) for a video platform listing.

Title: ${title}
${channel ? `Channel: ${channel}` : ""}

The description should tell a viewer what the video covers, in a neutral,
factual tone. Do not invent specific facts, statistics, or claims that
aren't implied by the title.
`;

    const description = await callAI(prompt, { temperature: 0.6, max_tokens: 150 });
    return description.trim();
};

// ================= 6. SITE-WIDE AI CHATBOT =================
// A general assistant that knows about the platform and can recommend
// videos from a small grounding set the caller provides (so it doesn't
// invent titles that don't exist). Distinct from answerVideoQuestion,
// which is scoped to a single video's own content.
export const chatWithAssistant = async (message, history = [], videoContext = []) => {

    const historyText = history
        .slice(-6) // keep prompts small; recent turns matter most
        .map((turn) => `${turn.role === "user" ? "Viewer" : "Assistant"}: ${turn.text}`)
        .join("\n");

    const videoListText = videoContext.length
        ? videoContext
            .map((v) => `- "${v.title}" (${v.category}) by ${v.channel}`)
            .join("\n")
        : "(no videos available)";

    const prompt = `
You are the AI assistant for VEXA, a video and music streaming platform.
You help viewers find videos, understand platform features, and answer
general questions in a friendly, concise way (2-4 sentences unless a list
is clearly better).

Platform features you can tell people about: AI video summaries, an AI
Q&A chat on each video page, AI YouTube import for uploading, and AI
comment moderation.

A sample of videos currently on the platform (only recommend from this
list — never invent a title that isn't here):
${videoListText}

${historyText ? `Recent conversation:\n${historyText}\n` : ""}
Viewer: ${message}

Respond as the Assistant. Plain text, no markdown.
`;

    try {
        const reply = await callAI(prompt, { temperature: 0.6, max_tokens: 300 });
        return reply.trim();
    } catch (error) {
        console.error("Chatbot reply failed — AI call error:", error.response?.data || error.message);
        // A friendly, in-character fallback instead of a raw error/blank
        // reply — keeps the widget usable even if the AI provider is
        // temporarily down, rate-limited, or out of credits.
        return "Sorry, I'm having trouble connecting right now — please try again in a moment.";
    }
};

// ================= 7. TRENDING INSIGHT WRITER =================
// Used by the Trending page: writes a short, honest one-liner explaining
// why a video is currently ranking highly, grounded only in the real
// numbers passed in (never invents claims about the content itself).
export const generateTrendingInsight = async (video) => {

    const { title, category, views, likes, commentCount, hoursSinceUpload } = video;

    const age =
        hoursSinceUpload < 48
            ? `${Math.round(hoursSinceUpload)} hours ago`
            : `${Math.round(hoursSinceUpload / 24)} days ago`;

    const prompt = `
Write ONE short sentence (under 20 words, plain text, no markdown) explaining
why this video is trending right now, based only on the stats given. Be
specific about the stats, not generic.

Title: ${title}
Category: ${category}
Uploaded: ${age}
Views: ${views}
Likes: ${likes}
Comments: ${commentCount}

Do not invent anything about the video's content beyond its title/category.
`;

    const insight = await callAI(prompt, { temperature: 0.5, max_tokens: 60 });
    return insight.trim().replace(/^"|"$/g, "");
};

// ================= 8. SEMANTIC SEARCH QUERY EXPANSION =================
// Not vector-embedding search (that needs a vector index + stored
// embeddings) — this is AI query understanding: it turns a natural,
// possibly vague query into concrete keywords and a likely category, so
// a normal text match can find relevant videos even when the wording
// doesn't literally match the title.
export const expandSearchQuery = async (query) => {

    const prompt = `
A user searched a video platform for: "${query}"

Respond with ONLY a raw JSON object (no markdown fences, no commentary) in
exactly this shape:

{
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "likelyCategory": "Education" | "Programming" | "Gaming" | "Music" | "Technology" | "Entertainment" | "Sports" | "General" | null
}

"keywords" should include the original important terms plus close synonyms
and related concepts a video about this topic would plausibly be titled or
tagged with. Use null for likelyCategory if genuinely unclear.
`;

    // AI query-expansion is an enhancement, not a requirement — if the
    // AI provider is down, out of credits, or rate-limited, search
    // should still work using the literal query rather than failing
    // outright (local DB + live YouTube results still come through).
    let raw;
    try {
        raw = await callAI(prompt, { temperature: 0.3, max_tokens: 150 });
    } catch (error) {
        console.error("Search query expansion skipped — AI call failed:", error.response?.data || error.message);
        return { keywords: [query], likelyCategory: null };
    }

    const parsed = safeParseJSON(raw);

    if (!parsed) {
        return { keywords: [query], likelyCategory: null };
    }

    return {
        keywords: Array.isArray(parsed.keywords) && parsed.keywords.length
            ? parsed.keywords
            : [query],
        likelyCategory: typeof parsed.likelyCategory === "string" ? parsed.likelyCategory : null,
    };
};

// ================= 4. COMMENT MODERATION =================
// Runs before a comment is saved. Flags harassment, hate speech, spam,
// and similar abuse so it never reaches the public comment thread.
export const moderateComment = async (text) => {

    const prompt = `
You are a content moderation classifier for a video platform's comment
section. Classify the comment below.

Comment:
"""${text}"""

Respond with ONLY a raw JSON object (no markdown fences, no commentary) in
exactly this shape:

{
  "flagged": true | false,
  "reason": "short reason, empty string if not flagged"
}

Flag the comment only if it contains harassment, hate speech, threats,
explicit sexual content, or spam/scam links. Do NOT flag ordinary negative
opinions, criticism, or strong-but-non-abusive language.
`;

    try {
        const raw = await callAI(prompt, { temperature: 0, max_tokens: 100 });
        const parsed = safeParseJSON(raw);

        if (!parsed) {
            // If moderation itself fails to parse, fail open (don't block
            // the user) but log it for visibility.
            return { flagged: false, reason: "" };
        }

        return {
            flagged: Boolean(parsed.flagged),
            reason: typeof parsed.reason === "string" ? parsed.reason : "",
        };

    } catch (error) {
        // Never let a moderation-service outage block commenting entirely.
        console.error("Moderation check failed, allowing comment:", error.message);
        return { flagged: false, reason: "" };
    }
};

// ================= VEXA MUSIC: AI "UP NEXT" PICKER =================
// Given the currently-playing track and a shortlist of same-category
// candidates (title/tags only — no audio analysis, the model can't hear
// the songs), asks the LLM to pick and order the best continuation for
// a listening session, the way a human curator sequences a playlist by
// mood/style/energy. Returns an ordered array of candidate ids (a
// subset — never inventing ids not in the list).
export const pickNextTracks = async (currentTrack, candidates) => {

    const candidateList = candidates
        .map((c) => `${c.id} :: "${c.title}" by ${c.channel} [${(c.tags || []).join(", ")}]`)
        .join("\n");

    const prompt = `
You are sequencing an "up next" queue for a music streaming app, the way
a human DJ or curator would — matching mood, energy, and style, not just
genre labels.

Now playing: "${currentTrack.title}" by ${currentTrack.channel} [${(currentTrack.tags || []).join(", ")}]

Candidate tracks (id :: title by channel [tags]):
${candidateList}

Respond with ONLY a raw JSON array (no markdown fences, no commentary) of
up to 8 candidate ids, ordered from best continuation first. Only use ids
that appear above — never invent one. Example: ["abc123", "def456"]
`;

    const raw = await callAI(prompt, { temperature: 0.5, max_tokens: 250 });
    const parsed = safeParseJSON(raw);

    if (!Array.isArray(parsed)) {
        return [];
    }

    const validIds = new Set(candidates.map((c) => c.id));
    return parsed.filter((pid) => typeof pid === "string" && validIds.has(pid));

};
