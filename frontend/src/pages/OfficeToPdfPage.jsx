import { useState } from 'react';
import { FileCheck, Upload, File, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function OfficeToPdfPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const allowedExtensions = ['.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt'];

  const checkFileValidity = (fileName) => {
    const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
    return allowedExtensions.includes(ext);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && checkFileValidity(selected.name)) {
      setFile(selected);
      setError(null);
      setResult(null);
    } else {
      setError('Harap pilih dokumen Word (.docx/.doc), Excel (.xlsx/.xls), atau PowerPoint (.pptx/.ppt).');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const selected = e.dataTransfer.files[0];
    if (selected && checkFileValidity(selected.name)) {
      setFile(selected);
      setError(null);
      setResult(null);
    } else {
      setError('Harap pilih dokumen Word, Excel, atau PowerPoint yang valid.');
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

    try {
      const response = await fetch('http://localhost:8000/office-to-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Konversi gagal. Pastikan Microsoft Office terpasang di server Windows Anda.');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const outputName = file.name.slice(0, file.name.lastIndexOf('.')) + '.pdf';

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
    setResult(null);
    setError(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Office to PDF Converter</h1>
        <p className="page-subtitle">
          Konversi dokumen Word, spreadsheet Excel, atau slide presentasi PowerPoint Anda menjadi PDF dengan akurasi 100% menggunakan engine asli Microsoft Office.
        </p>
      </div>

      <div className="glass-card-static" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Notice alert */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', marginBottom: '20px', fontSize: '13px' }}>
          <Info size={18} style={{ color: 'var(--info)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--info)' }}>Persyaratan Sistem:</strong> Fitur konversi ini memanfaatkan COM automation Windows. Komputer lokal Windows Anda wajib memiliki Microsoft Office (Word, Excel, PowerPoint) terinstal untuk menjalankan konversi dengan tata letak sempurna.
          </div>
        </div>

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
            onClick={() => document.getElementById('office-input').click()}
          >
            <input 
              type="file" 
              id="office-input" 
              accept=".docx,.doc,.xlsx,.xls,.pptx,.ppt" 
              onChange={handleFileChange} 
              style={{ display: 'none' }}
            />
            <Upload className="drop-zone-icon" />
            <div className="drop-zone-text">Pilih atau Seret File Office di sini</div>
            <div className="drop-zone-subtext">Word (.docx/.doc), Excel (.xlsx/.xls), PowerPoint (.pptx/.ppt)</div>
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

            {!result && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={handleReset} disabled={loading}>Batal</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <>
                      <div className="spinner" />
                      <span>Mengonversi Dokumen...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck size={18} />
                      <span>Konversi ke PDF</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {result && (
              <div className="result-container" style={{ padding: '24px', background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                <CheckCircle2 size={48} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>Konversi Dokumen Berhasil!</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Dokumen Office Anda telah berhasil diredistribusi menjadi PDF.</p>
                <p style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '24px', fontWeight: 600 }}>Ukuran PDF: {formatBytes(result.size)}</p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <button className="btn btn-secondary" onClick={handleReset}>Konversi File Lain</button>
                  <a href={result.url} download={result.name} className="btn btn-primary">
                    Unduh File PDF
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
