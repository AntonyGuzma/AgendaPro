import { useFuncionarioContext } from "../contexts/FuncionarioContext"
import { mudarBadge } from "../utils/mudarBadge";

function ListaFuncionarios() {
// Utilizando o AuthContext que retorna do firebase os dados em tempo real a cada alteração
  const { funcionarios } = useFuncionarioContext()


  // Separar Todas as Profissoes Existentes em outra lista 
  const profissoes = [...new Set(funcionarios.map(func => func.nicho))];
  console.log(profissoes)
  return (
    <div className="container mt-5 d-flex flex-column flex-md-row justify-content-evenly justify-content-xl-around">
      {profissoes.map((profissao) => (
        <div key={profissao} className="p-3 mb-4" style={{ minWidth: '300px' }}>
          <h2>{profissao}</h2>
          <table className="table table-borderless">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {funcionarios
                .filter(func => func.nicho === profissao)
                .map(func => (
                  <tr>
                    <td>{func.nome}</td>
                    <td>{mudarBadge(func.status)} </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

export default ListaFuncionarios
