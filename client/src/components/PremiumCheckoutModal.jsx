import { useState } from "react";
import { FaCrown, FaCheckCircle, FaTimes, FaSpinner, FaShieldAlt } from "react-icons/fa";
import { createOrder, verifyPayment } from "../api/paymentApi";

// Real payment flow via Razorpay — UPI, cards, netbanking, and wallets
// are all handled inside Razorpay's own secure checkout widget (we never
// collect card/UPI details ourselves; that would be both insecure and
// non-compliant). Steps: confirm plan -> Razorpay checkout opens ->
// verifying signature server-side -> success.
const STEPS = { CONFIRM: 0, OPENING: 1, VERIFYING: 2, SUCCESS: 3 };

let razorpayScriptPromise = null;

const loadRazorpayScript = () => {
    if (window.Razorpay) return Promise.resolve(true);

    if (!razorpayScriptPromise) {
        razorpayScriptPromise = new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    }

    return razorpayScriptPromise;
};

function PremiumCheckoutModal({ onClose, onUpgraded }) {

    const [step, setStep] = useState(STEPS.CONFIRM);
    const [error, setError] = useState("");

    const handleStartPayment = async () => {

        setError("");
        setStep(STEPS.OPENING);

        const scriptLoaded = await loadRazorpayScript();

        if (!scriptLoaded) {
            setError("Couldn't load the payment widget. Check your connection and try again.");
            setStep(STEPS.CONFIRM);
            return;
        }

        try {

            const orderRes = await createOrder();
            const { orderId, amount, currency, keyId } = orderRes.data;

            const razorpay = new window.Razorpay({
                key: keyId,
                order_id: orderId,
                amount,
                currency,
                name: "VEXA Premium",
                description: "Monthly subscription — zero ads",
                theme: { color: "#3B82F6" },

                handler: async (response) => {
                    setStep(STEPS.VERIFYING);
                    try {
                        await verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        setStep(STEPS.SUCCESS);
                        onUpgraded?.();
                    } catch (err) {
                        setError(err.response?.data?.message || "Payment succeeded but verification failed. Contact support.");
                        setStep(STEPS.CONFIRM);
                    }
                },

                modal: {
                    ondismiss: () => {
                        // Person closed the Razorpay widget without paying
                        setStep(STEPS.CONFIRM);
                    },
                },
            });

            razorpay.on("payment.failed", () => {
                setError("Payment failed or was declined. You can try again.");
                setStep(STEPS.CONFIRM);
            });

            razorpay.open();

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Couldn't start the payment. Try again in a moment."
            );
            setStep(STEPS.CONFIRM);

        }

    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
            <div
                className="w-full max-w-md rounded-2xl border p-6 relative animate-fade-up"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >

                {step !== STEPS.VERIFYING && step !== STEPS.OPENING && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4"
                        style={{ color: "var(--color-text-faint)" }}
                    >
                        <FaTimes />
                    </button>
                )}

                {/* ================= STEP: CONFIRM PLAN ================= */}
                {step === STEPS.CONFIRM && (
                    <>
                        <FaCrown size={28} className="mb-3" style={{ color: "var(--color-brand)" }} />
                        <h2 className="text-xl font-bold mb-1" style={{ color: "var(--color-text)" }}>
                            Upgrade to VEXA Premium
                        </h2>
                        <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
                            ₹30/month · zero ads · cancel anytime
                        </p>

                        <div
                            className="flex items-start gap-2 text-xs rounded-lg px-3 py-2 mb-5"
                            style={{ backgroundColor: "var(--color-ai-soft)", color: "#5eead4" }}
                        >
                            <FaShieldAlt className="mt-0.5 shrink-0" size={12} />
                            Pay securely via UPI, card, netbanking, or wallet — handled entirely by Razorpay's checkout. VEXA never sees or stores your payment details.
                        </div>

                        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

                        <button
                            onClick={handleStartPayment}
                            className="w-full brand-btn py-2.5 rounded-lg text-sm"
                        >
                            Continue to Payment
                        </button>
                    </>
                )}

                {/* ================= STEP: OPENING RAZORPAY ================= */}
                {step === STEPS.OPENING && (
                    <div className="text-center py-8">
                        <FaSpinner className="mx-auto mb-4 animate-spin" size={28} style={{ color: "var(--color-brand)" }} />
                        <p style={{ color: "var(--color-text)" }}>Opening secure checkout...</p>
                    </div>
                )}

                {/* ================= STEP: VERIFYING ================= */}
                {step === STEPS.VERIFYING && (
                    <div className="text-center py-8">
                        <FaSpinner className="mx-auto mb-4 animate-spin" size={28} style={{ color: "var(--color-brand)" }} />
                        <p style={{ color: "var(--color-text)" }}>Verifying your payment...</p>
                        <p className="text-xs mt-1" style={{ color: "var(--color-text-faint)" }}>This won't take long.</p>
                    </div>
                )}

                {/* ================= STEP: SUCCESS ================= */}
                {step === STEPS.SUCCESS && (
                    <div className="text-center py-4">
                        <FaCheckCircle className="mx-auto mb-4" size={36} style={{ color: "#5eead4" }} />
                        <h2 className="text-xl font-bold mb-1" style={{ color: "var(--color-text)" }}>
                            Welcome to Premium 🎉
                        </h2>
                        <p className="text-sm mb-5" style={{ color: "var(--color-text-muted)" }}>
                            Ads are off. Enjoy VEXA, uninterrupted.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full brand-btn py-2.5 rounded-lg text-sm"
                        >
                            Done
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}

export default PremiumCheckoutModal;
