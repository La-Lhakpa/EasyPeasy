import { Navigate, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
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
import DailyLifeHub from "../pages/DailyLifeHub.jsx";
import DoctorVisit from "../pages/DoctorVisit.jsx";
import ParentTeacherMeeting from "../pages/ParentTeacherMeeting.jsx";
import GroceryStore from "../pages/GroceryStore.jsx";
import Pharmacy from "../pages/Pharmacy.jsx";
import Transportation from "../pages/Transportation.jsx";
import Emergency from "../pages/Emergency.jsx";
import Profile from "../pages/Profile.jsx";
import WordBank from "../pages/WordBank.jsx";
import PhraseBank from "../pages/PhraseBank.jsx";
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

export default function AppRoutes() {
  return (
    <Routes>
      {/* Unauthenticated routes (no AppShell, full screen) */}
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/sign-up" element={<SignUp />} />

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
        <Route path="/daily-life" element={<DailyLifeHub />} />
        <Route path="/daily-life/doctor-visit" element={<DoctorVisit />} />
        <Route path="/daily-life/parent-teacher-meeting" element={<ParentTeacherMeeting />} />
        <Route path="/daily-life/grocery-store" element={<GroceryStore />} />
        <Route path="/daily-life/pharmacy" element={<Pharmacy />} />
        <Route path="/daily-life/transportation" element={<Transportation />} />
        <Route path="/daily-life/emergency" element={<Emergency />} />
        <Route path="/word-bank" element={<WordBank />} />
        <Route path="/phrase-bank" element={<PhraseBank />} />
        <Route path="/review" element={<Review />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Default redirect to home for now; change to /welcome for auth flow */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
