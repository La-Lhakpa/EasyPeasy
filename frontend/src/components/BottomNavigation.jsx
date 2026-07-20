import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Soup, UserRound, ListTodo } from "lucide-react";

const navItems = [
  { to: "/", label: "nav.home", icon: Home },
  { to: "/cooking", label: "nav.cooking", icon: Soup },
  { to: "/word-bank", label: "nav.phraseBank", icon: ListTodo },
  { to: "/profile", label: "nav.profile", icon: UserRound }
];

export default function BottomNavigation() {
  const { t } = useTranslation();

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
          <span>{t(label)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
