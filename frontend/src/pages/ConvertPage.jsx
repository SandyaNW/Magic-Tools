import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  Download,
  Trash2,
  ImageIcon,
  ArrowRight,
  FileImage,
  Info,
  Check,
} from 'lucide-react';

const FORMATS = [
  { label: 'PNG', mime: 'image/png', ext: 'png', desc: 'Lossless, mendukung transparansi', hasQuality: false },
  { label: 'JPEG', mime: 'image/jpeg', ext: 'jpg', desc: 'Ukuran kecil, cocok untuk foto', hasQuality: true },
  { label: 'WEBP', mime: 'image/webp', ext: 'webp', desc: 'Format modern, ukuran paling kecil', hasQuality: true },
  { label: 'BMP', mime: 'image/bmp', ext: 'bmp', desc: 'Bitmap tanpa kompresi', hasQuality: false },
  { label: 'GIF', mime: 'image/gif', ext: 'gif', desc: 'Cocok untuk grafik sederhana', hasQuality: false },
];

export default function ConvertPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [targetFormat, setTargetFormat] = useState(FORMATS[0]);
  const [quality, setQuality] = useState(92);
  const [resultInfo, setResultInfo] = useState(null);
  const [originalInfo, setOriginalInfo] = useState(null);
  const fileInputRef = useRef(null);

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setSelectedFile(file);
    setResultUrl(null);
    setResultInfo(null);

    const ext = file.name.split('.').pop()?.toUpperCase() || '??';
    setOriginalInfo({ name: file.name, size: file.size, ext });

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleConvert = useCallback(() => {
    if (!previewUrl) return;
    setProcessing(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      // For JPEG/BMP, fill white bg because they don't support transparency
      if (['image/jpeg', 'image/bmp'].includes(targetFormat.mime)) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      const q = targetFormat.hasQuality ? quality / 100 : undefined;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // Fallback for formats not supported by toBlob (like TIFF)
            setProcessing(false);
            return;
          }
          const url = URL.createObjectURL(blob);
          setResultUrl(url);
          setResultInfo({
            size: blob.size,
            format: targetFormat.label,
            width: img.width,
            height: img.height,
          });
          setProcessing(false);
        },
        targetFormat.mime,
        q
      );
    };
    img.src = previewUrl;
  }, [previewUrl, targetFormat, quality]);

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    const baseName = selectedFile?.name?.split('.').slice(0, -1).join('.') || 'image';
    a.download = `${baseName}.${targetFormat.ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setResultInfo(null);
    setOriginalInfo(null);
    setTargetFormat(FORMATS[0]);
    setQuality(92);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header animate-fade-in-up">
        <h1 className="page-title">Convert Image Format</h1>
        <p className="page-subtitle">
          Ubah format gambar ke PNG, JPEG, WEBP, BMP, atau GIF dengan satu klik. Atur kualitas output sesuai kebutuhan.
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
          id="drop-zone-convert"
        >
          <Upload className="drop-zone-icon" />
          <p className="drop-zone-text">Drop gambar di sini atau klik untuk upload</p>
          <p className="drop-zone-subtext">Format: PNG, JPG, WEBP, BMP, GIF • Max 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files[0])}
            style={{ display: 'none' }}
            id="file-input-convert"
          />
        </div>
      )}

      {/* Controls */}
      {selectedFile && (
        <div className="glass-card-static animate-fade-in-up delay-1" style={{ marginBottom: 24 }}>
          {/* Original file info */}
          {originalInfo && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 20,
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(139, 92, 246, 0.06)',
              border: '1px solid rgba(139, 92, 246, 0.15)',
            }}>
              <Info size={15} color="var(--accent-1)" />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                File: <strong style={{ color: 'var(--text-primary)' }}>{originalInfo.name}</strong>
                {' • '}
                <span style={{ color: 'var(--accent-1)' }}>{originalInfo.ext}</span>
                {' • '}
                {formatBytes(originalInfo.size)}
              </span>
            </div>
          )}

          {/* Format cards */}
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: 10,
          }}>
            Pilih Format Tujuan
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: 10,
            marginBottom: 20,
          }}>
            {FORMATS.map((f) => {
              const isActive = targetFormat.label === f.label;
              return (
                <button
                  key={f.label}
                  onClick={() => { setTargetFormat(f); setResultUrl(null); setResultInfo(null); }}
                  id={`format-btn-${f.ext}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '14px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: isActive
                      ? '2px solid var(--accent-1)'
                      : '1px solid var(--border-subtle)',
                    background: isActive
                      ? 'rgba(139, 92, 246, 0.1)'
                      : 'var(--bg-card)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    boxShadow: isActive ? '0 0 16px rgba(139, 92, 246, 0.2)' : 'none',
                  }}
                >
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent-1), var(--accent-2))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Check size={11} color="white" />
                    </div>
                  )}
                  <span style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: isActive ? 'var(--accent-1)' : 'var(--text-primary)',
                    letterSpacing: '0.5px',
                  }}>
                    {f.label}
                  </span>
                  <span style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    lineHeight: 1.3,
                  }}>
                    {f.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quality slider (JPEG / WEBP only) */}
          {targetFormat.hasQuality && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}>
                  Kualitas Output
                </span>
                <span style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: quality >= 80 ? 'var(--success)' : quality >= 50 ? '#eab308' : '#ef4444',
                  fontFamily: 'monospace',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: quality >= 80
                    ? 'rgba(34,197,94,0.1)'
                    : quality >= 50 ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
                }}>
                  {quality}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => { setQuality(Number(e.target.value)); setResultUrl(null); setResultInfo(null); }}
                id="quality-slider"
                style={{
                  width: '100%',
                  accentColor: 'var(--accent-1)',
                  cursor: 'pointer',
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10,
                color: 'var(--text-muted)',
                marginTop: 4,
              }}>
                <span>Kecil (File kecil)</span>
                <span>Tinggi (File besar)</span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleConvert}
              disabled={processing}
              id="btn-convert"
            >
              {processing ? (
                <><div className="spinner" /> Mengonversi...</>
              ) : (
                <>
                  <ArrowRight size={16} />
                  Konversi ke {targetFormat.label}
                </>
              )}
            </button>
            {resultUrl && (
              <button className="btn btn-secondary btn-lg" onClick={handleDownload} id="btn-download-convert">
                <Download size={18} /> Download .{targetFormat.ext}
              </button>
            )}
            <button className="btn btn-ghost btn-lg" onClick={handleReset} id="btn-reset-convert">
              <Trash2 size={18} /> Reset
            </button>
          </div>
        </div>
      )}

      {/* Comparison Info */}
      {resultInfo && originalInfo && (
        <div className="glass-card-static animate-fade-in" style={{
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          flexWrap: 'wrap',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 4 }}>Original</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{originalInfo.ext}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatBytes(originalInfo.size)}</div>
          </div>

          <ArrowRight size={20} color="var(--accent-1)" />

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 4 }}>Hasil</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-1)' }}>{resultInfo.format}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatBytes(resultInfo.size)}</div>
          </div>

          <div style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            background: resultInfo.size < originalInfo.size
              ? 'rgba(34,197,94,0.1)'
              : 'rgba(239,68,68,0.1)',
            color: resultInfo.size < originalInfo.size ? 'var(--success)' : '#f87171',
            fontSize: 13,
            fontWeight: 700,
          }}>
            {resultInfo.size < originalInfo.size
              ? `↓ ${Math.round((1 - resultInfo.size / originalInfo.size) * 100)}% lebih kecil`
              : `↑ ${Math.round((resultInfo.size / originalInfo.size - 1) * 100)}% lebih besar`
            }
          </div>
        </div>
      )}

      {/* Preview Grid */}
      {selectedFile && (
        <div className="image-preview-grid animate-fade-in-up delay-2">
          {/* Original */}
          <div className="image-preview-card">
            <div className="image-preview-label">
              <span className="dot dot-original" />
              Original ({originalInfo?.ext})
            </div>
            <div className="image-preview-body">
              {previewUrl && <img src={previewUrl} alt="Original" />}
            </div>
          </div>

          {/* Result */}
          <div className="image-preview-card" style={{ position: 'relative' }}>
            <div className="image-preview-label">
              <span className="dot dot-result" />
              Hasil ({targetFormat.label})
            </div>
            <div className="image-preview-body">
              {processing && (
                <div className="loading-overlay">
                  <div className="spinner" />
                  <span className="loading-text">Mengonversi ke {targetFormat.label}...</span>
                </div>
              )}
              {resultUrl ? (
                <img src={resultUrl} alt="Converted" />
              ) : (
                !processing && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <FileImage size={48} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <p style={{ fontSize: 13 }}>Pilih format lalu klik "Konversi"</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
