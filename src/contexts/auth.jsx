import { createContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firebaseConnection'

export const AuthContext = createContext();

export function AuthProvider({children}){
  const [user, setUser] = useState(true)
  const [loadAuth, setLoadingAuth] = useState(true)

  // Escutar mudanças no estado de autenticação do usuário com Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (dataUser) => {
    setUser(dataUser); // atualiza o estado do usuário
    setLoadingAuth(false);// só aqui você libera a renderização
    });
    return () => unsubscribe(); // limpa o listener ao desmontar
  })

  async function Login(user, password) {
    setLoadingAuth(true); 

    await signInWithEmailAndPassword(auth, user, password)
    .then((dataUser) => { setUser(dataUser.user) })
    .catch((error) => { console.error("Erro ao logar:", error.message); })
    .finally(() => { setLoadingAuth(false) })
  }

  async function Register(user, password) {
    try{
      setLoadingAuth(true); 
      const dataUser = await createUserWithEmailAndPassword(auth, user, password);
      setUser(dataUser.user);
    } catch(error){
      console.error("Erro ao registrar:", error.message);
    } finally {
      setLoadingAuth(false);
    }
  }

  async function Logout() {
    await signOut(auth)
    .then(() => { setUser(null); })
    .catch((error) => {"Error:", error}) 
  }

  return(
    <AuthContext.Provider value={
      {user,
       signed: !!user,
       loadAuth,
      setUser,
      Login,
      Register,
      Logout}
    }>
      {children}
    </AuthContext.Provider>
  )
}