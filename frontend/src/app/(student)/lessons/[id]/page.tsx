'use client';

import React, { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';
import api from '@/lib/api';
import Editor from '@monaco-editor/react';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { ChevronLeft, ChevronRight, Save, Play, Eye, EyeOff, CloudCheck, CloudUpload, CheckCircle2, FileText } from 'lucide-react';
import Link from 'next/link';
import { Console } from '@/components/Console';
import { isAxiosError } from 'axios';
import MaterialModal from '@/components/MaterialModal';

interface Material {
  id: number;
  title: string;
  content: string;
}

interface Category {
  id: number;
  name: string;
}

interface Lesson {
  id: number;
  title: string;
  language: string;
  content: string;
  model_answer?: string;
  expected_output?: string;
  categories: Category[];
  materials: Material[];
  next_lesson_id: number | null;
}

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [code, setCode] = useState<string>('');
  const [lastSavedCode, setLastSavedCode] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Execution State
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isExecuting, setIsExecuting] = useState(false);
  const [judgeResult, setJudgeResult] = useState<'pass' | 'fail' | null>(null);

  // Reset lesson-scoped local state during render when navigating between
  // lessons, since Next.js reuses this component instance across dynamic
  // segment changes instead of remounting it.
  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    setLogs([]);
    setError(undefined);
    setJudgeResult(null);
    setShowModelAnswer(false);
    setSelectedMaterial(null);
    setIsLoading(true);
  }

  useEffect(() => {
    const fetchLessonAndSubmission = async () => {
      try {
        const [lessonRes, submissionRes] = await Promise.all([
          api.get(`/lessons/${id}`),
          api.get(`/submissions/lesson/${id}`).catch(() => ({ data: null }))
        ]);

        const lessonData = lessonRes.data;
        setLesson(lessonData);
        
        if (submissionRes.data && submissionRes.data.code) {
          setCode(submissionRes.data.code);
          setLastSavedCode(submissionRes.data.code);
          setIsCompleted(submissionRes.data.status === 'completed');
        } else {
          // Set default code based on language
          const defaultCode = lessonData.language === 'php' ? '<?php\n\necho "Hello, World!";\n' : 
                             lessonData.language === 'python' ? 'print("Hello, World!")\n' :
                             '// ここにコードを書いてください\n';
          setCode(defaultCode);
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

  const handleSave = useCallback(async (codeToSave: string) => {
    if (!codeToSave || codeToSave === lastSavedCode) return;
    
    setIsSaving(true);
    try {
      await api.post('/submissions', {
        lesson_id: id,
        code: codeToSave,
        status: 'saved'
      });
      setLastSavedCode(codeToSave);
    } catch (error) {
      console.error('Save failed', error);
    } finally {
      setIsSaving(false);
    }
  }, [id, lastSavedCode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (code !== lastSavedCode && !isLoading) {
        handleSave(code);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [code, lastSavedCode, handleSave, isLoading]);

  const handleRun = async () => {
    if (!lesson) return;
    
    setIsExecuting(true);
    setLogs([]);
    setError(undefined);
    setJudgeResult(null);
    
    try {
      const response = await api.post('/execute', {
        language: lesson.language,
        code: code
      });
      
      const { status, stdout, stderr, execution_time_ms } = response.data;
      
      const outputLines = stdout ? stdout.split('\n').filter((l: string) => l !== '') : [];
      setLogs(outputLines);

      if (status === 'error' || status === 'timeout') {
        setError(stderr || `Execution ${status}`);
      } else if (stderr) {
        setLogs(prev => [...prev, `stderr: ${stderr}`]);
      }

      if (execution_time_ms !== undefined) {
        console.log(`Execution time: ${execution_time_ms}ms`);
      }

      if (lesson.expected_output && status === 'success') {
        const actual = (stdout || '').trim();
        const expected = lesson.expected_output.trim();
        setJudgeResult(actual === expected ? 'pass' : 'fail');
      }
    } catch (err) {
      console.error('Execution failed', err);
      let message = '実行中にエラーが発生しました。';
      if (isAxiosError(err) && err.response?.data?.message) {
        message = err.response.data.message;
      }
      setError(message);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClearConsole = () => {
    setLogs([]);
    setError(undefined);
    setJudgeResult(null);
  };

  const handleComplete = async () => {
    if (isCompleted) return;
    
    try {
      await api.post('/submissions/complete', {
        lesson_id: id,
        code: code,
      });
      setIsCompleted(true);
      setLastSavedCode(code);
    } catch (error) {
      console.error('Failed to complete lesson', error);
      alert('完了処理に失敗しました。');
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

  const relatedMaterials = lesson.materials;
  const backHref = lesson.categories.length > 0
    ? `/categories/${lesson.categories[0].id}`
    : '/';

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="h-14 border-b border-slate-700 bg-slate-800 px-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href={backHref} className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-100">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="font-bold text-lg truncate max-w-[300px] md:max-w-md">
            {lesson.title}
          </h1>
          {isSaving ? (
            <div className="flex items-center text-xs text-slate-400 animate-pulse">
              <CloudUpload size={14} className="mr-1" />
              保存中...
            </div>
          ) : (
            <div className="flex items-center text-xs text-emerald-500">
              <CloudCheck size={14} className="mr-1" />
              保存済み
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-slate-300 hover:bg-slate-700 hover:text-white ${showModelAnswer ? 'bg-slate-700 text-white' : ''}`}
            onClick={() => setShowModelAnswer(!showModelAnswer)}
          >
            {showModelAnswer ? <EyeOff size={18} className="mr-2" /> : <Eye size={18} className="mr-2" />}
            模範解答
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-300 hover:bg-slate-700 hover:text-white"
            onClick={() => handleSave(code)}
            disabled={isSaving}
          >
            <Save size={18} className="mr-2" />
            {isSaving ? '保存中...' : '保存'}
          </Button>
          <Button 
            size="sm" 
            className="bg-emerald-600 hover:bg-emerald-500 text-white border-none"
            onClick={handleRun}
            disabled={isExecuting}
          >
            <Play size={18} className="mr-2" />
            {isExecuting ? '実行中...' : '実行'}
          </Button>
          <Button 
            size="sm" 
            className={`${isCompleted ? 'bg-slate-700 text-emerald-400 cursor-default' : 'bg-blue-600 hover:bg-blue-500 text-white'} border-none`}
            onClick={handleComplete}
            disabled={isCompleted}
          >
            <CheckCircle2 size={18} className="mr-2" />
            {isCompleted ? '完了済み' : '完了にする'}
          </Button>
          {lesson.next_lesson_id !== null && (
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:bg-slate-700 hover:text-white"
              onClick={() => router.push(`/lessons/${lesson.next_lesson_id}`)}
            >
              次のレッスンへ
              <ChevronRight size={18} className="ml-2" />
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Pane: Instructions */}
        <div className={`${showModelAnswer ? 'w-1/3' : 'w-1/2'} overflow-y-auto bg-white text-slate-900 p-8 border-r border-slate-200 transition-all`}>
          {relatedMaterials.length > 0 && (
            <div className="mb-6">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                <FileText size={14} />
                参考資料
              </h2>
              <div className="flex flex-col gap-2">
                {relatedMaterials.map(material => (
                  <button
                    key={material.id}
                    onClick={() => setSelectedMaterial(material)}
                    className="text-left px-4 py-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm text-slate-700 font-medium"
                  >
                    {material.title}
                  </button>
                ))}
              </div>
            </div>
          )}
          <MarkdownRenderer content={lesson.content} />
        </div>

        {/* Right Pane: Editor(s) & Console */}
        <div className={`${showModelAnswer ? 'w-2/3' : 'w-1/2'} flex flex-col bg-slate-900 transition-all`}>
          {/* Editors Container */}
          <div className="flex-1 flex flex-row overflow-hidden">
            {/* Your Editor */}
            <div className="flex-1 flex flex-col border-r border-slate-700">
              <div className="h-8 bg-slate-800 border-b border-slate-700 px-4 flex items-center text-xs font-mono text-slate-400 justify-between">
                <span>
                  {lesson.language === 'php' ? 'main.php' : 
                   lesson.language === 'python' ? 'main.py' :
                   lesson.language === 'ruby' ? 'main.rb' :
                   lesson.language === 'java' ? 'Main.java' : 'main.js'}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-sans">あなたのコード</span>
              </div>
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={lesson.language || 'javascript'}
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    padding: { top: 16 },
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>

            {/* Model Answer (Optional) */}
            {showModelAnswer && (
              <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300 border-l border-slate-700">
                <div className="h-8 bg-slate-800 border-b border-slate-700 px-4 flex items-center text-xs font-mono text-slate-400 justify-between">
                  <span>
                    {lesson.language === 'php' ? 'solution.php' : 
                     lesson.language === 'python' ? 'solution.py' :
                     lesson.language === 'ruby' ? 'solution.rb' :
                     lesson.language === 'java' ? 'Solution.java' : 'solution.js'}
                  </span>
                  <span className="text-[10px] text-amber-500 uppercase tracking-wider font-sans font-bold">模範解答</span>
                </div>
                <div className="flex-1 opacity-80">
                  <Editor
                    height="100%"
                    language={lesson.language || 'javascript'}
                    theme="vs-dark"
                    value={lesson.model_answer || '// 模範解答は用意されていません'}
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      readOnly: true,
                      scrollBeyondLastLine: false,
                      lineNumbers: 'on',
                      padding: { top: 16 },
                      automaticLayout: true,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Judge Result Banner */}
          {judgeResult && (
            <div className={`px-4 py-2 flex items-center gap-2 text-sm font-bold ${judgeResult === 'pass' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
              {judgeResult === 'pass' ? '✓ PASS — 期待される出力と一致しました' : '✗ FAIL — 期待される出力と一致しませんでした'}
            </div>
          )}

          {/* Console Area */}
          <div className="h-1/3 min-h-[150px]">
            <Console
              logs={logs}
              error={error}
              onClear={handleClearConsole}
            />
          </div>
        </div>
      </main>

      <MaterialModal material={selectedMaterial} onClose={() => setSelectedMaterial(null)} />
    </div>
  );
}
