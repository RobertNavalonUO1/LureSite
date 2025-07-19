import GuestLayout from '@/Layouts/GuestLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, useForm } from '@inertiajs/react';

export default function CompleteProfile({ user }) {
    const { data, setData, post, processing, errors } = useForm({
        lastname: '',
        phone: '',
        address: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/complete-profile');
    };

    return (
        <GuestLayout>
            <Head title="Completa tu perfil" />
            <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Completa tu perfil</h1>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <InputLabel htmlFor="lastname" value="Apellido" />
                        <TextInput
                            id="lastname"
                            name="lastname"
                            value={data.lastname}
                            onChange={(e) => setData('lastname', e.target.value)}
                            className="mt-1 block w-full"
                            required
                        />
                        <InputError message={errors.lastname} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="phone" value="Teléfono" />
                        <TextInput
                            id="phone"
                            name="phone"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            className="mt-1 block w-full"
                            required
                        />
                        <InputError message={errors.phone} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="address" value="Dirección" />
                        <TextInput
                            id="address"
                            name="address"
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.address} className="mt-2" />
                    </div>

                    <div className="flex justify-end">
                        <PrimaryButton className="ml-4" disabled={processing}>
                            Guardar y continuar
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}
