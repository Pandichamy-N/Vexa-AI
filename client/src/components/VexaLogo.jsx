// Unique VEXA mark: a "V" formed by two converging bars (video + music,
// two content streams becoming one platform), with a play-triangle
// nested exactly where they meet — reads as both a letterform and a
// play button at any size. Used in the Navbar and as the favicon source.
function VexaLogo({ size = 32 }) {

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id="vexa-badge" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#3B82F6" />
                    <stop offset="1" stopColor="#2DD4BF" />
                </linearGradient>
            </defs>

            <rect width="32" height="32" rx="9" fill="url(#vexa-badge)" />

            {/* Left bar of the V */}
            <polygon points="7,6 12.5,6 18,24.5 12.5,24.5" fill="#12100a" />

            {/* Right bar of the V */}
            <polygon points="25,6 19.5,6 14,24.5 19.5,24.5" fill="#12100a" />

            {/* Play triangle nested at the point where the V converges */}
            <polygon points="14.5,20 14.5,27 20.5,23.5" fill="#f5f4f1" />
        </svg>
    );
}

export default VexaLogo;
