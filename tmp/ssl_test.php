<?php

$url = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

echo 'curl.cainfo='.(ini_get('curl.cainfo') ?: '').PHP_EOL;
echo 'openssl.cafile='.(ini_get('openssl.cafile') ?: '').PHP_EOL;

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 20);

$out = curl_exec($ch);

if ($out === false) {
    echo 'CURL_ERRNO='.curl_errno($ch).PHP_EOL;
    echo 'CURL_ERROR='.curl_error($ch).PHP_EOL;
    exit(1);
}

echo 'OK bytes='.strlen($out).PHP_EOL;
