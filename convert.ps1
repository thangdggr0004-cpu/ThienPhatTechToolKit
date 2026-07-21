Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("C:\Users\PC\.gemini\antigravity\brain\7c7e7d2e-5ecb-4c3b-ac88-f2d924bedd59\media__1784490754508.jpg")
$img.Save("c:\Users\PC\Downloads\ThienPhatTechToolKit\build\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
