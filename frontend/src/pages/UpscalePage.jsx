import { useState, useRef, useCallback } from 'react';
import { Upload, Download, Trash2, Maximize2, RefreshCw, ImageIcon, Check, Info, ZoomIn, Eye } from 'lucide-react';
import axios from 'axios';

export default function UpscalePage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [scale, setScale] = useState(2);
  const [originalSize, setOriginalSize] = useState({ w: 0, h: 0 });
  const [resultSize, setResultSize] = useState({ w: 0, h: 0 });
  
  // New visualizer states
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState('slider'); // 'slider' | 'side-by-side'
  const [zoom, setZoom] = useState(1); // 1 to 4
  
  const fileInputRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (PNG, JPG, WEBP, dll)');
      return;
    }
    setError(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setResultUrl(null);
    setZoom(1);
    
    // Get image dimensions
    const img = new Image();
    img.onload = () => setOriginalSize({ w: img.width, h: img.height });
    img.src = url;
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleProcess = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('scale', scale.toString());

    try {
      const response = await axios.post('http://localhost:8000/upscale', formData, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      setResultUrl(url);
      
      const img = new Image();
      img.onload = () => setResultSize({ w: img.width, h: img.height });
      img.src = url;
    } catch (err) {
      console.error('Gagal memperbesar gambar:', err);
      setError('Gagal memperbesar gambar. Pastikan backend sudah berjalan dan direstart.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `upscaled_x${scale}_${selectedFile?.name || 'result'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setError(null);
    setScale(2);
    setZoom(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header animate-fade-in-up">
        <h1 className="page-title">AI Image Upscaler</h1>
        <p className="page-subtitle">
          Perbesar gambar pecah atau resolusi rendah menggunakan AI (OpenCV Super Resolution) agar menjadi tajam tanpa blur.
        </p>
      </div>

      {/* Educational info card */}
      <div className="glass-card-static animate-fade-in-up delay-1" style={{
        marginBottom: 20,
        borderColor: 'rgba(234, 179, 8, 0.2)',
        background: 'rgba(234, 179, 8, 0.03)',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start'
      }}>
        <Info size={20} color="var(--accent-3)" style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 13, lineHeight: '1.5', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Bagaimana AI Upscaler Bekerja?</strong><br />
          Fitur ini menggunakan model deep learning **FSRCNN** (Fast Super-Resolution Convolutional Neural Network) untuk merekonstruksi detail pixel baru (tepi & tekstur) pada foto. 
          <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
            <li>Cocok untuk **gambar kecil, buram, atau screenshot beresolusi rendah**.</li>
            <li>Kurang berpengaruh jika input sudah berkualitas sangat tinggi (HD/4K).</li>
            <li>Gunakan alat **Zoom** di bawah setelah proses selesai untuk melihat perbandingan ketajaman pixel demi pixel.</li>
          </ul>
        </div>
      </div>

      {/* Upload Area */}
      {!selectedFile && (
        <div
          className={`drop-zone animate-scale-in delay-2 ${dragOver ? 'drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          id="drop-zone-upscale"
        >
          <Upload className="drop-zone-icon" />
          <p className="drop-zone-text">Drop foto pecah/kecil di sini atau klik untuk upload</p>
          <p className="drop-zone-subtext">Format: PNG, JPG, WEBP • Max 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files[0])}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass-card-static animate-fade-in" style={{
          marginBottom: 16,
          borderColor: 'rgba(239, 68, 68, 0.3)',
          background: 'rgba(239, 68, 68, 0.08)',
          color: '#f87171',
          fontSize: 14
        }}>
          ⚠️ {error}
        </div>
      )}

      {selectedFile && (
        <div className="glass-card-static animate-fade-in-up delay-2" style={{ marginBottom: 24 }}>
          
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: 12,
          }}>
            Skala Perbesaran (AI Model)
          </div>

          {/* Scale Selectors */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {[2, 4].map((s) => {
              const isActive = scale === s;
              return (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  style={{
                    flex: 1,
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: isActive ? '2px solid var(--accent-3)' : '1px solid var(--border-subtle)',
                    background: isActive ? 'rgba(234, 179, 8, 0.1)' : 'var(--bg-card)',
                    color: isActive ? 'var(--accent-3)' : 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <span style={{ fontSize: 24, marginRight: 8 }}>{s}x</span>
                  Scale
                  {isActive && (
                    <Check 
                      size={18} 
                      color="var(--accent-3)" 
                      style={{ position: 'absolute', top: 8, right: 8 }} 
                    />
                  )}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleProcess}
              disabled={loading}
              style={{ background: 'linear-gradient(135deg, var(--accent-3), #ca8a04)', color: 'white', borderColor: 'transparent' }}
            >
              {loading ? (
                <><div className="spinner" /> Memproses AI...</>
              ) : (
                <><Maximize2 size={18} /> Perbesar Gambar</>
              )}
            </button>

            {resultUrl && (
              <button className="btn btn-secondary btn-lg" onClick={handleDownload}>
                <Download size={18} />
                Download Hasil
              </button>
            )}

            <button className="btn btn-ghost btn-lg" onClick={handleReset}>
              <Trash2 size={18} />
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Visualizers Controls */}
      {selectedFile && resultUrl && (
        <div className="glass-card-static animate-fade-in-up delay-2" style={{
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Tampilan:</span>
            <button
              className={`btn btn-ghost btn-sm ${viewMode === 'slider' ? 'active' : ''}`}
              onClick={() => setViewMode('slider')}
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              <Eye size={14} style={{ marginRight: 4 }} /> Sebelum/Sesudah Slider
            </button>
            <button
              className={`btn btn-ghost btn-sm ${viewMode === 'side-by-side' ? 'active' : ''}`}
              onClick={() => setViewMode('side-by-side')}
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              <Eye size={14} style={{ marginRight: 4 }} /> Berdampingan
            </button>
          </div>

          {/* Zoom Level */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ZoomIn size={16} color="var(--text-muted)" />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Zoom Preview:</span>
            <input
              type="range"
              min="1"
              max="4"
              step="0.5"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ width: 100, accentColor: 'var(--accent-3)' }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, minWidth: 24 }}>{zoom}x</span>
          </div>
        </div>
      )}

      {/* Image Previews */}
      {selectedFile && (
        <div className="animate-fade-in-up delay-3">
          {loading && (
            <div className="image-preview-card" style={{ padding: 48, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>AI sedang memperbesar gambar...</p>
            </div>
          )}

          {!loading && (
            <>
              {/* SLIDER VIEW MODE */}
              {viewMode === 'slider' && resultUrl ? (
                <div className="image-preview-card" style={{ maxWidth: 800, margin: '0 auto' }}>
                  <div className="image-preview-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Slider Sebelum (Kiri) vs Sesudah AI (Kanan)</span>
                    <span>Original: {originalSize.w}x{originalSize.h} px → AI Result: {resultSize.w}x{resultSize.h} px</span>
                  </div>
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    overflow: 'auto',
                    borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                    background: '#09090b',
                    maxHeight: '650px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      transform: `scale(${zoom})`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.1s ease',
                      userSelect: 'none'
                    }}>
                      {/* Original Image (Left / Background) */}
                      {previewUrl && (
                        <img 
                          src={previewUrl} 
                          alt="Original" 
                          style={{ width: '100%', display: 'block', objectFit: 'contain', pointerEvents: 'none' }} 
                        />
                      )}
                      
                      {/* Result Image (Right / Foreground, clipped) */}
                      {resultUrl && (
                        <img 
                          src={resultUrl} 
                          alt="Result" 
                          style={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'contain', 
                            pointerEvents: 'none',
                            clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`
                          }} 
                        />
                      )}

                      {/* Slider Line Divider */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: `${sliderPosition}%`,
                        width: '2px',
                        background: 'var(--accent-3)',
                        pointerEvents: 'none',
                        zIndex: 2,
                        boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                      }} />

                      {/* Slider Circle Handle */}
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: `${sliderPosition}%`,
                        transform: 'translate(-50%, -50%)',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--accent-3)',
                        border: '3px solid white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                        pointerEvents: 'none',
                        zIndex: 3,
                        color: 'black',
                        fontSize: '12px'
                      }}>
                        ↔
                      </div>

                      {/* Invisible input range covering the whole area for easy touch/drag interaction */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sliderPosition}
                        onChange={(e) => setSliderPosition(Number(e.target.value))}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'ew-resize',
                          zIndex: 4
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* SIDE BY SIDE VIEW MODE (or fallback if no result yet) */
                <div className="image-preview-grid">
                  {/* Original */}
                  <div className="image-preview-card">
                    <div className="image-preview-label">
                      <span className="dot dot-original" />
                      Original — {originalSize.w} x {originalSize.h} px
                    </div>
                    <div style={{ overflow: 'auto', maxHeight: '550px', background: '#09090b', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {previewUrl && (
                        <img 
                          src={previewUrl} 
                          alt="Original" 
                          style={{ 
                            width: '100%', 
                            display: 'block', 
                            objectFit: 'contain',
                            transform: `scale(${zoom})`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.1s ease'
                          }} 
                        />
                      )}
                    </div>
                  </div>

                  {/* Result */}
                  <div className="image-preview-card" style={{ position: 'relative' }}>
                    <div className="image-preview-label">
                      <span className="dot dot-result" />
                      Hasil {resultSize.w ? `— ${resultSize.w} x ${resultSize.h} px` : ''}
                    </div>
                    <div style={{ overflow: 'auto', maxHeight: '550px', background: '#09090b', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {resultUrl ? (
                        <img 
                          src={resultUrl} 
                          alt="Result" 
                          style={{ 
                            width: '100%', 
                            display: 'block', 
                            objectFit: 'contain',
                            transform: `scale(${zoom})`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.1s ease'
                          }} 
                        />
                      ) : (
                        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                          <RefreshCw size={48} style={{ opacity: 0.3, marginBottom: 8, margin: '0 auto' }} />
                          <p style={{ fontSize: 13 }}>Klik "Perbesar Gambar" untuk lihat hasil</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
