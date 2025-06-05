import { useContext, useState } from "react";
import { AuthContext } from "../../contexts/auth";
import { validarCPF } from "../../utils/validarcpf";
import { db } from "../../firebaseConnection";
import { addDoc, collection } from "firebase/firestore";
import Header from "../../components/Header";
import TabelaFuncionarios from "../../components/TabelaFuncionarios";
import { FiPlus } from "react-icons/fi";

function Home() {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [nicho, setNicho] = useState("Cabeleireiro");
  const { Logout, user } =  useContext(AuthContext);


  async function handleForm(e){
    e.preventDefault();
    
    // Vaerificar valores Nulos
    if (!nome || !cpf || !nicho) {
      alert("Preencha todos os campos.");
      return;
    }

    // Validação do CPF
    if (!validarCPF(cpf)) {
      alert("CPF inválido.");
      return;
    }

    await addDoc(collection(db, "funcionarios"), {
      nome: nome,
      cpf: cpf,
      nicho: nicho,
      status: "disponivel",
      created: new Date(),
      userUid: user?.uid 
    })
    .then(() => {
      console.log("tarefa cadastrada")
      setCpf('')
      setNicho('')
      setNome('')
    })
    .catch((error) => {
      console.log("Error ao registrar: ", error)
    })

    console.log(validarCPF(cpf))
    console.log(nome, cpf, nicho)
  }

  return (
    <>
      <Header/>
      <div className="container-sm py-4">
        <h2 className="text-center mb-4 fw-semibold">Cadastro de Funcionários</h2>
        <div className="card shadow-sm">
          <div className="card-body">
            <form className="mb-0" onSubmit={handleForm}>
              <div className="mb-3">
                <label className="form-label text-muted">Nome</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Digite o nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                ></input>
              </div>
              <div className="row">
                <div className="col-12 col-md-6 mb-3">
                  <label className="form-label text-muted">CPF</label>
                  <input
                    type="text"
                      className="form-control form-control-sm"
                    placeholder="Digite apenas números"
                    maxLength="11"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-6 mb-3">
                  <label className="form-label text-muted">Profissão</label>
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

              <div className="text-center">
                <button type="submit" className="btn btn-success" style={{width: "200px"}}>Cadastrar</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="container my-4">
        <TabelaFuncionarios/>
      </div>
    </>
  );
}

export default Home;
