import { Routes, Route, BrowserRouter } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Private from "./Private";
import { AuthProvider } from "../contexts/auth";

// Componente com configuração de Roteamento 
function RoutesApp(){
    return(
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                        <Route path="/" element={ <Login/> }></Route>
                        <Route path="/home" element={  <Private> <Home/> </Private>  }></Route>
                        <Route path="/register" element={ <Register/> }></Route>
                    
                        <Route path="*" element={ <Private> <Home/> </Private>  }></Route> 
                </Routes>
            </AuthProvider>
        </BrowserRouter>
        
    )
}

export default RoutesApp;