import { db } from "../firebaseConnection";
import { collection, doc, updateDoc, addDoc, Timestamp, serverTimestamp, deleteDoc, query, onSnapshot } from "firebase/firestore";
import { useState, useEffect } from "react";

export default function TabelaFuncionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [atendimentosPorFuncionario, setAtendimentosPorFuncionario] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchNome, setSearchNome] = useState("");
  const [searchNicho, setSearchNicho] = useState("");

  // Buscar todos os funcionários
  useEffect(() => {
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
  }, []);

  // Buscar e contar atendimentos
  useEffect(() => {
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
  }, []);

  // Função para filtrar funcionários
  const filteredFuncionarios = funcionarios.filter(func => {
    const matchNome = func.nome?.toLowerCase().includes(searchNome.toLowerCase());
    const matchNicho = func.nicho?.toLowerCase().includes(searchNicho.toLowerCase());
    return matchNome && matchNicho;
  });

  async function registrarAtendimento(profissionalId) {
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toISOString().split('T')[0];

    await addDoc(collection(db, 'atendimentos'), {
      profissionalId,
      data: dataFormatada,
      horario: Timestamp.fromDate(dataAtual)
    });
  }

  async function handleStatusChange(idDoc, novoStatus) {
    const docRef = doc(db, "funcionarios", idDoc);
    const payload = { status: novoStatus };

    if (novoStatus === "disponivel") {
      registrarAtendimento(idDoc)
      payload.ultimoStatusDisponivel = serverTimestamp();
    }

    try {
      await updateDoc(docRef, payload);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  }

  function handleEdit(funcionario) {
    setEditingEmployee(funcionario);
    setShowModal(true);
  }

  async function handleDelete(idDoc) {
    if (window.confirm("Tem certeza que deseja excluir este funcionário?")) {
      const docRef = doc(db, "funcionarios", idDoc);
      try {
        await deleteDoc(docRef);
        alert("Funcionário excluído com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir:", error);
        alert("Erro ao excluir funcionário.");
      }
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      const docRef = doc(db, 'funcionarios', editingEmployee.idDoc);
      await updateDoc(docRef, {
        nome: editingEmployee.nome,
        nicho: editingEmployee.nicho
      });
      setShowModal(false);
      alert('Dados Alterados com sucesso!');
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert("Erro ao atualizar dados.");
    }
  }

  return (
    <div className="container">
      <h2 className="mb-4">Funcionários</h2>
      
      {/* Campo de busca */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">🔍</span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nome..."
              value={searchNome}
              onChange={(e) => setSearchNome(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">👥</span>
            <select
              className="form-select"
              value={searchNicho}
              onChange={(e) => setSearchNicho(e.target.value)}
            >
              <option value="">Todas as funções</option>
              <option value="Cabeleireiro">Cabeleireiro</option>
              <option value="Manicure">Manicure</option>
              <option value="Depilador">Depilador</option>
            </select>
          </div>
        </div>
      </div>

      <table className="table table-hover">
        <thead>
          <tr>
            <th>Função</th>
            <th>Nome</th>
            <th>Status</th>
            <th>Tempo</th>
            <th>Quantidade de Atendimentos</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(
            filteredFuncionarios.reduce((groups, func) => {
              const nicho = func.nicho || 'Sem função';
              return {
                ...groups,
                [nicho]: [...(groups[nicho] || []), func],
              };
            }, {})
          )
            .sort(([nichoA], [nichoB]) => nichoA.localeCompare(nichoB))
            .map(([nicho, funcs]) => (
              <>
                {funcs
                  .sort((a, b) => {
                    // Primeiro ordena por status (disponível primeiro)
                    if (a.status !== b.status) {
                      if (a.status === 'disponivel') return -1;
                      if (b.status === 'disponivel') return 1;
                    }
                    
                    // Se ambos estiverem disponíveis, ordena por quem está disponível há mais tempo
                    if (a.status === 'disponivel' && b.status === 'disponivel') {
                      const timeA = a.ultimoStatusDisponivel ? a.ultimoStatusDisponivel.toDate().getTime() : 0;
                      const timeB = b.ultimoStatusDisponivel ? b.ultimoStatusDisponivel.toDate().getTime() : 0;
                      return timeA - timeB; // Ordem crescente - mais antigo primeiro
                    }
                    
                    // Para outros status, mantém a ordem por tempo mais recente
                    const timeA = a.ultimoStatusDisponivel ? a.ultimoStatusDisponivel.toDate().getTime() : 0;
                    const timeB = b.ultimoStatusDisponivel ? b.ultimoStatusDisponivel.toDate().getTime() : 0;
                    return timeB - timeA; // Ordem decrescente para não disponíveis
                  })
                  .map((func, index) => (
                  <tr key={func.idDoc}>
                    {index === 0 && (
                      <td rowSpan={funcs.length} className="align-middle bg-light">
                        {nicho}
                      </td>
                    )}
                    <td>{func.nome}</td>
                    <td>
                      <select
                        value={func.status}
                        onChange={(e) => handleStatusChange(func.idDoc, e.target.value)}
                        className="form-select form-select-sm"
                      >
                        <option value="disponivel">Disponível</option>
                        <option value="ocupado">Ocupado</option>
                        <option value="indisponível">Indisponível</option>
                      </select>
                    </td>
                    <td>
                      {func.ultimoStatusDisponivel
                        ? `${Math.floor(
                          (Date.now() - func.ultimoStatusDisponivel.toDate().getTime()) / 60000
                        )} min atrás`
                        : "Sem registro"}
                    </td>
                    <td className="text-center">
                      {atendimentosPorFuncionario[func.idDoc] || 0} atendimentos
                    </td>
                    <td>
                      <button onClick={() => handleEdit(func)} className="btn btn-link me-2">
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(func.idDoc)} className="btn btn-link">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </>
            ))}
        </tbody>
      </table>

      {/* Modal de Edição */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Editar Funcionário</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nome</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingEmployee?.nome || ''}
                      onChange={(e) => setEditingEmployee({...editingEmployee, nome: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">CPF</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingEmployee?.cpf || ''}
                      readOnly
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Função</label>
                    <select
                      className="form-select"
                      value={editingEmployee?.nicho || ''}
                      onChange={(e) => setEditingEmployee({...editingEmployee, nicho: e.target.value})}
                      required
                    >
                      <option value="">Selecione uma função</option>
                      <option value="Cabeleireiro">Cabeleireiro</option>
                      <option value="Manicure">Manicure</option>
                      <option value="Depilador">Depilador</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">
                    Salvar
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
