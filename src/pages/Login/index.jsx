import React, { useContext, useState } from "react"; 
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/auth";
import { notifyError, notifySucess } from "../../utils/toasts";
import { ToastContainer } from "react-toastify"; 

function Login() {
  // criando as variaveis
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { Login } = useContext(AuthContext);
  const navigate = useNavigate();
  
  async function handleSubmit(e) {
  e.preventDefault();

  if (email.trim() !== '' && password.trim() !== '') {
    try {
      await Login(email, password);
      notifySucess("Logado com sucesso");
      setTimeout(() => navigate("/home"), 3000);
    } catch (error) {
      notifyError("Erro ao fazer login");
      console.error(error);
    }
  } else {
    notifyError("Preencha todos os campos");
  }
}

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="container p-4 shadow-sm bg-white rounded col-9 col-sm-5 col-md-4 col-lg-3">
        <h1 className="text-center mb-4">Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="Digite seu email"
              autoComplete="current-password"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              id="email"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="senha" className="form-label">Senha</label>
            <input
              type="password"
              className="form-control"
              placeholder="*******"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              id="senha"
            />
          </div>
          <button type="submit" className="btn btn-secondary mb-2 w-100">Entrar</button>
          <ToastContainer/>
          <span>Não possui conta? <Link to="/register"> Cadastre-se</Link></span>
        </form>
      </div>
    </div>
  );
}

export default Login;
