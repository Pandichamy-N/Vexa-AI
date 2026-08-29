import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { getMyNotifications, markAllNotificationsRead, markNotificationRead } from "../api/notificationApi";
import { LanguageContext } from "../context/LanguageContext";

function NotificationBell() {

    const { t } = useContext(LanguageContext);
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const panelRef = useRef(null);

    const loggedIn = Boolean(localStorage.getItem("token"));

    useEffect(() => {
        if (!loggedIn) return;
        load();
        const interval = setInterval(load, 60000); // light polling, no websocket infra here
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const load = async () => {
        try {
            const res = await getMyNotifications();
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        } catch (error) {
            console.log(error);
        }
    };

    const handleOpen = () => {
        setOpen(!open);
        if (!open) load();
    };

    const handleItemClick = async (item) => {
        try {
            if (!item.read) {
                await markNotificationRead(item._id);
            }
        } catch (error) {
            console.log(error);
        }
        setOpen(false);
        if (item.video?._id) {
            navigate(`/video/${item.video._id}`);
        }
    };

    const handleMarkAll = async () => {
        try {
            await markAllNotificationsRead();
            load();
        } catch (error) {
            console.log(error);
        }
    };

    if (!loggedIn) {
        return (
            <FaBell className="text-xl" style={{ color: "var(--color-text-muted)" }} />
        );
    }

    return (
        <div className="relative" ref={panelRef}>

            <button onClick={handleOpen} className="relative">
                <FaBell
                    className="text-xl cursor-pointer"
                    style={{ color: "var(--color-text-muted)" }}
                />
                {unreadCount > 0 && (
                    <span
                        className="absolute -top-1.5 -right-1.5 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-semibold"
                        style={{ backgroundColor: "var(--color-brand)", color: "#ffffff" }}
                    >
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div
                    className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto rounded-xl border z-50 animate-fade-up"
                    style={{
                        backgroundColor: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                        boxShadow: "0 16px 40px -12px rgba(0,0,0,0.55)",
                    }}
                >

                    <div
                        className="flex items-center justify-between px-4 py-3 border-b"
                        style={{ borderColor: "var(--color-border)" }}
                    >
                        <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                            {t("notifications")}
                        </span>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAll}
                                className="text-xs"
                                style={{ color: "#5eead4" }}
                            >
                                {t("mark_all_read")}
                            </button>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <p className="p-4 text-sm" style={{ color: "var(--color-text-faint)" }}>
                            {t("no_notifications")}
                        </p>
                    ) : (
                        notifications.map((item) => (
                            <button
                                key={item._id}
                                onClick={() => handleItemClick(item)}
                                className="w-full text-left px-4 py-3 border-b last:border-b-0 flex gap-3 items-start hover:brightness-110"
                                style={{ borderColor: "var(--color-border-soft)" }}
                            >
                                {!item.read && (
                                    <span
                                        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                                        style={{ backgroundColor: "var(--color-ai-to)" }}
                                    />
                                )}
                                <span
                                    className="text-sm"
                                    style={{ color: item.read ? "var(--color-text-muted)" : "var(--color-text)" }}
                                >
                                    {item.message}
                                </span>
                            </button>
                        ))
                    )}

                </div>
            )}

        </div>
    );
}

export default NotificationBell;
