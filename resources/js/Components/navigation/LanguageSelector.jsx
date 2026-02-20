import React, { useState } from 'react';

const LanguageSelector = () => {
    const [selectedLanguage, setSelectedLanguage] = useState('es');

    const handleChangeLanguage = (e) => {
        setSelectedLanguage(e.target.value);
        // Aquí se podría agregar lógica para cambiar el idioma
    };

    return (
        <select
            value={selectedLanguage}
            onChange={handleChangeLanguage}
            className="bg-gray-700 text-white px-3 py-1 rounded"
        >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
        </select>
    );
};

export default LanguageSelector;
