import { createContext, useContext, useEffect, useState } from "react";
import { db } from "../firebaseConnection";
import { collection, onSnapshot } from "firebase/firestore";

// Cria o contexto
const FuncionarioContext = createContext();

// Provider que envolve sua aplicação
export function FuncionarioProvider({ children }) {
  const [funcionarios, setFuncionarios] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "funcionarios"), (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        idDoc: doc.id,
        ...doc.data(),
      }));
      setFuncionarios(lista);
    });

    return () => unsub();
  }, []);

  return (
    <FuncionarioContext.Provider value={{ funcionarios }}>
      {children}
    </FuncionarioContext.Provider>
  );
}

// Hook para acessar o contexto
export function useFuncionarioContext() {
  return useContext(FuncionarioContext);
}
