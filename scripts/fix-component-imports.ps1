$ErrorActionPreference = 'Stop'

$root = Join-Path $PSScriptRoot '..\resources\js'
$root = (Resolve-Path $root).Path
$componentsRoot = Join-Path $root 'Components'

# Build map from ComponentName -> folder/ComponentName based on actual file locations
$map = @{}
$dupes = @{}

Get-ChildItem $componentsRoot -Recurse -File -Include *.jsx | ForEach-Object {
    # Skip README and non-component files
    if ($_.Name -ieq 'README.md') { return }

    # Evita reescribir imports hacia subcomponentes internos del header
    if ($_.FullName -match "\\resources\\js\\Components\\navigation\\header\\") { return }

    $relative = $_.FullName.Substring($componentsRoot.Length).TrimStart('\\')
    $relativeNoExt = ($relative -replace '\\.jsx$', '') -replace '\\\\', '/'

    $name = $_.BaseName

    if ($map.ContainsKey($name) -and $map[$name] -ne $relativeNoExt) {
        $dupes[$name] = @($map[$name], $relativeNoExt)
        $map.Remove($name) | Out-Null
        return
    }

    if (-not $dupes.ContainsKey($name)) {
        $map[$name] = $relativeNoExt
    }
}

if ($dupes.Count -gt 0) {
    Write-Host 'WARNING: Duplicate component names found; these will NOT be auto-rewritten:'
    $dupes.Keys | Sort-Object | ForEach-Object { Write-Host "- ${_}: $($dupes[$_]-join ', ')" }
}

# Preferencias para nombres duplicados que sí queremos reescribir
$preferred = @{
    'SearchBar' = 'navigation/SearchBar'
    'TopBanner' = 'marketing/TopBanner'
}

foreach ($k in $preferred.Keys) {
    $map[$k] = $preferred[$k]
    if ($dupes.ContainsKey($k)) { $dupes.Remove($k) | Out-Null }
}

# Only rewrite imports that refer to removed root re-exports: @/Components/<Name>
$files = Get-ChildItem $root -Recurse -File -Include *.js,*.jsx,*.ts,*.tsx,*.md
$changed = 0

foreach ($file in $files) {
    $text = Get-Content $file.FullName -Raw
    if ($null -eq $text) { $text = '' }
    $newText = $text

    foreach ($name in $map.Keys) {
        $from = "@/Components/$name"
        $to = "@/Components/$($map[$name])"
        $newText = $newText.Replace($from, $to)
    }

    if ($newText -ne $text) {
        Set-Content -Path $file.FullName -Value $newText -NoNewline
        $changed++
    }
}

Write-Host "Rewrote imports for $($map.Count) unique component names. Updated $changed files."
