'use client';

import { useState, useEffect } from 'react';

interface ProcessingStep {
  id: string;
  label: string;
  duration?: number; // estimated duration in ms
}

interface ProcessingIndicatorProps {
  isProcessing: boolean;
  steps?: ProcessingStep[];
  toolName?: string;
  estimatedTime?: number; // total estimated time in seconds
  className?: string;
}

const defaultSteps: ProcessingStep[] = [
  { id: 'upload', label: 'Uploading image', duration: 1000 },
  { id: 'analyze', label: 'Analyzing content', duration: 2000 },
  { id: 'process', label: 'AI processing', duration: 5000 },
  { id: 'finalize', label: 'Finalizing', duration: 2000 },
];

const funFacts = [
  "AI models can process millions of pixels in seconds",
  "Our AI was trained on millions of high-quality images",
  "Each enhancement uses state-of-the-art neural networks",
  "Your image is being analyzed by multiple AI models",
  "We use GPU acceleration for faster processing",
  "Quality enhancement happens at the pixel level",
];

export default function ProcessingIndicator({
  isProcessing,
  steps = defaultSteps,
  toolName = 'Image',
  estimatedTime = 10,
  className = '',
}: ProcessingIndicatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [funFact, setFunFact] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  // Progress through steps
  useEffect(() => {
    if (!isProcessing) {
      setCurrentStep(0);
      setProgress(0);
      setElapsedTime(0);
      return;
    }

    // Calculate step durations
    const totalDuration = steps.reduce((acc, step) => acc + (step.duration || 2000), 0);
    let accumulated = 0;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = Math.min(prev + 1, 95); // Cap at 95% until done

        // Update current step based on progress
        let stepProgress = 0;
        for (let i = 0; i < steps.length; i++) {
          stepProgress += ((steps[i].duration || 2000) / totalDuration) * 100;
          if (newProgress <= stepProgress) {
            setCurrentStep(i);
            break;
          }
        }

        return newProgress;
      });
    }, totalDuration / 100);

    return () => clearInterval(interval);
  }, [isProcessing, steps]);

  // Elapsed time counter
  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isProcessing]);

  // Fun facts rotation
  useEffect(() => {
    if (!isProcessing) return;

    setFunFact(funFacts[Math.floor(Math.random() * funFacts.length)]);

    const interval = setInterval(() => {
      setFunFact(funFacts[Math.floor(Math.random() * funFacts.length)]);
    }, 4000);

    return () => clearInterval(interval);
  }, [isProcessing]);

  if (!isProcessing) return null;

  return (
    <div className={`bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 ${className}`}>
      {/* Main spinner */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-24 h-24 mb-4">
          {/* Outer ring */}
          <svg className="w-24 h-24 animate-spin-slow" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-700"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${progress * 2.83} ${283 - progress * 2.83}`}
              className="transform -rotate-90 origin-center"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center percentage */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-white mb-2">
          Processing {toolName}...
        </h3>

        <p className="text-gray-400 text-sm">
          {elapsedTime}s elapsed
          {estimatedTime && elapsedTime < estimatedTime && (
            <span> / ~{estimatedTime}s estimated</span>
          )}
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-6">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 transition-all duration-300 ${
              index < currentStep
                ? 'text-green-400'
                : index === currentStep
                ? 'text-white'
                : 'text-gray-500'
            }`}
          >
            {/* Step indicator */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                index < currentStep
                  ? 'bg-green-500'
                  : index === currentStep
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 animate-pulse'
                  : 'bg-gray-700'
              }`}
            >
              {index < currentStep ? (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : index === currentStep ? (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              ) : (
                <span className="text-xs">{index + 1}</span>
              )}
            </div>

            {/* Step label */}
            <span className={`text-sm ${index === currentStep ? 'font-medium' : ''}`}>
              {step.label}
              {index === currentStep && (
                <span className="ml-2 inline-flex">
                  <span className="animate-pulse">.</span>
                  <span className="animate-pulse animation-delay-200">.</span>
                  <span className="animate-pulse animation-delay-400">.</span>
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Fun fact */}
      <div className="bg-gray-700/30 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
          <span className="text-lg">💡</span>
          <span className="animate-fade-in">{funFact}</span>
        </div>
      </div>
    </div>
  );
}

// Compact version for inline use
interface CompactProcessingProps {
  isProcessing: boolean;
  text?: string;
}

export function CompactProcessing({ isProcessing, text = 'Processing...' }: CompactProcessingProps) {
  if (!isProcessing) return null;

  return (
    <div className="flex items-center gap-3 text-gray-300">
      <div className="relative w-5 h-5">
        <div className="absolute inset-0 border-2 border-gray-600 rounded-full"></div>
        <div className="absolute inset-0 border-2 border-t-green-500 rounded-full animate-spin"></div>
      </div>
      <span className="text-sm">{text}</span>
    </div>
  );
}
