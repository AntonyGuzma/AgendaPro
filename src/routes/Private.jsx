import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/auth";

// Rota Privada para gerir permissoes de apenas usuarios com login ativo
function Private({ children }) { 
  const { signed, loadAuth } = useContext(AuthContext);

  if(loadAuth ){
    return <div>carregando...</div>
  }

  return signed ? children : <Navigate to="/"/>
}

export default Private;
