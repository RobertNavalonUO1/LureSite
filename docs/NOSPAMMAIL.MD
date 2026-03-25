Perfecto. El siguiente paso es dejar el correo con autenticación completa para que los mensajes desde @limoneo.com no terminen en spam. Esto implica añadir DKIM y DMARC además del SPF que te mencioné antes. 📬

Primero, SPF (si todavía no lo añadiste). Este registro indica qué servidores pueden enviar correo por tu dominio.

Añade en Cloudflare:

Type: TXT
Name: @
Content: v=spf1 include:zoho.eu ~all
TTL: Auto

Segundo, DKIM.
DKIM firma criptográficamente los correos que envía Zoho Mail para demostrar que no fueron alterados.

Procedimiento:

En Zoho ve a
Admin Console → Mail → Domains → limoneo.com → DKIM

Pulsa Add selector.

Ejemplo de selector típico:

Selector: zohomail

Zoho te mostrará un registro DNS parecido a este:

Type: TXT
Name: zohomail._domainkey
Content: v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFA...

Ese TXT lo copias en Cloudflare exactamente igual.

Después vuelves a Zoho y pulsas Verify DKIM.

Tercero, DMARC.
Esto indica a otros servidores qué hacer si SPF o DKIM fallan.

Añade este TXT en Cloudflare:

Type: TXT
Name: _dmarc
Content: v=DMARC1; p=quarantine; rua=mailto:limoneo@limoneo.com
TTL: Auto

Explicación rápida:

p=quarantine → correos sospechosos van a spam

rua= → recibirás reportes de autenticación

Configuración final recomendada de DNS para tu dominio:

A      limoneo.com      46.224.207.157
A      www              46.224.207.157

MX     @                mx.zoho.eu        10
MX     @                mx2.zoho.eu       20
MX     @                mx3.zoho.eu       50

TXT    @                zoho-verification=...
TXT    @                v=spf1 include:zoho.eu ~all

TXT    zohomail._domainkey   v=DKIM1; k=rsa; p=...

TXT    _dmarc           v=DMARC1; p=quarantine; rua=mailto:limoneo@limoneo.com

Un detalle importante para tu proyecto Limoneo.
Si más adelante usas un servicio como Resend para enviar emails automáticos (pedidos, confirmaciones, etc.), tendrás que añadirlo también al SPF.

Ejemplo:

v=spf1 include:zoho.eu include:spf.resend.com ~all

Si quieres, también puedo enseñarte algo muy útil ahora que ya tienes dominio y servidor:

cómo crear las direcciones correctas para un marketplace (support, orders, noreply, etc.) y organizarlas bien desde el primer día.