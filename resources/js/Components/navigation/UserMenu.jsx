import React from 'react';
import { Link, usePage } from '@inertiajs/react';

const UserMenu = () => {
    const { auth } = usePage().props;

    return (
        <div>
            {auth?.user ? (
                <Link href="/profile" className="hover:text-gray-400">Mi Perfil</Link>
            ) : (
                <Link href="/login" className="hover:text-gray-400">Iniciar Sesión</Link>
            )}
        </div>
    );
};

export default UserMenu;
