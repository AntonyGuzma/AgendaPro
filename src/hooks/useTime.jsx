import { useEffect, useState } from "react";
import { formatarTempo } from "../utils/formatarTempo";

export function useTime(timestamp) {
    const [elapse, setElapse] = useState(() => formatarTempo(timestamp))

    useEffect(() => {
        const interval = setInterval(() => {
            setElapse(formatarTempo(timestamp))
        }, 60000)
        
        // Atualizar imediatamente
        setElapse(formatarTempo(timestamp))
        
        // Limpar o tempo e reiniciar a contagem
        return () => clearInterval(interval)
    }, [timestamp])

    
    return elapse;
}

export default useTime;