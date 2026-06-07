import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
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
import PhraseBank from "../pages/PhraseBank.jsx";
import Profile from "../pages/Profile.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
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
        <Route path="/phrase-bank" element={<PhraseBank />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
