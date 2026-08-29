// Seeds the database with a handful of real, publicly embeddable YouTube
// videos so the app has content to browse immediately after setup.
//
// Run with:  npm run seed   (from the server/ directory)
//
// Safe to re-run — it skips any demo video that's already in the DB
// (matched by videoId) instead of creating duplicates.

import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Video from "../models/Video.js";

dotenv.config();

const DEMO_USER = {
    name: "VEXA Demo",
    email: "demo@vexa.app",
    password: "VexaDemo123!",
};

// Real, verified YouTube videos (title/channel/duration confirmed against
// public sources) spanning a few categories, so filtering/search has
// something to work with out of the box.
const DEMO_VIDEOS = [
    {
        videoId: "-uleG_Vecis",
        title: "100+ Computer Science Concepts Explained",
        channel: "Fireship",
        description:
            "A rapid-fire tour of core computer science concepts every developer runs into — from algorithms and data structures to systems and theory — explained in quick, bite-sized bursts.",
        category: "Technology",
        tags: ["computer science", "programming", "fundamentals", "fireship"],
        duration: "13:07",
    },
    {
        videoId: "lkIFF4maKMU",
        title: "100+ JavaScript Concepts you Need to Know",
        channel: "Fireship",
        description:
            "A condensed crash course breaking down over 100 essential JavaScript concepts, from the basics through more advanced language features, for web developers who want a fast refresher.",
        category: "Programming",
        tags: ["javascript", "webdev", "programming", "fireship"],
        duration: "12:23",
    },
    {
        videoId: "erEgovG9WBs",
        title: "100+ Web Development Things you Should Know",
        channel: "Fireship",
        description:
            "A whirlwind introduction to modern web development — covering the browser, the network, frontend and backend concepts — aimed at developers who want the full landscape in one sitting.",
        category: "Programming",
        tags: ["web development", "frontend", "backend", "fireship"],
        duration: "13:18",
    },
    {
        videoId: "iWEgpdVSZyg",
        title: "100 Firebase Tips, Tricks, and Screw-ups",
        channel: "Fireship",
        description:
            "A deep, practical rundown of Firebase — what to use, what to avoid, and the mistakes developers commonly make when building apps on top of it.",
        category: "Technology",
        tags: ["firebase", "backend", "cloud", "fireship"],
        duration: "24:31",
    },
    {
        videoId: "sNhhvQGsMEc",
        title: "The Fermi Paradox — Where Are All The Aliens? (1/2)",
        channel: "Kurzgesagt – In a Nutshell",
        description:
            "An animated exploration of the Fermi Paradox: given how vast and old the universe is, why haven't we found any evidence of other civilizations?",
        category: "Education",
        tags: ["science", "space", "fermi paradox", "kurzgesagt"],
        duration: "7:30",
    },
    {
        videoId: "arj7oStGLkU",
        title: "Inside the Mind of a Master Procrastinator",
        channel: "TED",
        description:
            "Tim Urban's TED Talk on why procrastination doesn't make sense, and what's really going on in the mind of a chronic procrastinator.",
        category: "Education",
        tags: ["ted talk", "productivity", "psychology"],
        duration: "13:54",
    },
];

const run = async () => {

    await connectDB();

    let demoUser = await User.findOne({ email: DEMO_USER.email });

    if (!demoUser) {

        const hashedPassword = await bcrypt.hash(DEMO_USER.password, 10);

        demoUser = await User.create({
            name: DEMO_USER.name,
            email: DEMO_USER.email,
            password: hashedPassword,
            role: "admin",
        });

        console.log(`✅ Created demo user (${DEMO_USER.email}) — role: admin`);

    } else {

        console.log(`ℹ️  Demo user already exists (${DEMO_USER.email})`);

    }

    let created = 0;
    let skipped = 0;

    for (const item of DEMO_VIDEOS) {

        const exists = await Video.findOne({ videoId: item.videoId });

        if (exists) {
            skipped += 1;
            continue;
        }

        await Video.create({
            user: demoUser._id,
            title: item.title,
            description: item.description,
            tags: item.tags,
            channel: item.channel,
            thumbnail: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
            videoUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
            videoId: item.videoId,
            views: 0,
            likes: 0,
            time: "Demo content",
            duration: item.duration,
            category: item.category,
        });

        created += 1;

    }

    console.log(`✅ Seed complete — ${created} video(s) created, ${skipped} already existed.`);
    console.log(`   Demo login: ${DEMO_USER.email} / ${DEMO_USER.password}`);

    await mongoose.disconnect();
    process.exit(0);

};

run().catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
});
