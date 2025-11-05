import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import Layout from './components/Layout';
import DocumentLibrary from './pages/DocumentLibrary';
import DocumentViewer from './pages/DocumentViewer';
import './index.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<DocumentLibrary />} />
            <Route path="/document/:documentId" element={<DocumentViewer />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;