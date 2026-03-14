import PrimaryButton from '@/Components/ui/PrimaryButton.jsx';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useI18n } from '@/i18n';

export default function VerifyEmail() {
    const { t } = useI18n();
    const { status } = usePage().props;
    const resendForm = useForm({});
    const logoutForm = useForm({});

    const resend = (e) => {
        e.preventDefault();
        resendForm.post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title={t('auth.verify_email_title')} />

            <div className="mb-4 text-sm text-gray-600">
                {t('auth.verify_email_desc')}
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {t('auth.verify_email_sent')}
                </div>
            )}

            <form onSubmit={resend}>
                <div className="mt-4 flex items-center justify-between">
                    <PrimaryButton disabled={resendForm.processing}>
                        {t('auth.resend_verification')}
                    </PrimaryButton>
                    <button
                        type="button"
                        onClick={() => logoutForm.post(route('logout'))}
                        className="text-sm text-gray-600 underline hover:text-gray-900"
                    >
                        {t('auth.logout')}
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
