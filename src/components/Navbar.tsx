import { FaPlus, FaUser, FaSun, FaMoon } from "react-icons/fa";
import { SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import { Authenticated, Unauthenticated } from "convex/react";
import { Link, useNavigate } from "react-router-dom";
import CreateDropdown from "./CreateDropDown";
import SearchBar from "./SearchBar";
import { useState } from "react";
import "../styles/Navbar.css";

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') ?? 'light'
  );

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  return { theme, toggle };
}

const Navbar = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { user } = useUser();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="logo-link">
          <div className="logo-container">
            <img src="/cahill-captures.png" alt="Cahill Captures" className="logo-icon" />
            <span className="site-name">Cahill Captures</span>
          </div>
        </Link>
        <SearchBar />

        <div className="nav-actions">
          <button className="theme-toggle" onClick={toggle} title="Toggle dark mode">
            {theme === 'dark' ? <FaSun /> : <FaMoon />}
          </button>
          <Unauthenticated>
            <SignInButton mode="modal">
              <button className="sign-in-button">Sign In</button>
            </SignInButton>
          </Unauthenticated>
          <Authenticated>
            <div className="dropdown-container">
              <button className="icon-button" onClick={() => setShowDropdown(true)}>
                <FaPlus />
              </button>
              {showDropdown && (
                <CreateDropdown
                  isOpen={showDropdown}
                  onClose={() => setShowDropdown(false)}
                />
              )}
            </div>
            <button
              className="icon-button"
              onClick={() => user?.username && navigate(`/u/${user.username}`)}
              title="View Profile"
            >
              <FaUser />
            </button>
            <UserButton
              appearance={{
                variables: {
                  colorBackground: theme === 'dark' ? '#272729' : '#ffffff',
                }
              }}
            />
          </Authenticated>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;