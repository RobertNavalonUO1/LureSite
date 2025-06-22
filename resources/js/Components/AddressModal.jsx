import React, { useState } from 'react';
import { Inertia } from '@inertiajs/inertia';

const AddressModal = ({ closeModal, onAddressAdded }) => {
    const [form, setForm] = useState({
        street: '',
        city: '',
        province: '',
        zip_code: '',
        country: '',
        make_default: true,
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, type, checked, value } = e.target;
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        Inertia.post('/addresses/store', form, {
            onSuccess: () => {
                if (onAddressAdded) onAddressAdded(); // ✅ Llama al padre para recargar props
                closeModal(); // ✅ Cierra el modal
            },
            onError: (err) => {
                console.error('Errores de validación:', err);
                setErrors(err);
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Agregar nueva dirección</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        name="street"
                        placeholder="Calle"
                        value={form.street}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    />
                    {errors.street && <p className="text-red-500 text-sm">{errors.street}</p>}

                    <input
                        type="text"
                        name="city"
                        placeholder="Ciudad"
                        value={form.city}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    />
                    {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}

                    <input
                        type="text"
                        name="province"
                        placeholder="Provincia"
                        value={form.province}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    />
                    {errors.province && <p className="text-red-500 text-sm">{errors.province}</p>}

                    <input
                        type="text"
                        name="zip_code"
                        placeholder="Código postal"
                        value={form.zip_code}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    />
                    {errors.zip_code && <p className="text-red-500 text-sm">{errors.zip_code}</p>}

                    <input
                        type="text"
                        name="country"
                        placeholder="País"
                        value={form.country}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    />
                    {errors.country && <p className="text-red-500 text-sm">{errors.country}</p>}

                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name="make_default"
                            checked={form.make_default}
                            onChange={handleChange}
                        />
                        <span>Marcar como dirección predeterminada</span>
                    </label>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddressModal;
