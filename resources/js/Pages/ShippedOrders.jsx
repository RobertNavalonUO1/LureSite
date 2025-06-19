import React from 'react';
import { usePage } from '@inertiajs/react';

export default function ShippedOrders() {
  // Obtenemos la prop 'orders' enviada desde el método shipped del controlador
  const { orders } = usePage().props;

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Pedidos Enviados</h1>
      {orders && orders.length > 0 ? (
        orders.map(order => (
          <div
            key={order.id}
            style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem'
            }}
          >
            <p><strong>Pedido #:</strong> {order.id}</p>
            <p><strong>Fecha:</strong> {order.date}</p>
            <p><strong>Total:</strong> ${order.total}</p>
            <p><strong>Método de Pago:</strong> {order.status}</p>
            <div style={{ marginTop: '1rem' }}>
              <h3>Items del pedido:</h3>
              {order.items && order.items.length > 0 ? (
                order.items.map(item => (
                  <div key={item.id} style={{ marginLeft: '1rem' }}>
                    <p>{item.name} - Cantidad: {item.quantity} - Precio: ${item.price}</p>
                  </div>
                ))
              ) : (
                <p>No hay items en este pedido.</p>
              )}
            </div>
          </div>
        ))
      ) : (
        <p>No hay pedidos enviados.</p>
      )}
    </div>
  );
}
