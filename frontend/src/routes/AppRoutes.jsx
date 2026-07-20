import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../lib/auth.jsx";
import { useProfile } from "../lib/profile.js";
import AppShell from "../components/AppShell.jsx";
import Welcome from "../pages/Welcome.jsx";
import SignIn from "../pages/SignIn.jsx";
import SignUp from "../pages/SignUp.jsx";
import Assessment from "../pages/Assessment.jsx";
import Home from "../pages/Home.jsx";
import CookingHub from "../pages/CookingHub.jsx";
import CookingSession from "../pages/CookingSession.jsx";
import CookingConversation from "../pages/CookingConversation.jsx";
import Profile from "../pages/Profile.jsx";
import WordBank from "../pages/WordBank.jsx";
import Review from "../pages/Review.jsx";
import AboutUs from "../pages/AboutUs.jsx";

// Gate the app behind the auth session. While the session is still resolving
// (Supabase is async), show a brief loader instead of flashing the Welcome page.
function RequireAuth({ children }) {
  const { loading, isSignedIn } = useAuth();
  if (loading) {
    return (
      <div className="auth-loading">
        <Loader2 size={28} className="spin" aria-hidden="true" />
      </div>
    );
  }
  return isSignedIn ? children : <Navigate to="/welcome" replace />;
}

// Gate the main app behind a completed onboarding assessment. A signed-in user
// who hasn't finished it (e.g. navigated straight to "/") is sent to take it
// first, so every learner reaches the app with a profile in place.
function RequireAssessment({ children }) {
  const profile = useProfile();
  return profile.completed ? children : <Navigate to="/assessment" replace />;
}

// Welcome/Sign In/Sign Up always render in English, regardless of a language
// chosen in a previous authenticated session on this device — a first-time
// visitor shouldn't land on a login screen in whatever language someone else
// (or a past session) last picked. AppShell restores the saved language once
// the learner is back inside the authenticated app.
function ForceEnglish({ children }) {
  const { i18n } = useTranslation();
  useEffect(() => {
    if (i18n.language !== "en") i18n.changeLanguage("en");
  }, [i18n]);
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Unauthenticated routes (no AppShell, full screen) */}
      <Route path="/welcome" element={<ForceEnglish><Welcome /></ForceEnglish>} />
      <Route path="/sign-in" element={<ForceEnglish><SignIn /></ForceEnglish>} />
      <Route path="/sign-up" element={<ForceEnglish><SignUp /></ForceEnglish>} />

      {/* One-time onboarding assessment: signed in, but full-screen (no shell). */}
      <Route
        path="/assessment"
        element={
          <RequireAuth>
            <Assessment />
          </RequireAuth>
        }
      />

      {/* Authenticated routes with AppShell (nav bar, floral border, etc.).
          Also gated on a completed assessment so every learner has a profile. */}
      <Route
        element={
          <RequireAuth>
            <RequireAssessment>
              <AppShell />
            </RequireAssessment>
          </RequireAuth>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/cooking" element={<CookingHub />} />
        <Route path="/cooking/:recipeId" element={<CookingSession />} />
        <Route path="/cooking/:recipeId/conversation" element={<CookingConversation />} />
        <Route path="/word-bank" element={<WordBank />} />
        {/* Legacy link from the Supabase-backed Phrase Bank experiment — both
            save flows now write to the same local store, so send it home. */}
        <Route path="/phrase-bank" element={<Navigate to="/word-bank" replace />} />
        <Route path="/review" element={<Review />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Default redirect to home for now; change to /welcome for auth flow */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
