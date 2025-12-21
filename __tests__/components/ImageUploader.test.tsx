import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImageUploader from '@/components/ImageUploader';
import toast from 'react-hot-toast';

// Mock fetch
global.fetch = vi.fn();

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Store original FileReader
const OriginalFileReader = window.FileReader;

describe('ImageUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock FileReader properly
    class MockFileReader {
      result: string | ArrayBuffer | null = null;
      onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null;

      readAsDataURL() {
        this.result = 'data:image/png;base64,test';
        setTimeout(() => {
          if (this.onloadend) {
            this.onloadend.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>);
          }
        }, 0);
      }
    }

    window.FileReader = MockFileReader as unknown as typeof FileReader;
  });

  afterEach(() => {
    window.FileReader = OriginalFileReader;
  });

  describe('Initial render', () => {
    it('should render upload area initially', () => {
      render(<ImageUploader />);

      expect(screen.getByText('Upload Image')).toBeInTheDocument();
      expect(screen.getByText('or drop image anywhere')).toBeInTheDocument();
    });

    it('should render supported formats info', () => {
      render(<ImageUploader />);

      expect(screen.getByText(/Supported formats:/)).toBeInTheDocument();
    });

    it('should have hidden file input', () => {
      render(<ImageUploader />);

      const input = document.querySelector('input[type="file"]');
      expect(input).toHaveClass('hidden');
    });
  });

  describe('File validation', () => {
    it('should reject invalid file types', async () => {
      render(<ImageUploader />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const invalidFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      fireEvent.change(input, { target: { files: [invalidFile] } });

      expect(toast.error).toHaveBeenCalledWith(
        'Please upload a valid image file (PNG, JPG, JPEG, WEBP, HEIC, BMP)'
      );
    });

    it('should reject files larger than 10MB', async () => {
      render(<ImageUploader />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const largeContent = new Uint8Array(11 * 1024 * 1024); // 11MB
      const largeFile = new File([largeContent], 'large.png', { type: 'image/png' });

      fireEvent.change(input, { target: { files: [largeFile] } });

      expect(toast.error).toHaveBeenCalledWith('File size must be less than 10MB');
    });

    it('should accept valid PNG file', async () => {
      render(<ImageUploader />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = new File(['content'], 'test.png', { type: 'image/png' });

      fireEvent.change(input, { target: { files: [validFile] } });

      // Should show preview mode (look for scale selector)
      await waitFor(() => {
        expect(screen.getByText('Original Image')).toBeInTheDocument();
      });
    });
  });

  describe('Preview mode', () => {
    const setupPreviewMode = async () => {
      render(<ImageUploader />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = new File(['content'], 'test.png', { type: 'image/png' });

      fireEvent.change(input, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(screen.getByText('Original Image')).toBeInTheDocument();
      });
    };

    it('should display scale selector', async () => {
      await setupPreviewMode();

      expect(screen.getByText('Upscale to')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should display enhance face toggle', async () => {
      await setupPreviewMode();

      expect(screen.getByText('Enhance Face Quality')).toBeInTheDocument();
    });

    it('should display Process Image button', async () => {
      await setupPreviewMode();

      expect(screen.getByText('Process Image')).toBeInTheDocument();
    });

    it('should display Upload New button', async () => {
      await setupPreviewMode();

      expect(screen.getByText('Upload New')).toBeInTheDocument();
    });

    it('should allow changing scale value', async () => {
      await setupPreviewMode();

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '4' } });

      expect(select).toHaveValue('4');
    });

    it('should toggle enhance face option', async () => {
      await setupPreviewMode();

      const toggleButton = screen.getByText('On');
      fireEvent.click(toggleButton);

      expect(screen.getByText('Off')).toBeInTheDocument();
    });
  });

  describe('Processing', () => {
    const setupAndProcess = async () => {
      render(<ImageUploader />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = new File(['content'], 'test.png', { type: 'image/png' });

      fireEvent.change(input, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(screen.getByText('Process Image')).toBeInTheDocument();
      });
    };

    it('should call API on process', async () => {
      await setupAndProcess();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ imageUrl: '/api/processed-images/123/view' }),
      });

      const processButton = screen.getByText('Process Image');
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/upscale', expect.any(Object));
      });
    });

    it('should show processing state', async () => {
      await setupAndProcess();

      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ imageUrl: '/test.png' }),
        }), 100))
      );

      const processButton = screen.getByText('Process Image');
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(screen.getByText('Processing...')).toBeInTheDocument();
      });
    });

    it('should show download button after processing', async () => {
      await setupAndProcess();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ imageUrl: '/api/processed-images/123/view' }),
      });

      const processButton = screen.getByText('Process Image');
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(screen.getByText('Download Image')).toBeInTheDocument();
      });
    });

    it('should handle API error', async () => {
      await setupAndProcess();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ details: 'Insufficient credits' }),
      });

      const processButton = screen.getByText('Process Image');
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Insufficient credits'));
      });
    });
  });

  describe('Drag and drop', () => {
    it('should show drag active state', () => {
      render(<ImageUploader />);

      const dropZone = document.querySelector('.border-dashed')!;

      fireEvent.dragEnter(dropZone, {
        dataTransfer: { files: [] },
      });

      expect(dropZone).toHaveClass('border-green-500');
    });

    it('should remove drag active state on drag leave', () => {
      render(<ImageUploader />);

      const dropZone = document.querySelector('.border-dashed')!;

      fireEvent.dragEnter(dropZone, {
        dataTransfer: { files: [] },
      });

      fireEvent.dragLeave(dropZone, {
        dataTransfer: { files: [] },
      });

      expect(dropZone).not.toHaveClass('border-green-500');
    });
  });

  describe('Reset functionality', () => {
    it('should reset to initial state on Upload New click', async () => {
      render(<ImageUploader />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = new File(['content'], 'test.png', { type: 'image/png' });

      fireEvent.change(input, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(screen.getByText('Upload New')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Upload New'));

      await waitFor(() => {
        expect(screen.getByText('Upload Image')).toBeInTheDocument();
      });
    });
  });
});
