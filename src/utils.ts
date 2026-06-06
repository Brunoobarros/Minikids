/**
 * Utility to compress and downscale an image file client-side.
 * This ensures that when images are converted to base64 strings and stored in Firestore,
 * they remain well under the 1MB document limit, avoiding Quota and write failures,
 * and stay within firestore.rules size limits.
 */
export function compressImage(
  file: File,
  maxWidth: number = 1000,
  maxHeight: number = 800,
  quality: number = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error("File is not an image"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while constraining to maximum bounds
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback if context is not available
          resolve(e.target?.result as string || "");
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // Export to a high-compression JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        reject(new Error("Failed to load image for compression"));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    reader.readAsDataURL(file);
  });
}
