import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  Download,
  Trash2,
  Maximize,
  Lock,
  Unlock,
  ImageIcon,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';

// Presets
const SOCIAL_PRESETS = [
  { label: 'Instagram Post', w: 1080, h: 1080, unit: 'px' },
  { label: 'Instagram Story', w: 1080, h: 1920, unit: 'px' },
  { label: 'Facebook Cover', w: 820, h: 312, unit: 'px' },
  { label: 'YouTube Thumbnail', w: 1280, h: 720, unit: 'px' },
  { label: 'Wallpaper HD', w: 1920, h: 1080, unit: 'px' },
];

const PAS_FOTO_PRESETS = [
  { label: 'Pas Foto 2x3', w: 2, h: 3, unit: 'cm' },
  { label: 'Pas Foto 3x4', w: 3, h: 4, unit: 'cm' },
  { label: 'Pas Foto 4x6', w: 4, h: 6, unit: 'cm' },
];

const RATIO_PRESETS = [
  { label: 'Kotak (1:1)', ratio: 1 },
  { label: 'Pas Foto (3:4)', ratio: 3/4 },
  { label: 'Pas Foto (4:3)', ratio: 4/3 },
  { label: 'Landscape (16:9)', ratio: 16/9 },
  { label: 'Portrait (9:16)', ratio: 9/16 },
];

const selectStyle = {
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'var(--font-family)',
  outline: 'none',
  cursor: 'pointer',
  transition: 'border-color 0.2s',
};

const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: 4,
};

