import React, { useState } from 'react';
import { usePage, useForm } from '@inertiajs/react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AvatarCreatorModal from '../components/AvatarCreatorModal';
import {
  User,
  ShoppingBag,
  Truck,
  CreditCard,
  Settings,
  ShoppingCart,
  PlusCircle,
  Info,
  Phone,
  Search,
  Pencil
} from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { auth, orders, cartItems } = usePage().props;
  const user = auth.user;

  const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);

  const { setData, patch } = useForm({
    avatar: user.avatar || '/default-avatar.png',
  });

  const handleAvatarChange = (avatarUrl) => {
    setData('avatar', avatarUrl);
    patch('/profile', {
      preserveScroll: true,
      onSuccess: () => setAvatarModalOpen(false),
    });
  };

  return (
    <div className="bg-gradient-to-br from-sky-50 to-yellow-50 min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Perfil */}
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center relative">
            <div
              className="relative group cursor-pointer"
              onClick={() => setAvatarModalOpen(true)}
              title="Haz clic para cambiar tu avatar"
            >
              <img
                src={user.avatar || '/default-avatar.png'}
                alt="Avatar"
                className="w-24 h-24 rounded-full border-4 border-sky-400 object-cover transition duration-300 group-hover:brightness-75"
              />
              <div className="absolute bottom-0 right-0 bg-sky-600 p-1 rounded-full border-2 border-white shadow">
                <Pencil className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mt-4">{user.name}</h2>
            <p className="text-gray-500">{user.email}</p>
          </div>

          {/* Navegación */}
          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
            <NavCard icon={<ShoppingBag />} label="Mis Pedidos" href="/orders" />
            <NavCard icon={<Truck />} label="Pedidos Enviados" href="/orders/shipped" />
            <NavCard icon={<CreditCard />} label="Pedidos Pagados" href="/orders/paid" />
            <NavCard icon={<ShoppingCart />} label="Mi Carrito" href="/cart" badge={cartItems.length} />
            <NavCard icon={<Settings />} label="Editar Perfil" href="/profile" />
            <NavCard icon={<PlusCircle />} label="Agregar Producto" href="/products/add" />
            <NavCard icon={<Search />} label="Buscar Productos" href="/search" />
            <NavCard icon={<Info />} label="Acerca de" href="/about" />
            <NavCard icon={<Phone />} label="Contacto" href="/contact" />
          </div>
        </div>

        {/* Pedidos recientes */}
        <section className="mt-12">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-sky-600">
            <ShoppingBag className="w-5 h-5" />
            Pedidos Recientes
          </h3>
          {orders.length > 0 ? (
            <div className="grid gap-4">
              {orders.map(order => (
                <div key={order.id} className="bg-white shadow-md border-l-4 border-sky-400 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-gray-800 font-medium">Pedido #{order.id}</p>
                    <p className="text-gray-500 text-sm">Fecha: {order.date}</p>
                  </div>
                  <p className="text-lg text-sky-600 font-semibold">${order.total}</p>
                  <a
                    href={`/orders/${order.id}`}
                    className="bg-sky-500 text-white px-4 py-2 rounded hover:bg-sky-600 transition"
                  >
                    Ver
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No tienes pedidos recientes.</p>
          )}
        </section>

        {/* Carrito */}
        <section className="mt-12">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-amber-600">
            <ShoppingCart className="w-5 h-5" />
            Carrito de Compras
          </h3>
          {cartItems.length > 0 ? (
            <div className="grid gap-4">
              {cartItems.map(item => (
                <div key={item.id} className="bg-white shadow-md border-l-4 border-yellow-400 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-gray-800 font-medium">{item.title}</p>
                    <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                  </div>
                  <p className="text-lg text-yellow-600 font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  <a
                    href="/cart"
                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
                  >
                    Ver Carrito
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Tu carrito está vacío.</p>
          )}
        </section>
      </main>

      <Footer />

      {/* Modal para avatar estilo Wii */}
      <AvatarCreatorModal
        isOpen={isAvatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        onSelect={handleAvatarChange}
      />
    </div>
  );
};

// Componente de tarjetas de navegación
const NavCard = ({ icon, label, href, badge }) => (
  <motion.a
    whileHover={{ scale: 1.05 }}
    href={href}
    className="relative bg-white hover:bg-blue-50 p-4 rounded-xl shadow flex flex-col items-center justify-center text-center transition border border-blue-100"
  >
    <div className="mb-2 text-blue-600">{icon}</div>
    <p className="text-sm font-semibold text-gray-800">{label}</p>
    {badge > 0 && (
      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full shadow">
        {badge}
      </span>
    )}
  </motion.a>
);

export default Dashboard;
