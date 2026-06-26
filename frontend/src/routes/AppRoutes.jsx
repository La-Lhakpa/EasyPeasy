import { Navigate, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../lib/auth.jsx";
import AppShell from "../components/AppShell.jsx";
import Welcome from "../pages/Welcome.jsx";
import SignIn from "../pages/SignIn.jsx";
import SignUp from "../pages/SignUp.jsx";
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

export default function AppRoutes() {
  return (
    <Routes>
      {/* Unauthenticated routes (no AppShell, full screen) */}
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/sign-up" element={<SignUp />} />

      {/* Authenticated routes with AppShell (nav bar, floral border, etc.) */}
      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route path="/" element={<Home />} />
        <Route path="/cooking" element={<CookingHub />} />
        <Route path="/cooking/:recipeId" element={<CookingSession />} />
        <Route path="/cooking/:recipeId/conversation" element={<CookingConversation />} />
        <Route path="/daily-life" element={<DailyLifeHub />} />
        <Route path="/word-bank" element={<WordBank />} />
        <Route path="/review" element={<Review />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Default redirect to home for now; change to /welcome for auth flow */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
