import { useState, useRef, useCallback } from 'react';
import { Upload, Download, Trash2, Sliders, Wand2, RefreshCcw, Eye } from 'lucide-react';
import axios from 'axios';

export default function EnhancePage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [baseImageUrl, setBaseImageUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [denoiseLoading, setDenoiseLoading] = useState(false);
  const [isAiEnhanced, setIsAiEnhanced] = useState(false);
  
  // Visualizer states
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState('slider'); // 'slider' | 'single'
  
  // Manual slider states
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [sharpness, setSharpness] = useState(0); // 0 to 100
  const [denoise, setDenoise] = useState(0); // 0 to 30
  const [blur, setBlur] = useState(0);
  const [sepia, setSepia] = useState(0);

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const previewImgRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    setBaseImageUrl(url);
    resetSliders();
    setIsAiEnhanced(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const resetSliders = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSharpness(0);
    setDenoise(0);
    setBlur(0);
    setSepia(0);
  };

  const handleApplyDenoise = async () => {
    if (!selectedFile || denoise === 0) return;
    setDenoiseLoading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('strength', denoise.toString());

    try {
      const response = await axios.post('http://localhost:8000/denoise', formData, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      setBaseImageUrl(url);
      setIsAiEnhanced(false); // Denoise currently overrides AI state to base file + denoise
    } catch (err) {
      console.error('Gagal Denoise:', err);
      // fallback
    } finally {
      setDenoiseLoading(false);
    }
  };

  const handleAutoEnhance = async () => {
    if (!selectedFile) return;
    setAiLoading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('http://localhost:8000/auto-enhance', formData, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      setBaseImageUrl(url);
      setIsAiEnhanced(true);
      resetSliders(); 
    } catch (err) {
      console.error('Gagal Auto-Enhance:', err);
      alert('Gagal Auto-Enhance. Pastikan backend sudah direstart.');
    } finally {
      setAiLoading(false);
    }
  };

  const undoAutoEnhance = () => {
    setBaseImageUrl(originalUrl);
    setIsAiEnhanced(false);
  };

  const applyConvolution = (ctx, canvas, width, height, mx) => {
    const idata = ctx.getImageData(0, 0, width, height);
    const data = idata.data;
    const side = 3; // 3x3 matrix
    const halfSide = 1;
    const src = new Uint8ClampedArray(data);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dstOff = (y * width + x) * 4;
        let r = 0, g = 0, b = 0;
        for (let cy = 0; cy < side; cy++) {
          for (let cx = 0; cx < side; cx++) {
            const scy = y + cy - halfSide;
            const scx = x + cx - halfSide;
            if (scy >= 0 && scy < height && scx >= 0 && scx < width) {
              const srcOff = (scy * width + scx) * 4;
              const wt = mx[cy * side + cx];
              r += src[srcOff] * wt;
              g += src[srcOff + 1] * wt;
              b += src[srcOff + 2] * wt;
            }
          }
        }
        data[dstOff] = r;
        data[dstOff + 1] = g;
        data[dstOff + 2] = b;
      }
    }
    ctx.putImageData(idata, 0, 0);
  };

  const handleDownload = () => {
    if (!baseImageUrl || !previewImgRef.current || !canvasRef.current) return;
    
    // UI Feedback for processing heavy filters
    document.body.style.cursor = 'wait';

    setTimeout(() => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = previewImgRef.current;
      
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      canvas.width = naturalWidth;
      canvas.height = naturalHeight;

      // Make sure 0 blur is not written as blur(0px) if possible to avoid issues, though usually fine
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) sepia(${sepia}%)`;
      ctx.drawImage(img, 0, 0, naturalWidth, naturalHeight);

      // Apply Sharpness matrix physically on Canvas if value > 0
      if (sharpness > 0) {
        const sharpVal = sharpness / 100;
        const mx = [
          0, -sharpVal, 0,
          -sharpVal, 1 + 4 * sharpVal, -sharpVal,
          0, -sharpVal, 0
        ];
        applyConvolution(ctx, canvas, naturalWidth, naturalHeight, mx);
      }

      canvas.toBlob((blob) => {
        const a = document.createElement('a');
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = `enhanced_${selectedFile?.name || 'result'}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        document.body.style.cursor = 'default';
      }, 'image/png');
    }, 50); // slight timeout to allow cursor update
  };

  const handleResetAll = () => {
    setSelectedFile(null);
    setOriginalUrl(null);
    setBaseImageUrl(null);
    setIsAiEnhanced(false);
    resetSliders();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sharpVal = sharpness / 100;
  const filterStyle = {
    // We add the SVG sharpen filter conditionally
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) sepia(${sepia}%) ${sharpness > 0 ? 'url(#sharpen-filter)' : ''}`,
    transition: 'filter 0.1s ease',
  };

  return (
    <div>
      {/* Hidden SVG Filter for hardware-accelerated sharp review */}
      <svg style={{ width: 0, height: 0, position: 'absolute' }}>
        <filter id="sharpen-filter">
          <feConvolveMatrix
            order="3 3"
            preserveAlpha="true"
            kernelMatrix={`0 ${-sharpVal} 0 ${-sharpVal} ${1 + 4 * sharpVal} ${-sharpVal} 0 ${-sharpVal} 0`}
          />
        </filter>
      </svg>

      {/* Header */}
      <div className="page-header animate-fade-in-up">
        <h1 className="page-title">Enhance Image</h1>
        <p className="page-subtitle">
          Percantik foto dengan sekali klik menggunakan AI Auto-Enhance, atau kendalikan ketajaman & tekstur secara live!
        </p>
      </div>

      {!selectedFile && (
        <div
          className={`drop-zone animate-scale-in delay-1 ${dragOver ? 'drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
        >
          <Upload className="drop-zone-icon" />
          <p className="drop-zone-text">Drop foto di sini atau klik untuk upload</p>
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

      {selectedFile && (
        <div className="animate-fade-in-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div className="glass-card-static" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32 }}>
            
            {/* AI Section */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wand2 size={16} color="var(--accent-1)" />
                AI Auto-HDR & Texture
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                AI (OpenCV) akan memaksimalkan tekstur, kejernihan (clarity/HDR), dan menyeimbangkan warna gambar otomatis dari server.
              </p>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  className="btn btn-primary"
                  onClick={handleAutoEnhance}
                  disabled={aiLoading}
                  style={{ flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  {aiLoading ? (
                    <><div className="spinner" /> Memproses AI...</>
                  ) : (
                    <><Wand2 size={16} /> {isAiEnhanced ? 'Auto Enhance Ulang' : 'Auto Enhance'}</>
                  )}
                </button>
                {isAiEnhanced && (
                  <button className="btn btn-ghost" onClick={undoAutoEnhance} title="Batalkan efek AI">
                    <RefreshCcw size={16} /> Undo AI
                  </button>
                )}
              </div>
            </div>

            {/* Manual Edit Section */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sliders size={16} color="var(--accent-4)" />
                Manual Adjustments
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Sharpness */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>
                    <span>Ketajaman (Sharpness)</span>
                    <span>{sharpness}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={sharpness} onChange={(e) => setSharpness(e.target.value)} style={{ width: '100%', accentColor: 'var(--success)' }} />
                </div>
                {/* Contrast */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>
                    <span>Kontras</span>
                    <span>{contrast}%</span>
                  </div>
                  <input type="range" min="0" max="200" value={contrast} onChange={(e) => setContrast(e.target.value)} style={{ width: '100%', accentColor: 'var(--accent-4)' }} />
                </div>
                {/* Brightness */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>
                    <span>Kecerahan</span>
                    <span>{brightness}%</span>
                  </div>
                  <input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(e.target.value)} style={{ width: '100%', accentColor: 'var(--accent-4)' }} />
                </div>
                {/* Saturation */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>
                    <span>Saturasi Warna</span>
                    <span>{saturation}%</span>
                  </div>
                  <input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(e.target.value)} style={{ width: '100%', accentColor: 'var(--accent-4)' }} />
                </div>
                {/* Separator */}
                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
                {/* Denoise (Backend) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>
                    <span>Denoise (Hilangkan Bintik AI)</span>
                    <span>{denoise}</span>
                  </div>
                  <input 
                    type="range" min="0" max="30" value={denoise} 
                    onChange={(e) => setDenoise(Number(e.target.value))} 
                    onMouseUp={handleApplyDenoise}
                    onTouchEnd={handleApplyDenoise}
                    style={{ width: '100%', accentColor: 'var(--accent-2)' }} 
                  />
                  <p style={{fontSize: 10, color: 'var(--text-muted)'}}>*Perubahan pada slider ini akan divalidasi ke server</p>
                </div>
                {/* Sepia */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>
                    <span>Vintage (Sepia)</span>
                    <span>{sepia}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={sepia} onChange={(e) => setSepia(e.target.value)} style={{ width: '100%', accentColor: 'var(--accent-4)' }} />
                </div>
                {/* Blur */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>
                    <span>Blur (Bokeh / Buram)</span>
                    <span>{blur}px</span>
                  </div>
                  <input type="range" min="0" max="20" value={blur} onChange={(e) => setBlur(e.target.value)} style={{ width: '100%', accentColor: 'var(--accent-4)' }} />
                </div>
              </div>

              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                 <button className="btn btn-ghost btn-sm" onClick={resetSliders} style={{ fontSize: 12 }}>
                   Reset Slider
                 </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-lg" onClick={handleDownload}>
              <Download size={18} /> Simpan Hasil Edit
            </button>
            <button className="btn btn-ghost btn-lg" onClick={handleResetAll}>
              <Trash2 size={18} /> Mulai Ulang
            </button>
          </div>

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Preview Panel Controls */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, width: '100%', maxWidth: 800, margin: '0 auto 12px' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Mode Preview:</span>
            <button
              className={`btn btn-ghost btn-sm ${viewMode === 'slider' ? 'active' : ''}`}
              onClick={() => setViewMode('slider')}
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              <Eye size={14} style={{ marginRight: 4 }} /> Slider Sebelum vs Sesudah
            </button>
            <button
              className={`btn btn-ghost btn-sm ${viewMode === 'single' ? 'active' : ''}`}
              onClick={() => setViewMode('single')}
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              <Eye size={14} style={{ marginRight: 4 }} /> Full Hasil Edit
            </button>
          </div>

          {/* Preview Panel */}
          <div className="image-preview-card" style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
            <div className="image-preview-label">
              Live Preview {isAiEnhanced ? '(AI Auto-HDR Aktif)' : ''} {denoiseLoading ? '- Denoising...' : ''}
            </div>
            <div className="image-preview-body" style={{ position: 'relative', overflow: 'hidden', minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#09090b' }}>
              {(aiLoading || denoiseLoading) && (
                <div className="loading-overlay" style={{ zIndex: 10 }}>
                  <div className="spinner" />
                  <span className="loading-text">Sedang memproses dari server...</span>
                </div>
              )}
              {baseImageUrl && (
                viewMode === 'slider' ? (
                  <div style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
                    {/* Original Image (Left / Background) */}
                    <img 
                      src={originalUrl} 
                      alt="Original" 
                      style={{ width: '100%', display: 'block', objectFit: 'contain', pointerEvents: 'none' }} 
                    />
                    
                    {/* Result Image with Filters (Right / Foreground, clipped) */}
                    <img 
                      ref={previewImgRef}
                      src={baseImageUrl} 
                      alt="Preview" 
                      style={{ 
                        ...filterStyle,
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain', 
                        pointerEvents: 'none',
                        clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`
                      }} 
                      crossOrigin="anonymous" 
                    />

                    {/* Slider Divider */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: `${sliderPosition}%`,
                      width: '2px',
                      background: 'var(--accent-1)',
                      pointerEvents: 'none',
                      zIndex: 2,
                      boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                    }} />

                    {/* Slider Handle */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: `${sliderPosition}%`,
                      transform: 'translate(-50%, -50%)',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--accent-1)',
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

                    {/* Invisible range overlay */}
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
                ) : (
                  <img 
                    ref={previewImgRef}
                    src={baseImageUrl} 
                    alt="Preview" 
                    style={{ ...filterStyle, display: 'block', width: '100%', objectFit: 'contain' }}
                    crossOrigin="anonymous" 
                  />
                )
              )}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