export default function ResizePage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [originalSize, setOriginalSize] = useState({ w: 0, h: 0 });
  
  // Custom states for options
  const [unit, setUnit] = useState('px');
  const [dpi, setDpi] = useState(300);
  const [fitMode, setFitMode] = useState('stretch');
  const [padColor, setPadColor] = useState('transparent');
  
  const [newWidth, setNewWidth] = useState('');
  const [newHeight, setNewHeight] = useState('');
  const [lockRatio, setLockRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [resultSize, setResultSize] = useState(null);
  const fileInputRef = useRef(null);

  // Conversion helpers
  const toPx = useCallback((val, u, d) => {
    const num = Number(val);
    if (isNaN(num)) return 0;
    if (u === 'px') return num;
    if (u === 'cm') return (num / 2.54) * d;
    if (u === 'inch') return num * d;
    return num;
  }, []);

  const fromPx = useCallback((pxVal, u, d) => {
    if (u === 'px') return pxVal;
    if (u === 'cm') return (pxVal / d) * 2.54;
    if (u === 'inch') return pxVal / d;
    return pxVal;
  }, []);

  // Load image and get dimensions
  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    setSelectedFile(file);
    setResultUrl(null);
    setResultSize(null);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      setOriginalSize({ w: img.width, h: img.height });
      setAspectRatio(img.width / img.height);
      
      // Initialize with unit equivalents
      const decimals = unit === 'px' ? 0 : 2;
      const convertedW = fromPx(img.width, unit, dpi);
      const convertedH = fromPx(img.height, unit, dpi);
      setNewWidth(String(Number(convertedW.toFixed(decimals))));
      setNewHeight(String(Number(convertedH.toFixed(decimals))));
    };
    img.src = url;
  }, [unit, dpi, fromPx]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  // Handle unit change and convert current inputs
  const handleUnitChange = (newUnit) => {
    if (newUnit === unit) return;
    
    const wInPx = toPx(newWidth, unit, dpi);
    const hInPx = toPx(newHeight, unit, dpi);
    
    setUnit(newUnit);
    
    const convertedW = fromPx(wInPx, newUnit, dpi);
    const convertedH = fromPx(hInPx, newUnit, dpi);
    
    const decimals = newUnit === 'px' ? 0 : 2;
    setNewWidth(String(Number(convertedW.toFixed(decimals))));
    setNewHeight(String(Number(convertedH.toFixed(decimals))));
  };

  const handleDpiChange = (newDpi) => {
    const dVal = Math.max(72, Math.min(600, Number(newDpi)));
    setDpi(dVal);
  };

  // Handle width change (adjust height if locked)
  const handleWidthChange = (val) => {
    setNewWidth(val);
    const num = Number(val);
    if (lockRatio && val !== '' && !isNaN(num)) {
      const decimals = unit === 'px' ? 0 : 2;
      setNewHeight(String(Number((num / aspectRatio).toFixed(decimals))));
    }
  };

  const handleHeightChange = (val) => {
    setNewHeight(val);
    const num = Number(val);
    if (lockRatio && val !== '' && !isNaN(num)) {
      const decimals = unit === 'px' ? 0 : 2;
      setNewWidth(String(Number((num * aspectRatio).toFixed(decimals))));
    }
  };

  const applyPreset = (preset) => {
    setUnit(preset.unit);
    setNewWidth(String(preset.w));
    setNewHeight(String(preset.h));
    setLockRatio(false); // unlock since preset may differ from original ratio
  };

  const applyRatioPreset = (ratio) => {
    setLockRatio(true);
    setAspectRatio(ratio);
    const w = Number(newWidth);
    if (!isNaN(w) && w > 0) {
      const newH = w / ratio;
      const decimals = unit === 'px' ? 0 : 2;
      setNewHeight(String(Number(newH.toFixed(decimals))));
    }
  };

  // Resize using canvas with advanced fit modes
  const handleResize = useCallback(() => {
    if (!previewUrl || !newWidth || !newHeight) return;
    setProcessing(true);

    const w = Math.round(toPx(newWidth, unit, dpi));
    const h = Math.round(toPx(newHeight, unit, dpi));

    if (w <= 0 || h <= 0 || w > 15000 || h > 15000) {
      alert("Dimensi gambar tidak valid atau terlalu besar (maksimal 15,000 px).");
      setProcessing(false);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (fitMode === 'stretch') {
        ctx.drawImage(img, 0, 0, w, h);
      } else if (fitMode === 'fit') {
        if (padColor === 'transparent') {
          ctx.clearRect(0, 0, w, h);
        } else {
          ctx.fillStyle = padColor;
          ctx.fillRect(0, 0, w, h);
        }
        const scale = Math.min(w / img.width, h / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        ctx.drawImage(img, dx, dy, dw, dh);
      } else if (fitMode === 'fill') {
        const scale = Math.max(w / img.width, h / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        ctx.drawImage(img, dx, dy, dw, dh);
      }

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
        setResultSize({ w, h, bytes: blob.size });
        setProcessing(false);
      }, 'image/png');
    };
    img.src = previewUrl;
  }, [previewUrl, newWidth, newHeight, unit, dpi, fitMode, padColor, toPx]);

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    
    // Label filename with mode and dimensions
    const wPx = Math.round(toPx(newWidth, unit, dpi));
    const hPx = Math.round(toPx(newHeight, unit, dpi));
    a.download = `resized_${wPx}x${hPx}_${fitMode}_${selectedFile?.name || 'image'}.png`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setResultSize(null);
    setNewWidth('');
    setNewHeight('');
    setUnit('px');
    setDpi(300);
    setFitMode('stretch');
    setOriginalSize({ w: 0, h: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetToOriginal = () => {
    setUnit('px');
    setNewWidth(String(originalSize.w));
    setNewHeight(String(originalSize.h));
    setLockRatio(true);
    setAspectRatio(originalSize.w / originalSize.h);
    setResultUrl(null);
    setResultSize(null);
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header animate-fade-in-up">
        <h1 className="page-title">Resize Image</h1>
        <p className="page-subtitle">
          Ubah ukuran gambar ke dimensi apa pun (px, cm, inch) dengan aman tanpa gepeng, lengkap dengan preset ukuran Pas Foto standar Indonesia.
        </p>
      </div>

      {/* Upload */}
      {!selectedFile && (
        <div
          className={`drop-zone animate-scale-in delay-1 ${dragOver ? 'drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          id="drop-zone-resize"
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
            id="file-input-resize"
          />
        </div>
      )}

      {selectedFile && (
        <>
          {/* Resize Controls */}
          <div className="glass-card-static animate-fade-in-up delay-1" style={{ marginBottom: 24 }}>
            {/* Original info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <ImageIcon size={16} color="var(--text-muted)" />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Ukuran asli: <strong style={{ color: 'var(--text-primary)' }}>{originalSize.w} × {originalSize.h} px</strong>
              </span>
            </div>

            {/* Config: Unit, DPI, Fit Mode */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
              {/* Unit Dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={labelStyle}>Satuan</div>
                <select
                  value={unit}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  style={selectStyle}
                >
                  <option value="px">Pixel (px)</option>
                  <option value="cm">Sentimeter (cm)</option>
                  <option value="inch">Inci (inch)</option>
                </select>
              </div>

              {/* DPI Input (only if not px) */}
              {unit !== 'px' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={labelStyle}>DPI (Kerapatan Cetak)</div>
                  <input
                    type="number"
                    value={dpi}
                    onChange={(e) => handleDpiChange(e.target.value)}
                    min="72"
                    max="600"
                    style={{
                      ...selectStyle,
                      width: 90,
                    }}
                  />
                </div>
              )}

              {/* Fit Mode */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={labelStyle}>Metode Pengepasan</div>
                <select
                  value={fitMode}
                  onChange={(e) => setFitMode(e.target.value)}
                  style={selectStyle}
                >
                  <option value="stretch">Stretch (Regangkan - Gepeng)</option>
                  <option value="fill">Fill & Crop (Penuhi & Potong Tengah - Rekomendasi)</option>
                  <option value="fit">Fit & Pad (Muat & Frame Samping)</option>
                </select>
              </div>

              {/* Pad Background Color (only if fit) */}
              {fitMode === 'fit' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={labelStyle}>Warna Frame Samping</div>
                  <select
                    value={padColor}
                    onChange={(e) => setPadColor(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="transparent">Transparan</option>
                    <option value="#ffffff">Putih (Pas Foto)</option>
                    <option value="#000000">Hitam</option>
                  </select>
                </div>
              )}
            </div>

            {/* Dimension inputs & Action Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={labelStyle}>
                  Lebar ({unit})
                </label>
                <input
                  type="number"
                  step={unit === 'px' ? '1' : '0.01'}
                  value={newWidth}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  min="0.1"
                  max="15000"
                  id="input-width"
                  style={{
                    width: 120,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: 15,
                    fontWeight: 600,
                    fontFamily: 'var(--font-family)',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-1)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'}
                />
              </div>

              {/* Lock button */}
              <button
                className={`toolbar-btn ${lockRatio ? 'active' : ''}`}
                onClick={() => {
                  setLockRatio(!lockRatio);
                  if (!lockRatio) {
                    setAspectRatio(Number(newWidth) / Number(newHeight));
                  }
                }}
                style={{ marginTop: 18 }}
                id="btn-lock-ratio"
                title={lockRatio ? 'Rasio terkunci' : 'Rasio terbuka'}
              >
                {lockRatio ? <Lock size={16} /> : <Unlock size={16} />}
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={labelStyle}>
                  Tinggi ({unit})
                </label>
                <input
                  type="number"
                  step={unit === 'px' ? '1' : '0.01'}
                  value={newHeight}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  min="0.1"
                  max="15000"
                  id="input-height"
                  style={{
                    width: 120,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: 15,
                    fontWeight: 600,
                    fontFamily: 'var(--font-family)',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-1)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'}
                />
              </div>

              <ArrowRight size={18} color="var(--text-muted)" style={{ marginTop: 18 }} />

              <button
                className="btn btn-primary"
                onClick={handleResize}
                disabled={processing || !newWidth || !newHeight}
                style={{ marginTop: 18 }}
                id="btn-resize"
              >
                {processing ? (
                  <><div className="spinner" /> Resizing...</>
                ) : (
                  <><Maximize size={16} /> Resize</>
                )}
              </button>

              <button
                className="btn btn-ghost"
                onClick={resetToOriginal}
                style={{ marginTop: 18 }}
                id="btn-reset-size"
                title="Reset ke ukuran asli"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {/* Presets Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Pas Foto Presets */}
              <div>
                <div style={{ ...labelStyle, marginBottom: 8 }}>Pas Foto Indonesia (300 DPI Recommended)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {PAS_FOTO_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      className="btn btn-ghost"
                      onClick={() => applyPreset(p)}
                      style={{
                        fontSize: 12,
                        padding: '6px 12px',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {p.label}
                      <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontSize: 10 }}>
                        {p.w}×{p.h} {p.unit}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Social Media Presets */}
              <div>
                <div style={{ ...labelStyle, marginBottom: 8 }}>Preset Social Media & Layar</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SOCIAL_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      className="btn btn-ghost"
                      onClick={() => applyPreset(p)}
                      style={{
                        fontSize: 12,
                        padding: '6px 12px',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {p.label}
                      <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontSize: 10 }}>
                        {p.w}×{p.h} {p.unit}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio Presets */}
              <div>
                <div style={{ ...labelStyle, marginBottom: 8 }}>Rasio Aspek Terkunci (Lock Ratio)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {RATIO_PRESETS.map((r) => (
                    <button
                      key={r.label}
                      className="btn btn-ghost"
                      onClick={() => applyRatioPreset(r.ratio)}
                      style={{
                        fontSize: 12,
                        padding: '6px 12px',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="animate-fade-in-up delay-2" style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            {resultUrl && (
              <button className="btn btn-secondary btn-lg" onClick={handleDownload} id="btn-download-resize">
                <Download size={18} />
                Download Hasil
              </button>
            )}
            <button className="btn btn-ghost btn-lg" onClick={handleReset} id="btn-reset-all">
              <Trash2 size={18} />
              Reset
            </button>
          </div>

          {/* Preview Grid */}
          <div className="image-preview-grid animate-fade-in-up delay-3">
            {/* Original */}
            <div className="image-preview-card">
              <div className="image-preview-label">
                <span className="dot dot-original" />
                Original — {originalSize.w} × {originalSize.h} px
              </div>
              <div className="image-preview-body">
                {previewUrl && <img src={previewUrl} alt="Original" />}
              </div>
            </div>

            {/* Result */}
            <div className="image-preview-card" style={{ position: 'relative' }}>
              <div className="image-preview-label">
                <span className="dot dot-result" />
                Hasil {resultSize ? `— ${resultSize.w} × ${resultSize.h} px • ${formatBytes(resultSize.bytes)}` : ''}
              </div>
              <div className="image-preview-body">
                {processing && (
                  <div className="loading-overlay">
                    <div className="spinner" />
                    <span className="loading-text">Resizing...</span>
                  </div>
                )}
                {resultUrl ? (
                  <img src={resultUrl} alt="Resized" />
                ) : (
                  !processing && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Maximize size={48} style={{ opacity: 0.3, marginBottom: 8 }} />
                      <p style={{ fontSize: 13 }}>Atur ukuran lalu klik "Resize"</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
