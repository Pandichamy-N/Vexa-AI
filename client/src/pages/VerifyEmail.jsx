import { useContext, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { verifyEmailOtp, resendOtp } from "../services/authService";
import { getProfile } from "../services/userService";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { LanguageContext } from "../context/LanguageContext";
import VexaLogo from "../components/VexaLogo";

function VerifyEmail() {

    const { language } = useContext(LanguageContext);
    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email || "";
    const [code, setCode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState("");

    const handleVerify = async () => {

        if (!code.trim()) {
            alert("Enter the code sent to your email");
            return;
        }

        try {

            setSubmitting(true);

            const data = await verifyEmailOtp(email, code.trim());

            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.user?.role || "user");
            localStorage.setItem("userId", data.user?._id || "");

            try {
                const profile = await getProfile();
                if (!profile.user?.onboardingCompleted) {
                    navigate("/onboarding");
                    return;
                }
            } catch (profileError) {
                console.log(profileError);
            }

            navigate("/");

        } catch (error) {

            alert(error.response?.data?.message || "Verification failed");

        } finally {

            setSubmitting(false);

        }

    };

    const handleResend = async () => {

        try {

            setResending(true);
            setResendMessage("");

            await resendOtp(email);

            setResendMessage("A new code has been sent.");

        } catch (error) {

            setResendMessage(error.response?.data?.message || "Couldn't resend the code.");

        } finally {

            setResending(false);

        }

    };

    if (!email) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4" style={{ backgroundColor: "var(--color-ink)" }}>
                <p style={{ color: "var(--color-text)" }}>Nothing to verify — please register or log in first.</p>
                <Link to="/login" className="text-[var(--color-brand)]">Go to Login</Link>
            </div>
        );
    }

    return (

        <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4" style={{ backgroundColor: "var(--color-ink)" }}>

            <VexaLogo size={44} />

            <LanguageSwitcher variant="full" key={language} />

            <div className="p-6 sm:p-8 rounded-2xl w-full max-w-[384px] border" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>

                <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-text)" }}>
                    Verify your email
                </h1>

                <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
                    We sent a 6-digit code to <span style={{ color: "var(--color-text)" }}>{email}</span>
                </p>

                <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                    className="w-full p-3 rounded-lg mb-4 border outline-none text-center text-2xl tracking-[0.5em]"
                    style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />

                <button
                    onClick={handleVerify}
                    disabled={submitting}
                    className="brand-btn w-full py-3 rounded-lg"
                >
                    {submitting ? "Verifying..." : "Verify"}
                </button>

                <div className="text-sm mt-4 text-center" style={{ color: "var(--color-text-muted)" }}>
                    Didn't get a code?{" "}
                    <button
                        onClick={handleResend}
                        disabled={resending}
                        className="text-[var(--color-brand)] hover:text-[var(--color-brand-dark)]"
                    >
                        {resending ? "Sending..." : "Resend"}
                    </button>
                </div>

                {resendMessage && (
                    <p className="text-xs mt-2 text-center" style={{ color: "var(--color-text-faint)" }}>
                        {resendMessage}
                    </p>
                )}

            </div>

        </div>

    );

}

export default VerifyEmail;
