'use client';

import type { DragEvent } from 'react';

type WebkitDataTransferItem = DataTransferItem & {
  webkitGetAsEntry?: () => FileSystemEntry | null;
};

function readFileEntry(entry: FileSystemFileEntry): Promise<File[]> {
  return new Promise((resolve) => {
    entry.file(
      (file) => resolve([file]),
      () => resolve([]),
    );
  });
}

function readDirectoryEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve) => {
    const collected: FileSystemEntry[] = [];

    function pump() {
      reader.readEntries(
        (entries) => {
          if (entries.length === 0) {
            resolve(collected);
            return;
          }

          collected.push(...entries);
          pump();
        },
        () => resolve(collected),
      );
    }

    pump();
  });
}

async function readEntry(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    return readFileEntry(entry as FileSystemFileEntry);
  }

  const entries = await readDirectoryEntries((entry as FileSystemDirectoryEntry).createReader());
  const nestedFiles = await Promise.all(entries.map((childEntry) => readEntry(childEntry)));
  return nestedFiles.flat();
}

export function hasExternalFiles(event: DragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer.types).includes('Files');
}

export async function extractFilesFromDrop(event: DragEvent<HTMLElement>) {
  const items = Array.from(event.dataTransfer.items ?? []) as WebkitDataTransferItem[];
  const entries = items
    .map((item) => item.webkitGetAsEntry?.() ?? null)
    .filter((entry): entry is FileSystemEntry => entry !== null);

  if (entries.length > 0) {
    const files = await Promise.all(entries.map((entry) => readEntry(entry)));
    return files.flat().filter((file) => file.size > 0);
  }

  return Array.from(event.dataTransfer.files ?? []).filter((file) => file.size > 0);
}
