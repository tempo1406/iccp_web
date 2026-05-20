const STORAGE_KEY = 'iccp:imagekit:file-map:v1';

type ImageKitFileMap = Record<string, string>;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readFileMap(): ImageKitFileMap {
  if (!canUseStorage()) return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as ImageKitFileMap) : {};
  } catch {
    return {};
  }
}

function writeFileMap(nextMap: ImageKitFileMap) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMap));
  } catch {
    // Ignore storage failures. Logo upload/remove should still continue.
  }
}

export function rememberImageKitFile(url: string, fileId: string) {
  if (!url?.trim() || !fileId?.trim()) return;

  const nextMap = readFileMap();
  nextMap[url] = fileId;
  writeFileMap(nextMap);
}

export function getImageKitFileId(url?: string | null): string | null {
  if (!url?.trim()) return null;
  return readFileMap()[url] ?? null;
}

export function forgetImageKitFile(url?: string | null) {
  if (!url?.trim()) return;

  const nextMap = readFileMap();
  if (!(url in nextMap)) return;

  delete nextMap[url];
  writeFileMap(nextMap);
}
