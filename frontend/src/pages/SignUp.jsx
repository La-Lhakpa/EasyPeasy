import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import PinInput from "../components/PinInput.jsx";
import { useAuth } from "../lib/auth.jsx";
import { validateCredentials } from "../lib/auth.jsx";

export default function SignUp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const errorText = (code) => t(`auth.err.${code}`, t("auth.err.generic"));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const invalid = validateCredentials(name, pin);
    if (invalid) {
      setError(errorText(invalid));
      return;
    }
    if (pin !== confirm) {
      setError(errorText("pin_mismatch"));
      return;
    }

    setBusy(true);
    const { error: code } = await signUp(name, pin);
    setBusy(false);

    if (code) {
      setError(errorText(code));
      return;
    }
    // New accounts go through the one-time onboarding assessment, which builds
    // the learner profile used to personalise the rest of the app.
    navigate("/assessment");
  };

  return (
    <div className="auth-page">
      <div className="auth-content">
        <h1>{t("auth.signUpTitle")}</h1>

        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <label className="auth-field">
            <span>{t("auth.nameLabel")}</span>
            <input
              className="auth-text-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("auth.namePlaceholder")}
              autoComplete="off"
              autoFocus
            />
          </label>

          <div className="auth-field">
            <span>{t("auth.createPinLabel")}</span>
            <PinInput value={pin} onChange={setPin} label={t("auth.createPinLabel")} />
          </div>

          <div className="auth-field">
            <span>{t("auth.confirmPinLabel")}</span>
            <PinInput value={confirm} onChange={setConfirm} label={t("auth.confirmPinLabel")} />
          </div>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="auth-button primary" type="submit" disabled={busy}>
            {busy ? <Loader2 size={18} className="spin" aria-hidden="true" /> : t("auth.createAccount")}
          </button>

          <p className="auth-switch">
            {t("auth.haveAccount")} <Link to="/sign-in">{t("auth.loginLink")}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
