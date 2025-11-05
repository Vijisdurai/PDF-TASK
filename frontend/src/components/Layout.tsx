import React, { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAppContext } from '../contexts/AppContext';
import Header from './Header';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { state, dispatch } = useAppContext();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen bg-navy-900">
        {/* Header */}
        <Header />
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Global loading overlay */}
        {state.isUploading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-navy-800 rounded-lg p-6 border border-navy-700">
              <LoadingSpinner />
              <p className="text-off-white mt-4 text-center">Uploading document...</p>
            </div>
          </div>
        )}

        {/* Offline indicator */}
        {!state.isOnline && (
          <div className="fixed bottom-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-40">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Offline</span>
            </div>
          </div>
        )}

        {/* Sync status indicator */}
        {state.syncStatus === 'syncing' && (
          <div className="fixed bottom-4 right-4 bg-ocean-500 text-white px-4 py-2 rounded-lg shadow-lg z-40">
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span className="text-sm font-medium">Syncing...</span>
            </div>
          </div>
        )}

        {state.syncStatus === 'error' && (
          <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-40">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-300 rounded-full"></div>
              <span className="text-sm font-medium">Sync Error</span>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Layout;