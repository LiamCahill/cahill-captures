import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { Analytics } from "@vercel/analytics/next"

const Layout = () => {
    return (
        <div className="app-container">
            <Navbar />
            <div className="main-content">
                <Outlet />
                <Analytics />
            </div>
        </div>
    );
};

export default Layout;