import { useState, useRef, useCallback } from 'react';
import { Upload, Download, Trash2, Eraser, ImageIcon, Paintbrush } from 'lucide-react';
import axios from 'axios';
import MaskEditor from '../components/MaskEditor';

export default function RemoveBgPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (PNG, JPG, WEBP, dll)');
      return;
    }
    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultUrl(null);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleProcess = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('http://localhost:8000/remove-bg', formData, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      setResultUrl(url);
    } catch (err) {
      console.error('Gagal memproses gambar:', err);
      setError('Gagal memproses gambar. Pastikan backend sudah berjalan.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `nobg_${selectedFile?.name || 'result'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setError(null);
    setShowEditor(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Mask editor callbacks
  const handleOpenEditor = () => setShowEditor(true);
  const handleCloseEditor = () => setShowEditor(false);
  const handleApplyEdit = (editedUrl) => {
    setResultUrl(editedUrl);
    setShowEditor(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header animate-fade-in-up">
        <h1 className="page-title">Remove Background</h1>
        <p className="page-subtitle">
          Upload gambar dan hapus background secara otomatis menggunakan AI. Hasilnya bisa diedit manual dan didownload dalam format PNG transparan.
        </p>
      </div>

      {/* Upload Area */}
      {!selectedFile && (
        <div
          className={`drop-zone animate-scale-in delay-1 ${dragOver ? 'drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          id="drop-zone-remove-bg"
        >
          <Upload className="drop-zone-icon" />
          <p className="drop-zone-text">Drop gambar di sini atau klik untuk upload</p>
          <p className="drop-zone-subtext">Format: PNG, JPG, WEBP • Max 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files[0])}
            style={{ display: 'none' }}
            id="file-input-remove-bg"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass-card-static animate-fade-in" style={{
          marginTop: 16,
          borderColor: 'rgba(239, 68, 68, 0.3)',
          background: 'rgba(239, 68, 68, 0.08)',
          color: '#f87171',
          fontSize: 14
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Controls */}
      {selectedFile && (
        <div className="animate-fade-in-up delay-1" style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleProcess}
            disabled={loading}
            id="btn-process"
          >
            {loading ? (
              <>
                <div className="spinner" />
                Memproses...
              </>
            ) : (
              <>
                <Eraser size={18} />
                Hapus Background
              </>
            )}
          </button>

          {resultUrl && (
            <>
              <button className="btn btn-secondary btn-lg" onClick={handleOpenEditor} id="btn-edit">
                <Paintbrush size={18} />
                Edit Manual
              </button>
              <button className="btn btn-secondary btn-lg" onClick={handleDownload} id="btn-download">
                <Download size={18} />
                Download Hasil
              </button>
            </>
          )}

          <button className="btn btn-ghost btn-lg" onClick={handleReset} id="btn-reset">
            <Trash2 size={18} />
            Reset
          </button>
        </div>
      )}

      {/* Image Previews */}
      {selectedFile && (
        <div className="image-preview-grid animate-fade-in-up delay-2">
          {/* Original */}
          <div className="image-preview-card">
            <div className="image-preview-label">
              <span className="dot dot-original" />
              Original
            </div>
            <div className="image-preview-body">
              {previewUrl && <img src={previewUrl} alt="Original" />}
            </div>
          </div>

          {/* Result */}
          <div className="image-preview-card" style={{ position: 'relative' }}>
            <div className="image-preview-label">
              <span className="dot dot-result" />
              Hasil
            </div>
            <div className="image-preview-body">
              {loading && (
                <div className="loading-overlay">
                  <div className="spinner" />
                  <span className="loading-text">Menghapus background...</span>
                </div>
              )}
              {resultUrl ? (
                <img src={resultUrl} alt="Result" />
              ) : (
                !loading && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <ImageIcon size={48} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <p style={{ fontSize: 13 }}>Klik "Hapus Background" untuk melihat hasil</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mask Editor Modal */}
      {showEditor && resultUrl && previewUrl && (
        <MaskEditor
          originalImageUrl={previewUrl}
          resultImageUrl={resultUrl}
          onApply={handleApplyEdit}
          onCancel={handleCloseEditor}
        />
      )}
    </div>
  );
}
