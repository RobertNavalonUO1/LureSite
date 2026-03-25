import DangerButton from '@/Components/ui/DangerButton.jsx';
import InputError from '@/Components/ui/InputError.jsx';
import InputLabel from '@/Components/ui/InputLabel.jsx';
import Modal from '@/Components/ui/Modal.jsx';
import SecondaryButton from '@/Components/ui/SecondaryButton.jsx';
import TextInput from '@/Components/ui/TextInput.jsx';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { useI18n } from '@/i18n';

export default function DeleteUserForm({ className = '' }) {
    const { t } = useI18n();
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    {t('profile.delete_title')}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    {t('profile.delete_desc')}
                </p>
            </header>

            <DangerButton onClick={confirmUserDeletion}>
                {t('profile.delete_account')}
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        {t('profile.delete_confirm_title')}
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                        {t('profile.delete_confirm_desc')}
                    </p>

                    <div className="mt-6">
                        <InputLabel
                            htmlFor="password"
                            value={t('auth.password')}
                            className="sr-only"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="mt-1 block w-3/4"
                            isFocused
                            placeholder={t('auth.password')}
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal}>
                            {t('profile.cancel')}
                        </SecondaryButton>

                        <DangerButton className="ms-3" disabled={processing}>
                            {t('profile.delete_account')}
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
