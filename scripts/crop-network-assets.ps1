$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$sources = Join-Path $root 'assets/network-source'
$destination = Join-Path $root 'public/network-art'
[void](New-Item -ItemType Directory -Force $destination)
$images = @{}
foreach ($sheet in @('icons', 'controls', 'nodes', 'panels', 'concept')) {
    $images[$sheet] = [System.Drawing.Bitmap]::new((Join-Path $sources ($sheet + '.png')))
}

function Save-Crop($Sheet, $Name, $X, $Y, $Width, $Height) {
    $rectangle = [System.Drawing.Rectangle]::new($X, $Y, $Width, $Height)
    $bitmap = $images[$Sheet].Clone($rectangle, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try { $bitmap.Save((Join-Path $destination ($Name + '.png')), [System.Drawing.Imaging.ImageFormat]::Png) }
    finally { $bitmap.Dispose() }
}

function Save-DeskProp($Name, $X, $Y, $Width, $Height, [System.Drawing.Point[]]$Points) {
    $bitmap = [System.Drawing.Bitmap]::new($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    try {
        $path.AddPolygon($Points)
        $graphics.SetClip($path)
        $bounds = [System.Drawing.Rectangle]::new(0, 0, $Width, $Height)
        $source = [System.Drawing.Rectangle]::new($X, $Y, $Width, $Height)
        $graphics.DrawImage($images['concept'], $bounds, $source, [System.Drawing.GraphicsUnit]::Pixel)
        $bitmap.Save((Join-Path $destination ($Name + '.png')), [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $path.Dispose()
        $graphics.Dispose()
        $bitmap.Dispose()
    }
}

try {
    Save-Crop 'panels' 'crt' 280 193 668 454
    Save-Crop 'panels' 'mission' 13 183 264 199
    Save-Crop 'panels' 'mission-frame' 25 254 240 122
    Save-Crop 'panels' 'mission-notes' 53 184 182 69
    Save-Crop 'panels' 'journal' 12 654 319 289
    Save-Crop 'panels' 'clipboard' 949 181 297 456
    Save-Crop 'panels' 'console' 326 672 927 211
    Save-Crop 'panels' 'instrument' 677 47 561 103
    Save-Crop 'panels' 'title-plate' 19 47 357 111
    Save-Crop 'controls' 'pause' 135 979 209 218
    Save-Crop 'controls' 'resume' 651 976 213 222
    Save-Crop 'controls' 'launch' 30 747 600 222
    Save-Crop 'controls' 'launch-down' 632 747 603 222

    $tools = @('load', 'mail', 'access')
    $states = @('idle', 'selected', 'disabled')
    $controlX = @(14, 422, 830)
    $controlY = @(117, 322, 531)
    for ($column = 0; $column -lt $tools.Count; $column++) {
        for ($row = 0; $row -lt $states.Count; $row++) {
            Save-Crop 'controls' ($tools[$column] + '-' + $states[$row]) $controlX[$column] $controlY[$row] 410 199
            Save-Crop 'controls' ($tools[$column] + '-badge-' + $states[$row]) ($controlX[$column] + 33) ($controlY[$row] + 36) 110 117
        }
    }

    $nodes = @('internet', 'gateway', 'web', 'mail', 'archive')
    $tones = @('idle', 'armed', 'hurt')
    $nodeX = @(210, 490, 779)
    $nodeW = @(234, 279, 295)
    $nodeY = @(0, 211, 387, 558, 725)
    $nodeH = @(201, 169, 167, 163, 166)
    for ($row = 0; $row -lt $nodes.Count; $row++) {
        for ($column = 0; $column -lt $tones.Count; $column++) {
            Save-Crop 'nodes' ('node-' + $nodes[$row] + '-' + $tones[$column]) $nodeX[$column] $nodeY[$row] $nodeW[$column] $nodeH[$row]
        }
    }
    Save-Crop 'nodes' 'traffic' 644 1104 254 148
    Save-Crop 'nodes' 'hostile' 926 1103 265 149
    Save-Crop 'nodes' 'cable' 77 1143 268 81
    Save-Crop 'icons' 'shield' 35 82 142 147
    Save-Crop 'icons' 'coin' 555 116 102 90
    Save-Crop 'icons' 'indicator' 908 114 79 104
    Save-Crop 'icons' 'envelope' 767 415 128 108

    Save-DeskProp 'keyboard' 387 830 733 101 @(
            [System.Drawing.Point]::new(0, 86), [System.Drawing.Point]::new(63, 11),
            [System.Drawing.Point]::new(94, 4), [System.Drawing.Point]::new(632, 4),
            [System.Drawing.Point]::new(733, 88), [System.Drawing.Point]::new(733, 101),
            [System.Drawing.Point]::new(0, 101))
    Save-DeskProp 'desk-props' 0 594 336 316 @(
        [System.Drawing.Point]::new(0, 44), [System.Drawing.Point]::new(45, 18),
        [System.Drawing.Point]::new(83, 20), [System.Drawing.Point]::new(132, 72),
        [System.Drawing.Point]::new(151, 102), [System.Drawing.Point]::new(161, 65),
        [System.Drawing.Point]::new(189, 57), [System.Drawing.Point]::new(190, 0),
        [System.Drawing.Point]::new(248, 0), [System.Drawing.Point]::new(256, 51),
        [System.Drawing.Point]::new(274, 54), [System.Drawing.Point]::new(287, 142),
        [System.Drawing.Point]::new(323, 157), [System.Drawing.Point]::new(335, 217),
        [System.Drawing.Point]::new(313, 269), [System.Drawing.Point]::new(168, 315),
        [System.Drawing.Point]::new(15, 282), [System.Drawing.Point]::new(0, 259))
} finally {
    foreach ($image in $images.Values) { $image.Dispose() }
}
