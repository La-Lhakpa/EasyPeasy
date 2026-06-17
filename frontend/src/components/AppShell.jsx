import { Outlet } from "react-router-dom";
import { Globe } from "lucide-react";
import BottomNavigation from "./BottomNavigation.jsx";

export default function AppShell() {
  return (
    <div className="app-shell">
      <div className="floral-top" aria-hidden="true" />
      <button className="lang-pill" type="button">
        <Globe size={14} aria-hidden="true" />
        English
      </button>
      <main className="app-content">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
}
