'use client';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ChatbotSuggestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
  isStreaming?: boolean;
}

export function ChatbotSuggestions({
  questions,
  onSelect,
  isStreaming,
}: ChatbotSuggestionsProps) {
  const [visible, setVisible] = useState<boolean[]>([]);
  const prevQuestionsRef = useRef<string[]>([]);

  useEffect(() => {
    const prev = prevQuestionsRef.current;
    const isNew =
      questions.length > 0 &&
      (questions.length !== prev.length || questions[0] !== prev[0]);
    if (!isNew) return;

    prevQuestionsRef.current = questions;
    setVisible(Array(questions.length).fill(false));
    questions.forEach((_, i) => {
      setTimeout(() => {
        setVisible((v) => {
          const next = [...v];
          next[i] = true;
          return next;
        });
      }, 50 + i * 80);
    });
  }, [questions]);

  if (!questions.length || isStreaming) return null;

  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {questions.map((q, i) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className={cn(
            'rounded-full border px-3 py-1 text-xs',
            'bg-background border-amber-400/60 text-foreground/70',
            'hover:bg-amber-50 hover:border-amber-400 hover:text-foreground dark:hover:bg-amber-950/30',
            'active:scale-95 transition-all duration-150',
            'translate-y-1 opacity-0',
            visible[i] && 'translate-y-0 opacity-100',
          )}
          style={{
            transitionProperty: 'opacity, transform, background-color, color',
            transitionDuration: visible[i] ? '200ms' : '0ms',
          }}
        >
          {q}
        </button>
      ))}
    </div>
  );
}
