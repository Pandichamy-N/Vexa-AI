import { useContext, useState } from "react";
import { loginUser } from "../services/authService";
import { getProfile } from "../services/userService";
import { Link, useNavigate } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { LanguageContext } from "../context/LanguageContext";
import VexaLogo from "../components/VexaLogo";

function Login() {

    const { t, language } = useContext(LanguageContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    // Login Function
    const handleLogin = async () => {
        console.log({
            email,
            password
        });
        try {

            const data = await loginUser({
                email,
                password,
            });

            console.log(data);

            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.user?.role || "user");
            localStorage.setItem("userId", data.user?._id || "");

            // Send first-timers to onboarding, everyone else straight home.
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
            console.log("Full Error:", error);
            console.log("Response:", error.response);

            alert(error.response?.data?.message || "Login Failed");
        }

    };

    return (

        <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4" style={{ backgroundColor: "var(--color-ink)" }}>

            <VexaLogo size={44} />

            <LanguageSwitcher variant="full" key={language} />

            <div className="p-6 sm:p-8 rounded-2xl w-full max-w-[384px] border" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>

                <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--color-text)" }}>
                    Welcome back
                </h1>

                <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
                    Log in to VEXA
                </p>

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

                <button
                    onClick={handleLogin}
                    className="brand-btn w-full py-3 rounded-lg"
                >
                    {t("login")}
                </button>

                <p className="text-[var(--color-text-muted)] text-sm mt-4 text-center">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-[var(--color-brand)] hover:text-[var(--color-brand-dark)]">
                        {t("register")}
                    </Link>
                </p>

            </div>

        </div>

    );

}

export default Login;
