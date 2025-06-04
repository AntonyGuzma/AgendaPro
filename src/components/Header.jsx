import { Dropdown } from "react-bootstrap";
import { FaUserCircle } from "react-icons/fa";
import { AuthContext } from "../contexts/auth";
import { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

// mudança pra testar commit
function Header() {
  const navigate = useNavigate();
  const { Logout } = useContext(AuthContext);

  function Sair() {
    Logout();
    navigate("/");
  }

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary">
      <div className="container-fluid">
        {/* Logo */}
        <NavLink className="navbar-brand" to="/home">
          <img
            src={logo}
            alt="Logo"
            width="40"
            height="32"
            className="d-inline-block align-text-top"
          />
        </NavLink>

        {/* Botão mobile */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Links + Dropdown */}
        <div className="collapse navbar-collapse" id="navbarNav">
          {/* Links de navegação */}
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink
                to="/home"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Início
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/painel"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Painel
              </NavLink>
            </li>
          </ul>

          {/* Dropdown à direita */}
          <div className="dropdown">
            <button
              className="btn btn-secondary dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Usuário
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <button className="dropdown-item" onClick={Sair}>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Header;
