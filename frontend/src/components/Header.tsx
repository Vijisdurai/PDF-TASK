import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const Header: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [isEditingZoom, setIsEditingZoom] = useState(false);
  const [zoomInput, setZoomInput] = useState('');

  const isDocumentViewer = location.pathname.startsWith('/document/');

  const handleBackToLibrary = () => {
    dispatch({ type: 'SET_CURRENT_DOCUMENT', payload: null });
    dispatch({ type: 'SET_ANNOTATIONS', payload: [] });
    navigate('/');
  };

  const handlePrevPage = () => {
    if (state.viewerState.currentPage > 1) {
      dispatch({ 
        type: 'SET_VIEWER_STATE', 
        payload: { currentPage: state.viewerState.currentPage - 1 } 
      });
    }
  };

  const handleNextPage = () => {
    dispatch({ 
      type: 'SET_VIEWER_STATE', 
      payload: { currentPage: state.viewerState.currentPage + 1 } 
    });
  };

  const handleZoomIn = () => {
    const newScale = Math.min(3, state.viewerState.zoomScale + 0.25);
    dispatch({ type: 'SET_VIEWER_STATE', payload: { zoomScale: newScale } });
  };

  const handleZoomOut = () => {
    const newScale = Math.max(0.25, state.viewerState.zoomScale - 0.25);
    dispatch({ type: 'SET_VIEWER_STATE', payload: { zoomScale: newScale } });
  };

  const handleFitToScreen = () => {
    dispatch({ type: 'SET_VIEWER_STATE', payload: { zoomScale: 1, panOffset: { x: 0, y: 0 } } });
  };

  const handleZoomClick = () => {
    setIsEditingZoom(true);
    setZoomInput(Math.round(state.viewerState.zoomScale * 100).toString());
  };

  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoomInput(e.target.value);
  };

  const handleZoomInputBlur = () => {
    const value = parseInt(zoomInput);
    if (!isNaN(value) && value >= 25 && value <= 300) {
      dispatch({ type: 'SET_VIEWER_STATE', payload: { zoomScale: value / 100 } });
    }
    setIsEditingZoom(false);
  };

  const handleZoomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleZoomInputBlur();
    } else if (e.key === 'Escape') {
      setIsEditingZoom(false);
    }
  };

  return (
    <header 
      className="bg-navy-800/80 backdrop-blur-md border-b border-white/10 px-4 py-3 transition-all"
      style={{ marginRight: isDocumentViewer && state.isNotePanelOpen ? '320px' : '0' }}
    >
      {isDocumentViewer && state.currentDocument ? (
        // Document viewer: simplified layout
        <div className="flex items-center justify-between">
          {/* Left: Back arrow + Filename */}
          <div className="flex items-center space-x-3 flex-1">
            <button
              onClick={handleBackToLibrary}
              className="p-2 bg-white/5 backdrop-blur-sm hover:bg-white/10 rounded-lg transition-all text-gray-300 hover:text-off-white border border-white/10 hover:border-white/20"
              title="Back to Library"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 19l-7-7 7-7" 
                />
              </svg>
            </button>
            <span className="text-off-white font-medium truncate">
              {state.currentDocument.originalFilename || state.currentDocument.filename}
            </span>
          </div>

          {/* Center: Page navigation - no container box */}
          <div className="flex items-center space-x-3 flex-1 justify-center">
            <button
              onClick={handlePrevPage}
              disabled={state.viewerState.currentPage <= 1}
              className="p-2 bg-white/5 backdrop-blur-sm hover:bg-white/10 rounded-lg transition-all text-off-white disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 hover:border-white/20"
              title="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-off-white text-sm min-w-[60px] text-center font-medium">
              {state.viewerState.currentPage} / {state.viewerState.totalPages || '?'}
            </span>
            <button
              onClick={handleNextPage}
              disabled={state.viewerState.totalPages && state.viewerState.currentPage >= state.viewerState.totalPages}
              className="p-2 bg-white/5 backdrop-blur-sm hover:bg-white/10 rounded-lg transition-all text-off-white disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 hover:border-white/20"
              title="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Right: Zoom controls - glassmorphic */}
          <div className="flex items-center space-x-2 flex-1 justify-end">
            <button
              onClick={handleZoomOut}
              className="p-2 bg-white/5 backdrop-blur-sm hover:bg-white/10 rounded-lg transition-all text-off-white border border-white/10 hover:border-white/20"
              title="Zoom out"
            >
              <ZoomOut size={18} />
            </button>
            
            {isEditingZoom ? (
              <input
                type="text"
                value={zoomInput}
                onChange={handleZoomInputChange}
                onBlur={handleZoomInputBlur}
                onKeyDown={handleZoomInputKeyDown}
                className="w-16 px-2 py-1.5 text-sm text-center bg-white/10 backdrop-blur-sm text-off-white rounded-lg border border-white/20 focus:outline-none focus:border-white/30 focus:bg-white/15"
                autoFocus
              />
            ) : (
              <button
                onClick={handleZoomClick}
                className="px-3 py-1.5 text-sm text-off-white bg-white/5 backdrop-blur-sm hover:bg-white/10 rounded-lg transition-all min-w-[50px] border border-white/10 hover:border-white/20"
                title="Click to edit zoom"
              >
                {Math.round(state.viewerState.zoomScale * 100)}%
              </button>
            )}
            
            <button
              onClick={handleZoomIn}
              className="p-2 bg-white/5 backdrop-blur-sm hover:bg-white/10 rounded-lg transition-all text-off-white border border-white/10 hover:border-white/20"
              title="Zoom in"
            >
              <ZoomIn size={18} />
            </button>
            
            <button
              onClick={handleFitToScreen}
              className="p-2 bg-white/5 backdrop-blur-sm hover:bg-white/10 rounded-lg transition-all text-off-white border border-white/10 hover:border-white/20"
              title="Fit to screen"
            >
              <Maximize2 size={18} />
            </button>
          </div>
        </div>
      ) : (
        // Library view: show logo and title
        <div className="flex items-center">
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
            <span className="text-xl font-bold">Library</span>
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;