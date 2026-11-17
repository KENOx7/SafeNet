$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$destination = Join-Path $root 'public/junior-art'
[void](New-Item -ItemType Directory -Force $destination)
$sheet = [System.Drawing.Bitmap]::new((Join-Path $root 'assets/junior-source/characters.png'))
function Save-Character($Name, $X, $Y, $Width, $Height) {
    $bitmap = $sheet.Clone([System.Drawing.Rectangle]::new($X, $Y, $Width, $Height), [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    # The mentor's top-right corner overlaps the neighbouring gamer in the atlas.
    # Keep the full coat below it while excluding that neighbouring sprite fragment.
    if ($Name -eq 'mentor') {
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        try {
            $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
            $brush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::Transparent)
            try { $graphics.FillRectangle($brush, 270, 0, 24, 210) }
            finally { $brush.Dispose() }
        } finally { $graphics.Dispose() }
    }
    try { $bitmap.Save((Join-Path $destination ($Name + '.png')), [System.Drawing.Imaging.ImageFormat]::Png) }
    finally { $bitmap.Dispose() }
}
try {
    Save-Character 'ranger' 15 18 305 337
    Save-Character 'mia' 324 45 303 310
    Save-Character 'hood' 627 46 273 309
    Save-Character 'streamer' 909 42 340 313
    Save-Character 'student' 18 365 303 367
    Save-Character 'mentor' 324 365 294 367
    Save-Character 'gamer' 618 366 308 365
    Save-Character 'stranger' 928 367 323 365
    Save-Character 'laptop' 14 760 361 229
    Save-Character 'cup' 377 735 252 269
    Save-Character 'headphones' 641 760 293 242
    Save-Character 'cloud' 973 779 270 219
    Save-Character 'shield' 276 1001 270 253
    Save-Character 'card' 585 1031 398 218
} finally { $sheet.Dispose() }

