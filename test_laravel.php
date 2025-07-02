<?php

$prompt = "Mejora este título para SEO: Paleta de sombras metálicas 9 colores";

$data = json_encode(["data" => [$prompt]]);

$ch = curl_init("https://hf.space/embed/r0ber12/seo-title-generator/api/predict/");

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
curl_close($ch);

echo "🧠 Respuesta del Space:\n";
print_r(json_decode($response, true));
