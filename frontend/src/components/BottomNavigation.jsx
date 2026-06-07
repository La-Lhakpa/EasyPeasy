import { NavLink } from "react-router-dom";
import { BookOpen, Home, Soup, UserRound } from "lucide-react";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/cooking", label: "Cooking", icon: Soup },
  { to: "/daily-life", label: "Daily Life", icon: BookOpen },
  { to: "/profile", label: "Me", icon: UserRound }
];

export default function BottomNavigation() {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          end={to === "/"}
        >
          <Icon size={22} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
