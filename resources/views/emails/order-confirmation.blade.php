<x-mail.layout :title="$mailTitle" :preheader="$preheader">
    <p style="margin:0 0 18px; font-size:16px; line-height:1.7;">Hola {{ $customerName }},</p>

    <p style="margin:0 0 24px; font-size:16px; line-height:1.7;">
        {!! nl2br(e($introText)) !!}
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px; border-collapse:separate; border-spacing:0 12px;">
        <tr>
            <td colspan="4" style="padding:18px 20px; border:1px solid #eadfce; border-radius:18px; background:#faf6ef;">
                <div style="font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#6b7280;">Estado actual</div>
                <div style="margin-top:8px; font-size:24px; color:#17322d; font-weight:700;">{{ $statusLabel }}</div>
                <div style="margin-top:8px; font-size:14px; color:#6b7280;">Pedido realizado el {{ $orderDate }} · Entrega estimada {{ $estimatedDelivery }}</div>
            </td>
        </tr>
        <tr>
            @foreach ($progressSteps as $step)
                <td style="width:25%; vertical-align:top;">
                    <div style="height:10px; border-radius:999px; background:{{ $step['state'] === 'done' ? '#17322d' : '#d9cdb9' }};"></div>
                    <div style="margin-top:10px; font-size:13px; line-height:1.5; color:{{ $step['state'] === 'done' ? '#17322d' : '#6b7280' }}; font-weight:{{ $step['state'] === 'done' ? '700' : '500' }};">
                        {{ $step['label'] }}
                    </div>
                </td>
            @endforeach
        </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 28px;">
        <tr>
            <td>
                <a href="{{ $trackingUrl }}" style="display:inline-block; padding:14px 24px; border-radius:999px; background:#17322d; color:#f8f5ef; text-decoration:none; font-size:15px; font-weight:700;">{{ $trackingLabel }}</a>
            </td>
        </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
        <tr>
            <td style="padding:20px; border:1px solid #eadfce; border-radius:18px; background:#fff;">
                <div style="font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#6b7280;">Datos del comprador</div>
                <div style="margin-top:10px; font-size:15px; line-height:1.8; color:#1f2937;">
                    <strong>{{ $customerName }}</strong><br>
                    {{ $address }}<br>
                    {{ $customerEmail }}<br>
                    {{ $supportEmail ? 'Soporte: '.$supportEmail : '' }}
                </div>
            </td>
        </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px; border:1px solid #eadfce; border-radius:18px; overflow:hidden;">
        <tr>
            <td style="padding:20px; background:#faf6ef; font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#6b7280;">Articulos comprados</td>
        </tr>
        @foreach ($items as $item)
            <tr>
                <td style="padding:18px 20px; border-top:1px solid #eadfce;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                            <td style="font-size:15px; line-height:1.6; color:#1f2937;">
                                <strong>{{ $item['name'] }}</strong><br>
                                <span style="color:#6b7280;">Cantidad: {{ $item['quantity'] }} · {{ number_format($item['unit_price'], 2, ',', '.') }} EUR</span>
                            </td>
                            <td align="right" style="font-size:15px; font-weight:700; color:#17322d; white-space:nowrap;">
                                {{ number_format($item['subtotal'], 2, ',', '.') }} EUR
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        @endforeach
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #eadfce; border-radius:18px; overflow:hidden;">
        <tr>
            <td style="padding:20px; background:#faf6ef; font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#6b7280;">Resumen del pedido</td>
        </tr>
        <tr>
            <td style="padding:20px; font-size:15px; line-height:2; color:#1f2937;">
                Metodo de pago: <strong>{{ $paymentMethod }}</strong><br>
                Metodo de envio: <strong>{{ $shippingMethod }}</strong><br>
                @if ($trackingCarrier)
                    Transportista: <strong>{{ $trackingCarrier }}</strong><br>
                @endif
                @if ($shippingDescription)
                    Detalle del envio: <strong>{{ $shippingDescription }}</strong><br>
                @endif
                Gastos de envio: <strong>{{ number_format($shippingCost, 2, ',', '.') }} EUR</strong><br>
                @if ($couponCode)
                    Cupon aplicado: <strong>{{ $couponCode }}</strong><br>
                @endif
                @if ($discount > 0)
                    Descuento: <strong>-{{ number_format($discount, 2, ',', '.') }} EUR</strong><br>
                @endif
                Total final: <strong style="color:#17322d;">{{ number_format($total, 2, ',', '.') }} EUR</strong>
                @if ($trackingNumber)
                    <br>Tracking: <strong>{{ $trackingNumber }}</strong>
                @endif
            </td>
        </tr>
    </table>
</x-mail.layout>