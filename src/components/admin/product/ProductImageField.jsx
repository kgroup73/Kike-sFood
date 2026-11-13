import { Camera, Link as LinkIcon, CheckCircle2, Trash2, Upload, Loader2, AlertCircle } from 'lucide-react';
import DishImage from '../../client/DishImage';

/**
 * Campo de subida, optimización y previsualización de la foto del platillo.
 * Mantiene intactas al 100% las clases, estados visuales y animaciones.
 */
export default function ProductImageField({
  image,
  name,
  imageMode,
  setImageMode,
  onImageChange,
  fileInputRef,
  handleFileChange,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  isDragging,
  uploadingImage,
  optimizationStats,
  setOptimizationStats,
  uploadError,
  labelClass,
  fieldClass
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={labelClass}>Foto del platillo</span>
        <div className="flex items-center gap-1 bg-linea/60 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setImageMode('upload')}
            className={`px-2 py-0.5 rounded-md font-bold transition-colors flex items-center gap-1 ${
              imageMode === 'upload'
                ? 'bg-plato text-tinta shadow-xs'
                : 'text-suave hover:text-tinta'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Subir archivo
          </button>
          <button
            type="button"
            onClick={() => setImageMode('url')}
            className={`px-2 py-0.5 rounded-md font-bold transition-colors flex items-center gap-1 ${
              imageMode === 'url'
                ? 'bg-plato text-tinta shadow-xs'
                : 'text-suave hover:text-tinta'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" /> URL externa
          </button>
        </div>
      </div>

      {imageMode === 'upload' ? (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {image ? (
            /* Vista de Foto Cargada con Opciones */
            <div className="card p-3 border-linea bg-mantel flex items-center gap-3.5">
              <DishImage
                src={image}
                alt={name || 'Platillo'}
                className="w-20 h-20 rounded-xl shrink-0 border border-linea object-cover"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-hoja">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Foto lista para la carta</span>
                </div>

                {optimizationStats && (
                  <div className="text-[11px] text-suave">
                    Optimizado a <strong>{optimizationStats.optimized}</strong>{' '}
                    {optimizationStats.savings > 0 && (
                      <span className="text-hoja font-semibold">
                        (ahorro de {optimizationStats.savings}%)
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="btn btn-sm btn-quiet text-xs py-1 px-2.5 font-bold flex items-center gap-1"
                  >
                    <Camera className="w-3 h-3" /> Cambiar foto
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onImageChange('');
                      setOptimizationStats(null);
                    }}
                    className="btn btn-sm btn-quiet text-xs py-1 px-2 text-suave hover:text-red-600"
                    title="Quitar foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Zona de Carga / Drag & Drop */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !uploadingImage && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-hoja bg-hoja/10 scale-[1.01]'
                  : 'border-linea bg-mantel/60 hover:bg-mantel hover:border-tinta'
              }`}
            >
              {uploadingImage ? (
                <div className="py-2 space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin text-hoja mx-auto" />
                  <p className="text-xs font-bold text-tinta">
                    Optimizando imagen (~150-300 KB) y guardando en la nube...
                  </p>
                  <p className="text-[11px] text-suave">
                    Convirtiendo a formato WebP de alta velocidad
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="w-10 h-10 rounded-full bg-hoja/10 text-hoja flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-tinta">
                    Haz clic o arrastra la foto del platillo aquí
                  </p>
                  <p className="text-[11px] text-suave">
                    JPG, PNG o WebP. Se optimiza automáticamente en el rango ideal (~150 a 300 KB).
                  </p>
                </div>
              )}
            </div>
          )}

          {uploadError && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      ) : (
        /* Modo URL externa */
        <div className="space-y-1.5">
          <input
            value={image || ''}
            onChange={(e) => onImageChange(e.target.value)}
            placeholder="https://ejemplo.com/foto-platillo.jpg"
            className={fieldClass}
          />
          <p className="text-[11px] text-suave">
            Pega un enlace directo de imagen alojada externamente.
          </p>
        </div>
      )}
    </div>
  );
}
