// True when running inside the Wails desktop app (Go bridge available).
export const isDesktopApp = (): boolean =>
  typeof window !== 'undefined' && !!(window as any).go?.main?.App

// True when running as the static web demo (GitHub Pages / local browser).
export const isDesktopDemo = (): boolean => !isDesktopApp()
