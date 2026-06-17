import { Link } from "react-router-dom";
import illustration from "../assets/images/welcome-illustration.png";

export default function Welcome() {
  return (
    <div className="welcome-page">
      <div className="welcome-content">
        <p className="welcome-eyebrow">Welcome to</p>

        <img
          src={illustration}
          alt="A woman reading a book beside a lotus flower and the sun"
          className="welcome-illustration"
        />

        <h1 className="welcome-title">
          <span className="title-easy">Easy</span><span className="title-peasy">Peasy</span>
        </h1>

        <ul className="welcome-bullets">
          <li>zero judgement</li>
          <li>boost confidence</li>
          <li>gain fluency</li>
        </ul>

        <Link to="/sign-in" className="welcome-button">
          Start Learning Free
        </Link>
      </div>
    </div>
  );
}
