import React, { useState } from 'react';

const Contador = () => {
    // Definir un estado para el número
    const [numero, setNumero] = useState(0);

    // Función para incrementar el número
    const aumentarNumero = () => {
        setNumero(prevNumero => prevNumero + 1);
    };

    return (
        <div>
            <h1>El número actual es: {numero}</h1>
            <button onClick={aumentarNumero}>Aumentar número</button>
        </div>
    );
}

export default Contador;
