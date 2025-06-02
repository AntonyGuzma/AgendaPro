
export function mudarBadge(status){
    
    switch (status) {
      case "disponivel":
        return <span className="badge bg-success">{status}</span>;
      case "ocupado":
        return <span className="badge bg-warning text-dark">{status}</span>;
      case "indisponivel":
        return <span className="badge bg-danger">{status}</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
}