// src/components/LinhaFuncionario.jsx
function LinhaFuncionario({ funcionario, onStatusChange }) {
  function getStatusClass(status) {
    switch (status) {
      case "disponivel":
        return "bg-success text-white";
      case "ocupado":
        return "bg-warning text-dark";
      case "indisponivel":
        return "bg-danger text-white";
      default:
        return "bg-secondary text-white";
    }
  }

  return (
    <tr>
      <td>{funcionario.nome}</td>
      <td>{funcionario.nicho}</td>
      <td>
        <select
          className={`form-select-sm  ${getStatusClass(funcionario.status)}`}
          value={funcionario.status}
          onChange={(e) => onStatusChange(funcionario.idDoc, e.target.value)}
        >
          <option value="disponivel">Disponível</option>
          <option value="ocupado">Ocupado</option>
          <option value="indisponivel">Indisponível</option>
        </select>
      </td>
    </tr>
  );
}

export default LinhaFuncionario;
