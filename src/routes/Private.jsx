import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/auth";
import { Spinner } from "react-bootstrap";

// Rota Privada para gerir permissoes de apenas usuarios com login ativo
function Private({ children }) { 
  const { signed, loadAuth } = useContext(AuthContext);

  if(loadAuth ){
    return <Spinner className="container d-flex justify-content-center mt-4"/>
  }

  return signed ? children : <Navigate to="/"/>
}

export default Private;
