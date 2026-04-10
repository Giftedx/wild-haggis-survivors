New-Item -ItemType Directory -Force -Path "$PSScriptRoot/../public" | Out-Null
Add-Type -AssemblyName System.Drawing
$root = Resolve-Path "$PSScriptRoot/../public"
foreach ($size in @(192, 512)) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::FromArgb(26, 26, 46))
  $g.Dispose()
  $path = Join-Path $root "pwa-${size}x${size}.png"
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "Wrote $path"
}
