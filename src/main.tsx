import {StrictMode, Component, ErrorInfo, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.addEventListener('error', (e) => {
  console.error('[GLOBAL WINDOW ERROR]:', e.error || e.message);
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.innerHTML = `<div style="color: red; padding: 20px; font-family: sans-serif; background: white; z-index: 99999; position: relative;"><h1>Lỗi khởi chạy giao diện</h1><pre>${e.error?.stack || e.message}</pre></div>`;
  }
});

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[REACT ERROR BOUNDARY]:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: 'white', color: 'red', fontFamily: 'sans-serif', zIndex: 99999, position: 'relative' }}>
          <h2>Đã xảy ra lỗi giao diện React</h2>
          <pre>{this.state.error?.stack || String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
