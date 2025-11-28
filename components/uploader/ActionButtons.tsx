"use client";

interface SingleModeButtonsProps {
  mode: 'single';
  processing: boolean;
  hasResult: boolean;
  onProcess: () => void;
  onDownload: () => void;
  onReset: () => void;
}

interface BatchModeButtonsProps {
  mode: 'batch';
  processing: boolean;
  totalImages: number;
  completedCount: number;
  currentProgress: number;
  totalProgress: number;
  onProcess: () => void;
  onDownloadAll: () => void;
  onReset: () => void;
}

type ActionButtonsProps = SingleModeButtonsProps | BatchModeButtonsProps;

/**
 * Action buttons for single and batch modes
 */
export default function ActionButtons(props: ActionButtonsProps) {
  if (props.mode === 'batch') {
    return <BatchButtons {...props} />;
  }
  return <SingleButtons {...props} />;
}

function SingleButtons({
  processing,
  hasResult,
  onProcess,
  onDownload,
  onReset
}: SingleModeButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-4 flex-wrap">
      {!hasResult ? (
        <button
          onClick={onProcess}
          disabled={processing}
          className="px-12 py-5 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-bold text-xl transition shadow-xl shadow-green-500/30"
        >
          {processing ? "Processing..." : "Process Image"}
        </button>
      ) : (
        <>
          <button
            onClick={onDownload}
            className="px-8 py-4 bg-green-500 hover:bg-green-600 rounded-lg font-semibold text-lg transition flex items-center gap-2 shadow-lg shadow-green-500/20"
          >
            <DownloadIcon />
            Download Enhanced Image
          </button>
          <button
            onClick={onProcess}
            disabled={processing}
            className="px-6 py-4 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition"
          >
            🔄 Process Again
          </button>
        </>
      )}
      <button
        onClick={onReset}
        disabled={processing}
        className="px-6 py-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg font-semibold transition"
      >
        Upload New Image
      </button>
    </div>
  );
}

function BatchButtons({
  processing,
  totalImages,
  completedCount,
  currentProgress,
  totalProgress,
  onProcess,
  onDownloadAll,
  onReset
}: BatchModeButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-4 flex-wrap">
      {completedCount > 0 && (
        <button
          onClick={onDownloadAll}
          disabled={processing}
          className="px-8 py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition shadow-lg shadow-green-500/20"
        >
          Download All ({completedCount})
        </button>
      )}

      <button
        onClick={onProcess}
        disabled={processing || totalImages === 0}
        className="px-8 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition shadow-lg shadow-blue-500/20"
      >
        {processing
          ? `Processing ${currentProgress}/${totalProgress}...`
          : `Process All ${totalImages} Images`}
      </button>

      <button
        onClick={onReset}
        disabled={processing}
        className="px-6 py-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg font-semibold transition"
      >
        Start New Batch
      </button>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}
