import { db } from "../firebaseConnection";
import { collection, doc, updateDoc, addDoc, Timestamp, serverTimestamp, deleteDoc, query, onSnapshot, getDoc, getDocs } from "firebase/firestore";
import { useState, useEffect } from "react";
import { IoSearchCircleSharp } from "react-icons/io5";
import { FiTrash2 } from "react-icons/fi";
import { BiEditAlt } from "react-icons/bi";
import { formatarTempo } from "../utils/formatarTempo";
import { notifyError, notifySucess, showConfirmationToast } from "../utils/toasts";

export default function TabelaFuncionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [atendimentosPorFuncionario, setAtendimentosPorFuncionario] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchNome, setSearchNome] = useState("");
  const [searchNicho, setSearchNicho] = useState("");
  
  // Estados para o modal de cliente
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [clienteData, setClienteData] = useState({ nome: '', tipoCliente: '' });
  const [funcionarioParaOcupar, setFuncionarioParaOcupar] = useState(null);
  
  // Estados para o modal de detalhes dos atendimentos
  const [showAtendimentosModal, setShowAtendimentosModal] = useState(false);
  const [atendimentosDetalhados, setAtendimentosDetalhados] = useState([]);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);
  
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
      notifyError("Erro ao carregar funcionários: " + error.message)
    }
  }, []);

  // Buscar e contar atendimentos
  useEffect(() => {
    const q = query(collection(db, "atendimentos"));
    const unsub = onSnapshot(q, (querySnapshot) => {
      const contagem = {};
      // Usar fuso horário local para a data de hoje
      // O zeramento dos atendimentos acontece na virada do dia no fuso horário local
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      const hojeFormatado = `${ano}-${mes}-${dia}`;
      
      querySnapshot.forEach((doc) => {
        const atendimento = doc.data();
        // Verifica se o atendimento é do dia atual
        let dataAtendimento = '';
        if (atendimento.horario && atendimento.horario.toDate) {
          // Usar fuso horário local para a data do atendimento
          const dataAtend = atendimento.horario.toDate();
          const anoAtend = dataAtend.getFullYear();
          const mesAtend = String(dataAtend.getMonth() + 1).padStart(2, '0');
          const diaAtend = String(dataAtend.getDate()).padStart(2, '0');
          dataAtendimento = `${anoAtend}-${mesAtend}-${diaAtend}`;
        } else if (atendimento.data) {
          dataAtendimento = atendimento.data;
        }
        if (dataAtendimento === hojeFormatado) {
          const profissionalId = atendimento.profissionalId;
          contagem[profissionalId] = (contagem[profissionalId] || 0) + 1;
        }
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

  async function registrarAtendimento(profissionalId, clienteNome, tipoCliente) {
    const dataAtual = new Date();
    // Usar fuso horário local para ambos os campos
    const ano = dataAtual.getFullYear();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const dia = String(dataAtual.getDate()).padStart(2, '0');
    const dataFormatada = `${ano}-${mes}-${dia}`;

    await addDoc(collection(db, 'atendimentos'), {
      profissionalId,
      data: dataFormatada,
      horario: Timestamp.fromDate(dataAtual),
      cliente: clienteNome,
      tipoCliente: tipoCliente
    });
  }

  async function handleStatusChange(idDoc, novoStatus) {
    const docRef = doc(db, "funcionarios", idDoc);
    const payload = { status: novoStatus };

    try {
      // Buscar o status atual antes de atualizar
      const docSnap = await getDoc(docRef);
      const statusAtual = docSnap.data().status;

      if (novoStatus === "ocupado") {
        // Se está mudando para ocupado, mostrar modal para capturar dados do cliente
        const funcionario = funcionarios.find(f => f.idDoc === idDoc);
        setFuncionarioParaOcupar(funcionario);
        setShowClienteModal(true);
        return; // Não atualiza o status ainda
      }

      if (novoStatus === "disponivel") {
        // Só registra atendimento e zera o tempo se vier do status 'ocupado'
        if (statusAtual === "ocupado") {
          // Buscar dados do cliente armazenados temporariamente
          const dadosCliente = sessionStorage.getItem(`cliente_${idDoc}`);
          if (dadosCliente) {
            const { nome, tipoCliente } = JSON.parse(dadosCliente);
            await registrarAtendimento(idDoc, nome, tipoCliente);
            sessionStorage.removeItem(`cliente_${idDoc}`); // Limpa os dados temporários
          } else {
            // Fallback: registra sem dados do cliente
            await registrarAtendimento(idDoc, '', '');
          }
          payload.ultimoStatusDisponivel = serverTimestamp();
        }
      }

      await updateDoc(docRef, payload);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      notifyError("Erro ao atualizar status: " + error.message)
    }
  }

  // Função para confirmar dados do cliente e ocupar funcionário
  async function confirmarCliente() {
    if (!clienteData.nome.trim() || !clienteData.tipoCliente) {
      notifyError("Por favor, preencha todos os campos");
      return;
    }

    try {
      const docRef = doc(db, "funcionarios", funcionarioParaOcupar.idDoc);
      
      // Armazena dados do cliente temporariamente
      sessionStorage.setItem(`cliente_${funcionarioParaOcupar.idDoc}`, JSON.stringify(clienteData));
      
      // Atualiza status para ocupado
      await updateDoc(docRef, { status: "ocupado" });
      
      // Limpa o modal
      setShowClienteModal(false);
      setClienteData({ nome: '', tipoCliente: '' });
      setFuncionarioParaOcupar(null);
      
      notifySucess("Funcionário ocupado com sucesso!");
    } catch (error) {
      console.error("Erro ao ocupar funcionário:", error);
      notifyError("Erro ao ocupar funcionário: " + error.message);
    }
  }

  // Função para cancelar ocupação
  function cancelarOcupacao() {
    setShowClienteModal(false);
    setClienteData({ nome: '', tipoCliente: '' });
    setFuncionarioParaOcupar(null);
  }

  // Função para buscar atendimentos detalhados de um funcionário
  async function buscarAtendimentosDetalhados(funcionario) {
    try {
      const q = query(collection(db, "atendimentos"));
      const querySnapshot = await getDocs(q);
      
      const atendimentos = [];
      // Usar fuso horário local para a data de hoje
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      const hojeFormatado = `${ano}-${mes}-${dia}`;
      
      querySnapshot.forEach((doc) => {
        const atendimento = doc.data();
        let dataAtendimento = '';
        
        if (atendimento.horario && atendimento.horario.toDate) {
          // Usar fuso horário local para a data do atendimento
          const dataAtend = atendimento.horario.toDate();
          const anoAtend = dataAtend.getFullYear();
          const mesAtend = String(dataAtend.getMonth() + 1).padStart(2, '0');
          const diaAtend = String(dataAtend.getDate()).padStart(2, '0');
          dataAtendimento = `${anoAtend}-${mesAtend}-${diaAtend}`;
        } else if (atendimento.data) {
          dataAtendimento = atendimento.data;
        }
        
        if (dataAtendimento === hojeFormatado && atendimento.profissionalId === funcionario.idDoc) {
          atendimentos.push({
            id: doc.id,
            ...atendimento,
            horarioFormatado: atendimento.horario?.toDate ? 
              atendimento.horario.toDate().toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }) : 'N/A'
          });
        }
      });
      
      // Ordenar por horário (mais recente primeiro)
      atendimentos.sort((a, b) => {
        if (a.horario?.toDate && b.horario?.toDate) {
          return b.horario.toDate() - a.horario.toDate();
        }
        return 0;
      });
      
      setAtendimentosDetalhados(atendimentos);
      setFuncionarioSelecionado(funcionario);
      setShowAtendimentosModal(true);
    } catch (error) {
      console.error("Erro ao buscar atendimentos:", error);
      notifyError("Erro ao buscar atendimentos: " + error.message);
    }
  }

  // Função para fechar modal de atendimentos
  function fecharModalAtendimentos() {
    setShowAtendimentosModal(false);
    setAtendimentosDetalhados([]);
    setFuncionarioSelecionado(null);
  }

  function handleEdit(funcionario) {
    setEditingEmployee(funcionario);
    setShowModal(true);
  }

  async function handleDelete(idDoc) {
    const confirmarExclusao = async () => {
    const docRef = doc(db, "funcionarios", idDoc);
    try {
      await deleteDoc(docRef);
      notifySucess("Funcionário excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir:", error);
      notifyError("Erro ao excluir funcionário.");
    }
  };

  showConfirmationToast(
    "Tem certeza que deseja excluir este funcionário?",
    confirmarExclusao,
    () => console.log("Exclusão cancelada")
  );
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
      notifySucess('Dados Alterados com sucesso!');
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      notifyError("Erro ao atualizar dados.");
    }
  }

  // 🔧 Agrupar por nicho/função - objetic.entries: retorna array de arrays com pares chave-valor:
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
      // Se ambos são ocupados, ordena pelo tempo
      if (a.status === 'ocupado' && b.status === 'ocupado') {
        const timeA = a.ultimoStatusDisponivel?.toDate()?.getTime() || -1;
        const timeB = b.ultimoStatusDisponivel?.toDate()?.getTime() || -1;
        
        // Se ambos não têm registro, mantém a ordem original
        if (timeA === -1 && timeB === -1) return 0;
        // Se apenas A não tem registro, coloca B na frente
        if (timeA === -1) return 1;
        // Se apenas B não tem registro, coloca A na frente
        if (timeB === -1) return -1;
        
        // Ordena do maior para o menor tempo
        return timeA - timeB;
      }

      // Se só um é ocupado, ele vai pra trás
      if (a.status === 'ocupado') return 1;
      if (b.status === 'ocupado') return -1;

      // Para disponível e indisponível, ordena só pelo tempo
      const timeA = a.ultimoStatusDisponivel?.toDate()?.getTime() || -1;
      const timeB = b.ultimoStatusDisponivel?.toDate()?.getTime() || -1;
      
      // Se ambos não têm registro, mantém a ordem original
      if (timeA === -1 && timeB === -1) return 0;
      // Se apenas A não tem registro, coloca B na frente
      if (timeA === -1) return 1;
      // Se apenas B não tem registro, coloca A na frente
      if (timeB === -1) return -1;
      
      // Ordena do maior para o menor tempo
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
            <span className="input-group-text"><IoSearchCircleSharp className="fs-4"/></span>
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

      <div className="table-responsive container my-4">
      <table className="table table-hover">
        <thead>
          <tr>
            <th>Função</th>
            <th>Nome</th>
            <th>Status</th>
            
            <th className="text-truncate-custom">Atendimentos</th>
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
                    className="form-selec max-w-[150px] form-select-sm text-gray-900 bg-white w-full"
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="ocupado">Ocupado</option>
                    <option value="indisponível">Indisponível</option>
                  </select>
                </td>
                
                <td className="text-center">
                  <button 
                    type="button" 
                    className="btn btn-link p-0 text-decoration-none"
                    onClick={() => buscarAtendimentosDetalhados(func)}
                    disabled={!atendimentosPorFuncionario[func.idDoc] || atendimentosPorFuncionario[func.idDoc] === 0}
                  >
                    {atendimentosPorFuncionario[func.idDoc] || 0} atendimentos
                  </button>
                </td>
                <td>
                  <button type="button" onClick={() => handleEdit(func)} className="btn btn-link me-2">
                    <BiEditAlt />
                  </button>
                  <button type="button" onClick={() => handleDelete(func.idDoc)} className="btn btn-link">
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

      {/* Modal de Cliente */}
      {showClienteModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Ocupar Funcionário</h5>
                <button type="button" className="btn-close" onClick={cancelarOcupacao}></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); confirmarCliente(); }}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nome do Cliente</label>
                    <input
                      type="text"
                      className="form-control"
                      value={clienteData.nome}
                      onChange={(e) => setClienteData({...clienteData, nome: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Tipo de Cliente</label>
                    <select
                      className="form-select"
                      value={clienteData.tipoCliente}
                      onChange={(e) => setClienteData({...clienteData, tipoCliente: e.target.value})}
                      required
                    >
                      <option value="">Selecione um tipo</option>
                      <option value="preferencial">Preferencial</option>
                      <option value="rotatividade">Rotatividade</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">
                    Confirmar
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={cancelarOcupacao}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes dos Atendimentos */}
      {showAtendimentosModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Atendimentos de {funcionarioSelecionado?.nome} - {new Date().toLocaleDateString('pt-BR')}
                </h5>
                <button type="button" className="btn-close" onClick={fecharModalAtendimentos}></button>
              </div>
              <div className="modal-body">
                {atendimentosDetalhados.length === 0 ? (
                  <p className="text-center text-muted">Nenhum atendimento registrado hoje.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Horário</th>
                          <th>Cliente</th>
                          <th>Tipo de Cliente</th>
                        </tr>
                      </thead>
                      <tbody>
                        {atendimentosDetalhados.map((atendimento) => (
                          <tr key={atendimento.id}>
                            <td>{atendimento.horarioFormatado}</td>
                            <td>{atendimento.cliente || 'N/A'}</td>
                            <td>
                              <span className={`badge ${
                                atendimento.tipoCliente === 'preferencial' 
                                  ? 'bg-success' 
                                  : atendimento.tipoCliente === 'rotatividade' 
                                    ? 'bg-primary' 
                                    : 'bg-secondary'
                              }`}>
                                {atendimento.tipoCliente || 'N/A'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={fecharModalAtendimentos}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}