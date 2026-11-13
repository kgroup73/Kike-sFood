/**
 * Utilidades puras para la generación del documento HTML de impresión de stickers (SoC - Capa 2).
 * Calibrado a 8.8 × 8.5 cm (6 stickers por hoja A4) con esquinas de corte y vector Timbre.
 */

export const escapeHtml = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]
  );

// SVG vector oficial del timbre de Kike's vertical para el sticker impreso
export function getStickerLogoSvg(isMono) {
  if (isMono) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 208.92 209.90" width="20mm" height="20mm" role="img" aria-label="Kike's">
      <circle cx="104.46" cy="39.02" r="10.98" fill="#1E2B24"/>
      <rect x="99.58" y="43.90" width="9.76" height="12.20" fill="#1E2B24"/>
      <path d="M53.24 102.44A51.22 51.22 0 0 1 155.68 102.44Z" fill="#1E2B24"/>
      <rect x="41.05" y="107.32" width="126.83" height="19.51" rx="9.76" fill="#1E2B24"/>
      <path d="M89.83 68.29 L89.83 95.12 M117.88 68.29 L97.14 81.71 L117.88 95.12" fill="none" stroke="#FFFFFF" stroke-width="10.98" stroke-linecap="round" stroke-linejoin="round"/>
      <path transform="translate(26.83 183.07) scale(0.06400 -0.06400)" d="M40 0V660H202V378Q250 394 286.5 423.5Q323 453 349.0 491.0Q375 529 392.0 572.5Q409 616 418 660H600Q588 603 565.5 552.5Q543 502 509.0 460.0Q475 418 430.0 385.5Q385 353 328 332V324Q389 329 429.0 316.5Q469 304 494.0 280.0Q519 256 533.5 225.5Q548 195 558 164L611 0H431L393 147Q384 183 367.5 205.5Q351 228 325.0 238.0Q299 248 259 248H202V0Z" fill="#1E2B24"/>
      <path transform="translate(64.14 183.07) scale(0.06400 -0.06400)" d="M36 0V528H198V0ZM116 566Q70 566 45.5 585.5Q21 605 21 642Q21 680 45.5 699.5Q70 719 116 719Q163 719 187.5 699.0Q212 679 212 642Q212 606 187.5 586.0Q163 566 116 566Z" fill="#1E2B24"/>
      <path transform="translate(76.56 183.07) scale(0.06400 -0.06400)" d="M36 0V700H194V329Q228 347 252.5 370.0Q277 393 294.0 419.5Q311 446 321.5 473.5Q332 501 339 528H525Q514 488 493.5 450.5Q473 413 443.0 380.5Q413 348 373.5 322.0Q334 296 286 279V271Q348 281 387.5 273.5Q427 266 450.0 245.5Q473 225 485.5 194.0Q498 163 505 125L528 0H353L342 88Q338 120 331.0 148.0Q324 176 304.0 193.5Q284 211 241 211H194V0Z" fill="#1E2B24"/>
      <path transform="translate(108.62 183.07) scale(0.06400 -0.06400)" d="M287 -14Q212 -14 161.5 7.5Q111 29 80.0 66.5Q49 104 35.5 152.0Q22 200 22 253Q22 310 36.5 362.0Q51 414 81.5 454.5Q112 495 160.5 518.5Q209 542 277 542Q345 542 393.5 518.5Q442 495 471.0 453.0Q500 411 508.5 356.0Q517 301 506 237L123 231V319L382 324L361 273Q367 319 359.5 350.5Q352 382 332.0 398.5Q312 415 277 415Q240 415 218.0 396.0Q196 377 187.0 342.5Q178 308 178 261Q178 180 205.0 143.0Q232 106 288 106Q312 106 328.0 112.0Q344 118 354.0 129.5Q364 141 368.0 157.5Q372 174 371 195L519 187Q522 154 512.5 119.0Q503 84 477.0 54.0Q451 24 404.5 5.0Q358 -14 287 -14Z" fill="#1E2B24"/>
      <path transform="translate(140.43 183.07) scale(0.06400 -0.06400)" d="M32 440 14 700H160L142 440Z" fill="#1E2B24"/>
      <path transform="translate(149.01 183.07) scale(0.06400 -0.06400)" d="M267 -14Q214 -14 168.5 -3.5Q123 7 89.5 30.0Q56 53 38.5 91.5Q21 130 24 185L165 197Q167 164 180.0 142.5Q193 121 216.0 111.0Q239 101 272 101Q303 101 325.5 111.5Q348 122 348 147Q348 160 340.0 168.5Q332 177 310.5 184.5Q289 192 248 202Q197 215 156.0 228.0Q115 241 86.0 259.0Q57 277 42.0 303.5Q27 330 27 369Q27 424 56.5 462.5Q86 501 138.0 521.5Q190 542 258 542Q319 542 372.0 523.0Q425 504 455.5 461.0Q486 418 478 347L340 334Q343 363 332.0 383.5Q321 404 300.0 414.5Q279 425 249 425Q215 425 196.5 412.5Q178 400 178 381Q178 366 189.5 355.5Q201 345 225.5 337.5Q250 330 289 321Q323 314 360.0 303.0Q397 292 429.0 273.5Q461 255 481.0 225.0Q501 195 501 149Q501 100 474.0 63.0Q447 26 395.0 6.0Q343 -14 267 -14Z" fill="#1E2B24"/>
    </svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 208.92 209.90" width="20mm" height="20mm" role="img" aria-label="Kike's">
    <circle cx="104.46" cy="39.02" r="10.98" fill="#1E2B24"/>
    <rect x="99.58" y="43.90" width="9.76" height="12.20" fill="#1E2B24"/>
    <path d="M53.24 102.44A51.22 51.22 0 0 1 155.68 102.44Z" fill="#F3C64B"/>
    <rect x="41.05" y="107.32" width="126.83" height="19.51" rx="9.76" fill="#1E2B24"/>
    <path d="M89.83 68.29 L89.83 95.12 M117.88 68.29 L97.14 81.71 L117.88 95.12" fill="none" stroke="#1E2B24" stroke-width="10.98" stroke-linecap="round" stroke-linejoin="round"/>
    <path transform="translate(26.83 183.07) scale(0.06400 -0.06400)" d="M40 0V660H202V378Q250 394 286.5 423.5Q323 453 349.0 491.0Q375 529 392.0 572.5Q409 616 418 660H600Q588 603 565.5 552.5Q543 502 509.0 460.0Q475 418 430.0 385.5Q385 353 328 332V324Q389 329 429.0 316.5Q469 304 494.0 280.0Q519 256 533.5 225.5Q548 195 558 164L611 0H431L393 147Q384 183 367.5 205.5Q351 228 325.0 238.0Q299 248 259 248H202V0Z" fill="#1E2B24"/>
    <path transform="translate(64.14 183.07) scale(0.06400 -0.06400)" d="M36 0V528H198V0ZM116 566Q70 566 45.5 585.5Q21 605 21 642Q21 680 45.5 699.5Q70 719 116 719Q163 719 187.5 699.0Q212 679 212 642Q212 606 187.5 586.0Q163 566 116 566Z" fill="#1E2B24"/>
    <path transform="translate(76.56 183.07) scale(0.06400 -0.06400)" d="M36 0V700H194V329Q228 347 252.5 370.0Q277 393 294.0 419.5Q311 446 321.5 473.5Q332 501 339 528H525Q514 488 493.5 450.5Q473 413 443.0 380.5Q413 348 373.5 322.0Q334 296 286 279V271Q348 281 387.5 273.5Q427 266 450.0 245.5Q473 225 485.5 194.0Q498 163 505 125L528 0H353L342 88Q338 120 331.0 148.0Q324 176 304.0 193.5Q284 211 241 211H194V0Z" fill="#1E2B24"/>
    <path transform="translate(108.62 183.07) scale(0.06400 -0.06400)" d="M287 -14Q212 -14 161.5 7.5Q111 29 80.0 66.5Q49 104 35.5 152.0Q22 200 22 253Q22 310 36.5 362.0Q51 414 81.5 454.5Q112 495 160.5 518.5Q209 542 277 542Q345 542 393.5 518.5Q442 495 471.0 453.0Q500 411 508.5 356.0Q517 301 506 237L123 231V319L382 324L361 273Q367 319 359.5 350.5Q352 382 332.0 398.5Q312 415 277 415Q240 415 218.0 396.0Q196 377 187.0 342.5Q178 308 178 261Q178 180 205.0 143.0Q232 106 288 106Q312 106 328.0 112.0Q344 118 354.0 129.5Q364 141 368.0 157.5Q372 174 371 195L519 187Q522 154 512.5 119.0Q503 84 477.0 54.0Q451 24 404.5 5.0Q358 -14 287 -14Z" fill="#1E2B24"/>
    <path transform="translate(140.43 183.07) scale(0.06400 -0.06400)" d="M32 440 14 700H160L142 440Z" fill="#1E2B24"/>
    <path transform="translate(149.01 183.07) scale(0.06400 -0.06400)" d="M267 -14Q214 -14 168.5 -3.5Q123 7 89.5 30.0Q56 53 38.5 91.5Q21 130 24 185L165 197Q167 164 180.0 142.5Q193 121 216.0 111.0Q239 101 272 101Q303 101 325.5 111.5Q348 122 348 147Q348 160 340.0 168.5Q332 177 310.5 184.5Q289 192 248 202Q197 215 156.0 228.0Q115 241 86.0 259.0Q57 277 42.0 303.5Q27 330 27 369Q27 424 56.5 462.5Q86 501 138.0 521.5Q190 542 258 542Q319 542 372.0 523.0Q425 504 455.5 461.0Q486 418 478 347L340 334Q343 363 332.0 383.5Q321 404 300.0 414.5Q279 425 249 425Q215 425 196.5 412.5Q178 400 178 381Q178 366 189.5 355.5Q201 345 225.5 337.5Q250 330 289 321Q323 314 360.0 303.0Q397 292 429.0 273.5Q461 255 481.0 225.0Q501 195 501 149Q501 100 474.0 63.0Q447 26 395.0 6.0Q343 -14 267 -14Z" fill="#1E2B24"/>
  </svg>`;
}

// Plantilla HTML optimizada para impresión: tamaño compacto calibrado (8.8 x 8.5 cm, 6 por hoja A4)
export function buildStickersHtml(tenant, tablesWithQr, printMode = 'color') {
  const tenantName = escapeHtml(tenant?.name || '');
  const isSingle = tablesWithQr.length === 1;
  const isMono = printMode === 'mono';
  const logoSvg = getStickerLogoSvg(isMono);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Stickers Mesas - ${tenantName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800;12..96,900&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background: #ffffff;
      color: #1E2B24;
      margin: 0;
      padding: 0;
      font-family: 'Atkinson Hyperlegible', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      background: #1E2B24;
      color: #F6F7F3;
      border-radius: 12px;
      margin: 8px;
    }
    .btn-print {
      background: #2F6B3F;
      color: #FFFFFF;
      font-weight: 700;
      border: none;
      padding: 7px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
    }
    @media print {
      .header-bar { display: none !important; }
      body { margin: 0 !important; padding: 0 !important; }
    }
    .container {
      ${
        isSingle
          ? `display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 250mm; padding: 10mm;`
          : `display: grid; grid-template-columns: repeat(2, 88mm); justify-content: center; gap: 7mm 10mm; padding: 2mm 0;`
      }
    }
    .sticker-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .sticker {
      width: 88mm;
      height: 85mm;
      border: 2px solid #1E2B24;
      border-radius: 14px;
      padding: 5mm 6mm;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      position: relative;
      box-sizing: border-box;
    }
    .sticker-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      line-height: 1.1;
    }
    .brand-name {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #56655C;
      margin-top: 1px;
    }
    .table-num {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 20px;
      font-weight: 900;
      color: #1E2B24;
      letter-spacing: -0.4px;
      line-height: 1.1;
      margin-top: 2px;
    }
    .qr-box {
      background: #ffffff;
      border: 2px solid #1E2B24;
      border-radius: 10px;
      padding: 2mm;
      margin: 1mm auto;
      display: inline-block;
      line-height: 0;
    }
    .qr-img {
      width: 44mm;
      height: 44mm;
      display: block;
    }
    .nfc-pill {
      width: 100%;
      background: #1E2B24;
      color: #FFFFFF;
      padding: 4px 6px;
      border-radius: 6px;
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-top: 1px;
      box-sizing: border-box;
    }
    .scan-note {
      font-size: 7.5px;
      font-weight: 700;
      color: #56655C;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-top: 2px;
    }
    .single-guide {
      margin-top: 8px;
      font-size: 10px;
      color: #56655C;
      font-weight: 600;
    }
    .corner { position: absolute; width: 7px; height: 7px; border-color: #1E2B24; border-style: solid; }
    .corner-tl { top: 4px; left: 4px; border-width: 1.5px 0 0 1.5px; }
    .corner-tr { top: 4px; right: 4px; border-width: 1.5px 1.5px 0 0; }
    .corner-bl { bottom: 4px; left: 4px; border-width: 0 0 1.5px 1.5px; }
    .corner-br { bottom: 4px; right: 4px; border-width: 0 1.5px 1.5px 0; }
  </style>
</head>
<body>
  <div class="header-bar">
    <div>
      <h2 style="font-size: 14px; font-weight: 800;">Stickers de Mesas — ${tenantName}</h2>
      <p style="font-size: 11px; opacity: 0.85;">
        ${
          isSingle
            ? `Sticker individual de Mesa #${escapeHtml(tablesWithQr[0].label)} (8.8 × 8.5 cm)`
            : `${tablesWithQr.length} stickers (${isMono ? 'Una tinta / Monocromo' : 'A color oficial'} · 8.8 × 8.5 cm · 6 por hoja A4)`
        }
      </p>
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar en PDF</button>
  </div>
  <div class="container">
    ${tablesWithQr
      .map(
        (t) => `
      <div class="sticker-wrapper">
        <div class="sticker">
          <div class="corner corner-tl"></div>
          <div class="corner corner-tr"></div>
          <div class="corner corner-bl"></div>
          <div class="corner corner-br"></div>
          <div class="sticker-header">
            ${logoSvg}
            <div class="brand-name">${tenantName}</div>
            <div class="table-num">MESA ${escapeHtml(t.label)}</div>
          </div>
          <div class="qr-box">
            <img class="qr-img" src="${t.qrDataUrl}" alt="QR Mesa ${escapeHtml(t.label)}" />
          </div>
          <div style="width: 100%;">
            <div class="nfc-pill">📲 Toca con tu celular (NFC)</div>
            <div class="scan-note">O escanea para ver la carta y pedir</div>
          </div>
        </div>
        ${isSingle ? `<div class="single-guide header-bar" style="background:none; color:#56655C; margin:6px 0 0 0; font-size:10px;">✂️ Tamaño de corte: 8.8 cm × 8.5 cm</div>` : ''}
      </div>
    `
      )
      .join('')}
  </div>
</body>
</html>`;
}
