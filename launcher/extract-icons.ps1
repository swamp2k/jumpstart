# Reads a JSON list of file paths (exe/dll/lnk targets) and prints {path: base64 PNG} using the Windows icon of each file.
param([string]$ListFile)
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'SilentlyContinue'
$paths = Get-Content $ListFile -Raw | ConvertFrom-Json
$result = @{}
foreach ($p in $paths) {
    try {
        $ico = [System.Drawing.Icon]::ExtractAssociatedIcon($p)
        if ($ico) {
            $bmp = $ico.ToBitmap()
            $ms = New-Object System.IO.MemoryStream
            $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
            $result[$p] = [Convert]::ToBase64String($ms.ToArray())
        }
    } catch {}
}
$result | ConvertTo-Json -Compress
