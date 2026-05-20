'use client';

import { Toaster } from 'sonner';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export function ToastProvider() {
  return (
    <Toaster
      position="top-left"
      toastOptions={{
        classNames: {
          toast:
            'group flex items-center gap-3 p-4 rounded-lg shadow-lg border w-full font-sans transition-all',
          success:
            'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-900 dark:text-green-300',
          error:
            'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-900 dark:text-red-300',
          info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300',
          warning:
            'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-900 dark:text-amber-300',
          title: 'font-semibold text-sm',
          description: 'opacity-90 text-xs mt-1',
        },
      }}
      icons={{
        success: <CheckCircle className="h-5 w-5 !text-green-600 dark:!text-green-400" />,
        info: <Info className="h-5 w-5 !text-blue-600 dark:!text-blue-400" />,
        warning: (
          <AlertTriangle className="h-5 w-5 !text-amber-600 dark:!text-amber-400" />
        ),
        error: <AlertCircle className="h-5 w-5 !text-red-600 dark:!text-red-400" />,
      }}
    />
  );
}
