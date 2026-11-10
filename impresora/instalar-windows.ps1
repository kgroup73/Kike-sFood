# Instala Kike's Impresora en Windows y lo deja arrancando solo con el equipo.
#
# Uso (PowerShell como administrador, en la carpeta del agente):
#   powershell -ExecutionPolicy Bypass -File .\instalar-windows.ps1 `
#     -Restaurante la-trattoria -Codigo K7Q2-9XMB -Servidor https://xxxx.supabase.co -Llave <llave pública>
#
# Administración → Cocina e impresión muestra esta línea completa al vincular un equipo.
# Opcional: -Impresora 192.168.1.50 (o el nombre de la impresora en Windows) usa esa
# impresora para todas las estaciones sin preguntar.
param(
  [Parameter(Mandatory = $true)][string]$Restaurante,
  [Parameter(Mandatory = $true)][string]$Codigo,
  [Parameter(Mandatory = $true)][string]$Servidor,
  [Parameter(Mandatory = $true)][string]$Llave,
  [string]$Impresora = ''
)
$ErrorActionPreference = 'Stop'
$Tarea = "Kike's Impresora"
$Base = Join-Path $env:ProgramData 'KikesImpresora'
$App = Join-Path $Base 'app'

function Paso($texto) { Write-Host "`n== $texto" -ForegroundColor Cyan }

# 1. Permisos y Node.js
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) { throw 'Abre PowerShell como administrador (clic derecho → Ejecutar como administrador) y vuelve a correr este instalador.' }

Paso 'Revisando Node.js'
$node = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
if (-not $node) {
  throw 'Falta Node.js 18 o superior. Instálalo con: winget install OpenJS.NodeJS.LTS  (o desde https://nodejs.org) y vuelve a correr este instalador.'
}
$version = [int]((& $node --version).TrimStart('v').Split('.')[0])
if ($version -lt 18) { throw "Node.js $version es muy viejo: se necesita la versión 18 o superior." }
Write-Host "Node.js $(& $node --version) en $node"

# 2. Copiar el agente
Paso "Copiando el agente a $App"
New-Item -ItemType Directory -Force -Path $App | Out-Null
Copy-Item -Path (Join-Path $PSScriptRoot '*') -Destination $App -Recurse -Force
$Cli = Join-Path $App 'kikes-impresora.mjs'

# 3. Vincular con el restaurante
Paso "Vinculando con el restaurante $Restaurante"
& $node $Cli vincular --restaurante $Restaurante --codigo $Codigo --servidor $Servidor --llave $Llave
if ($LASTEXITCODE -ne 0) { throw 'No se pudo vincular. Revisa el código (vence a los 30 minutos) y la conexión a internet.' }

# 4. Elegir la impresora de cada estación
Paso 'Impresoras'
$estado = & $node $Cli estado --json | Out-String | ConvertFrom-Json
$instaladas = @(Get-Printer -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name)

function Configurar($estacion, $valor) {
  if ($valor -match '^\d{1,3}(\.\d{1,3}){3}(:\d+)?$') {
    & $node $Cli impresora --estacion $estacion --red $valor
  } else {
    & $node $Cli impresora --estacion $estacion --windows $valor
  }
  if ($LASTEXITCODE -ne 0) { throw "No se pudo guardar la impresora de $estacion" }
}

foreach ($e in $estado.estaciones) {
  if ($Impresora) { Configurar $e.id $Impresora; continue }
  Write-Host "`nEstación: $($e.nombre)$(if ($e.tiquetes) { ' (tiquetes de caja)' })"
  if ($instaladas.Count) {
    Write-Host 'Impresoras instaladas en este equipo:'
    for ($i = 0; $i -lt $instaladas.Count; $i++) { Write-Host "  [$($i + 1)] $($instaladas[$i])" }
  }
  $resp = Read-Host 'Escribe la IP de la impresora de red (ej. 192.168.1.50), el número de la lista, o Enter para dejarla sin impresora'
  if (-not $resp) { continue }
  if ($resp -match '^\d+$' -and [int]$resp -ge 1 -and [int]$resp -le $instaladas.Count) { $resp = $instaladas[[int]$resp - 1] }
  Configurar $e.id $resp
}

# 5. Prueba
Paso 'Imprimiendo una hoja de prueba en cada estación'
& $node $Cli probar
if ($LASTEXITCODE -ne 0) { Write-Warning ("Alguna estación no imprimió. Puedes corregirla después con: node `"$Cli`" impresora --estacion <nombre> --red <IP>") }

# 6. Arranque automático: tarea programada al iniciar Windows, reinicia si se cae
Paso 'Dejando el agente activo al encender el equipo'
$accion = New-ScheduledTaskAction -Execute $node -Argument "`"$Cli`" iniciar" -WorkingDirectory $App
$disparador = New-ScheduledTaskTrigger -AtStartup
$cuenta = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$ajustes = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable `
  -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero)
Register-ScheduledTask -TaskName $Tarea -Action $accion -Trigger $disparador -Principal $cuenta -Settings $ajustes -Force | Out-Null
Start-ScheduledTask -TaskName $Tarea

Write-Host "`nListo. El agente quedó activo y arranca solo con Windows." -ForegroundColor Green
Write-Host "Registro: $(Join-Path $Base 'agente.log')"
Write-Host 'En Administración → Cocina e impresión el equipo debe aparecer como conectado.'
