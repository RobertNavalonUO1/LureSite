$ErrorActionPreference = 'Stop'

$pagesRoot = Resolve-Path (Join-Path $PSScriptRoot '..\resources\js\Pages')
$pagesRoot = $pagesRoot.Path

# Move root Pages/*.jsx into grouped folders
$movePlan = @(
    @{ Name = 'Home.jsx'; TargetDir = 'Shop' },
    @{ Name = 'CartPage.jsx'; TargetDir = 'Shop' },
    @{ Name = 'Checkout.jsx'; TargetDir = 'Shop' },
    @{ Name = 'CategoryPage.jsx'; TargetDir = 'Shop' },

    @{ Name = 'About.jsx'; TargetDir = 'Static' },
    @{ Name = 'Contact.jsx'; TargetDir = 'Static' },
    @{ Name = 'Faq.jsx'; TargetDir = 'Static' },
    @{ Name = 'Terms.jsx'; TargetDir = 'Static' },
    @{ Name = 'Privacy.jsx'; TargetDir = 'Static' },

    @{ Name = 'DealsToday.jsx'; TargetDir = 'Special' },
    @{ Name = 'SuperDeal.jsx'; TargetDir = 'Special' },
    @{ Name = 'FastShipping.jsx'; TargetDir = 'Special' },
    @{ Name = 'NewArrivals.jsx'; TargetDir = 'Special' },
    @{ Name = 'SeasonalProducts.jsx'; TargetDir = 'Special' },

    @{ Name = 'AddProduct.jsx'; TargetDir = 'Admin' },
    @{ Name = 'SelectProducts.jsx'; TargetDir = 'Admin' },
    @{ Name = 'MigrateProducts.jsx'; TargetDir = 'Admin' },
    @{ Name = 'AdminOrders.jsx'; TargetDir = 'Admin' },

    @{ Name = 'Dashboard.jsx'; TargetDir = 'User' },
    @{ Name = 'EditProfile.jsx'; TargetDir = 'Profile' },
    @{ Name = 'ShippedOrders.jsx'; TargetDir = 'Orders' },

    @{ Name = 'LinkAggregator.jsx'; TargetDir = 'Tools' },

    @{ Name = 'HomePage.jsx'; TargetDir = 'Legacy' },
    @{ Name = 'Welcome.jsx'; TargetDir = 'Legacy' }
)

foreach ($item in $movePlan) {
    $destDir = Join-Path $pagesRoot $item.TargetDir
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    }

    $src = Join-Path $pagesRoot $item.Name
    if (Test-Path $src) {
        $dest = Join-Path $destDir $item.Name
        Move-Item -Force -Path $src -Destination $dest
    }
}

# Update PHP Inertia render targets to new folder paths
$renderMap = @{
    'Home' = 'Shop/Home'
    'CartPage' = 'Shop/CartPage'
    'Checkout' = 'Shop/Checkout'
    'CategoryPage' = 'Shop/CategoryPage'

    'About' = 'Static/About'
    'Contact' = 'Static/Contact'
    'Faq' = 'Static/Faq'
    'Terms' = 'Static/Terms'
    'Privacy' = 'Static/Privacy'

    'LinkAggregator' = 'Tools/LinkAggregator'

    'DealsToday' = 'Special/DealsToday'
    'SuperDeal' = 'Special/SuperDeal'
    'FastShipping' = 'Special/FastShipping'
    'NewArrivals' = 'Special/NewArrivals'
    'SeasonalProducts' = 'Special/SeasonalProducts'

    'AddProduct' = 'Admin/AddProduct'
    'SelectProducts' = 'Admin/SelectProducts'
    'MigrateProducts' = 'Admin/MigrateProducts'
    'AdminOrders' = 'Admin/AdminOrders'

    'Dashboard' = 'User/Dashboard'
    'EditProfile' = 'Profile/EditProfile'
    'ShippedOrders' = 'Orders/ShippedOrders'
}

$phpRoots = @(
    (Resolve-Path (Join-Path $PSScriptRoot '..\\app')).Path,
    (Resolve-Path (Join-Path $PSScriptRoot '..\\routes')).Path
)

$phpFiles = @()
foreach ($r in $phpRoots) {
    $phpFiles += Get-ChildItem $r -Recurse -File -Filter *.php |
        Where-Object { $_.FullName -notmatch "\\routes\\web copy" }
}

$updated = 0
foreach ($file in $phpFiles) {
    $text = Get-Content $file.FullName -Raw
    if ($null -eq $text) { continue }

    $newText = $text

    foreach ($old in $renderMap.Keys) {
        $new = $renderMap[$old]

        # ::render('Old') / ::render("Old")
        $patternRender = ('::render\(\s*([''\"]){0}\1' -f [regex]::Escape($old))
        $replacementRender = '::render($1' + $new + '$1'
        $newText = [regex]::Replace($newText, $patternRender, $replacementRender)

        # inertia('Old') / inertia("Old")
        $patternInertiaFn = ('inertia\(\s*([''\"]){0}\1' -f [regex]::Escape($old))
        $replacementInertiaFn = 'inertia($1' + $new + '$1'
        $newText = [regex]::Replace($newText, $patternInertiaFn, $replacementInertiaFn)
    }

    if ($newText -ne $text) {
        Set-Content -Path $file.FullName -Value $newText -NoNewline
        $updated++
    }
}

Write-Host "Moved root Pages/*.jsx into folders and updated Inertia render strings in $updated PHP files."
