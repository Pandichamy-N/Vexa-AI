import { useContext, useEffect, useState } from "react";
import { FaCrown, FaCheck, FaMusic, FaRobot } from "react-icons/fa";
import { getProfile } from "../services/userService";
import { setPremium } from "../api/userApi";
import { LanguageContext } from "../context/LanguageContext";
import PremiumCheckoutModal from "../components/PremiumCheckoutModal";

const FREE_FEATURES = [
    "Unlimited music & video streaming",
    "AI recommendations & search",
    "Ads between songs",
];

const PREMIUM_FEATURES = [
    "Zero ads, ever",
    "Unlimited music & video streaming",
    "AI recommendations & search",
    "Priority AI response times",
    "Support VEXA directly",
];

function Premium() {

    const { t } = useContext(LanguageContext);
    const [isPremium, setIsPremiumState] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const data = await getProfile();
            setIsPremiumState(Boolean(data.user?.isPremium));
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgraded = () => {
        setIsPremiumState(true);
    };

    const handleCancel = async () => {
        if (!confirm("Cancel Premium? Ads will come back between songs.")) return;
        try {
            setProcessing(true);
            const res = await setPremium(false);
            setIsPremiumState(res.data.isPremium);
        } catch (error) {
            alert(error.response?.data?.message || "Couldn't cancel right now.");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return <p style={{ color: "var(--color-text-muted)" }}>Loading...</p>;
    }

    return (
        <div className="max-w-3xl mx-auto py-4">

            <div className="text-center mb-10">
                <FaCrown className="mx-auto mb-3" size={36} style={{ color: "var(--color-brand)" }} />
                <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
                    VEXA <span className="ai-gradient-text">Premium</span>
                </h1>
                <p style={{ color: "var(--color-text-muted)" }}>
                    Listen and watch without interruptions.
                </p>

                <p
                    className="text-xs mt-3 max-w-md mx-auto"
                    style={{ color: "var(--color-text-faint)" }}
                >
                    Payments are processed securely by Razorpay (UPI, cards, netbanking, wallets). In Test Mode, no real money moves — use Razorpay's published test UPI ID / card to try it.
                </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">

                {/* Free plan */}
                <div
                    className="rounded-2xl p-6 border"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                >
                    <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--color-text)" }}>
                        Free
                    </h2>
                    <p className="text-3xl font-bold mb-4" style={{ color: "var(--color-text)" }}>
                        ₹0
                    </p>

                    <ul className="space-y-3">
                        {FREE_FEATURES.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
                                <FaCheck className="mt-0.5 shrink-0" size={12} style={{ color: "var(--color-text-faint)" }} />
                                {f}
                            </li>
                        ))}
                    </ul>

                    {!isPremium && (
                        <div
                            className="mt-6 text-center text-sm py-2 rounded-lg"
                            style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text-muted)" }}
                        >
                            {t("premium_current_plan")}
                        </div>
                    )}
                </div>

                {/* Premium plan */}
                <div
                    className="ai-panel rounded-2xl p-6 relative overflow-hidden"
                >
                    <span
                        className="absolute top-4 right-4 text-[10px] font-bold px-2 py-1 rounded-full"
                        style={{ backgroundColor: "var(--color-brand)", color: "#ffffff" }}
                    >
                        BEST VALUE
                    </span>

                    <h2 className="text-lg font-semibold mb-1 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                        <FaCrown style={{ color: "var(--color-brand)" }} />
                        Premium
                    </h2>
                    <p className="text-3xl font-bold mb-4" style={{ color: "var(--color-text)" }}>
                        ₹30<span className="text-sm font-normal" style={{ color: "var(--color-text-muted)" }}>/month</span>
                    </p>

                    <ul className="space-y-3">
                        {PREMIUM_FEATURES.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "var(--color-text)" }}>
                                <FaCheck className="mt-0.5 shrink-0" size={12} style={{ color: "#5eead4" }} />
                                {f}
                            </li>
                        ))}
                    </ul>

                    {isPremium ? (
                        <button
                            onClick={handleCancel}
                            disabled={processing}
                            className="w-full mt-6 py-2.5 rounded-lg text-sm border"
                            style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
                        >
                            {processing ? "..." : t("premium_cancel")}
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowCheckout(true)}
                            className="w-full mt-6 py-2.5 rounded-lg text-sm ai-btn"
                        >
                            {t("premium_upgrade")}
                        </button>
                    )}
                </div>

            </div>

            <div className="flex items-center justify-center gap-8 mt-10 text-sm" style={{ color: "var(--color-text-faint)" }}>
                <span className="flex items-center gap-2"><FaMusic /> Video + Music, one app</span>
                <span className="flex items-center gap-2"><FaRobot /> AI in every feature</span>
            </div>

            {showCheckout && (
                <PremiumCheckoutModal
                    onClose={() => setShowCheckout(false)}
                    onUpgraded={handleUpgraded}
                />
            )}

        </div>
    );
}

export default Premium;
