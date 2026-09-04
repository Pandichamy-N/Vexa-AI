import { useState } from "react";
import { resetPassword } from "../services/authService";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import LanguageSwitcher from "../components/LanguageSwitcher";
import VexaLogo from "../components/VexaLogo";

function ResetPassword() {

    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    const handleSubmit = async () => {
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords don't match.");
            return;
        }

        if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
            setError("Password must be at least 8 characters and include both letters and numbers.");
            return;
        }

        setSubmitting(true);
        try {
            await resetPassword(token, password);
            setDone(true);
            setTimeout(() => navigate("/login"), 2500);
        } catch (err) {
            setError(err.response?.data?.message || "That reset link is invalid or has expired.");
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
                    Reset password
                </h1>

                {done ? (
                    <p className="text-sm mt-4" style={{ color: "var(--color-text-muted)" }}>
                        Your password has been updated. Taking you to login...
                    </p>
                ) : (
                    <>
                        <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
                            Choose a new password for your account.
                        </p>

                        <div className="relative mb-4">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="New password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 pr-11 rounded-lg border outline-none" style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                tabIndex={-1}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                style={{ color: "var(--color-text-muted)" }}
                            >
                                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                            </button>
                        </div>

                        <div className="relative mb-4">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                className="w-full p-3 pr-11 rounded-lg border outline-none" style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword((s) => !s)}
                                tabIndex={-1}
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                style={{ color: "var(--color-text-muted)" }}
                            >
                                {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                            </button>
                        </div>

                        {error && (
                            <p className="text-sm mb-4" style={{ color: "#f87171" }}>{error}</p>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="brand-btn w-full py-3 rounded-lg disabled:opacity-60"
                        >
                            {submitting ? "Updating..." : "Update password"}
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

export default ResetPassword;
