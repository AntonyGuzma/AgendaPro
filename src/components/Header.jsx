import { Container, Dropdown, Nav, Navbar } from "react-bootstrap";
import { FaUserCircle } from "react-icons/fa";
import { AuthContext } from "../contexts/auth";
import { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo-svg.svg";
import { VscAccount } from "react-icons/vsc";
// mudança pra testar commit
function Header() {
  const navigate = useNavigate();
  const { Logout } = useContext(AuthContext);

  function Sair() {
    Logout();
    navigate("/");
  }

  return (
    // Menu hamburguer so aparecer quando tela tiver > "sm"
    <Navbar expand="md" style={{ backgroundColor: "var(--bs-warning-bg-subtle)"}}>
      <Container>
        <Navbar.Brand href={"/home"}><img src={logo} style={{width:"50px", height:"60px"}}></img></Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto d-flex align-items-center">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                `nav-link fs-5 mx-2 text-decoration-none ${
                  isActive ? "fw-semibold text-decoration-underline" : "text-dark"
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/painel"
              className={({ isActive }) =>
                `nav-link fs-5 mx-2 text-decoration-none ${
                  isActive ? "fw-semibold text-decoration-underline" : "text-dark"
                }`
              }
            >
              Painel
            </NavLink>
            <NavLink
              to="/atendimentos"
              className={({ isActive }) =>
                `nav-link fs-5 mx-2 text-decoration-none ${
                  isActive ? "fw-semibold text-decoration-underline" : "text-dark"
                }`
              }
            >
              Atendimentos
            </NavLink>
             {/* Dropdown de Login/Logout */}
            <Dropdown className="mx-2 d-flex justify-content-center justify-content-md-start">
              <Dropdown.Toggle split variant="light" id="dropdown-basic" className="fs-5 px-2 py-1"  style={{ border: "none" ,backgroundColor: "var(--bs-warning-bg-subtle)"}}>
                <VscAccount  className="fs-2"/>
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item onClick={Sair} style={{ backgroundColor: 'transparent', color: 'inherit' }}>Sair</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;
