import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Define explicit interfaces for Props and State
interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Fix: Explicitly declare state as a class property
  public state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#e11d48' }}>Something went wrong</h1>
          <p style={{ color: '#475569', marginBottom: '1rem' }}>The application encountered an error.</p>
          {this.state.error && (
            <pre style={{ 
              background: '#f1f5f9', 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              overflow: 'auto', 
              textAlign: 'left',
              fontSize: '0.8rem'
            }}>
              {this.state.error.toString()}
            </pre>
          )}
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              background: '#0d9488',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);