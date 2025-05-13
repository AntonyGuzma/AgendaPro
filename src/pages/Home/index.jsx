import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../contexts/auth";

function Home() {
  const navigate = useNavigate();
  const { signed, Logout } =  useContext(AuthContext);
  console.log('TELA HOME: ', signed)

  function handle(){
    Logout()
    navigate('/')
  }

  return (
    <>
      {signed ? <p>Usuário autenticado</p> : <p>Usuário não autenticado</p>}
      <header style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem' }}>
      <button onClick={handle}>
        Sair
      </button>
    </header>
    </>
  )
}

export default Home;
