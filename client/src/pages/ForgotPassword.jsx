import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/authService";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { LanguageContext } from "../context/LanguageContext";
import VexaLogo from "../components/VexaLogo";

function ForgotPassword() {

    const { language } = useContext(LanguageContext);
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {

        if (!email.trim()) {
            setError("Enter your email");
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            await forgotPassword(email.trim());
            setSent(true);
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
        } finally {
            setSubmitting(false);
        }

    };

    return (

        <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4" style={{ backgroundColor: "var(--color-ink)" }}>

            <VexaLogo size={44} />

            <LanguageSwitcher variant="full" key={language} />

            <div className="p-6 sm:p-8 rounded-2xl w-full max-w-[384px] border" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>

                <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-text)" }}>
                    Forgot password
                </h1>

                {sent ? (
                    <p className="text-sm mt-3" style={{ color: "var(--color-text-muted)" }}>
                        If <span style={{ color: "var(--color-text)" }}>{email}</span> has a VEXA account, a reset link has been sent — check your inbox (and Spam folder).
                    </p>
                ) : (
                    <>
                        <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
                            Enter your email and we'll send you a link to reset your password.
                        </p>

                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                            className="w-full p-3 rounded-lg mb-4 border outline-none"
                            style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        />

                        {error && <p className="text-sm mb-4" style={{ color: "var(--color-danger)" }}>{error}</p>}

                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="brand-btn w-full py-3 rounded-lg"
                        >
                            {submitting ? "Sending..." : "Send reset link"}
                        </button>
                    </>
                )}

                <p className="text-sm mt-4 text-center" style={{ color: "var(--color-text-muted)" }}>
                    <Link to="/login" style={{ color: "var(--color-brand)" }}>Back to Login</Link>
                </p>

            </div>

        </div>

    );

}

export default ForgotPassword;
