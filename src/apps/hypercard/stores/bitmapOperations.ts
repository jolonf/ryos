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
    }
  };
}; 