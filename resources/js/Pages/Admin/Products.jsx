import React from 'react';

export default function Products({ products }) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">Gestión de Productos</h1>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id} className="border-b">
              <td>{product.id}</td>
              <td>{product.name}</td>
              <td>{product.category?.name}</td>
              <td>${product.price}</td>
              <td>{product.stock}</td>
              <td>
                <form method="POST" action={`/admin/products/${product.id}/delete`}>
                  <button type="submit" className="bg-red-500 text-white px-3 py-1 rounded">Eliminar</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}