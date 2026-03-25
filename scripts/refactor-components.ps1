$ErrorActionPreference = 'Stop'

$root = Join-Path $PSScriptRoot '..\resources\js'
$root = (Resolve-Path $root).Path
$componentsRoot = Join-Path $root 'Components'

# Build mapping from root re-export files to their real target path
$maps = @{}
Get-ChildItem $componentsRoot -Filter *.jsx -File | ForEach-Object {
    $lines = Get-Content $_.FullName -TotalCount 2
    if ($lines.Count -gt 0 -and $lines[0] -match "export\s+\{\s+default\s+\}\s+from\s+'\.\/(.+?)';") {
        $target = $Matches[1]
        if ($target.EndsWith('.jsx')) { $target = $target.Substring(0, $target.Length - 4) }
        $from = "@/Components/$($_.BaseName)"
        $to = "@/Components/$target"
        $maps[$from] = $to
    }
}

if ($maps.Count -eq 0) {
    Write-Host 'No root re-export component files found. Nothing to do.'
    exit 0
}

# Update imports across JS/TS/MD (exclude the root re-export files themselves)
$files = Get-ChildItem $root -Recurse -File -Include *.js,*.jsx,*.ts,*.tsx,*.md |
    Where-Object { $_.FullName -notmatch ([regex]::Escape($componentsRoot) + "\\[^\\]+\\.jsx$") }

$changed = 0
foreach ($file in $files) {
    $text = Get-Content $file.FullName -Raw
    $newText = $text
    foreach ($key in $maps.Keys) {
        $newText = $newText.Replace($key, $maps[$key])
    }

    if ($newText -ne $text) {
        Set-Content -Path $file.FullName -Value $newText -NoNewline
        $changed++
    }
}

# Remove root re-export files
Get-ChildItem $componentsRoot -Filter *.jsx -File | Remove-Item -Force

Write-Host "Updated $changed files; mapped $($maps.Count) component imports; removed root Components/*.jsx re-exports."
