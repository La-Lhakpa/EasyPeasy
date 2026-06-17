import { useNavigate } from "react-router-dom";

export default function SignIn() {
  const navigate = useNavigate();

  function handleAuth() {
    localStorage.setItem("easypeasy:signedIn", "true");
    navigate("/");
  }

  return (
    <div className="auth-page">
      <div className="auth-content">
        <h1>Sign In</h1>

        <div className="auth-card">
          <button
            className="auth-button primary"
            type="button"
            onClick={handleAuth}
          >
            Login
          </button>
          <button
            className="auth-button primary"
            type="button"
            onClick={handleAuth}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
