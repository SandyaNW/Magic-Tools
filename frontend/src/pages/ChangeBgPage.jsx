import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  Download,
  Trash2,
  Palette,
  ImageIcon,
  Eraser,
  Check,
  Pipette,
} from 'lucide-react';
import axios from 'axios';

const PRESET_COLORS = [
  { label: 'Merah', hex: '#DC2626' },
  { label: 'Biru', hex: '#2563EB' },
  { label: 'Hijau', hex: '#16A34A' },
  { label: 'Kuning', hex: '#EAB308' },
  { label: 'Putih', hex: '#FFFFFF' },
  { label: 'Hitam', hex: '#000000' },
  { label: 'Abu-abu', hex: '#6B7280' },
  { label: 'Pink', hex: '#EC4899' },
  { label: 'Ungu', hex: '#7C3AED' },
  { label: 'Cyan', hex: '#06B6D4' },
  { label: 'Orange', hex: '#F97316' },
  { label: 'Navy', hex: '#1E3A5F' },
];

export default function ChangeBgPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [transparentUrl, setTransparentUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [compositing, setCompositing] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [bgColor, setBgColor] = useState('#2563EB');
  const [step, setStep] = useState(1); // 1=upload, 2=pick color, 3=result
  const fileInputRef = useRef(null);
  const colorInputRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (PNG, JPG, WEBP, dll)');
      return;
    }
    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setTransparentUrl(null);
    setResultUrl(null);
    setStep(1);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  // Step 1: Remove background via API
  const handleRemoveBg = async () => {
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
      setTransparentUrl(url);
      setStep(2);
    } catch (err) {
      console.error('Gagal menghapus background:', err);
      setError('Gagal menghapus background. Pastikan backend sudah berjalan.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Composite transparent image on colored background
  const handleApplyColor = useCallback(() => {
    if (!transparentUrl) return;
    setCompositing(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      // Draw solid background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw transparent image on top
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
        setStep(3);
        setCompositing(false);
      }, 'image/png');
    };
    img.src = transparentUrl;
  }, [transparentUrl, bgColor]);

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    const colorName = bgColor.replace('#', '');
    a.download = `bg_${colorName}_${selectedFile?.name || 'result'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setTransparentUrl(null);
    setResultUrl(null);
    setError(null);
    setBgColor('#2563EB');
    setStep(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleChangeColor = (newColor) => {
    setBgColor(newColor);
    // Auto-recomposite if we already have transparent image
    if (transparentUrl) {
      setCompositing(true);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = newColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          setResultUrl(url);
          setStep(3);
          setCompositing(false);
        }, 'image/png');
      };
      img.src = transparentUrl;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header animate-fade-in-up">
        <h1 className="page-title">Change Background Color</h1>
        <p className="page-subtitle">
          Ganti warna background foto secara otomatis. Upload foto, AI hapus background lama, lalu pilih warna baru sesukamu.
        </p>
      </div>

      {/* Step Indicator */}
      {selectedFile && (
        <div className="animate-fade-in-up delay-1" style={{
          display: 'flex',
          gap: 0,
          marginBottom: 24,
          justifyContent: 'center',
        }}>
          {[
            { num: 1, label: 'Upload', icon: Upload },
            { num: 2, label: 'Pilih Warna', icon: Palette },
            { num: 3, label: 'Hasil', icon: Check },
          ].map((s, i) => {
            const Icon = s.icon;
            const isActive = step >= s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  opacity: isActive ? 1 : 0.35,
                  transition: 'all 0.3s ease',
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isActive
                      ? 'linear-gradient(135deg, var(--accent-1), var(--accent-2))'
                      : 'var(--bg-card)',
                    border: isCurrent ? '2px solid var(--accent-1)' : '2px solid var(--border-subtle)',
                    boxShadow: isCurrent ? '0 0 16px rgba(168, 85, 247, 0.4)' : 'none',
                    transition: 'all 0.3s ease',
                  }}>
                    {step > s.num ? (
                      <Check size={18} color="white" />
                    ) : (
                      <Icon size={16} color={isActive ? 'white' : 'var(--text-muted)'} />
                    )}
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    letterSpacing: '0.3px',
                  }}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div style={{
                    width: 60,
                    height: 2,
                    background: step > s.num
                      ? 'linear-gradient(90deg, var(--accent-1), var(--accent-2))'
                      : 'var(--border-subtle)',
                    margin: '0 8px',
                    marginBottom: 22,
                    borderRadius: 2,
                    transition: 'background 0.3s ease',
                  }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Zone */}
      {!selectedFile && (
        <div
          className={`drop-zone animate-scale-in delay-1 ${dragOver ? 'drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          id="drop-zone-changebg"
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
            id="file-input-changebg"
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
          fontSize: 14,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Step 1: Process button */}
      {selectedFile && !transparentUrl && (
        <div className="animate-fade-in-up delay-2" style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleRemoveBg}
            disabled={loading}
            id="btn-remove-bg-changebg"
          >
            {loading ? (
              <><div className="spinner" /> Menghapus Background...</>
            ) : (
              <><Eraser size={18} /> Hapus Background Dulu</>
            )}
          </button>
          <button className="btn btn-ghost btn-lg" onClick={handleReset} id="btn-reset-changebg">
            <Trash2 size={18} /> Reset
          </button>
        </div>
      )}

      {/* Step 2: Color Picker */}
      {transparentUrl && (
        <div className="glass-card-static animate-fade-in-up" style={{ marginBottom: 24 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}>
            <Palette size={18} color="var(--accent-1)" />
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              Pilih Warna Background
            </span>
          </div>

          {/* Preset Colors */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 16,
          }}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => handleChangeColor(c.hex)}
                title={c.label}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-md)',
                  border: bgColor === c.hex
                    ? '3px solid var(--accent-1)'
                    : '2px solid var(--border-subtle)',
                  background: c.hex,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: bgColor === c.hex
                    ? `0 0 12px ${c.hex}66`
                    : 'none',
                  transform: bgColor === c.hex ? 'scale(1.15)' : 'scale(1)',
                  position: 'relative',
                }}
              >
                {bgColor === c.hex && (
                  <Check
                    size={16}
                    color={['#FFFFFF', '#EAB308', '#06B6D4'].includes(c.hex) ? '#000' : '#fff'}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Custom Color */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button
              className="btn btn-ghost"
              onClick={() => colorInputRef.current?.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                border: '1px solid var(--border-default)',
              }}
              id="btn-custom-color"
            >
              <Pipette size={16} />
              Custom Warna
            </button>
            <input
              ref={colorInputRef}
              type="color"
              value={bgColor}
              onChange={(e) => handleChangeColor(e.target.value)}
              style={{ display: 'none' }}
              id="color-picker-input"
            />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
            }}>
              <div style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                background: bgColor,
                border: '1px solid var(--border-subtle)',
              }} />
              <span style={{
                fontSize: 13,
                fontFamily: 'monospace',
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}>
                {bgColor.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleApplyColor}
              disabled={compositing}
              id="btn-apply-color"
            >
              {compositing ? (
                <><div className="spinner" /> Menerapkan...</>
              ) : (
                <><Palette size={18} /> Terapkan Warna</>
              )}
            </button>
            {resultUrl && (
              <button className="btn btn-secondary btn-lg" onClick={handleDownload} id="btn-download-changebg">
                <Download size={18} /> Download Hasil
              </button>
            )}
            <button className="btn btn-ghost btn-lg" onClick={handleReset} id="btn-reset-changebg-2">
              <Trash2 size={18} /> Reset
            </button>
          </div>
        </div>
      )}

      {/* Image Previews */}
      {selectedFile && (
        <div className="image-preview-grid animate-fade-in-up delay-3">
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
            <div className="image-preview-body" style={resultUrl ? {
              background: `repeating-conic-gradient(#1a1a2e 0% 25%, #16162a 0% 50%) 0 0 / 16px 16px`,
            } : {}}>
              {(loading || compositing) && (
                <div className="loading-overlay">
                  <div className="spinner" />
                  <span className="loading-text">
                    {loading ? 'Menghapus background...' : 'Menerapkan warna...'}
                  </span>
                </div>
              )}
              {resultUrl ? (
                <img src={resultUrl} alt="Result" />
              ) : transparentUrl ? (
                <img src={transparentUrl} alt="Transparent" style={{ opacity: 0.6 }} />
              ) : (
                !loading && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Palette size={48} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <p style={{ fontSize: 13 }}>Hapus background dulu, lalu pilih warna baru</p>
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
