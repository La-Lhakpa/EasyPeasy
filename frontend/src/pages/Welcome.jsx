import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import illustration from "../assets/images/welcome-illustration.png";

export default function Welcome() {
  const { t } = useTranslation();

  return (
    <div className="welcome-page">
      <div className="welcome-content">
        <p className="welcome-eyebrow">{t("welcome.welcomeTo")}</p>

        <img
          src={illustration}
          alt="A woman reading a book beside a lotus flower and the sun"
          className="welcome-illustration"
        />

        <h1 className="welcome-title">
          <span className="title-easy">Easy</span><span className="title-peasy">Peasy</span>
        </h1>

        <ul className="welcome-bullets">
          <li>{t("welcome.bullet1")}</li>
          <li>{t("welcome.bullet2")}</li>
          <li>{t("welcome.bullet3")}</li>
        </ul>

        <Link to="/sign-up" className="welcome-button">
          {t("welcome.startFree")}
        </Link>
      </div>
    </div>
  );
}
