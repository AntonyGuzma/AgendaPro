import { db } from "../firebaseConnection";
import { collection, doc, updateDoc, addDoc, Timestamp, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useFuncionarios } from "../hooks/useFuncionarios";
import useTime from "../hooks/useTime";
import { formatarTempo } from "../utils/formatarTempo";

export default function TabelaFuncionarios( {profissao} ) {
  // Utilizando o hooks que retorna do firebase os dados em tempo real a cada alteração
  const funcionarios = useFuncionarios(profissao);
  const navigate = useNavigate()

  //Cria uma coleção 'atendimentos' que salva o atendimento do profissional  
  async function registrarAtendimento(profissionalId, profissionalName) {
  const dataAtual = new Date();
  const dataFormatada = dataAtual.toISOString().split('T')[0]; // "2025-05-20"

  await addDoc(collection(db, 'atendimentos'), {
    profissionalId,
    profissionalName,
    data: dataFormatada,
    horario: Timestamp.fromDate(dataAtual)
    });
  }


  async function handleStatusChange(idDoc, nomeDoc,novoStatus) {
    const docRef = doc(db, "funcionarios", idDoc);
    const payload = { status: novoStatus };

    // console.log(idDoc, nomeDoc)
    if (novoStatus === "disponivel") {
      registrarAtendimento(idDoc, nomeDoc)
      payload.ultimoStatusDisponivel = serverTimestamp();
    }

    try {
      await updateDoc(docRef, payload); 
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  }

  //Direcionar para a tela de editar os dados 
  function handleEdit(idDoc) {
    navigate(`/edit-employer/${idDoc}`);
  }

  return (
    <>
    <h1>{profissao}</h1>
    <table className="table table-hover" >
      <thead>
        <tr>
          <th>Nome</th>
          <th></th>
          <th>Status</th>
          <th>Tempo</th>
        </tr>
      </thead>
      <tbody>
        {funcionarios.map((func) => (
            <tr key={func.idDoc}>
            <td>{func.nome}</td>
            <td><button onClick={() => handleEdit(func.idDoc)} className="btn">Editar</button></td>
            <td>
              <select
                value={func.status}
                onChange={(e) => handleStatusChange(func.idDoc, func.nome,e.target.value)}
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
          </tr>
        ))}
      </tbody>
    </table>
    </>
  );
}
