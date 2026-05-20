export function formatDateTime(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function splitPermissionCode(code: string): { parent: string; child: string } {
  const firstDot = code.indexOf('.');
  if (firstDot < 0) {
    return { parent: code, child: code };
  }

  return {
    parent: code.slice(0, firstDot),
    child: code.slice(firstDot + 1) || code,
  };
}

export interface PermissionGroup {
  parent: string;
  children: Array<{ code: string; child: string }>;
}

export function groupPermissionCodes(codes: string[]): PermissionGroup[] {
  const groups = new Map<string, Array<{ code: string; child: string }>>();

  codes.forEach((code) => {
    const parsed = splitPermissionCode(code);
    const bucket = groups.get(parsed.parent) ?? [];
    bucket.push({ code, child: parsed.child });
    groups.set(parsed.parent, bucket);
  });

  return Array.from(groups.entries())
    .map(([parent, children]) => ({
      parent,
      children: [...children].sort((a, b) => a.child.localeCompare(b.child)),
    }))
    .sort((a, b) => a.parent.localeCompare(b.parent));
}
