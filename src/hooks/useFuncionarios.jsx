import { useEffect, useState } from "react";
import { db } from "../firebaseConnection";
import { collection, onSnapshot } from "firebase/firestore";

// Hook Responsavel por coletar os dados Snapshot do firebase
export function useFuncionarios(profissao) {
  const [funcionarios, setFuncionarios] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "funcionarios"), (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        idDoc: doc.id,
        ...doc.data(),
      }))

      setFuncionarios(lista);
    });
    
    return () => unsub();
  }, [profissao]);

  return funcionarios;
}