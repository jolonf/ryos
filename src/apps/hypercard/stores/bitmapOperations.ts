import { BitmapOperations } from '../types/stack';

export const createBitmapOperations = (stackId: string): BitmapOperations => {
  // Store bitmaps in memory
  const bitmapStore = new Map<string, ImageData>();

  return {
    createBitmap: async (width: number, height: number) => {
      // Create a new empty bitmap
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to create bitmap context');

      // Fill with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);

      // Generate a unique ID for this bitmap
      const bitmapId = `${stackId}_bitmap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store the initial image data
      const imageData = ctx.getImageData(0, 0, width, height);
      bitmapStore.set(bitmapId, imageData);

      return bitmapId;
    },

    saveBitmap: async (bitmapId: string, imageData: ImageData) => {
      bitmapStore.set(bitmapId, imageData);
    },

    loadBitmap: async (bitmapId: string) => {
      const imageData = bitmapStore.get(bitmapId);
      if (!imageData) throw new Error(`Bitmap not found: ${bitmapId}`);
      return imageData;
    },

    deleteBitmap: async (bitmapId: string) => {
      bitmapStore.delete(bitmapId);
    },

    // New methods for serialization
    serializeBitmap: async (bitmapId: string): Promise<string | null> => {
      const imageData = bitmapStore.get(bitmapId);
      if (!imageData) return null;

      // Create a canvas to convert ImageData to base64
      const canvas = new OffscreenCanvas(imageData.width, imageData.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Put the image data on the canvas
      ctx.putImageData(imageData, 0, 0);

      // Convert to blob and then to base64
      const blob = await canvas.convertToBlob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      return base64;
    },

    deserializeBitmap: async (bitmapId: string, base64Data: string): Promise<void> => {
      // Convert base64 to blob
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes.buffer], { type: 'image/png' });

      // Create an image to load the blob
      const img = new Image();
      const loadImage = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load bitmap data'));
      });

      // Create object URL for the blob
      const url = URL.createObjectURL(blob);
      img.src = url;

      try {
        await loadImage;

        // Create a canvas to get ImageData
        const canvas = new OffscreenCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to create canvas context');

        // Draw the image and get its data
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);

        // Store in bitmap store
        bitmapStore.set(bitmapId, imageData);
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  };
}; 