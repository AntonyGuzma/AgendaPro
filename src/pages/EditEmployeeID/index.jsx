import { useNavigate, useParams } from "react-router-dom"
import Header from "../../components/Header"
import { db } from "../../firebaseConnection";
import { useEffect, useState } from "react";
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";

function EditEmployer() {
  const navigate = useNavigate()
  // 	Pega o id da URL (/editar-funcionario/:id)
  const { id } = useParams();

  const [nome, setNome] = useState('');
  const [nicho, setNicho] = useState('');
  const [cpf, setCpf] = useState('');

  // Executa ao abrir a página
  useEffect(() => {
    async function loadFuncionario() {
      const docRef = doc(db, 'funcionarios', id);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        setNome(data.nome || '');
        setNicho(data.nicho || '');
        setCpf(data.cpf || '');
      } else {
        console.log('Funcionário não encontrado');
      }
    }
    loadFuncionario();
  }, [id]);

  async function handleSave(e) {
    e.preventDefault();

    try{
      const docRef = doc(db, 'funcionarios', id);
      await updateDoc(docRef, 
      {
       nome 
      })
      alert('Dados Alterados')
    } catch(error){
      console.error("Error updating document:", error);
    }
  }

  function handleDelete(idDoc) {
  const docRef = doc(db, "funcionarios", idDoc);
  deleteDoc(docRef)
    .then(() => {
      alert("Funcionário deletado com sucesso!");
      navigate('/home');
    })
    .catch((error) => {
      console.error("Erro ao deletar:", error);
      alert("Erro ao deletar.");
    });
  }

  return (
    <>
    <Header/>
    <div className="container mt-5">
      {cpf ? 
        <form onSubmit={handleSave}>
        <div className="mb-3">
          <label className="form-label">Nome</label>
          <input
            type="text"
            className="form-control"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">CPF</label>
          <input
            type="text"
            className="form-control"
            value={cpf}
            readOnly
            onChange={(e) => setCpf(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Profissão</label>
          <input
            type="text"
            className="form-control"
            value={nicho}
            onChange={(e) => setNicho(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-success me-2">
          Salvar
        </button>
        <button
          type="button"
          className="btn btn-secondary me-2"
          onClick={() => navigate(-1)}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => handleDelete(id)}
        >
          Excluir
        </button>
      </form>
      : 
      navigate('/home')}
      
    </div>
    </>
  )
}

export default EditEmployer
