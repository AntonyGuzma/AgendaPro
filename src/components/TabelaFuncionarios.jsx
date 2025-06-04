import { db } from "../firebaseConnection";
import { collection, doc, updateDoc, addDoc, Timestamp, serverTimestamp, deleteDoc, query, onSnapshot } from "firebase/firestore";
import { useState, useEffect } from "react";
import { Modal, Button } from 'react-bootstrap';

export default function TabelaFuncionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [atendimentosPorFuncionario, setAtendimentosPorFuncionario] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [nome, setNome] = useState("");
  const [nicho, setNicho] = useState("");
  const [searchNome, setSearchNome] = useState("");
  const [filtroNicho, setFiltroNicho] = useState("");

  // Buscar todos os funcionários
  useEffect(() => {
    try {
      const q = query(collection(db, "funcionarios"));
      const unsub = onSnapshot(q, (querySnapshot) => {
        let funcionariosArray = [];
        querySnapshot.forEach((doc) => {
          funcionariosArray.push({
            ...doc.data(),
            idDoc: doc.id
          });
        });
        setFuncionarios(funcionariosArray);
      });

      return () => unsub();
    } catch (error) {
      console.error("Erro ao configurar listener:", error);
      alert("Erro ao carregar funcionários: " + error.message);
    }
  }, []);

  // Buscar e contar atendimentos
  useEffect(() => {
    try {
      const q = query(collection(db, "atendimentos"));
      const unsub = onSnapshot(q, (querySnapshot) => {
        const contagem = {};
        querySnapshot.forEach((doc) => {
          const atendimento = doc.data();
          const profissionalId = atendimento.profissionalId;
          contagem[profissionalId] = (contagem[profissionalId] || 0) + 1;
        });
        setAtendimentosPorFuncionario(contagem);
      });

      return () => unsub();
    } catch (error) {
      console.error("Erro ao configurar listener de atendimentos:", error);
      alert("Erro ao carregar atendimentos: " + error.message);
    }
  }, []);

  async function handleStatusChange(idDoc, nomeDoc, novoStatus) {
    try {
      const docRef = doc(db, "funcionarios", idDoc);
      const payload = { status: novoStatus };

      // Buscar o status atual antes de atualizar
      const funcionarioAtual = funcionarios.find(f => f.idDoc === idDoc);
      const statusAtual = funcionarioAtual?.status || 'disponivel';

      if (novoStatus === "disponivel") {
        // Só registra atendimento se estava ocupado antes
        if (statusAtual === "ocupado") {
          await registrarAtendimento(idDoc, nomeDoc);
        }
        payload.ultimoStatusDisponivel = serverTimestamp();
      }

      await updateDoc(docRef, payload);
      alert("Status atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status: " + error.message);
    }
  }

  async function registrarAtendimento(profissionalId, profissionalName) {
    try {
      const dataAtual = new Date();
      const dataFormatada = dataAtual.toISOString().split('T')[0];

      await addDoc(collection(db, 'atendimentos'), {
        profissionalId,
        profissionalName,
        data: dataFormatada,
        horario: Timestamp.fromDate(dataAtual)
      });
    } catch (error) {
      console.error("Erro ao registrar atendimento:", error);
      alert("Erro ao registrar atendimento: " + error.message);
    }
  }

  function handleEdit(funcionario) {
    setEditingEmployee(funcionario);
    setNome(funcionario.nome);
    setNicho(funcionario.nicho);
    setShowModal(true);
  }

  async function handleSaveEdit() {
    try {
      const docRef = doc(db, "funcionarios", editingEmployee.idDoc);
      await updateDoc(docRef, {
        nome: nome,
        nicho: nicho
      });
      setShowModal(false);
      setEditingEmployee(null);
      alert("Funcionário atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar funcionário:", error);
      alert("Erro ao atualizar funcionário: " + error.message);
    }
  }

  async function handleDelete(idDoc) {
    if (window.confirm("Tem certeza que deseja excluir este funcionário?")) {
      try {
        await deleteDoc(doc(db, "funcionarios", idDoc));
        alert("Funcionário excluído com sucesso!");
      } catch (error) {
        console.error("Erro ao deletar funcionário:", error);
        alert("Erro ao deletar funcionário: " + error.message);
      }
    }
  }

  // Agrupar e ordenar funcionários
  const funcionariosFiltrados = funcionarios
    .filter(func => {
      const matchNome = func.nome.toLowerCase().includes(searchNome.toLowerCase());
      const matchNicho = !filtroNicho || func.nicho === filtroNicho;
      return matchNome && matchNicho;
    });

  const funcionariosOrdenados = [...funcionariosFiltrados].sort((a, b) => {
    // Primeiro ordena por profissão
    if (a.nicho !== b.nicho) {
      return a.nicho.localeCompare(b.nicho);
    }
    
    // Depois por status (disponível primeiro)
    if (a.status !== b.status) {
      return a.status === "disponivel" ? -1 : 1;
    }
    
    // Por fim, pelo tempo disponível (maior tempo primeiro)
    if (!a.ultimoStatusDisponivel && !b.ultimoStatusDisponivel) return 0;
    if (!a.ultimoStatusDisponivel) return 1;
    if (!b.ultimoStatusDisponivel) return -1;
    return a.ultimoStatusDisponivel.toDate() - b.ultimoStatusDisponivel.toDate();
  });

  // Preparar dados para mesclagem
  const profissaoRowSpans = funcionariosOrdenados.reduce((acc, func, i, arr) => {
    if (i === 0 || func.nicho !== arr[i - 1].nicho) {
      acc[func.idDoc] = arr.filter(f => f.nicho === func.nicho).length;
    }
    return acc;
  }, {});

  // Obter lista única de profissões para o filtro
  const profissoes = [...new Set(funcionarios.map(f => f.nicho))];

  return (
    <div className="container">
      <h2 className="text-center mb-4 fw-semibold">Funcionários</h2>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-6 mb-3">
              <div className="input-group">
                <span className="input-group-text bg-light">🔍</span>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Buscar por nome..."
                  value={searchNome}
                  onChange={(e) => setSearchNome(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="input-group">
                <span className="input-group-text bg-light">👥</span>
                <select
                  className="form-select form-select-sm"
                  value={filtroNicho}
                  onChange={(e) => setFiltroNicho(e.target.value)}
                >
                  <option value="">Todas as profissões</option>
                  {profissoes.map(prof => (
                    <option key={prof} value={prof}>{prof}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {funcionariosOrdenados.length === 0 ? (
            <div className="alert alert-info text-center">
              Nenhum funcionário encontrado com os filtros aplicados.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Profissão</th>
                    <th>Nome</th>
                    <th>Status</th>
                    <th>Tempo</th>
                    <th>Atendimentos</th>
                    <th className="text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {funcionariosOrdenados.map((func, index) => (
                    <tr key={func.idDoc}>
                      {profissaoRowSpans[func.idDoc] && (
                        <td className="align-middle" rowSpan={profissaoRowSpans[func.idDoc]}>{func.nicho}</td>
                      )}
                      <td className="align-middle">{func.nome}</td>
                      <td className="align-middle" style={{width: "200px"}}>
                        <select
                          className="form-select form-select-sm"
                          value={func.status || 'disponivel'}
                          onChange={(e) => handleStatusChange(func.idDoc, func.nome, e.target.value)}
                        >
                          <option value="disponivel">Disponível</option>
                          <option value="ocupado">Ocupado</option>
                          <option value="indisponível">Indisponível</option>
                        </select>
                      </td>
                      <td className="align-middle text-muted">
                        {func.ultimoStatusDisponivel
                          ? `${Math.floor(
                              (Date.now() - func.ultimoStatusDisponivel.toDate().getTime()) / 60000
                            )} min atrás`
                          : "Sem registro"}
                      </td>
                      <td className="align-middle text-center">
                        <span className="badge bg-secondary">
                          {atendimentosPorFuncionario[func.idDoc] || 0}
                        </span>
                      </td>
                      <td className="text-center align-middle">
                        <button 
                          onClick={() => handleEdit(func)} 
                          className="btn btn-light btn-sm me-2"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDelete(func.idDoc)} 
                          className="btn btn-light btn-sm"
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Funcionário</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label text-muted">Nome</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div className="mb-3">
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
        </Modal.Body>
        <Modal.Footer>
        <Button variant="success" onClick={handleSaveEdit}>
            Salvar
          </Button>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          
        </Modal.Footer>
      </Modal>
    </div>
  );
}