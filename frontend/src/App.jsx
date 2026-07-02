import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import RemoveBgPage from './pages/RemoveBgPage';
import ResizePage from './pages/ResizePage';
import ConvertPage from './pages/ConvertPage';
import ChangeBgPage from './pages/ChangeBgPage';
import UpscalePage from './pages/UpscalePage';
import EnhancePage from './pages/EnhancePage';
import ESignPage from './pages/ESignPage';
import PdfCompressPage from './pages/PdfCompressPage';
import MergeSplitPdfPage from './pages/MergeSplitPdfPage';
import OfficeToPdfPage from './pages/OfficeToPdfPage';
import PdfToWordPage from './pages/PdfToWordPage';
import ExtractPdfImagesPage from './pages/ExtractPdfImagesPage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/remove-bg" element={<RemoveBgPage />} />
        <Route path="/resize" element={<ResizePage />} />
        <Route path="/convert" element={<ConvertPage />} />
        <Route path="/change-bg" element={<ChangeBgPage />} />
        <Route path="/upscale" element={<UpscalePage />} />
        <Route path="/enhance" element={<EnhancePage />} />
        <Route path="/esign" element={<ESignPage />} />
        <Route path="/compress-pdf" element={<PdfCompressPage />} />
        <Route path="/merge-split-pdf" element={<MergeSplitPdfPage />} />
        <Route path="/office-to-pdf" element={<OfficeToPdfPage />} />
        <Route path="/pdf-to-word" element={<PdfToWordPage />} />
        <Route path="/extract-pdf-images" element={<ExtractPdfImagesPage />} />
      </Route>
    </Routes>
  );
}

export default App;