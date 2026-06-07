import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  GraduationCap,
  ShoppingBasket,
  Soup,
  Stethoscope,
  Volume2
} from "lucide-react";
import ActionButton from "../components/ActionButton.jsx";
import PageHeader from "../components/PageHeader.jsx";
import ProgressCard from "../components/ProgressCard.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import recipes from "../data/recipes.json";
import userProgress from "../data/userProgress.json";

const quickStarts = [
  { label: "Cooking", to: "/cooking", icon: Soup, tone: "sage" },
  { label: "Doctor Visit", to: "/daily-life/doctor-visit", icon: Stethoscope, tone: "coral" },
  { label: "Parent Teacher Meeting", to: "/daily-life/parent-teacher-meeting", icon: GraduationCap, tone: "sun" },
  { label: "Grocery Store", to: "/daily-life/grocery-store", icon: ShoppingBasket, tone: "teal" },
  { label: "Emergency", to: "/daily-life/emergency", icon: AlertTriangle, tone: "rose" }
];

export default function Home() {
  const continueRecipe = recipes.find((recipe) => recipe.id === userProgress.continuePractice.recipeId);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Welcome back"
        title={`Hello, ${userProgress.name}`}
        subtitle="Let's practice together."
      />

      <ProgressCard
        title={userProgress.continuePractice.title}
        subtitle={userProgress.continuePractice.step}
        progress={userProgress.continuePractice.progress}
        to="/cooking/making-dal"
        image={continueRecipe?.image}
      />

      <section>
        <SectionHeader title="Quick Start" subtitle="Choose a familiar moment." />
        <div className="quick-grid">
          {quickStarts.map(({ label, to, icon: Icon, tone }) => (
            <Link className={`quick-card ${tone}`} to={to} key={label}>
              <Icon size={24} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="today-card">
        <div>
          <p className="eyebrow">Today's Phrase</p>
          <h2>"I am washing the lentils."</h2>
          <p>Practice it while making dal or rice.</p>
        </div>
        <div className="button-row">
          <ActionButton icon={Volume2} variant="soft">Hear It</ActionButton>
          <ActionButton icon={BookOpen} variant="primary">Practice</ActionButton>
        </div>
      </section>

      <section>
        <SectionHeader title="Recent Activity" />
        <div className="activity-list">
          {userProgress.recentActivity.map((item) => (
            <div className="activity-item" key={item}>
              <CalendarDays size={18} aria-hidden="true" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
