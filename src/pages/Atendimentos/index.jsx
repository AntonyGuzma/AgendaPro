import { useState, useEffect } from 'react';
import { db } from '../../firebaseConnection';
import { collection, query, onSnapshot, enableNetwork, disableNetwork, doc, getDoc, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import Header from '../../components/Header';
import Spinner from '../../components/Spinner'
// comentário só pra testar estratégia de controle de versão  - segundo teste
export default function Atendimentos() {
  const [atendimentos, setAtendimentos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  // Usar fuso horário local para inicializar a data do filtro
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  const dataFiltroInicial = `${ano}-${mes}-${dia}`;
  const [dataFiltro, setDataFiltro] = useState(dataFiltroInicial);
  const [atendimentosPorProfissional, setAtendimentosPorProfissional] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para o modal de detalhes dos atendimentos
  const [showAtendimentosModal, setShowAtendimentosModal] = useState(false);
  const [atendimentosDetalhados, setAtendimentosDetalhados] = useState([]);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);
  const [dataFiltroAtendimento, setDataFiltroAtendimento] = useState('');

  // Função para buscar dados do funcionário
  async function buscarDadosFuncionario(id) {
    try {
      const docRef = doc(db, "funcionarios", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const dados = docSnap.data();
        return {
          nome: dados.nome,
          nicho: dados.nicho
        };
      }
      return null;
    } catch (error) {
      console.error("Erro ao buscar funcionário:", error);
      return null;
    }
  }

  // Função para tentar reconectar ao Firebase
  async function tentarReconectar() {
    try {
      await disableNetwork(db);
      await enableNetwork(db);
      setError(null);
    } catch (err) {
      console.error("Erro ao tentar reconectar:", err);
      setError("Erro de conexão. Clique para tentar novamente.");
    }
  }

  // Carregar dados dos funcionários
  useEffect(() => {
    const carregarFuncionarios = async () => {
      try {
        const q = query(collection(db, "funcionarios"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const funcs = [];
          querySnapshot.forEach((doc) => {
            funcs.push({ idDoc: doc.id, ...doc.data() });
          });
          setFuncionarios(funcs);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Erro ao carregar funcionários:", error);
      }
    };

    carregarFuncionarios();
  }, []);

  // Carregar atendimentos
  useEffect(() => {
    let unsubscribe = null;

    async function setupListener() {
      try {
        setLoading(true);
        setError(null);

        const q = query(collection(db, "atendimentos"));
        unsubscribe = onSnapshot(q, 
          async (querySnapshot) => {
            let atendimentosArray = [];
            
            for (const doc of querySnapshot.docs) {
              const data = doc.data();
              // Usar fuso horário local para formatação da data
              let dataFormatada = '';
              if (data.horario) {
                const dataAtend = new Date(data.horario.seconds * 1000);
                const ano = dataAtend.getFullYear();
                const mes = String(dataAtend.getMonth() + 1).padStart(2, '0');
                const dia = String(dataAtend.getDate()).padStart(2, '0');
                dataFormatada = `${ano}-${mes}-${dia}`;
              } else if (data.data) {
                dataFormatada = data.data;
              }
              
              // Buscar dados do funcionário do cache
              const funcionario = (funcionarios || []).find(f => f.idDoc === data.profissionalId);
              
              if (funcionario) {
                atendimentosArray.push({
                  ...data,
                  dataFormatada,
                  idDoc: doc.id,
                  profissionalName: funcionario.nome,
                  nicho: funcionario.nicho
                });
              } else {
                console.warn('Funcionário não encontrado:', data.profissionalId);
              }
            }
            
            console.log('Total de atendimentos carregados:', atendimentosArray.length);
            setAtendimentos(atendimentosArray);
            setLoading(false);
          },
          (error) => {
            console.error("Erro ao observar atendimentos:", error);
            setError("Erro de conexão. Clique para tentar novamente.");
            setLoading(false);
          }
        );
      } catch (error) {
        console.error("Erro ao configurar listener:", error);
        setError("Erro ao configurar conexão. Clique para tentar novamente.");
        setLoading(false);
      }
    }

    if (funcionarios.length > 0) {
      setupListener();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [funcionarios]);

  // Sempre que dataFiltro ou atendimentos mudar, atualize o agrupamento
  useEffect(() => {
    if (!atendimentos.length) {
      setAtendimentosPorProfissional({});
      return;
    }
    const atendimentosDoDia = atendimentos.filter(atend => atend.data === dataFiltro);
    const contagem = {};
    atendimentosDoDia.forEach(atend => {
      const key = `${atend.profissionalId}-${atend.profissionalName}`;
      contagem[key] = (contagem[key] || 0) + 1;
    });
    setAtendimentosPorProfissional(contagem);
  }, [atendimentos, dataFiltro]);

  const dadosAgrupados = Object.entries(atendimentosPorProfissional).map(([key, quantidade]) => {
    const [profissionalId, profissionalName] = key.split('-');
    const funcionario = (funcionarios || []).find(f => f.idDoc === profissionalId);
    return {
      id: profissionalId,
      nome: profissionalName,
      quantidade,
      nicho: funcionario?.nicho || ''
    };
  });

  const profissaoRowSpans = dadosAgrupados.reduce((acc, dado, i, arr) => {
    if (i === 0 || dado.profissao !== arr[i - 1].profissao) {
      acc[dado.id] = arr.filter(d => d.profissao === dado.profissao).length;
    }
    return acc;
  }, {});

  // Função para buscar atendimentos detalhados de um funcionário
  async function buscarAtendimentosDetalhados(funcionario, profissionalId) {
    // Preenche idDoc se estiver undefined
    if (!funcionario) {
      setAtendimentosDetalhados([]);
      setFuncionarioSelecionado(null);
      setShowAtendimentosModal(true);
      return;
    }
    if (!funcionario.idDoc) {
      // Tenta preencher com id ou profissionalId
      funcionario.idDoc = funcionario.id || profissionalId || '';
    }
    if (!funcionario.idDoc) {
      setAtendimentosDetalhados([]);
      setFuncionarioSelecionado(null);
      setShowAtendimentosModal(true);
      return;
    }
    setDataFiltroAtendimento(dataFiltro.split('-').reverse().join('/'));
    const atendimentosFiltrados = atendimentos.filter(atend =>
      atend.data === dataFiltro && atend.profissionalId === funcionario.idDoc
    );
    const atendimentosOrdenados = atendimentosFiltrados.sort((a, b) => a.horario.localeCompare(b.horario));
    setAtendimentosDetalhados(atendimentosOrdenados);
    setFuncionarioSelecionado(funcionario);
    setShowAtendimentosModal(true);
  }

  // Função para fechar modal de atendimentos
  function fecharModalAtendimentos() {
    setShowAtendimentosModal(false);
    setAtendimentosDetalhados([]);
    setFuncionarioSelecionado(null);
  }

  return (
    <>
      <Header />
      <div className="container py-4">
        <h2 className="text-center mb-4 fw-semibold">Atendimentos</h2>
        
        <div className="card shadow-sm">
          <div className="card-body">
            {error ? (
              <div 
                className="alert alert-danger text-center cursor-pointer" 
                onClick={tentarReconectar}
                style={{ cursor: 'pointer' }}
              >
                {error}
              </div>
            ) : loading ? <Spinner/> : (
              <>
                <div className="row mb-4">
                  <div className="col-md-4">
                    <div className="input-group">
                      <span className="input-group-text bg-light">📅</span>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={dataFiltro}
                        onChange={(e) => setDataFiltro(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Profissão</th>
                        <th>Nome</th>
                        <th className="text-center">Atendimentos no Dia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dadosAgrupados.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center">
                            Nenhum atendimento encontrado para esta data.
                          </td>
                        </tr>
                      ) : (
                        dadosAgrupados.map((dado, index) => (
                          <tr key={dado.id}>
                            <td>{dado.nicho}</td>
                            <td>{dado.nome}</td>
                            <td className="text-center">
                              <button
                                type="button"
                                className="btn btn-link p-0 text-decoration-none"
                                onClick={() => buscarAtendimentosDetalhados({ idDoc: dado.id, nome: dado.nome, nicho: dado.nicho })}
                              >
                                <span className="badge bg-secondary">
                                  {dado.quantidade}
                                </span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes dos Atendimentos */}
      {showAtendimentosModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Atendimentos de {funcionarioSelecionado?.nome} - {dataFiltroAtendimento}
                </h5>
                <button type="button" className="btn-close" onClick={fecharModalAtendimentos}></button>
              </div>
              <div className="modal-body">
                {atendimentosDetalhados.length === 0 ? (
                  <p className="text-center text-muted">Nenhum atendimento registrado nesta data.</p>
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
                          <tr key={atendimento.idDoc}>
                            <td>{atendimento.horario || 'N/A'}</td>
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
    </>
  );
} 