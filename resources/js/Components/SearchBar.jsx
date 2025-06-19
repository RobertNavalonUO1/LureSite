import React, { useState } from 'react';
import { Inertia } from '@inertiajs/inertia';

const SearchBar = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        Inertia.get('/search', { query: searchQuery });
    };

    return (
        <form onSubmit={handleSearchSubmit} className="flex w-full max-w-md">
            <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Buscar productos..."
                className="w-full p-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
            <button
                type="submit"
                className="bg-blue-600 p-2 rounded-r-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                Buscar
            </button>
        </form>
    );
};

export default SearchBar;
