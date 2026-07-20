import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./lib/auth.jsx";
import { ProfileProvider } from "./lib/profile.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ProfileProvider>
    </AuthProvider>
  );
}
