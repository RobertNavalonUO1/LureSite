import React from 'react';

export default function Stats({ orders, sales, users, products, reviews, topProducts, recentOrders }) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">Estadísticas</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-10">
        <div className="bg-white p-6 rounded shadow text-center">
          <div className="text-2xl font-bold">{orders}</div>
          <div className="text-gray-600">Pedidos</div>
        </div>
        <div className="bg-white p-6 rounded shadow text-center">
          <div className="text-2xl font-bold">${sales}</div>
          <div className="text-gray-600">Ventas</div>
        </div>
        <div className="bg-white p-6 rounded shadow text-center">
          <div className="text-2xl font-bold">{users}</div>
          <div className="text-gray-600">Usuarios</div>
        </div>
        <div className="bg-white p-6 rounded shadow text-center">
          <div className="text-2xl font-bold">{products}</div>
          <div className="text-gray-600">Productos</div>
        </div>
        <div className="bg-white p-6 rounded shadow text-center">
          <div className="text-2xl font-bold">{reviews}</div>
          <div className="text-gray-600">Reviews</div>
        </div>
      </div>
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Top Productos por Reviews</h2>
        <ul>
          {topProducts.map(p => (
            <li key={p.id}>{p.name} ({p.reviews_count} reviews)</li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Últimos Pedidos</h2>
        <ul>
          {recentOrders.map(o => (
            <li key={o.id}>#{o.id} - {o.user?.name} - ${o.total} - {o.status}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
