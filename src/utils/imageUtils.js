/**
 * Optimiza una imagen en el navegador antes de subirla:
 * - Redimensiona a un ancho máximo
 * - La convierte a WebP con calidad ajustable
 */
export async function compressImage(file, maxWidth = 2560, quality = 0.9) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, maxWidth / img.width);
        const width = img.width * scale;
        const height = img.height * scale;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('No se pudo comprimir la imagen'));
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '.webp'),
              { type: 'image/webp', lastModified: Date.now() }
            );
            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Genera dos versiones de una imagen: una de alta resolución y una miniatura.
 */
export async function generateVersions(file) {
  const full = await compressImage(file, 2560, 0.9);
  const thumb = await compressImage(file, 800, 0.7);
  return { full, thumb };
}
