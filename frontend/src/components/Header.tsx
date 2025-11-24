import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const Header: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();

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
    dispatch({ type: 'SET_VIEWER_STATE', payload: { zoomScale: 1 } });
  };

  return (
    <header 
      className="sticky top-0 z-50 bg-navy-800/80 backdrop-blur-md border-b border-white/10 px-4 py-3 transition-all"
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
              disabled={!!(state.viewerState.totalPages && state.viewerState.currentPage >= state.viewerState.totalPages)}
              className="p-2 bg-white/5 backdrop-blur-sm hover:bg-white/10 rounded-lg transition-all text-off-white disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 hover:border-white/20"
              title="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Right: Zoom controls - glassmorphic with slider */}
          <div className="flex items-center space-x-3 flex-1 justify-end">
            <button
              onClick={handleZoomOut}
              className="p-2 bg-white/5 backdrop-blur-sm hover:bg-white/10 rounded-lg transition-all text-off-white border border-white/10 hover:border-white/20"
              title="Zoom out (Ctrl + -)"
            >
              <ZoomOut size={18} />
            </button>
            
            {/* Zoom Slider */}
            <input
              type="range"
              min={10}
              max={500}
              value={Math.round(state.viewerState.zoomScale * 100)}
              onChange={(e) => {
                const newScale = Number(e.target.value) / 100;
                dispatch({ type: 'SET_VIEWER_STATE', payload: { zoomScale: newScale } });
              }}
              className="w-32 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((state.viewerState.zoomScale * 100 - 10) / (500 - 10)) * 100}%, rgba(255,255,255,0.1) ${((state.viewerState.zoomScale * 100 - 10) / (500 - 10)) * 100}%, rgba(255,255,255,0.1) 100%)`
              }}
              title="Zoom Slider"
            />
            
            <button
              onClick={handleZoomIn}
              className="p-2 bg-white/5 backdrop-blur-sm hover:bg-white/10 rounded-lg transition-all text-off-white border border-white/10 hover:border-white/20"
              title="Zoom in (Ctrl + +)"
            >
              <ZoomIn size={18} />
            </button>
            
            {/* Zoom Percentage Dropdown */}
            <select
              value={Math.round(state.viewerState.zoomScale * 100)}
              onChange={(e) => {
                const newScale = Number(e.target.value) / 100;
                dispatch({ type: 'SET_VIEWER_STATE', payload: { zoomScale: newScale } });
              }}
              className="px-3 py-1.5 text-sm text-off-white bg-white/5 backdrop-blur-sm hover:bg-white/10 rounded-lg transition-all border border-white/10 hover:border-white/20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Zoom Level"
            >
              {[25, 33, 50, 75, 100, 125, 150, 200, 300, 400].map((preset) => (
                <option key={preset} value={preset}>
                  {preset}%
                </option>
              ))}
              {![25, 33, 50, 75, 100, 125, 150, 200, 300, 400].includes(Math.round(state.viewerState.zoomScale * 100)) && 
                Math.round(state.viewerState.zoomScale * 100) > 0 && (
                <option value={Math.round(state.viewerState.zoomScale * 100)}>
                  {Math.round(state.viewerState.zoomScale * 100)}%
                </option>
              )}
            </select>
            
            <button
              onClick={handleFitToScreen}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg transition-all text-white font-medium"
              title="Fit to screen (0)"
            >
              Fit
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