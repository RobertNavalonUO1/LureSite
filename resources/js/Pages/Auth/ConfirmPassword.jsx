import InputError from '@/Components/ui/InputError.jsx';
import InputLabel from '@/Components/ui/InputLabel.jsx';
import PrimaryButton from '@/Components/ui/PrimaryButton.jsx';
import TextInput from '@/Components/ui/TextInput.jsx';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { useI18n } from '@/i18n';

export default function ConfirmPassword() {
    const { t } = useI18n();
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title={t('auth.confirm_password_title')} />

            <div className="mb-4 text-sm text-gray-600">
                {t('auth.confirm_password_desc')}
            </div>

            <form onSubmit={submit}>
                <div className="mt-4">
                    <InputLabel htmlFor="password" value={t('auth.password')} />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        isFocused={true}
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <PrimaryButton className="ms-4" disabled={processing}>
                        {t('auth.confirm')}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
