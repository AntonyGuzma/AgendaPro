import React, { useContext, useState } from "react"; 
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/auth";

function Login() {
  // criando as variaveis
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { Login } = useContext(AuthContext);
  const navigate = useNavigate();

  async function handleSubmit(e){
    e.preventDefault()

    if(email !== '' && password != ''){
      await Login(email, password)
      .then(() => { navigate("/home") })
    }else{
      alert('Preencha os campos');
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
          <button type="submit" className="btn btn-primary w-100">Entrar</button>
          <Link className="m-auto" to="/register">Não possui conta? Cadastre-se</Link>
        </form>
      </div>
    </div>
  );
}

export default Login;
