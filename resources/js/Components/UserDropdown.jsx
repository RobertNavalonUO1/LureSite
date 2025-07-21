import { useState, useRef, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { Inertia } from '@inertiajs/inertia';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LogOut, User, ShoppingBag } from 'lucide-react';

const UserDropdown = ({ user }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  const toggleDropdown = () => setOpen(!open);

  const handleLogout = () => {
    Inertia.post('/logout');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-2 focus:outline-none group"
        title="Menú de usuario"
      >
        <span className="text-white font-medium hidden sm:inline group-hover:underline transition">
          Hola, {user.name.split(' ')[0]}
        </span>
        <img
          src={user.avatar || '/default-avatar.png'}
          alt="Avatar"
          className="w-9 h-9 rounded-full border-2 border-white object-cover group-hover:ring-2 group-hover:ring-white transition"
        />
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-white"
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-52 bg-white text-sm rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 text-gray-800 transition"
            >
              <User size={16} /> Mi perfil
            </Link>
            <Link
              href="/orders"
              className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 text-gray-800 transition"
            >
              <ShoppingBag size={16} /> Mis pedidos
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-red-600 transition"
            >
              <LogOut size={16} /> Cerrar sesión
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserDropdown;
