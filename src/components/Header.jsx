import { Container, Dropdown, Nav, Navbar } from "react-bootstrap";
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
    <Navbar bg="light" expand="lg">
      <Container>
        <Navbar.Brand href={"/home"}><img src={''}></img>Logo</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="m-auto">
            <NavLink to={"/home"}> Home </NavLink>
            <NavLink to={"/painel"}> Painel </NavLink>
            <NavLink to={"/atendimentos"}> Atendimentos </NavLink>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;
