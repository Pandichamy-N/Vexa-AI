import { Navigate } from "react-router-dom";

// Client-side gate only — the real enforcement is the adminOnly
// middleware on every /api/admin/* route. This just avoids showing a
// non-admin user a dashboard full of requests that will 403.
function AdminRoute({ children }) {

    const role = localStorage.getItem("role");

    if (role !== "admin") {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default AdminRoute;
