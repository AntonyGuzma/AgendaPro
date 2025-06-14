import { useFuncionarioContext } from "../contexts/FuncionarioContext"
import StatusIndicator from '../utils/badgeStatus'

function ListaFuncionarios() {
// Utilizando o AuthContext que retorna do firebase os dados em tempo real a cada alteração
  const { funcionarios } = useFuncionarioContext()

  // Separar Todas as Profissoes Existentes em outra lista 
  const profissoes = [...new Set(funcionarios.map(func => func.nicho))];
  
  return (      
    <div className="container py-4">
      <h2 className="text-center mb-4 fw-semibold">Painel de Funcionários</h2>
      
      <div className="row g-4">
        {profissoes.map((profissao) => (
          <div key={profissao} className="col-12 col-md-6 col-xl-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h3 className="card-title h5 mb-3">{profissao}</h3>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Nome</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {funcionarios
                        .filter(func => func.nicho === profissao)
                        .sort((a, b) => {
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
                      })
                        .map(func => (
                          <tr key={func.id}>
                            <td>{func.nome}</td>
                            <td>
                              <StatusIndicator status={func.status} />
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ListaFuncionarios;
