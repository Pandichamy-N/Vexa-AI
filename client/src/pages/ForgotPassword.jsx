import { useState } from "react";
import { forgotPassword } from "../services/authService";
import { Link } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
import VexaLogo from "../components/VexaLogo";

function ForgotPassword() {

    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!email) return;
        setError("");
        setSubmitting(true);
        try {
            await forgotPassword(email);
            // Always shown, regardless of whether the email is
            // registered — the server responds the same way either way
            // so this screen can't be used to check which emails exist.
            setSent(true);
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4" style={{ backgroundColor: "var(--color-ink)" }}>

            <VexaLogo size={44} />

            <LanguageSwitcher variant="full" />

            <div className="p-6 sm:p-8 rounded-2xl w-full max-w-[384px] border" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>

                <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-text)" }}>
                    Forgot password
                </h1>

                {sent ? (
                    <>
                        <p className="text-sm mt-4" style={{ color: "var(--color-text-muted)" }}>
                            If an account exists for <strong>{email}</strong>, we've sent a password reset link to that email. It expires in 30 minutes.
                        </p>
                        <Link to="/login" className="block text-center mt-6 text-sm text-[var(--color-brand)] hover:text-[var(--color-brand-dark)]">
                            Back to login
                        </Link>
                    </>
                ) : (
                    <>
                        <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
                            Enter the email on your account and we'll send you a link to reset your password.
                        </p>

                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                            className="w-full p-3 rounded-lg mb-4 border outline-none" style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        />

                        {error && (
                            <p className="text-sm mb-4" style={{ color: "#f87171" }}>{error}</p>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="brand-btn w-full py-3 rounded-lg disabled:opacity-60"
                        >
                            {submitting ? "Sending..." : "Send reset link"}
                        </button>

                        <p className="text-[var(--color-text-muted)] text-sm mt-4 text-center">
                            <Link to="/login" className="text-[var(--color-brand)] hover:text-[var(--color-brand-dark)]">
                                Back to login
                            </Link>
                        </p>
                    </>
                )}

            </div>

        </div>
    );
}

export default ForgotPassword;
