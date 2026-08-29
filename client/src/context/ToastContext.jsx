import { createContext, useCallback, useState } from "react";

export const ToastContext = createContext();

let idCounter = 0;

function ToastProvider({ children }) {

    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message, type = "info") => {
        const id = ++idCounter;
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => removeToast(id), 3500);

    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>

            {children}

            {/* Toast stack — bottom-center, above the music player if any */}
            <div
                className="fixed bottom-28 left-1/2 z-[60] flex flex-col-reverse gap-2 items-center pointer-events-none"
                style={{ transform: "translateX(-50%)" }}
            >
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="animate-toast-in flex items-center gap-2 px-4 py-2.5 rounded-full text-sm shadow-lg pointer-events-auto"
                        style={{
                            backgroundColor: "var(--color-surface)",
                            border: `1px solid ${
                                toast.type === "success" ? "#5eead4" :
                                toast.type === "error" ? "var(--color-danger)" :
                                "var(--color-border)"
                            }`,
                            color: "var(--color-text)",
                            boxShadow: "0 12px 30px -10px rgba(0,0,0,0.5)",
                        }}
                    >
                        <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                                backgroundColor:
                                    toast.type === "success" ? "#5eead4" :
                                    toast.type === "error" ? "var(--color-danger)" :
                                    "var(--color-brand)",
                            }}
                        />
                        {toast.message}
                    </div>
                ))}
            </div>

        </ToastContext.Provider>
    );
}

export default ToastProvider;
