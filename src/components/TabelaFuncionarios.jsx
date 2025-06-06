import { db } from "../firebaseConnection";
import { collection, doc, updateDoc, addDoc, Timestamp, serverTimestamp, deleteDoc, query, onSnapshot, getDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { FiTrash2 } from "react-icons/fi";
import { BiEditAlt } from "react-icons/bi";
import { formatarTempo } from "../utils/formatarTempo";

export default function TabelaFuncionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [atendimentosPorFuncionario, setAtendimentosPorFuncionario] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchNome, setSearchNome] = useState("");
  const [searchNicho, setSearchNicho] = useState("");
  
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

    try {
      // Buscar o status atual antes de atualizar
      const docSnap = await getDoc(docRef);
      const statusAtual = docSnap.data().status;

      if (novoStatus === "disponivel") {
        // Só registra atendimento e zera o tempo se vier do status 'ocupado'
        if (statusAtual === "ocupado") {
          registrarAtendimento(idDoc);
          payload.ultimoStatusDisponivel = serverTimestamp();
        }
      }

      await updateDoc(docRef, payload);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status: " + error.message);
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

  // 🔧 Agrupar por nicho/função
  const funcionariosAgrupados = Object.entries(
    filteredFuncionarios.reduce((groups, func) => {
      const nicho = func.nicho || 'Sem função';
      if (!groups[nicho]) groups[nicho] = [];
      groups[nicho].push(func);
      return groups;
    }, {})
  ).sort(([a], [b]) => a.localeCompare(b));

  // 🔧 Função de ordenação
  const ordenarFuncionarios = (funcs) => {
    return [...funcs].sort((a, b) => {
      // Primeiro, ordenamos por status com prioridade específica
      if (a.status !== b.status) {
        if (a.status === 'disponivel') return -1;
        if (b.status === 'disponivel') return 1;
        if (a.status === 'indisponível') return -1;
        if (b.status === 'indisponível') return 1;
        return 0;
      }

      // Se chegou aqui, os status são iguais
      // Ordenamos pelo tempo dentro do mesmo status (do maior para o menor)
      const timeA = a.ultimoStatusDisponivel?.toDate()?.getTime() || -1; // -1 para quem não tem registro
      const timeB = b.ultimoStatusDisponivel?.toDate()?.getTime() || -1; // -1 para quem não tem registro
      
      // Se ambos não têm registro, mantém a ordem original
      if (timeA === -1 && timeB === -1) return 0;
      // Se apenas A não tem registro, coloca B na frente
      if (timeA === -1) return 1;
      // Se apenas B não tem registro, coloca A na frente
      if (timeB === -1) return -1;
      
      // Se ambos têm registro, ordena do maior para o menor
      return timeA - timeB;
    });
  };

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
        
        <div className="mt-3 mt-md-0 col-md-6">
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

      <div className="table-responsive">
      <table className="table table-hover">
        <thead>
          <tr>
            <th>Função</th>
            <th>Nome</th>
            <th>Status</th>
            <th>Tempo</th>
            <th className="text-truncate-custom">Quantidade de Atendimentos</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {funcionariosAgrupados.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center">
                Nenhum funcionário encontrado.
              </td>
            </tr>
          ) : (
            funcionariosAgrupados.map(([nicho, funcs]) => {
            const funcsOrdenados = ordenarFuncionarios(funcs);
            
            return funcsOrdenados.map((func, index) => (
              <tr key={func.idDoc}>
                {index === 0 && (
                  <td rowSpan={funcsOrdenados.length}>
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
                <td>{formatarTempo(func.ultimoStatusDisponivel)}</td>
                <td className="text-center">
                  {atendimentosPorFuncionario[func.idDoc] || 0} atendimentos
                </td>
                <td>
                  <button onClick={() => handleEdit(func)} className="btn btn-link me-2">
                    <BiEditAlt />
                  </button>
                  <button onClick={() => handleDelete(func.idDoc)} className="btn btn-link">
                    <FiTrash2 color="red" />
                  </button>
                </td>
              </tr>
            ));
          }))}
        </tbody>
      </table>
      </div>
      

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