import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import Welcome from "../pages/Welcome.jsx";
import SignIn from "../pages/SignIn.jsx";
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
import AboutUs from "../pages/AboutUs.jsx";

// Until real auth lands, gate the app behind a flag the SignIn page sets.
// First launch has no flag, so the app opens on /welcome.
function RequireAuth({ children }) {
  const signedIn = localStorage.getItem("easypeasy:signedIn") === "true";
  return signedIn ? children : <Navigate to="/welcome" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Unauthenticated routes (no AppShell, full screen) */}
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/sign-in" element={<SignIn />} />

      {/* Authenticated routes with AppShell (nav bar, floral border, etc.) */}
      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route path="/" element={<Home />} />
        <Route path="/cooking" element={<CookingHub />} />
        <Route path="/cooking/:recipeId" element={<CookingSession />} />
        <Route path="/cooking/:recipeId/conversation" element={<CookingConversation />} />
        <Route path="/daily-life" element={<DailyLifeHub />} />
        <Route path="/word-bank" element={<WordBank />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Default redirect to home for now; change to /welcome for auth flow */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
