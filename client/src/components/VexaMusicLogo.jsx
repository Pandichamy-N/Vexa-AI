// A distinct sub-brand mark for VEXA Music — an equalizer/soundwave
// silhouette (unmistakably "music"), badge gradient reversed from the
// main VexaLogo (teal-forward instead of amber-forward) so it reads as
// part of the same family while staying visually its own thing.
function VexaMusicLogo({ size = 32 }) {

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id="vexa-music-badge" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#2DD4BF" />
                    <stop offset="1" stopColor="#3B82F6" />
                </linearGradient>
            </defs>

            <rect width="32" height="32" rx="9" fill="url(#vexa-music-badge)" />

            {/* Equalizer bars */}
            <rect x="8.5" y="13" width="4" height="11" rx="2" fill="#12100a" />
            <rect x="14" y="7" width="4" height="17" rx="2" fill="#12100a" />
            <rect x="19.5" y="11" width="4" height="13" rx="2" fill="#12100a" />
        </svg>
    );
}

export default VexaMusicLogo;
