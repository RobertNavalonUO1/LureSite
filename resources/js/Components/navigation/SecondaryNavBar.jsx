import React from 'react';
import UserMenu from '@/Components/navigation/UserMenu.jsx';
import Cart from '@/Components/cart/Cart.jsx';
import LanguageSelector from '@/Components/navigation/LanguageSelector.jsx';
import SearchBar from '@/Components/navigation/SearchBar';

const SecondaryNavBar = () => {
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

export default SecondaryNavBar;