import React from "react";

export default function PaymentMethod({ selectedPayment, setSelectedPayment }) {
    const paymentMethods = ["Tarjeta de Crédito", "PayPal", "Pago Contra Entrega"];

    return (
        <div className="p-4 border rounded-lg shadow-md">
            <h2 className="text-lg font-semibold">Método de Pago</h2>
            {paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center">
                    <input
                        type="radio"
                        id={method}
                        name="payment"
                        value={method}
                        checked={selectedPayment === method}
                        onChange={() => setSelectedPayment(method)}
                    />
                    <label htmlFor={method} className="ml-2">{method}</label>
                </div>
            ))}
        </div>
    );
}
