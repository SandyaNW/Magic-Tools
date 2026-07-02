import { useState } from 'react';
import { FileText, Upload, File, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PdfToWordPage() {
  const [file, setFile] = useState(null);
  const [ocr, setOcr] = useState(false);
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
    formData.append('ocr', ocr);

    try {
      const response = await fetch('http://localhost:8000/pdf-to-word', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Gagal mengonversi PDF ke Word.');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const outputName = file.name.slice(0, file.name.lastIndexOf('.')) + '.docx';

      setResult({
        url: downloadUrl,
        name: outputName,
        size: blob.size,
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
    setOcr(false);
    setResult(null);
    setError(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">PDF to Word Converter</h1>
        <p className="page-subtitle">
          Ubah file PDF Anda menjadi dokumen Microsoft Word (.docx) yang dapat diedit secara penuh dengan tetap mempertahankan layout asli.
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
            onClick={() => document.getElementById('word-input').click()}
          >
            <input 
              type="file" 
              id="word-input" 
              accept=".pdf" 
              onChange={handleFileChange} 
              style={{ display: 'none' }}
            />
            <Upload className="drop-zone-icon" />
            <div className="drop-zone-text">Pilih atau Seret File PDF di sini</div>
            <div className="drop-zone-subtext">Hanya menerima format .pdf</div>
          </div>
        ) : (
          <div>
            <div className="file-info-bar" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--bg-glass-strong)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
              <File size={28} style={{ color: 'var(--accent-1)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{file.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatBytes(file.size)}</div>
              </div>
              {!result && !loading && (
                <button className="btn btn-ghost" onClick={handleReset}>Ganti</button>
              )}
            </div>

            {!result && !loading && (
              <div style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)' }}>
                  <input 
                    type="checkbox" 
                    checked={ocr}
                    onChange={(e) => setOcr(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-1)' }}
                  />
                  <span>Aktifkan OCR (Optical Character Recognition)</span>
                </label>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', paddingLeft: '28px', lineHeight: '1.4' }}>
                  Centang opsi ini jika file PDF Anda berupa **hasil scan/foto dokumen** agar teks di dalamnya dapat diubah menjadi teks digital yang bisa diedit di Word. Jika PDF Anda adalah hasil export Word secara langsung, biarkan opsi ini tidak tercentang agar pemrosesan lebih cepat dan layout lebih rapi.
                </p>
              </div>
            )}

            {!result && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={handleReset} disabled={loading}>Batal</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <>
                      <div className="spinner" />
                      <span>Mengonversi PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileText size={18} />
                      <span>Konversi ke Word</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {result && (
              <div className="result-container" style={{ padding: '24px', background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                <CheckCircle2 size={48} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>Konversi PDF ke Word Berhasil!</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>File Word (.docx) hasil konversi siap diunduh.</p>
                <p style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '24px', fontWeight: 600 }}>Ukuran Word: {formatBytes(result.size)}</p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <button className="btn btn-secondary" onClick={handleReset}>Konversi File Lain</button>
                  <a href={result.url} download={result.name} className="btn btn-primary">
                    Unduh Dokumen Word
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
