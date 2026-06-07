import { Outlet } from "react-router-dom";
import BottomNavigation from "./BottomNavigation.jsx";

export default function AppShell() {
  return (
    <div className="app-shell">
      <aside className="desktop-brand">
        <div className="brand-mark">EP</div>
        <div>
          <strong>EasyPeasy</strong>
          <span>Practice English gently</span>
        </div>
      </aside>
      <main className="app-content">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
}
