import { useContext, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { resetPassword } from "../services/authService";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { LanguageContext } from "../context/LanguageContext";
import VexaLogo from "../components/VexaLogo";

function ResetPassword() {

    const { language } = useContext(LanguageContext);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get("token") || "";
    const email = searchParams.get("email") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {

        setError("");

        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        try {
            setSubmitting(true);
            await resetPassword(email, token, password);
            alert("Password reset — please log in with your new password.");
            navigate("/login");
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
        } finally {
            setSubmitting(false);
        }

    };

    if (!token || !email) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4" style={{ backgroundColor: "var(--color-ink)" }}>
                <p style={{ color: "var(--color-text)" }}>This reset link is invalid.</p>
                <Link to="/forgot-password" style={{ color: "var(--color-brand)" }}>Request a new one</Link>
            </div>
        );
    }

    return (

        <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4" style={{ backgroundColor: "var(--color-ink)" }}>

            <VexaLogo size={44} />

            <LanguageSwitcher variant="full" key={language} />

            <div className="p-6 sm:p-8 rounded-2xl w-full max-w-[384px] border" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>

                <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-text)" }}>
                    Reset password
                </h1>

                <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
                    Choose a new password for <span style={{ color: "var(--color-text)" }}>{email}</span>
                </p>

                <div className="relative mb-4">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="New password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 pr-11 rounded-lg border outline-none"
                        style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--color-text-faint)" }}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                </div>

                <div className="relative mb-4">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        className="w-full p-3 pr-11 rounded-lg border outline-none"
                        style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--color-text-faint)" }}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                        {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                </div>

                {error && <p className="text-sm mb-4" style={{ color: "var(--color-danger)" }}>{error}</p>}

                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="brand-btn w-full py-3 rounded-lg"
                >
                    {submitting ? "Resetting..." : "Reset password"}
                </button>

            </div>

        </div>

    );

}

export default ResetPassword;
