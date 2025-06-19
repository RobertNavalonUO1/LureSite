import React from "react";

export default function OrderSummary({ cart }) {
    return (
        <div className="p-4 border rounded-lg shadow-md">
            <h2 className="text-lg font-semibold">Resumen del pedido</h2>
            <ul>
                {cart.items.map((item, index) => (
                    <li key={index} className="flex justify-between">
                        <span>{item.name} x {item.quantity}</span>
                        <span>€{item.price}</span>
                    </li>
                ))}
            </ul>
            <div className="mt-4 font-bold">Total: €{cart.total}</div>
        </div>
    );
}
