$files = Get-ChildItem -Path 'd:\STOCKBRIDGE_ANTIGRAVITY\client\src' -Recurse -Include '*.tsx' 

$replacements = @(
  ,@('#0f1329', '#0F0B1A')
  ,@('#1b2151', '#1A1330')
  ,@('#293264', '#2B1F4D')
  ,@('#3f4b81', '#2B1F4D')
  ,@('#151a41', '#1A1330')
  ,@('#20275e', '#231845')
  ,@('#161a3f', '#1A1330')
  ,@('#1a204d', '#1A1330')
  ,@('#0b0e1f', '#0A0715')
  ,@('#313b6e', '#2B1F4D')
  ,@('teal-600', 'purple-600')
  ,@('teal-500', 'purple-500')
  ,@('teal-400', 'purple-400')
  ,@('teal-300', 'purple-300')
  ,@('teal-950', 'purple-950')
  ,@('teal-900', 'purple-900')
  ,@('teal-800', 'purple-800')
  ,@('cyan-500', 'pink-500')
  ,@('cyan-400', 'pink-400')
  ,@('cyan-300', 'pink-300')
)

foreach ($file in $files) {
  $content = Get-Content $file.FullName -Raw
  $changed = $false
  foreach ($pair in $replacements) {
    $old = $pair[0]
    $new = $pair[1]
    if ($content.Contains($old)) {
      $content = $content.Replace($old, $new)
      $changed = $true
    }
  }
  if ($changed) {
    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Output "Updated: $($file.Name)"
  }
}
Write-Output 'All done!'
