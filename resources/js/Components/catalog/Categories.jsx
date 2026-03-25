import React from 'react';
import { Link } from '@inertiajs/react';


const Categories = ({ categories }) => {
    return (
        <div className="bg-gray-100 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Categorías</h2>
            <ul className="space-y-2">
                {categories && categories.length > 0 ? (
                    categories.map((category) => (
                        <li key={category.id}>
                            <Link
                                href={`/category/${category.id}`}
                                className="block px-4 py-2 bg-white rounded-md shadow hover:bg-gray-200 transition"
                            >
                                {category.name}
                            </Link>
                        </li>
                    ))
                ) : (
                    <p>No hay categorías disponibles.</p>
                )}
            </ul>
        </div>
    );
};

export default Categories;
