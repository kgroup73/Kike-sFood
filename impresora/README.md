# Kike's Impresora (agente local)

Programa pequeño que se instala una vez en el computador conectado a la impresora térmica.
Imprime las comandas y los tiquetes de caja apenas llegan, sin vista previa, sin abrir Chrome
y sin configurar la impresora predeterminada.

Versión inicial (0.1.0). Funciona con Node.js 18 o superior; el siguiente paso es empaquetarlo
como un instalador `.exe` firmado para que el restaurante no tenga que instalar Node.

## Cómo funciona

```
Comensal pide ──► Supabase arma la comanda por estación ──► print_jobs (fila)
                                                              │
                         agente local (este programa) ◄───────┘  pregunta cada 2 s
                                │
              impresora de Cocina (red 9100)   impresora de Barra (USB/Windows)
```

- **Estaciones:** cada restaurante define sus estaciones (Cocina, Barra, Caja) en
  Administración → Cocina e impresión, y asigna cada categoría de la carta a una. Lo que no
  tiene estación va a la estación por defecto. Una estación puede recibir los tiquetes de caja.
- **Vinculación con el código del restaurante:** Administración crea el equipo y muestra un
  código de un solo uso (vence en 30 minutos). El agente lo cambia por un token propio que
  guarda en este computador. No usa el PIN de nadie.
- **Una sola vez:** cada trabajo lo toma un solo imprimidor (agente o navegador). Si la
  impresión falla, vuelve a la fila; tras 5 intentos queda en error.
- **Sin conexión:** la fila vive en el servidor. Si se cae internet, lo pendiente sale
  cuando vuelve (hasta 12 horas).

## Instalar en Windows

1. Instala Node.js 18 o superior: `winget install OpenJS.NodeJS.LTS`.
2. Copia esta carpeta `impresora` al computador.
3. En Administración → Cocina e impresión, toca **Vincular un equipo**, elige sus estaciones y
   copia la línea que aparece.
4. Abre PowerShell **como administrador** en esta carpeta y pega la línea:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\instalar-windows.ps1 -Restaurante la-trattoria -Codigo K7Q2-9XMB -Servidor https://xxxx.supabase.co -Llave <llave pública>
   ```

5. Para cada estación, escribe la IP de la impresora de red o elige una impresora instalada.
6. Sale una hoja de prueba por estación y el agente queda activo, arrancando solo con Windows.

Para quitarlo: `desinstalar-windows.ps1`, y revoca el equipo en Administración.

## Comandos

```
node kikes-impresora.mjs vincular  --restaurante <código> --codigo <XXXX-XXXX> --servidor <url> --llave <llave>
node kikes-impresora.mjs impresora [--estacion <nombre>] (--red <IP[:puerto]> | --windows <nombre> | --archivo <ruta>) [--columnas 32] [--ascii] [--cajon]
node kikes-impresora.mjs estado    [--json]
node kikes-impresora.mjs probar    [--estacion <nombre>]
node kikes-impresora.mjs iniciar
```

- `--red`: impresoras con cable de red o Wi-Fi, puerto 9100. No necesita controlador.
- `--windows`: impresoras USB instaladas en Windows; se les manda el trabajo en crudo (RAW).
- `--archivo`: escribe los bytes en un archivo, para probar sin impresora.
- `--columnas 32`: papel de 58 mm (por defecto 48, papel de 80 mm).
- `--ascii`: sin tildes, para impresoras que no traen la página de códigos PC858.
- `--cajon`: abre el cajón monedero al imprimir un tiquete pagado en efectivo.

Configuración y registro: `C:\ProgramData\KikesImpresora\` en Windows, `~/.kikes-impresora/`
en Linux y macOS (`KIKES_IMPRESORA_CONFIG` cambia la ruta).

## Pruebas

```
cd impresora && npm test          # codificación, plantillas, red, ciclo del agente
npm run test:db                   # desde la raíz: incluye el agente de punta a punta contra la base
```

## Pendiente

- Instalador `.exe` con Node incluido y firma de código (sin firma, Windows muestra una advertencia).
- Probar `--windows` (USB) con impresoras reales: la salida por red está probada; la de Windows usa
  el spooler en modo RAW y todavía no se ha probado en un equipo físico.
- Servicio para Linux (systemd) si algún restaurante usa un mini PC con Linux.
