'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface LogInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export default function LogInput({ value, onChange, onSubmit, isLoading }: LogInputProps) {
  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => onChange(e.target?.result as string);
      reader.readAsText(file);
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/plain': ['.log', '.txt'] },
    multiple: false
  });

  return (
    <div className="space-y-4">
      <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${isDragActive ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-gray-600 font-medium">{isDragActive ? 'Drop log file here' : 'Drag & drop log file or click to browse'}</p>
          <p className="text-sm text-gray-400">Supports .log and .txt files</p>
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or paste your build log here..."
        className="w-full h-64 p-4 border border-gray-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        disabled={isLoading}
      />

      <button
        onClick={onSubmit}
        disabled={!value || isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
      >
        {isLoading ? '🔍 Analyzing...' : '🚀 Diagnose'}
      </button>
    </div>
  );
}
