import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif', gap: '16px' }}>
          <h1>Something went wrong</h1>
          <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', fontSize: '14px', cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
