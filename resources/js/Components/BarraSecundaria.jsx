import React from 'react';
import UserMenu from './UserMenu';
import Cart from './Cart';
import LanguageSelector from './LanguageSelector';
import SearchBar from './SearchBar';

const BarraSecundaria = () => {
    return (
        <div className="bg-gray-800 text-white py-2">
            <div className="container mx-auto flex justify-between items-center">
                <SearchBar />
                <div className="flex space-x-6">
                    <LanguageSelector />
                    <Cart />
                    <UserMenu />
                </div>
            </div>
        </div>
    );
};

export default BarraSecundaria;
