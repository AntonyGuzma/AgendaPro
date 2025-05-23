import { useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../../contexts/auth";
import { validarCPF } from "../../utils/validarcpf";


function Home() {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [nicho, setNicho] = useState("Cabeleireiro");

  const navigate = useNavigate();
  const { signed, Logout } =  useContext(AuthContext);

  function handle(){
    Logout()
    navigate('/')
  }

  function handleForm(e){
    e.preventDefault();
    
    if (!nome || !cpf || !nicho) {
      alert("Preencha todos os campos.");
      return;
    }

    console.log(validarCPF(cpf))
    console.log(nome, cpf, nicho)
  }

  return (
    <>
      <header
        style={{ display: "flex", justifyContent: "flex-end", padding: "1rem" }}
      >
        {signed ? <p>Usuário autenticado</p> : <p>Usuário não autenticado</p>}
        <button onClick={handle}>Sair</button>
      </header>
      <div className="container py-4">
        <h1 className="text-center">Cadastro de Profissionais</h1>
        <form className="mb-4" onSubmit={handleForm}>
          <div className="mb-3">
            <label className="form-label">Nome</label>
            <input
              type="text"
              className="form-control form-control-sm w-50"
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            ></input>
          </div>
          <div className="row">
            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">CPF</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="CPF"
                maxLength="11"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">Nicho</label>
              <select
                className="form-select form-select-sm"
                value={nicho}
                onChange={(e) => setNicho(e.target.value)}
              >
                <option value="Cabeleireiro">Cabeleireiro</option>
                <option value="Manicure">Manicure</option>
                <option value="Depilador">Depilador</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary">Cadastrar</button>
        </form>
      </div>
    </>
  );
}

export default Home;
