<?php

declare(strict_types=1);

/**
 * Switches the active Laravel environment file by copying one of:
 * - .env.<env>
 * - .env.<env>.local
 * - .env.<env>.example
 * into .env (with a timestamped backup).
 *
 * Usage:
 *   php scripts/switch-env.php development|staging|production
 */

$rawTarget = $argv[1] ?? '';
$rawTarget = trim((string) $rawTarget);

$aliases = [
    'dev' => 'development',
    'development' => 'development',
    'local' => 'development',
    'stage' => 'staging',
    'staging' => 'staging',
    'prod' => 'production',
    'production' => 'production',
];

if ($rawTarget === '') {
    fwrite(STDOUT, "Usage: php scripts/switch-env.php development|staging|production\n");
    fwrite(STDOUT, "Aliases: dev, local, stage, prod\n");
    exit(0);
}

if (!isset($aliases[strtolower($rawTarget)])) {
    fwrite(STDERR, "Usage: php scripts/switch-env.php development|staging|production\n");
    fwrite(STDERR, "Aliases: dev, local, stage, prod\n");
    exit(2);
}

$target = $aliases[strtolower($rawTarget)];
$root = realpath(__DIR__ . '/..');
if ($root === false) {
    fwrite(STDERR, "Error: unable to resolve project root.\n");
    exit(1);
}

$sourceCandidates = [
    $root . DIRECTORY_SEPARATOR . ".env.$target",
    $root . DIRECTORY_SEPARATOR . ".env.$target.local",
    $root . DIRECTORY_SEPARATOR . ".env.$target.example",
];

$source = null;
foreach ($sourceCandidates as $candidate) {
    if (is_file($candidate)) {
        $source = $candidate;
        break;
    }
}

if ($source === null) {
    fwrite(STDERR, "Error: no env template found for '$target'. Looked for:\n");
    foreach ($sourceCandidates as $candidate) {
        fwrite(STDERR, "- " . basename($candidate) . "\n");
    }
    exit(1);
}

$dest = $root . DIRECTORY_SEPARATOR . '.env';

if (is_file($dest)) {
    $timestamp = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Ymd-His');
    $backup = $root . DIRECTORY_SEPARATOR . ".env.backup-$timestamp";

    if (!copy($dest, $backup)) {
        fwrite(STDERR, "Error: failed to create backup '$backup'.\n");
        exit(1);
    }
}

if (!copy($source, $dest)) {
    fwrite(STDERR, "Error: failed to copy '" . basename($source) . "' to .env\n");
    exit(1);
}

fwrite(STDOUT, "Active env switched to '$target' using '" . basename($source) . "'.\n");
