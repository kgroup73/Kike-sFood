# Quita Kike's Impresora de este equipo: detiene la tarea programada y borra la carpeta
# C:\ProgramData\KikesImpresora (incluida la configuración con el token del equipo).
# Para que el equipo deje de recibir trabajos también hay que revocarlo en
# Administración → Cocina e impresión.
$ErrorActionPreference = 'Stop'
$Tarea = "Kike's Impresora"
$Base = Join-Path $env:ProgramData 'KikesImpresora'

if (Get-ScheduledTask -TaskName $Tarea -ErrorAction SilentlyContinue) {
  Stop-ScheduledTask -TaskName $Tarea -ErrorAction SilentlyContinue
  Unregister-ScheduledTask -TaskName $Tarea -Confirm:$false
  Write-Host 'Tarea programada eliminada.'
}
if (Test-Path $Base) {
  $ok = Read-Host "¿Borrar $Base con la configuración de este equipo? (s/n)"
  if ($ok -eq 's') { Remove-Item -Path $Base -Recurse -Force; Write-Host 'Carpeta borrada.' }
}
Write-Host 'Listo.'
