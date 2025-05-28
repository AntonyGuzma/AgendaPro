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
        // Busca apenas pra profissão onde foi passada via props
        .filter((func) => func.nicho === profissao)
        // Ordenar com sort - ocupados ficam em ultimo e disponivel e indisponivel ficam a frente
        .sort((a, b) => {
          if (a.status === "ocupado" && b.status !== "ocupado") return 1;
          if (a.status !== "ocupado" && b.status === "ocupado") return -1;

          if (a.status === "disponivel" && b.status === "disponivel") {
            const aTime = a.ultimoStatusDisponivel?.toDate().getTime() || 0;
            const bTime = b.ultimoStatusDisponivel?.toDate().getTime() || 0;
            return aTime - bTime;
          }

          return 0;
        });

      setFuncionarios(lista);
    });

    return () => unsub();
  }, [profissao]);

  return funcionarios;
}