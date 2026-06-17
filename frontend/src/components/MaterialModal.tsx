'use client';

import { X } from 'lucide-react';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface Material {
  id: number;
  title: string;
  content: string;
}

interface MaterialModalProps {
  material: Material | null;
  onClose: () => void;
}

export default function MaterialModal({ material, onClose }: MaterialModalProps) {
  if (!material) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[80vh] flex flex-col bg-white rounded-xl shadow-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-900 truncate pr-4">{material.title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-5">
          <MarkdownRenderer content={material.content} />
        </div>
      </div>
    </div>
  );
}
