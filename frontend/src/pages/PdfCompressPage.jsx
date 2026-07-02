import { useState } from 'react';
import { FileDown, Upload, File, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function PdfCompressPage() {
  const [file, setFile] = useState(null);
  const [level, setLevel] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setError(null);
      setResult(null);
    } else {
      setError('Harap pilih file PDF yang valid.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const selected = e.dataTransfer.files[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setError(null);
      setResult(null);
    } else {
      setError('Harap jatuhkan file PDF yang valid.');
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('level', level);

    try {
      const response = await fetch('http://localhost:8000/compress-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Terjadi kesalahan saat memproses.');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        url: downloadUrl,
        name: `compressed_${file.name}`,
        originalSize: file.size,
        compressedSize: blob.size,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (result && result.url) {
      URL.revokeObjectURL(result.url);
    }
    setFile(null);
    setLevel('medium');
    setResult(null);
    setError(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Compress PDF</h1>
        <p className="page-subtitle">
          Kurangi ukuran file PDF Anda secara optimal dengan tetap menjaga kualitas teks dan dokumen yang dapat dibaca.
        </p>
      </div>

      <div className="glass-card-static" style={{ maxWidth: '800px', margin: '0 auto' }}>
        {error && (
          <div className="error-alert" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', marginBottom: '20px' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {!file ? (
          <div 
            className="drop-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById('pdf-input').click()}
          >
            <input 
              type="file" 
              id="pdf-input" 
              accept=".pdf" 
              onChange={handleFileChange} 
              style={{ display: 'none' }}
            />
            <Upload className="drop-zone-icon" />
            <div className="drop-zone-text">Pilih atau Seret File PDF di sini</div>
            <div className="drop-zone-subtext">Hanya menerima format .pdf (maksimal 50MB)</div>
          </div>
        ) : (
          <div>
            <div className="file-info-bar" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--bg-glass-strong)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
              <File size={28} className="text-primary" style={{ color: 'var(--accent-1)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{file.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatBytes(file.size)}</div>
              </div>
              {!result && !loading && (
                <button className="btn btn-ghost" onClick={handleReset}>Ganti</button>
              )}
            </div>

            {!result && !loading && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>Tingkat Kompresi:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <button 
                    type="button" 
                    className={`btn ${level === 'low' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setLevel('low')}
                  >
                    Low Compression
                    <span style={{ fontSize: '11px', opacity: 0.8, display: 'block', fontWeight: 'normal' }}>Ukuran besar, kualitas super</span>
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${level === 'medium' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setLevel('medium')}
                  >
                    Medium Compression
                    <span style={{ fontSize: '11px', opacity: 0.8, display: 'block', fontWeight: 'normal' }}>Ukuran & kualitas seimbang</span>
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${level === 'high' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setLevel('high')}
                  >
                    High Compression
                    <span style={{ fontSize: '11px', opacity: 0.8, display: 'block', fontWeight: 'normal' }}>Ukuran kecil, kualitas standar</span>
                  </button>
                </div>
              </div>
            )}

            {!result && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={handleReset} disabled={loading}>Batal</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <>
                      <div className="spinner" />
                      <span>Mengompresi...</span>
                    </>
                  ) : (
                    <>
                      <FileDown size={18} />
                      <span>Kompres PDF</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {result && (
              <div className="result-container" style={{ padding: '24px', background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                <CheckCircle2 size={48} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>Kompresi PDF Berhasil!</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>File Anda siap diunduh.</p>

                <div className="size-comparison" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginBottom: '28px' }}>
                  <div>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Ukuran Awal</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-secondary)' }}>{formatBytes(result.originalSize)}</div>
                  </div>
                  <ArrowRight size={20} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Ukuran Baru</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success)' }}>{formatBytes(result.compressedSize)}</div>
                  </div>
                  <div style={{ background: 'var(--success)', color: 'white', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 700 }}>
                    -{Math.round(((result.originalSize - result.compressedSize) / result.originalSize) * 100)}%
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <button className="btn btn-secondary" onClick={handleReset}>Kompres File Lain</button>
                  <a href={result.url} download={result.name} className="btn btn-primary">
                    Unduh PDF Terkompresi
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
