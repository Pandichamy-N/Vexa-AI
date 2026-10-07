// Lightweight intent detection for the chatbot. Works for English,
// Tanglish ("anirudh songs podu") and Tamil script, with no AI call —
// so "play / search / open" commands react instantly.
//
// Returns one of:
//   { type: "link",  url }
//   { type: "music", query }
//   { type: "video", query }
//   { type: "chat" }            -> fall through to the normal AI reply

const URL_RE = /(https?:\/\/[^\s]+|www\.[^\s]+)/i;

const QUESTION_START = /^(how|what|why|who|which|when|where|can you explain|does|do|is|are|tell me about|explain)\b/i;

const MUSIC_WORDS = /(\bsongs?\b|\bmusic\b|\bpaadal\b|\bpaatu\b|\bpattu\b|\bpaattu\b|\btrack\b|\bmp3\b|\blyrics?\b|பாடல்|பாட்டு|பாடல|இசை)/i;
const VIDEO_WORDS = /(\bvideos?\b|\bwatch\b|\btrailer\b|\bmovie\b|\bshorts?\b|\bpaaru\b|\bpaar\b|வீடியோ|பாரு|படம்)/i;
const ACTION_WORDS = /(\bplay\b|\bsearch\b|\bfind\b|\bopen\b|\bshow\b|\bput\b|\bplay pannu\b|\bpodu\b|\bpodunga\b|\bpoduga\b|\bpaadu\b|\bpadu\b|\bkaattu\b|\bkaatu\b|\btheduu?\b|\bvenum\b|\bvendum\b|\bkudu\b|\bkudunga\b|\bpannu\b|போடு|போடுங்க|பாடு|காட்டு|தேடு|வேணும்|வேண்டும்|கொடு)/i;

// Words stripped out to leave just the song / video name.
const FILLER = new Set([
    "play", "search", "find", "open", "show", "put", "watch", "me", "my", "please", "pls", "plz",
    "song", "songs", "music", "video", "videos", "shorts", "short", "track", "mp3",
    "a", "an", "the", "for", "to", "of", "on", "in", "some", "any", "lyrics", "lyric",
    "can", "you", "could", "i", "want", "wanna", "need", "like", "listen", "hear",
    "podu", "podunga", "poduga", "paadu", "padu", "paadal", "paatu", "pattu", "paattu", "kaattu", "kaatu",
    "theduu", "thedu", "venum", "vendum", "kudu", "kudunga", "pannu", "paaru", "paar", "enakku", "oru", "ithu",
    "pls", "da", "bro", "pa", "ah", "la", "ku", "kaga", "sollu", "ippo", "ippove", "ipo",
    "போடு", "போடுங்க", "பாடு", "பாடல்", "பாட்டு", "இசை", "வீடியோ", "காட்டு", "தேடு", "வேணும்", "வேண்டும்",
    "கொடு", "பாரு", "படம்", "ஒரு", "எனக்கு", "இப்போ",
]);

const cleanQuery = (text) =>
    text
        .replace(/[?!.,"“”]/g, " ")
        .split(/\s+/)
        .filter((w) => w && !FILLER.has(w.toLowerCase()))
        .join(" ")
        .trim();

export const detectChatIntent = (rawText) => {

    const text = (rawText || "").trim();
    if (!text) return { type: "chat" };

    // 1) A pasted link wins over everything else.
    const urlMatch = text.match(URL_RE);
    if (urlMatch) {
        let url = urlMatch[0].replace(/[),.;]+$/, "");
        if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
        return { type: "link", url };
    }

    // 2) Questions about how things work stay as normal chat.
    if (QUESTION_START.test(text) && !ACTION_WORDS.test(text)) return { type: "chat" };

    const hasMusic = MUSIC_WORDS.test(text);
    const hasVideo = VIDEO_WORDS.test(text);
    const hasAction = ACTION_WORDS.test(text);
    const startsWithPlay = /^(play|paadu|padu|போடு)\b/i.test(text);

    const query = cleanQuery(text);
    if (!query) return { type: "chat" };

    // "song"/"music" words only count if there's an action word, or a
    // clear "<name> songs" shape (so plain chat mentioning music isn't hijacked).
    if (hasMusic && (hasAction || query.split(" ").length <= 5)) {
        return { type: "music", query };
    }

    // "watch ..." / "... paaru" / "... trailer" already imply an action.
    const impliesWatch = /(\bwatch\b|\bpaaru\b|\bpaar\b|\btrailer\b|பாரு)/i.test(text);
    if (hasVideo && (hasAction || impliesWatch)) return { type: "video", query };

    if (startsWithPlay) return { type: "music", query };

    if (/^(search|find|open|show|theduu?|தேடு)\b/i.test(text)) {
        return { type: "video", query };
    }

    return { type: "chat" };
};
