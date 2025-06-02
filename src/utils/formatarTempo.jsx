// utils/formatarTempo.js
export function formatarTempo(timestamp){
    if(!timestamp) return "Sem Registro!";

    // calcula a difernça do tempo atual com o tempo de registro
    const diffMs = Date.now() - timestamp.toDate().getTime();
    //  Converte os milissegundos para minutos
    const diffMinutes = Math.floor(diffMs / 60000);
    //  Calcula quantas horas tem nesse tempo
    const hours = Math.floor(diffMinutes/60);
    //  Calcula a diferença de minutos que sobrou
    const minutes = diffMinutes % 60;
    
    if(hours > 0){
        return `${hours}h ${minutes} atrás`;
    }

    return `${minutes} min atrás`;
}