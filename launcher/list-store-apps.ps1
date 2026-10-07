# Prints Microsoft Store (packaged) apps from the Start menu as JSON: name, appId, family, logo path.
$ErrorActionPreference = 'SilentlyContinue'
$pk = @{}
Get-AppxPackage | ForEach-Object { $pk[$_.PackageFamilyName] = $_.InstallLocation }
$out = @()
Get-StartApps | Where-Object { $_.AppID -match '!' -and $_.AppID -notmatch '\.exe$' } | ForEach-Object {
    $family, $appKey = $_.AppID -split '!', 2
    $loc = $pk[$family]
    $logo = ''
    if ($loc -and (Test-Path "$loc\AppxManifest.xml")) {
        try {
            [xml]$x = Get-Content "$loc\AppxManifest.xml" -Raw
            $app = @($x.Package.Applications.Application) | Where-Object { $_.Id -eq $appKey } | Select-Object -First 1
            if (-not $app) { $app = @($x.Package.Applications.Application)[0] }
            $rel = $app.VisualElements.Square44x44Logo
            if (-not $rel) { $rel = $app.VisualElements.Square150x150Logo }
            if ($rel) {
                $base = Join-Path $loc $rel
                $dir = Split-Path $base
                $stem = [IO.Path]::GetFileNameWithoutExtension($base)
                $c = Get-ChildItem $dir -Filter "$stem*.png" | Where-Object { $_.Name -notmatch 'contrast|altform-lightunplated' } | Sort-Object Length -Descending | Select-Object -First 1
                if (-not $c) { $c = Get-ChildItem $dir -Filter "$stem*.png" | Sort-Object Length -Descending | Select-Object -First 1 }
                if (-not $c) { $c = Get-ChildItem $loc -Recurse -Filter "$stem*.png" | Sort-Object Length -Descending | Select-Object -First 1 }
                if ($c) { $logo = $c.FullName }
            }
        } catch {}
    }
    $game = [bool]($loc -and (Test-Path "$loc\MicrosoftGame.config"))
    $out += [pscustomobject]@{ name = $_.Name; appId = $_.AppID; family = $family; logo = $logo; game = $game }
}
$out | ConvertTo-Json -Compress
