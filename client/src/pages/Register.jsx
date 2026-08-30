import { useContext, useState } from "react";
import { registerUser } from "../services/authService";
import { Link, useNavigate } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { LanguageContext } from "../context/LanguageContext";
import VexaLogo from "../components/VexaLogo";

function Register() {

    const { t, language } = useContext(LanguageContext);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    // Register Function
    const handleRegister = async () => {

        if (!name.trim() || !email.trim() || !password) {
            alert("Please fill all fields");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        try {

            setSubmitting(true);

            const data = await registerUser({
                name,
                email,
                password,
            });

            // Registration no longer logs the person straight in — an
            // email verification code has to be entered first.
            navigate("/verify-email", { state: { email: data.email || email } });

        } catch (error) {

            console.log("Full Error:", error);
            console.log("Response:", error.response);

            alert(error.response?.data?.message || "Registration Failed");

        } finally {

            setSubmitting(false);

        }

    };

    return (

        <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4" style={{ backgroundColor: "var(--color-ink)" }}>

            <VexaLogo size={44} />

            <LanguageSwitcher variant="full" key={language} />

            <div className="p-6 sm:p-8 rounded-2xl w-full max-w-[384px] border" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>

                <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--color-text)" }}>
                    Create your account
                </h1>

                <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
                    Join VEXA
                </p>

                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 rounded-lg mb-4 border outline-none" style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-lg mb-4 border outline-none" style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 rounded-lg mb-4 border outline-none" style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />

                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3 rounded-lg mb-4 border outline-none" style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />

                <button
                    onClick={handleRegister}
                    disabled={submitting}
                    className="brand-btn w-full py-3 rounded-lg"
                >
                    {submitting ? "Creating Account..." : t("register")}
                </button>

                <p className="text-[var(--color-text-muted)] text-sm mt-4 text-center">
                    Already have an account?{" "}
                    <Link to="/login" className="text-[var(--color-brand)] hover:text-[var(--color-brand-dark)]">
                        {t("login")}
                    </Link>
                </p>

            </div>

        </div>

    );

}

export default Register;
