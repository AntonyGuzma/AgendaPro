import React, { useState, useContext } from "react"; 
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/auth";
import { ToastContainer } from "react-toastify";

function Register() {
  // criando as variaveis
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { Register } = useContext(AuthContext);
  const navigate = useNavigate();

  // Função assincrona que cadastra o user no sistema
  const handleSubmit =  async (e) => {
    e.preventDefault();

    if(email !== '' && password != ''){
      await Register(email, password)
      .then(() => { navigate("/home") })
    }else{
      alert('Preencha os campos');
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="container p-4 shadow-sm bg-white rounded col-9 col-sm-5 col-md-4 col-lg-3">
        <h1 className="text-center mb-4">Cadastre-se</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="Digite seu email"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              id="senha"
            />
          </div>
          <button type="submit" className="btn btn-secondary mb-2 w-100">Cadastrar</button>
        </form>
        <ToastContainer/>
          <span>Não possui conta? <Link to="/register"> Cadastre-se</Link></span>
      </div>
    </div>
  );
}

export default Register;
