import React from 'react';

export function getModeHref(pathname, mode) {
  const isStatic = pathname.includes('/frontend/klask/dist/')
    || pathname.endsWith('/klask-4.html')
    || pathname.endsWith('/klask-4-solo.html')
    || pathname.endsWith('/index.html');

  if (isStatic) {
    if (mode === 'klask') return './index.html?from=klask4';
    if (mode === 'team') return './klask-4.html';
    if (mode === 'solo') return './klask-4-solo.html';
    return './index.html';
  }

  if (mode === 'klask') return '/?from=klask4';
  if (mode === 'team') return '/klask-4';
  if (mode === 'solo') return '/klask-4-solo';
  return '/';
}

export function ModeSwitchButtons({ rightMode, rightLabel }) {
  const pathname = window.location.pathname;

  return (
    <>
      <a className="switch-app-btn switch-app-btn-top-left" href={getModeHref(pathname, 'klask')}>Klask</a>
      <a className="switch-app-btn switch-app-btn-top-right" href={getModeHref(pathname, rightMode)}>{rightLabel}</a>
    </>
  );
}

export function LoadingScreen() {
  return <div className="loading-screen"><div className="loading-text">Loading...</div></div>;
}
