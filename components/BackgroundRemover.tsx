'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

interface ImageData {
  id: string;
  originalFilename: string;
  fileSize: number;
  width: number;
  height: number;
  processedPath: string; // Replicate URL
  createdAt: string;
}

interface UploadQueueItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
  resultImageId?: string;
}

export default function BackgroundRemover() {
  const { data: session } = useSession();
  const [images, setImages] = useState<ImageData[]>([]);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(true);

  // Load images on mount
  useEffect(() => {
    fetchImages();
  }, [session]);

  const fetchImages = async () => {
    if (!session?.user?.email) {
      setIsLoadingImages(false);
      return;
    }

    try {
      const response = await fetch('/api/get-images');
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }

      const data = await response.json();
      setImages(data.images || []);
    } catch (err) {
      console.error('Failed to fetch images:', err);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFilesSelect(Array.from(files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFilesSelect(Array.from(files));
    }
  };

  const handleFilesSelect = (files: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name}: Not an image file`);
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File too large (max 10MB)`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setError(errors.join(', '));
    } else {
      setError(null);
    }

    if (validFiles.length > 0) {
      // Add files to upload queue with unique IDs
      const newQueueItems: UploadQueueItem[] = validFiles.map(file => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        status: 'pending',
        progress: 0
      }));

      setUploadQueue(prev => [...prev, ...newQueueItems]);
    }
  };

  // Process upload queue
  useEffect(() => {
    const processQueue = async () => {
      if (isProcessingQueue) return;

      const pendingItem = uploadQueue.find(item => item.status === 'pending');
      if (!pendingItem) return;

      setIsProcessingQueue(true);

      try {
        if (!session?.user?.email) {
          throw new Error('You must be logged in to process images');
        }

        const pendingItemId = pendingItem.id;

        // Update status to uploading
        setUploadQueue(prev => prev.map(item =>
          item.id === pendingItemId
            ? { ...item, status: 'uploading', progress: 0 }
            : item
        ));

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadQueue(prev => prev.map(item =>
            item.id === pendingItemId && item.progress < 90
              ? { ...item, progress: item.progress + 10 }
              : item
          ));
        }, 200);

        // Process image (remove background)
        const formData = new FormData();
        formData.append('image', pendingItem.file);

        const response = await fetch('/api/remove-background', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process image');
        }

        const data = await response.json();

        // Save metadata to Firestore
        const saveResponse = await fetch('/api/save-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            originalFilename: pendingItem.file.name,
            replicateUrl: data.imageUrl,
            fileSize: pendingItem.file.size,
          }),
        });

        if (!saveResponse.ok) {
          const errorData = await saveResponse.json();
          throw new Error(errorData.error || 'Failed to save image');
        }

        const result = await saveResponse.json();

        clearInterval(progressInterval);

        // Update status to completed
        setUploadQueue(prev => prev.map(item =>
          item.id === pendingItemId
            ? { ...item, status: 'completed', progress: 100, resultImageId: result.id }
            : item
        ));

        // Refresh images
        await fetchImages();

        // Auto-remove completed item after 2 seconds
        setTimeout(() => {
          setUploadQueue(prev => prev.filter(item => item.id !== pendingItemId));
        }, 2000);

      } catch (error: any) {
        const pendingItemId = pendingItem.id;
        // Update status to failed
        setUploadQueue(prev => prev.map(item =>
          item.id === pendingItemId
            ? {
                ...item,
                status: 'failed',
                progress: 0,
                error: error.message || 'Upload failed'
              }
            : item
        ));
      } finally {
        setIsProcessingQueue(false);
      }
    };

    processQueue();
  }, [uploadQueue, isProcessingQueue, session]);

  const clearCompletedUploads = () => {
    setUploadQueue(prev => prev.filter(item => item.status !== 'completed' && item.status !== 'failed'));
  };

  const removeFromQueue = (item: UploadQueueItem) => {
    setUploadQueue(prev => prev.filter(i => i !== item));
  };

  const handleDownload = async (imageId: string, filename: string) => {
    try {
      const url = `/api/download-image/${imageId}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to download image');
      }

      const blob = await response.blob();

      // Create download link
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${filename.split('.')[0]}_processed.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      setError('Failed to download image');
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(`/api/delete-image/${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      // Refresh images
      await fetchImages();
      setSuccess('Image deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to delete image');
    }
  };

  return (
    <div className="space-y-8">
      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-400 font-medium">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-400 font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Remove Background
        </h2>

        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-4 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
            isDragging
              ? 'border-purple-500 bg-purple-50/10 scale-105'
              : uploadQueue.length > 0
              ? 'border-purple-400 bg-purple-50/5'
              : 'border-gray-600 hover:border-purple-400'
          }`}
        >
          {uploadQueue.length === 0 ? (
            <>
              <svg
                className="w-20 h-20 text-gray-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-2xl font-bold text-white mb-2">
                Drop your images here
              </p>
              <p className="text-gray-400 mb-6">
                or click to browse (PNG, JPG, WebP, max 10MB per file)
              </p>
              <label className="inline-block">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer inline-block">
                  Choose Images
                </span>
              </label>
            </>
          ) : (
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">
                  Upload Queue ({uploadQueue.length} {uploadQueue.length === 1 ? 'file' : 'files'})
                </h3>
                {uploadQueue.filter(item => item.status === 'completed' || item.status === 'failed').length > 0 && (
                  <button
                    onClick={clearCompletedUploads}
                    className="text-sm text-gray-400 hover:text-purple-400 font-semibold transition-colors"
                  >
                    Clear Completed
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {uploadQueue.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border-2 ${
                      item.status === 'completed'
                        ? 'border-green-500/50 bg-green-500/10'
                        : item.status === 'failed'
                        ? 'border-red-500/50 bg-red-500/10'
                        : item.status === 'uploading'
                        ? 'border-purple-500/50 bg-purple-500/10'
                        : 'border-gray-600 bg-gray-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        {item.status === 'completed' && (
                          <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {item.status === 'failed' && (
                          <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                        {item.status === 'uploading' && (
                          <svg className="w-8 h-8 text-purple-500 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {item.status === 'pending' && (
                          <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-grow min-w-0">
                        <p className="font-semibold text-white truncate">{item.file.name}</p>
                        <p className="text-sm text-gray-400">
                          {(item.file.size / 1024 / 1024).toFixed(2)} MB
                          {item.status === 'completed' && ' - Completed'}
                          {item.status === 'failed' && ` - ${item.error}`}
                          {item.status === 'uploading' && ' - Processing...'}
                          {item.status === 'pending' && ' - Waiting...'}
                        </p>

                        {/* Progress Bar */}
                        {item.status === 'uploading' && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
                                style={{ width: `${item.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Remove Button */}
                      {(item.status === 'pending' || item.status === 'failed' || item.status === 'completed') && (
                        <button
                          onClick={() => removeFromQueue(item)}
                          className="flex-shrink-0 text-gray-500 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add More Files Button */}
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer inline-flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add More Images
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

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
              {images.length} {images.length === 1 ? 'image' : 'images'}
            </span>
          </div>

          {isLoadingImages ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500/30 border-t-purple-500"></div>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400">No processed images yet</p>
              <p className="text-sm text-gray-500 mt-2">Upload and process your first image!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div key={image.id} className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 hover:border-purple-500 transition-all">
                  <div className="aspect-square relative bg-[linear-gradient(45deg,#1f2937_25%,transparent_25%,transparent_75%,#1f2937_75%,#1f2937),linear-gradient(45deg,#1f2937_25%,transparent_25%,transparent_75%,#1f2937_75%,#1f2937)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]">
                    <Image
                      src={image.processedPath}
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
                        onClick={() => handleDownload(image.id, image.originalFilename)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                      <button
                        onClick={() => handleDelete(image.id)}
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
    </div>
  );
}
