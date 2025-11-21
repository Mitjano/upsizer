'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { db, storage } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes } from 'firebase/storage';

interface ProcessedImage {
  id: string;
  originalFilename: string;
  originalPath: string;
  processedPath: string;
  fileSize: number;
  width: number;
  height: number;
  createdAt: Timestamp;
  userId?: string;
}

// Helper function to convert storage path to proxy URL
const getProxyUrl = (path: string) => {
  return `/api/image?path=${encodeURIComponent(path)}`;
};

type Resolution = 'low' | 'medium' | 'high' | 'original';
type Format = 'png' | 'jpg';

export default function BackgroundRemover() {
  const { data: session } = useSession();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(true);

  // Download modal state
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedImageForDownload, setSelectedImageForDownload] = useState<ProcessedImage | null>(null);
  const [downloadResolution, setDownloadResolution] = useState<Resolution>('medium');
  const [downloadFormat, setDownloadFormat] = useState<Format>('png');
  const [isDownloading, setIsDownloading] = useState(false);

  // Load user's processed images from Firestore
  useEffect(() => {
    loadProcessedImages();
  }, [session]);

  const loadProcessedImages = async () => {
    setIsLoadingImages(true);
    try {
      const imagesRef = collection(db, 'processedImages');
      let q;

      if (session?.user?.email) {
        q = query(
          imagesRef,
          where('userId', '==', session.user.email),
          orderBy('createdAt', 'desc')
        );
      } else {
        // For non-logged users, we could use localStorage ID or skip
        setIsLoadingImages(false);
        return;
      }

      const querySnapshot = await getDocs(q);
      const images: ProcessedImage[] = [];

      querySnapshot.forEach((doc) => {
        images.push({
          id: doc.id,
          ...doc.data()
        } as ProcessedImage);
      });

      setProcessedImages(images);
    } catch (err) {
      console.error('Error loading images:', err);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleFile = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image (JPG, PNG, or WebP)');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);
    setProcessedImage(null);

    // Preview original
    const reader = new FileReader();
    reader.onload = (e) => setOriginalImage(e.target?.result as string);
    reader.readAsDataURL(file);

    // Process
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/remove-background', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process image');
      }

      const blob = await response.blob();
      const processedUrl = URL.createObjectURL(blob);
      setProcessedImage(processedUrl);

      // Upload to Firebase Storage and save metadata to Firestore
      await saveProcessedImage(file, blob);

      // Reload images list
      await loadProcessedImages();
    } catch (err: any) {
      setError(err.message || 'Failed to process image');
      console.error('Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const saveProcessedImage = async (originalFile: File, processedBlob: Blob) => {
    if (!session?.user?.email) {
      console.log('User not logged in, skipping save');
      throw new Error('You must be logged in to save images');
    }

    console.log('Starting save to Firebase for user:', session.user.email);

    try {
      // Get image dimensions
      console.log('Creating image bitmap to get dimensions...');
      const img = await createImageBitmap(processedBlob);
      const { width, height } = img;
      console.log(`Image dimensions: ${width}x${height}`);

      const timestamp = Date.now();
      const userEmail = session.user.email;

      // Upload original file to Firebase Storage (client-side)
      const originalPath = `originals/${userEmail}/${timestamp}_${originalFile.name}`;
      const originalRef = ref(storage, originalPath);
      console.log('Uploading original to Storage:', originalPath);
      await uploadBytes(originalRef, originalFile);
      console.log('Original uploaded successfully');

      // Upload processed file to Firebase Storage (client-side)
      const processedPath = `processed/${userEmail}/${timestamp}_processed.png`;
      const processedRef = ref(storage, processedPath);
      console.log('Uploading processed to Storage:', processedPath);
      await uploadBytes(processedRef, processedBlob);
      console.log('Processed uploaded successfully');

      // Save metadata via backend API
      const response = await fetch('/api/save-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalFilename: originalFile.name,
          originalPath,
          processedPath,
          fileSize: originalFile.size,
          width,
          height,
          userId: userEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save metadata');
      }

      const result = await response.json();
      console.log('Image saved successfully:', result);
    } catch (err: any) {
      console.error('Error saving to Firebase:', err);
      throw new Error(`Failed to save image: ${err.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async (image: ProcessedImage) => {
    if (!confirm(`Are you sure you want to delete ${image.originalFilename}?`)) return;

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'processedImages', image.id));

      // Delete from Storage
      try {
        const originalRef = ref(storage, image.originalPath);
        await deleteObject(originalRef);
      } catch (err) {
        console.error('Error deleting original from storage:', err);
      }

      try {
        const processedRef = ref(storage, image.processedPath);
        await deleteObject(processedRef);
      } catch (err) {
        console.error('Error deleting processed from storage:', err);
      }

      // Reload images
      await loadProcessedImages();
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Failed to delete image');
    }
  };

  const handleDownloadClick = (image: ProcessedImage) => {
    setSelectedImageForDownload(image);
    setShowDownloadModal(true);
  };

  const handleDownload = async () => {
    if (!selectedImageForDownload) return;

    setIsDownloading(true);
    try {
      // Fetch the processed image through proxy
      const proxyUrl = getProxyUrl(selectedImageForDownload.processedPath);
      const response = await fetch(proxyUrl);
      const blob = await response.blob();

      // Process image with selected resolution and format
      const processedBlob = await processImageWithOptions(
        blob,
        downloadResolution,
        downloadFormat
      );

      // Create download link
      const url = URL.createObjectURL(processedBlob);
      const a = document.createElement('a');
      a.href = url;
      const extension = downloadFormat === 'jpg' ? 'jpg' : 'png';
      a.download = `${selectedImageForDownload.originalFilename.split('.')[0]}_processed.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowDownloadModal(false);
      setSelectedImageForDownload(null);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download image');
    } finally {
      setIsDownloading(false);
    }
  };

  const processImageWithOptions = async (
    blob: Blob,
    resolution: Resolution,
    format: Format
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate target dimensions based on resolution
        let targetWidth = img.width;
        let targetHeight = img.height;

        if (resolution !== 'original') {
          const maxSize = resolution === 'low' ? 512 : resolution === 'medium' ? 1024 : 2048;
          const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
          targetWidth = Math.round(img.width * scale);
          targetHeight = Math.round(img.height * scale);
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // For JPG, fill with white background
        if (format === 'jpg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
          (processedBlob) => {
            if (processedBlob) {
              resolve(processedBlob);
            } else {
              reject(new Error('Failed to process image'));
            }
          },
          format === 'jpg' ? 'image/jpeg' : 'image/png',
          0.95
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(blob);
    });
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, []);

  return (
    <div className="space-y-8">
      {/* Upload Area */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-purple-500 bg-purple-500/10'
            : 'border-gray-700 hover:border-purple-500 hover:bg-gray-800/50'
        }`}
      >
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={onFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">
                {isDragActive ? 'Drop image here' : 'Drag & drop an image here'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                or click to browse (JPG, PNG, WebP up to 10MB)
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg">
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* Processing */}
      {isProcessing && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500/30 border-t-purple-500"></div>
          <p className="mt-4 text-gray-400 font-medium">Removing background with AI...</p>
          <p className="text-sm text-gray-500 mt-2">This usually takes 10-15 seconds</p>
        </div>
      )}

      {/* Current Results */}
      {(originalImage || processedImage) && !isProcessing && (
        <div className="grid md:grid-cols-2 gap-8">
          {originalImage && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Original Image</h3>
              <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-700 bg-gray-800">
                <Image src={originalImage} alt="Original" fill className="object-contain" />
              </div>
            </div>
          )}
          {processedImage && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Background Removed</h3>
              <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-700 bg-[linear-gradient(45deg,#1f2937_25%,transparent_25%,transparent_75%,#1f2937_75%,#1f2937),linear-gradient(45deg,#1f2937_25%,transparent_25%,transparent_75%,#1f2937_75%,#1f2937)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]">
                <Image src={processedImage} alt="Processed" fill className="object-contain" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image Gallery */}
      {session && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              Your Images
            </h2>
            <span className="text-sm text-gray-400">
              {processedImages.length} {processedImages.length === 1 ? 'image' : 'images'}
            </span>
          </div>

          {isLoadingImages ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500/30 border-t-purple-500"></div>
            </div>
          ) : processedImages.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400">No processed images yet</p>
              <p className="text-sm text-gray-500 mt-2">Upload and process your first image!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {processedImages.map((image) => (
                <div key={image.id} className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 hover:border-purple-500 transition-all">
                  <div className="aspect-square relative bg-[linear-gradient(45deg,#1f2937_25%,transparent_25%,transparent_75%,#1f2937_75%,#1f2937),linear-gradient(45deg,#1f2937_25%,transparent_25%,transparent_75%,#1f2937_75%,#1f2937)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]">
                    <Image
                      src={getProxyUrl(image.processedPath)}
                      alt={image.originalFilename}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-white truncate mb-2" title={image.originalFilename}>
                      {image.originalFilename}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                      <span>{(image.fileSize / 1024).toFixed(0)} KB</span>
                      <span>•</span>
                      <span>{image.width} × {image.height}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownloadClick(image)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                      <button
                        onClick={() => handleDelete(image)}
                        className="bg-red-500/20 text-red-400 hover:bg-red-500/30 py-2 px-3 rounded-lg transition-all duration-200"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Download Modal */}
      {showDownloadModal && selectedImageForDownload && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Download Options
                </h3>
                <button
                  onClick={() => {
                    setShowDownloadModal(false);
                    setSelectedImageForDownload(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-gray-300 mb-2">
                  Choose your preferred resolution and format for{' '}
                  <span className="font-semibold text-white">{selectedImageForDownload.originalFilename}</span>
                </p>
              </div>

              {/* Resolution Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Resolution
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'low' as Resolution, label: 'Low (512px)', desc: 'Fast & Small' },
                    { value: 'medium' as Resolution, label: 'Medium (1024px)', desc: 'Balanced' },
                    { value: 'high' as Resolution, label: 'High (2048px)', desc: 'High Quality' },
                    { value: 'original' as Resolution, label: 'Original', desc: 'Best Quality' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDownloadResolution(option.value)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        downloadResolution === option.value
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                      }`}
                    >
                      <div className="font-semibold text-white mb-1">{option.label}</div>
                      <div className="text-xs text-gray-400">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'png' as Format, label: 'PNG', desc: 'Transparent background' },
                    { value: 'jpg' as Format, label: 'JPG', desc: 'Smaller file size' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDownloadFormat(option.value)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        downloadFormat === option.value
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                      }`}
                    >
                      <div className="font-semibold text-white mb-1">{option.label}</div>
                      <div className="text-xs text-gray-400">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => {
                  setShowDownloadModal(false);
                  setSelectedImageForDownload(null);
                }}
                className="flex-1 bg-gray-800 text-gray-300 py-3 px-6 rounded-xl font-semibold hover:bg-gray-700 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
