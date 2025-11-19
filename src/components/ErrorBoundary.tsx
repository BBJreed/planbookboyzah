import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Log error to monitoring service
    // In a real app, this would send the error to a service like Sentry
    if (process.env.NODE_ENV === 'production') {
      // Log to external service
      console.log('Error reported to monitoring service:', { error, errorInfo });
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h2 style={{ color: '#dc3545' }}>Something went wrong.</h2>
          <details style={{ 
            whiteSpace: 'pre-wrap',
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '4px',
            marginTop: '15px',
            textAlign: 'left'
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Error Details
            </summary>
            {this.state.error && (
              <div style={{ marginTop: '10px' }}>
                <p><strong>Error:</strong> {this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <p><strong>Component Stack:</strong> {this.state.errorInfo.componentStack}</p>
                )}
              </div>
            )}
          </details>
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={() => {
                this.setState({ hasError: false, error: undefined, errorInfo: undefined });
                window.location.reload();
              }}
              style={{ 
                marginTop: '10px', 
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Reload Page
            </button>
            <button 
              onClick={() => {
                // Try to reset the app state without reloading
                this.setState({ hasError: false, error: undefined, errorInfo: undefined });
              }}
              style={{ 
                marginTop: '10px', 
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                marginLeft: '10px'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}