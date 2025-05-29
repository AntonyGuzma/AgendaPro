import { FuncionarioProvider } from "./contexts/FuncionarioContext"
import RoutesApp from "./routes"

function App() {
  return (
      <FuncionarioProvider>
        <RoutesApp/>
      </FuncionarioProvider>
  )
}

export default App
