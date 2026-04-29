'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';
import api from '@/lib/api';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft, Save, Play, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface Lesson {
  id: number;
  title: string;
  content: string;
  model_answer?: string;
}

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [code, setCode] = useState<string>('// ここにコードを書いてください\n');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchLessonAndSubmission = async () => {
      try {
        const [lessonRes, submissionRes] = await Promise.all([
          api.get(`/api/lessons/${id}`),
          api.get(`/api/submissions/lesson/${id}`).catch(() => ({ data: null }))
        ]);

        setLesson(lessonRes.data);
        if (submissionRes.data && submissionRes.data.code) {
          setCode(submissionRes.data.code);
        }
      } catch (error) {
        console.error('Failed to fetch lesson data', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchLessonAndSubmission();
    }
  }, [id, authLoading, user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post('/api/submissions', {
        lesson_id: id,
        code: code,
        status: 'saved'
      });
      // 保存成功のフィードバック（簡易）
      alert('保存しました！');
    } catch (error) {
      console.error('Save failed', error);
      alert('保存に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-lg text-slate-600 animate-pulse">レッスンを準備中...</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <p className="text-lg text-slate-600">レッスンが見つかりませんでした。</p>
        <Button className="mt-4" onClick={() => router.push('/')}>
          ホームに戻る
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="h-14 border-b border-slate-700 bg-slate-800 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-100">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="font-bold text-lg truncate max-w-[300px] md:max-w-md">
            {lesson.title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-300 hover:bg-slate-700 hover:text-white"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save size={18} className="mr-2" />
            {isSaving ? '保存中...' : '保存'}
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white border-none">
            <Play size={18} className="mr-2" />
            実行
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Pane: Instructions */}
        <div className="w-1/2 overflow-y-auto bg-white text-slate-900 p-8 border-r border-slate-200 prose prose-slate max-w-none">
          <ReactMarkdown>{lesson.content}</ReactMarkdown>
        </div>

        {/* Right Pane: Editor */}
        <div className="w-1/2 flex flex-col bg-slate-900">
          <div className="h-8 bg-slate-800 border-b border-slate-700 px-4 flex items-center text-xs font-mono text-slate-400">
            main.js
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                roundedSelection: false,
                padding: { top: 16 },
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
