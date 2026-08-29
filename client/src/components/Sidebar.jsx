import {
    FaHome,
    FaBolt,
    FaFire,
    FaThLarge,
    FaUpload,
    FaHeart,
    FaHistory,
    FaUser,
    FaVideo,
    FaChartBar,
    FaBookmark,
    FaList,
    FaShieldAlt,
    FaCrown,
    FaTimes,
} from "react-icons/fa";

import { useContext } from "react";
import { NavLink } from "react-router-dom";
import VexaMusicLogo from "./VexaMusicLogo";
import { LanguageContext } from "../context/LanguageContext";

function Sidebar({ onNavigate }) {

    const { t } = useContext(LanguageContext);
    const isAdmin = localStorage.getItem("role") === "admin";

    const menuItems = [
        { icon: <FaHome />, name: t("nav_home"), path: "/" },
        { icon: <FaBolt />, name: t("nav_shorts"), path: "/shorts", highlight: true },
        { icon: <VexaMusicLogo size={17} />, name: t("nav_music"), path: "/music", highlight: true },
        { icon: <FaFire />, name: t("nav_trending"), path: "/trending" },
        { icon: <FaThLarge />, name: t("nav_categories"), path: "/categories" },
        { icon: <FaHeart />, name: t("nav_favorites"), path: "/favorites" },
        { icon: <FaHistory />, name: t("nav_history"), path: "/history" },
        { icon: <FaUpload />, name: t("nav_upload"), path: "/upload" },
        { icon: <FaVideo />, name: t("nav_myuploads"), path: "/myuploads" },
        { icon: <FaChartBar />, name: t("nav_dashboard"), path: "/dashboard" },
        { icon: <FaList />, name: t("nav_playlists"), path: "/playlists" },
        { icon: <FaBookmark />, name: t("nav_watchlater"), path: "/watchlater" },
        { icon: <FaCrown />, name: t("nav_premium"), path: "/premium", highlight: true },
        { icon: <FaUser />, name: t("nav_profile"), path: "/profile" },
        ...(isAdmin ? [{ icon: <FaShieldAlt />, name: t("nav_admin"), path: "/admin" }] : []),
    ];

    return (
        <aside
            className="w-64 min-h-full border-r shrink-0"
            style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
            }}
        >

            {/* Close button — only shows on the mobile/tablet drawer */}
            <div className="flex justify-end p-2.5 lg:p-3 lg:hidden">
                <button
                    onClick={onNavigate}
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text-muted)" }}
                >
                    <FaTimes size={14} />
                </button>
            </div>

            <div className="px-3 pb-3 lg:p-4 lg:pt-4">

                {menuItems.map((item) => (

                    <NavLink
                        key={item.name}
                        to={item.path}
                        end={item.path === "/"}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                            `flex items-center gap-3 lg:gap-4 px-3.5 py-2 lg:px-4 lg:py-3 rounded-xl mb-0.5 lg:mb-1 text-sm transition-colors duration-150 ${
                                isActive ? "font-semibold" : ""
                            }`
                        }
                        style={({ isActive }) =>
                            isActive
                                ? {
                                    backgroundColor: "var(--color-brand-soft)",
                                    color: "var(--color-brand)",
                                }
                                : {
                                    color: item.highlight ? "#5eead4" : "var(--color-text-muted)",
                                }
                        }
                    >
                        <span className="text-base lg:text-lg">{item.icon}</span>
                        <span>{item.name}</span>
                    </NavLink>

                ))}

            </div>

        </aside>
    );
}

export default Sidebar;
