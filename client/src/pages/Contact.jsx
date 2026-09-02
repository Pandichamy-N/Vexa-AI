import { useEffect, useState } from "react";
import { FaEnvelope, FaCheckCircle } from "react-icons/fa";
import { submitContactMessage } from "../api/contactApi";
import { getProfile } from "../services/userService";

function Contact() {

    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Prefill from the logged-in profile, if there is one — guests
        // can still use this form, just typing their own details in.
        const token = localStorage.getItem("token");
        if (!token) return;

        getProfile()
            .then((data) => {
                setForm((f) => ({ ...f, name: data.user?.name || "", email: data.user?.email || "" }));
            })
            .catch(() => {});
    }, []);

    const handleChange = (field, value) => {
        setForm((f) => ({ ...f, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            setSubmitting(true);
            await submitContactMessage(form);
            setSent(true);
        } catch (err) {
            setError(err.response?.data?.message || "Couldn't send your message — please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (sent) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-24 px-4 text-center" style={{ color: "var(--color-text)" }}>
                <FaCheckCircle size={48} style={{ color: "#5eead4" }} />
                <h1 className="text-2xl font-bold">Message sent</h1>
                <p style={{ color: "var(--color-text-muted)" }}>
                    Thanks for reaching out — we'll get back to you at {form.email}.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto p-3 sm:p-4 md:p-6 text-[var(--color-text)]">

            <div className="flex items-center gap-3 mb-2">
                <FaEnvelope style={{ color: "var(--color-brand)" }} />
                <h1 className="text-2xl sm:text-3xl font-bold">Contact Support</h1>
            </div>
            <p className="mb-6" style={{ color: "var(--color-text-muted)" }}>
                Have a question, found a bug, or need help with your account? Send us a message.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">

                <input
                    type="text"
                    placeholder="Your name"
                    required
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full p-3 rounded-lg border outline-none"
                    style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />

                <input
                    type="email"
                    placeholder="Your email"
                    required
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="w-full p-3 rounded-lg border outline-none"
                    style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />

                <input
                    type="text"
                    placeholder="Subject"
                    required
                    value={form.subject}
                    onChange={(e) => handleChange("subject", e.target.value)}
                    className="w-full p-3 rounded-lg border outline-none"
                    style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />

                <textarea
                    placeholder="How can we help?"
                    required
                    rows={6}
                    value={form.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    className="w-full p-3 rounded-lg border outline-none resize-none"
                    style={{ backgroundColor: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />

                {error && <p className="text-sm" style={{ color: "var(--color-danger)" }}>{error}</p>}

                <button
                    type="submit"
                    disabled={submitting}
                    className="brand-btn w-full py-3 rounded-lg"
                >
                    {submitting ? "Sending..." : "Send message"}
                </button>

            </form>

        </div>
    );
}

export default Contact;
