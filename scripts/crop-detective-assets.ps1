$projectPath = Split-Path $PSScriptRoot -Parent
Add-Type -AssemblyName System.Drawing
$atlas = [System.Drawing.Bitmap]::new((Join-Path $projectPath 'assets/detective-source/scenes.png'))
$outputPath = Join-Path $projectPath 'public/detective-art'
New-Item -ItemType Directory -Force -Path $outputPath | Out-Null
try {
    $halfWidth = [int]($atlas.Width / 2)
    $halfHeight = [int]($atlas.Height / 2)
    $names = @('bedroom', 'school', 'desk', 'street')
    for ($index = 0; $index -lt 4; $index++) {
        $left = ($index % 2) * $halfWidth
        $top = [int][Math]::Floor($index / 2) * $halfHeight
        $crop = $atlas.Clone([System.Drawing.Rectangle]::new($left, $top, $halfWidth, $halfHeight), [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try { $crop.Save((Join-Path $outputPath ($names[$index] + '.png')), [System.Drawing.Imaging.ImageFormat]::Png) }
        finally { $crop.Dispose() }
    }
} finally { $atlas.Dispose() }
