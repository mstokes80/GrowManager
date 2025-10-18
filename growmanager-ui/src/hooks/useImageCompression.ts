import { useState } from 'react';

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Hook for compressing images before upload using Canvas API.
 * Compresses images to target dimensions and quality.
 */
export const useImageCompression = () => {
  const [isCompressing, setIsCompressing] = useState(false);

  const compressImage = async (
    file: File,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> => {
    const { maxWidth = 2048, maxHeight = 2048, quality = 0.85 } = options;

    setIsCompressing(true);

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      const originalSize = file.size;

      // Read the image file
      const imageBitmap = await createImageBitmap(file);
      const { width, height } = imageBitmap;

      // Calculate new dimensions while maintaining aspect ratio
      let newWidth = width;
      let newHeight = height;

      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;

        if (width > height) {
          newWidth = maxWidth;
          newHeight = Math.round(maxWidth / aspectRatio);
        } else {
          newHeight = maxHeight;
          newWidth = Math.round(maxHeight * aspectRatio);
        }
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      ctx.drawImage(imageBitmap, 0, 0, newWidth, newHeight);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      });

      // Create new file from blob
      const compressedFile = new File([blob], file.name, {
        type: file.type,
        lastModified: Date.now(),
      });

      const compressedSize = compressedFile.size;
      const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

      return {
        file: compressedFile,
        originalSize,
        compressedSize,
        compressionRatio,
      };
    } catch (error) {
      console.error('Image compression error:', error);
      // Return original file if compression fails
      return {
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0,
      };
    } finally {
      setIsCompressing(false);
    }
  };

  return {
    compressImage,
    isCompressing,
  };
};