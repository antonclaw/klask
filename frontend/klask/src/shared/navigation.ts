export type KlaskMode = 'klask' | 'team' | 'solo';

export function getModeHref(pathname: string, mode: KlaskMode) {
  const isStatic = pathname.includes('/frontend/klask/dist/')
    || pathname.endsWith('/klask-4.html')
    || pathname.endsWith('/klask-4-solo.html')
    || pathname.endsWith('/index.html')
    || pathname.includes('/frontend/klask/');

  if (isStatic) {
    if (mode === 'klask') return './index.html?from=klask4';
    if (mode === 'team') return './klask-4.html';
    if (mode === 'solo') return './klask-4-solo.html';
  }

  if (mode === 'klask') return '/?from=klask4';
  if (mode === 'team') return '/klask-4';
  return '/klask-4-solo';
}
