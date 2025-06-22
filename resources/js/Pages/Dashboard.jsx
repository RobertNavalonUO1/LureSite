import React from 'react';
import { usePage } from '@inertiajs/react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  User,
  ShoppingBag,
  Truck,
  CreditCard,
  Settings,
  ShoppingCart,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' },
};

const Dashboard = () => {
  const { auth, orders, cartItems } = usePage().props;
  const user = auth.user;

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto py-10 px-6 space-y-10">

        <motion.section
          {...fadeInUp}
          className="bg-white shadow rounded-xl p-6 flex items-center gap-6"
        >
          <img
            src="/default-avatar.png"
            alt="Avatar"
            className="w-20 h-20 rounded-full border object-cover"
          />
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              {user.name}
            </h2>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </motion.section>

        <motion.section
          {...fadeInUp}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <CardLink icon={<ShoppingBag />} label="Mis Pedidos" href="/orders" color="blue" />
          <CardLink icon={<Truck />} label="Enviados" href="/orders/shipped" color="green" />
          <CardLink icon={<CreditCard />} label="Pagados" href="/orders/paid" color="yellow" />
          <CardLink icon={<Settings />} label="Editar Perfil" href="/profile" color="gray" />
        </motion.section>

        <motion.section {...fadeInUp} className="bg-white shadow rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Pedidos Recientes
          </h3>
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map(order => (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex justify-between items-center border rounded-lg p-4 hover:bg-gray-50 transition"
                  key={order.id}
                >
                  <div>
                    <p className="font-medium text-gray-700">Pedido #{order.id}</p>
                    <p className="text-sm text-gray-500">Fecha: {order.date}</p>
                  </div>
                  <p className="text-lg font-bold text-blue-600">${order.total}</p>
                  <a
                    href={`/orders/${order.id}`}
                    className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                  >
                    Ver <ArrowRight className="w-4 h-4" />
                  </a>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No tienes pedidos recientes.</p>
          )}
        </motion.section>

        <motion.section {...fadeInUp} className="bg-white shadow rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Carrito de Compras
          </h3>
          {cartItems.length > 0 ? (
            <div className="space-y-4">
              {cartItems.map(item => (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  key={item.id}
                  className="flex justify-between items-center border rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div>
                    <p className="font-medium text-gray-700">{item.title}</p>
                    <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                  </div>
                  <p className="text-lg font-bold text-yellow-600">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  <a
                    href="/cart"
                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
                  >
                    Ir al Carrito
                  </a>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Tu carrito está vacío.</p>
          )}
        </motion.section>
      </main>
      <Footer />
    </div>
  );
};

const CardLink = ({ icon, label, href, color }) => {
  const bg = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    yellow: 'bg-yellow-500 hover:bg-yellow-600',
    gray: 'bg-gray-600 hover:bg-gray-700',
  }[color];

  return (
    <motion.a
      whileHover={{ scale: 1.05 }}
      href={href}
      className={`text-white p-4 rounded-xl text-center shadow transition flex flex-col items-center ${bg}`}
    >
      <div className="mb-2">{icon}</div>
      <p className="text-md font-semibold">{label}</p>
    </motion.a>
  );
};

export default Dashboard;
