<x-mail.layout title="Verifica tu correo" preheader="Confirma tu direccion de correo para activar las comunicaciones de {{ $appName }}.">
    <p style="margin:0 0 18px; font-size:16px; line-height:1.7;">Hola {{ $userName }},</p>

    <p style="margin:0 0 18px; font-size:16px; line-height:1.7;">
        Necesitamos verificar que este correo te pertenece antes de activar las notificaciones de cuenta, pedidos y soporte de {{ $appName }}.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;">
        <tr>
            <td>
                <a href="{{ $verificationUrl }}" style="display:inline-block; padding:14px 24px; border-radius:999px; background:#17322d; color:#f8f5ef; text-decoration:none; font-size:15px; font-weight:700;">Verificar correo</a>
            </td>
        </tr>
    </table>

    <div style="margin:0 0 20px; padding:18px 20px; border-radius:18px; background:#f7f1e8; color:#4b5563; font-size:14px; line-height:1.7;">
        Este enlace caduca en {{ $expiresInMinutes }} minutos. Si no has creado una cuenta o cambiado tu email, puedes ignorar este mensaje.
    </div>

    <p style="margin:0; font-size:14px; line-height:1.7; color:#6b7280;">
        Si el boton no funciona, copia y pega esta URL en tu navegador:<br>
        <a href="{{ $verificationUrl }}" style="color:#17322d; word-break:break-all;">{{ $verificationUrl }}</a>
    </p>
</x-mail.layout>