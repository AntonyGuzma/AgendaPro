import { useState, useEffect } from 'react';
import { db } from '../../firebaseConnection';
import { collection, query, onSnapshot, enableNetwork, disableNetwork, doc, getDoc } from 'firebase/firestore';
import Header from '../../components/Header';
// comentário só pra testar estratégia de controle de versão  - segundo teste
export default function Atendimentos() {
  const [atendimentos, setAtendimentos] = useState([]);
  const [funcionarios, setFuncionarios] = useState({});
  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().split('T')[0]);
  const [atendimentosPorProfissional, setAtendimentosPorProfissional] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          const funcs = {};
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            funcs[doc.id] = {
              nome: data.nome,
              nicho: data.nicho
            };
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
              const dataFormatada = data.horario ? new Date(data.horario.seconds * 1000).toISOString().split('T')[0] : '';
              
              // Buscar dados do funcionário do cache
              const funcionario = funcionarios[data.profissionalId];
              
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

    if (Object.keys(funcionarios).length > 0) {
      setupListener();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [funcionarios]);

  useEffect(() => {
    const atendimentosFiltrados = atendimentos.filter(atend => 
      atend.dataFormatada === dataFiltro
    );

    const grupoPorProfissao = atendimentosFiltrados.reduce((acc, atend) => {
      const { nicho } = atend;
      if (!acc[nicho]) {
        acc[nicho] = [];
      }
      acc[nicho].push(atend);
      return acc;
    }, {});

    const contagem = {};
    Object.entries(grupoPorProfissao).forEach(([profissao, atendimentos]) => {
      atendimentos.forEach(atend => {
        const key = `${profissao}-${atend.profissionalId}-${atend.profissionalName}`;
        contagem[key] = (contagem[key] || 0) + 1;
      });
    });

    setAtendimentosPorProfissional(contagem);
  }, [atendimentos, dataFiltro]);

  const dadosAgrupados = Object.entries(atendimentosPorProfissional).map(([key, quantidade]) => {
    const [profissao, profissionalId, profissionalName] = key.split('-');
    return {
      id: profissionalId,
      profissao,
      nome: profissionalName,
      quantidade
    };
  }).sort((a, b) => a.profissao.localeCompare(b.profissao));

  const profissaoRowSpans = dadosAgrupados.reduce((acc, dado, i, arr) => {
    if (i === 0 || dado.profissao !== arr[i - 1].profissao) {
      acc[dado.id] = arr.filter(d => d.profissao === dado.profissao).length;
    }
    return acc;
  }, {});

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
            ) : loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Carregando...</span>
                </div>
                <p className="mt-2">Carregando atendimentos...</p>
              </div>
            ) : (
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
                          <tr key={`${dado.id}-${index}`}>
                            {profissaoRowSpans[dado.id] && (
                              <td 
                                className="align-middle" 
                                rowSpan={profissaoRowSpans[dado.id]}
                              >
                                {dado.profissao}
                              </td>
                            )}
                            <td className="align-middle">{dado.nome}</td>
                            <td className="align-middle text-center">
                              <span className="badge bg-secondary">
                                {dado.quantidade}
                              </span>
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
    </>
  );
} 