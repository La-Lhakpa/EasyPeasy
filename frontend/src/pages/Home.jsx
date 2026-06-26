import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Flame,
  GraduationCap,
  NotebookText,
  RotateCcw,
  ShoppingBasket,
  Soup,
  Sparkles,
  Stethoscope,
  Volume2,
} from "lucide-react";
import ActionButton from "../components/ActionButton.jsx";
import PageHeader from "../components/PageHeader.jsx";
import ProgressCard from "../components/ProgressCard.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import userProgress from "../data/userProgress.json";
import { useSpeak } from "../lib/speech.js";
import { useAuth } from "../lib/auth.jsx";
import {
  getMostRecentInProgress,
  getStats,
  useProgress,
} from "../lib/progress.js";

const TODAYS_PHRASE = "I am washing the lentils.";

export default function Home() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const progress = useProgress();
  const { speak, speaking, activeText } = useSpeak();

  const stats = getStats(progress);
  const resume = getMostRecentInProgress(progress);
  const firstName = (user?.name || userProgress.name).split(" ")[0];

  const quickStarts = [
    { label: "home.cooking", to: "/cooking", icon: Soup, tone: "sage" },
    { label: "home.doctorVisit", to: "/daily-life/doctor-visit", icon: Stethoscope, tone: "coral" },
    { label: "home.parentTeacherMeeting", to: "/daily-life/parent-teacher-meeting", icon: GraduationCap, tone: "sun" },
    { label: "home.groceryStore", to: "/daily-life/grocery-store", icon: ShoppingBasket, tone: "teal" },
    { label: "home.emergency", to: "/daily-life/emergency", icon: AlertTriangle, tone: "rose" },
  ];

  return (
    <div className="page-stack">
      <PageHeader eyebrow={t("home.welcomeBack")} title={t("home.hello", { name: firstName })} />

      {/* Live progress — earned by cooking */}
      <section className="stat-row">
        <div className="stat-chip">
          <Flame size={20} aria-hidden="true" />
          <strong>{stats.streak}</strong>
          <span>{t("home.dayStreak")}</span>
        </div>
        <div className="stat-chip">
          <NotebookText size={20} aria-hidden="true" />
          <strong>{stats.phrasesLearned}</strong>
          <span>{t("home.phrasesLearned")}</span>
        </div>
        <div className="stat-chip">
          <Soup size={20} aria-hidden="true" />
          <strong>{stats.recipesCompleted}</strong>
          <span>{t("home.recipesCooked")}</span>
        </div>
      </section>

      {/* Spaced-repetition nudge */}
      {stats.phrasesDue > 0 && (
        <Link to="/review" className="review-card">
          <RotateCcw size={22} aria-hidden="true" />
          <div>
            <strong>{t("home.reviewTitle", { count: stats.phrasesDue })}</strong>
            <p>{t("home.reviewBody")}</p>
          </div>
        </Link>
      )}

      {/* Resume where they left off, or invite them to start */}
      {resume ? (
        <ProgressCard
          title={resume.name}
          subtitle={t("home.stepOf", { step: resume.stepIndex + 1, total: resume.total })}
          progress={Math.round(((resume.stepIndex + 1) / Math.max(resume.total, 1)) * 100)}
          to={`/cooking/${resume.name.toLowerCase().replace(/\s+/g, "-")}`}
        />
      ) : (
        <Link to="/cooking" className="start-card">
          <Sparkles size={22} aria-hidden="true" />
          <div>
            <strong>{t("home.startTitle")}</strong>
            <p>{t("home.startBody")}</p>
          </div>
        </Link>
      )}

      <section>
        <SectionHeader title={t("home.quickStart")} subtitle={t("home.quickStartSubtitle")} />
        <div className="quick-grid">
          {quickStarts.map(({ label, to, icon: Icon, tone }) => (
            <Link className={`quick-card ${tone}`} to={to} key={to}>
              <Icon size={24} aria-hidden="true" />
              <span>{t(label)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="today-card">
        <div>
          <p className="eyebrow">{t("home.todaysPhrase")}</p>
          <h2>"{TODAYS_PHRASE}"</h2>
        </div>
        <div className="button-row">
          <ActionButton
            icon={Volume2}
            variant="soft"
            onClick={() => speak(TODAYS_PHRASE)}
          >
            {speaking && activeText === TODAYS_PHRASE ? t("home.playing") : t("home.hearIt")}
          </ActionButton>
          <Link className="primary-link" to="/cooking">
            <BookOpen size={18} aria-hidden="true" />
            {t("home.practice")}
          </Link>
        </div>
      </section>

      <section>
        <SectionHeader title={t("home.recentActivity")} />
        <div className="activity-list">
          {(progress.recent.length > 0
            ? progress.recent.map((r) => r.text)
            : userProgress.recentActivity
          ).map((item) => (
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
