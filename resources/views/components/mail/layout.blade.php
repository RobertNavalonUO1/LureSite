@props([
    'title' => config('app.name'),
    'preheader' => null,
])

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
</head>
<body style="margin:0; padding:0; background-color:#f4efe8; color:#1f2937; font-family:Georgia, 'Times New Roman', serif;">
    @if ($preheader)
        <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
            {{ $preheader }}
        </div>
    @endif

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(180deg, #f7f1e8 0%, #efe6d7 100%); padding:32px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px; background:#fffdf9; border:1px solid #e8dcc8; border-radius:24px; overflow:hidden; box-shadow:0 20px 40px rgba(78, 52, 24, 0.08);">
                    <tr>
                        <td style="padding:28px 32px 20px; background:#17322d; background-image:linear-gradient(135deg, #17322d 0%, #2c5a4a 100%); color:#f8f5ef;">
                            <div style="font-size:12px; letter-spacing:0.28em; text-transform:uppercase; opacity:0.8;">{{ config('app.name') }}</div>
                            <div style="margin-top:12px; font-size:28px; line-height:1.2; font-weight:700;">{{ $title }}</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px;">
                            {{ $slot }}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 32px 28px; color:#6b7280; font-size:13px; line-height:1.7;">
                            <div style="padding-top:20px; border-top:1px solid #eadfce;">
                                Has recibido este correo porque existe actividad reciente asociada a tu cuenta o pedido en {{ config('app.name') }}.<br>
                                Si necesitas ayuda, responde a <a href="mailto:{{ config('mail.support_address') }}" style="color:#17322d;">{{ config('mail.support_address') }}</a>.
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>