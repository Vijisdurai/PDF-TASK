import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

const Header: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isDocumentViewer = location.pathname.startsWith('/document/');

  const handleBackToLibrary = () => {
    dispatch({ type: 'SET_CURRENT_DOCUMENT', payload: null });
    dispatch({ type: 'SET_ANNOTATIONS', payload: [] });
    navigate('/');
  };

  const toggleNotesPanel = () => {
    dispatch({ type: 'TOGGLE_NOTE_PANEL' });
  };

  return (
    <header className="bg-navy-800 border-b border-navy-700 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Logo and title */}
        <div className="flex items-center space-x-4">
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-off-white hover:text-ocean-400 transition-colors"
          >
            <div className="w-8 h-8 bg-ocean-500 rounded-lg flex items-center justify-center">
              <svg 
                className="w-5 h-5 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
            </div>
            <span className="text-xl font-bold hidden sm:block">Library</span>
          </Link>

          {/* Breadcrumb navigation */}
          {isDocumentViewer && state.currentDocument && (
            <nav className="flex items-center space-x-2 text-sm">
              <button
                onClick={handleBackToLibrary}
                className="text-gray-400 hover:text-ocean-400 transition-colors"
              >
                Library
              </button>
              <span className="text-gray-600">/</span>
              <span className="text-off-white font-medium truncate max-w-xs">
                {state.currentDocument.filename}
              </span>
            </nav>
          )}
        </div>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Connection status */}
          <div className="flex items-center space-x-2">
            <div 
              className={`w-2 h-2 rounded-full ${
                state.isOnline ? 'bg-green-400' : 'bg-red-400'
              }`}
            />
            <span className="text-sm text-gray-300">
              {state.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Document viewer controls */}
          {isDocumentViewer && (
            <>
              <div className="h-6 w-px bg-navy-600" />
              
              {/* Page info */}
              <div className="text-sm text-gray-300">
                Page {state.viewerState.currentPage}
              </div>

              {/* Zoom info */}
              <div className="text-sm text-gray-300">
                {Math.round(state.viewerState.zoomScale * 100)}%
              </div>

              {/* Notes panel toggle */}
              <button
                onClick={toggleNotesPanel}
                className={`p-2 rounded-lg transition-colors ${
                  state.isNotePanelOpen
                    ? 'bg-ocean-500 text-white'
                    : 'bg-navy-700 text-gray-300 hover:bg-navy-600'
                }`}
                title="Toggle notes panel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" 
                  />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-lg bg-navy-700 text-gray-300 hover:bg-navy-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
            />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-navy-700">
          <div className="flex flex-col space-y-3">
            {/* Connection status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Status:</span>
              <div className="flex items-center space-x-2">
                <div 
                  className={`w-2 h-2 rounded-full ${
                    state.isOnline ? 'bg-green-400' : 'bg-red-400'
                  }`}
                />
                <span className="text-sm text-gray-300">
                  {state.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Document viewer mobile controls */}
            {isDocumentViewer && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Page:</span>
                  <span className="text-sm text-off-white">{state.viewerState.currentPage}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Zoom:</span>
                  <span className="text-sm text-off-white">
                    {Math.round(state.viewerState.zoomScale * 100)}%
                  </span>
                </div>

                <button
                  onClick={toggleNotesPanel}
                  className={`w-full p-3 rounded-lg transition-colors text-left ${
                    state.isNotePanelOpen
                      ? 'bg-ocean-500 text-white'
                      : 'bg-navy-700 text-gray-300'
                  }`}
                >
                  {state.isNotePanelOpen ? 'Hide Notes Panel' : 'Show Notes Panel'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;