$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..\resources\js')
$root = $root.Path

$files = Get-ChildItem $root -Recurse -File -Include *.js,*.jsx,*.ts,*.tsx
$changed = 0

foreach ($file in $files) {
    $lines = Get-Content $file.FullName
    if ($null -eq $lines) { continue }

    $newLines = @()
    $fileChanged = $false

    foreach ($line in $lines) {
        $newLine = $line
        if ($newLine -match '^\s*(import|export)\b') {
            $newLine = [regex]::Replace(
                $newLine,
                '([''\"])([^''\"]+)\1',
                {
                    param($m)
                    $q = $m.Groups[1].Value
                    $p = $m.Groups[2].Value
                    while ($p.EndsWith('.')) {
                        $p = $p.Substring(0, $p.Length - 1)
                    }
                    return $q + $p + $q
                }
            )
        }

        if ($newLine -ne $line) { $fileChanged = $true }
        $newLines += $newLine
    }

    if ($fileChanged) {
        Set-Content -Path $file.FullName -Value ($newLines -join "`n") -NoNewline
        $changed++
    }
}

Write-Host "Removed trailing '.' from import/export specifiers in $changed files."
