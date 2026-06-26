import { useTranslation } from "react-i18next";

export default function AboutUs() {
  const { t } = useTranslation();

  return (
    <div className="page-stack about-page">
      <h1 className="about-title">{t("about.title")}</h1>

      <div className="about-card">
        <h2>{t("about.foundedTitle")}</h2>
        <p>{t("about.founded1")}</p>
        <p>{t("about.founded2")}</p>
        <p>{t("about.founded3")}</p>

        <h2>{t("about.missionTitle")}</h2>
        <p>{t("about.mission")}</p>
      </div>

      <p className="about-credit">
        {t("about.credit")}{" "}
        <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer">
          Pexels
        </a>
        .
      </p>
    </div>
  );
}
