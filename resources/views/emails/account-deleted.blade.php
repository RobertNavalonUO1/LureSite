<x-mail.layout title="Cuenta eliminada" preheader="Confirmacion de eliminacion de tu cuenta en {{ $appName }}.">
    <p style="margin:0 0 18px; font-size:16px; line-height:1.7;">Hola {{ $account['name'] }},</p>

    <p style="margin:0 0 18px; font-size:16px; line-height:1.7;">
        Confirmamos que tu cuenta asociada a <strong>{{ $account['email'] }}</strong> se ha eliminado correctamente el {{ $account['deleted_at'] }}.
    </p>

    <div style="margin:0 0 22px; padding:18px 20px; border-radius:18px; background:#faf6ef; border:1px solid #eadfce; color:#4b5563; font-size:14px; line-height:1.8;">
        Si no has solicitado esta accion o necesitas recuperar informacion relacionada con un pedido reciente, contacta cuanto antes con nuestro equipo en
        <a href="mailto:{{ $supportEmail }}" style="color:#17322d;">{{ $supportEmail }}</a>.
    </div>

    <p style="margin:0; font-size:15px; line-height:1.7; color:#1f2937;">
        Gracias por haber confiado en {{ $appName }}.
    </p>
</x-mail.layout>