import { useState } from 'react';
import { Merge, Upload, File, CheckCircle2, AlertCircle, ArrowUp, ArrowDown, Trash2, Scissors } from 'lucide-react';

export default function MergeSplitPdfPage() {
  const [activeTab, setActiveTab] = useState('merge'); // 'merge' or 'split'
  const [error, setError] = useState(null);

  // Merge state
  const [mergeFiles, setMergeFiles] = useState([]);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeResult, setMergeResult] = useState(null);

  // Split state
  const [splitFile, setSplitFile] = useState(null);
  const [splitRanges, setSplitRanges] = useState('');
  const [splitLoading, setSplitLoading] = useState(false);
  const [splitResult, setSplitResult] = useState(null);

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Merge Handlers
  const handleMergeFilesAdd = (e) => {
    const selected = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
    if (selected.length > 0) {
      setMergeFiles([...mergeFiles, ...selected]);
      setError(null);
      setMergeResult(null);
    } else {
      setError('Harap pilih file PDF yang valid.');
    }
  };

  const handleMergeDrop = (e) => {
    e.preventDefault();
    const selected = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (selected.length > 0) {
      setMergeFiles([...mergeFiles, ...selected]);
      setError(null);
      setMergeResult(null);
    } else {
      setError('Harap jatuhkan file PDF yang valid.');
    }
  };

  const moveItem = (index, direction) => {
    const updated = [...mergeFiles];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < updated.length) {
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      setMergeFiles(updated);
    }
  };

  const removeMergeFile = (index) => {
    const updated = mergeFiles.filter((_, idx) => idx !== index);
    setMergeFiles(updated);
    setMergeResult(null);
  };

  const handleMergeSubmit = async () => {
    if (mergeFiles.length < 2) {
      setError('Minimal unggah 2 file PDF untuk digabungkan.');
      return;
    }
    setMergeLoading(true);
    setError(null);
    setMergeResult(null);

    const formData = new FormData();
    mergeFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('http://localhost:8000/merge-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Terjadi kesalahan saat menggabungkan PDF.');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      setMergeResult({
        url: downloadUrl,
        name: 'merged_document.pdf',
        size: blob.size,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setMergeLoading(false);
    }
  };

  const handleMergeReset = () => {
    if (mergeResult && mergeResult.url) {
      URL.revokeObjectURL(mergeResult.url);
    }
    setMergeFiles([]);
    setMergeResult(null);
    setError(null);
  };

  // Split Handlers
  const handleSplitFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      setSplitFile(selected);
      setError(null);
      setSplitResult(null);
    } else {
      setError('Harap pilih file PDF yang valid.');
    }
  };

  const handleSplitDrop = (e) => {
    e.preventDefault();
    const selected = e.dataTransfer.files[0];
    if (selected && selected.type === 'application/pdf') {
      setSplitFile(selected);
      setError(null);
      setSplitResult(null);
    } else {
      setError('Harap jatuhkan file PDF yang valid.');
    }
  };

  const handleSplitSubmit = async () => {
    if (!splitFile) return;
    if (!splitRanges.trim()) {
      setError('Harap masukkan rentang halaman pemisah (misal: 1-3, 5).');
      return;
    }
    setSplitLoading(true);
    setError(null);
    setSplitResult(null);

    const formData = new FormData();
    formData.append('file', splitFile);
    formData.append('ranges', splitRanges);

    try {
      const response = await fetch('http://localhost:8000/split-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Gagal memisahkan PDF.');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      setSplitResult({
        url: downloadUrl,
        name: `split_${splitFile.name}`,
        size: blob.size,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSplitLoading(false);
    }
  };

  const handleSplitReset = () => {
    if (splitResult && splitResult.url) {
      URL.revokeObjectURL(splitResult.url);
    }
    setSplitFile(null);
    setSplitRanges('');
    setSplitResult(null);
    setError(null);
  };

  const switchTab = (tab) => {
    setError(null);
    setActiveTab(tab);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Merge & Split PDF</h1>
        <p className="page-subtitle">
          Gabungkan beberapa file PDF menjadi satu dokumen rapi atau pisahkan halaman tertentu menjadi file PDF terpisah.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-glass)', padding: '4px', borderRadius: 'var(--radius-full)', display: 'inline-flex', gap: '4px' }}>
          <button 
            className={`btn ${activeTab === 'merge' ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => switchTab('merge')}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            <Merge size={16} />
            <span>Merge PDF</span>
          </button>
          <button 
            className={`btn ${activeTab === 'split' ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => switchTab('split')}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            <Scissors size={16} />
            <span>Split PDF</span>
          </button>
        </div>
      </div>

      <div className="glass-card-static" style={{ maxWidth: '800px', margin: '0 auto' }}>
        {error && (
          <div className="error-alert" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', marginBottom: '20px' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* ================================= MERGE TAB ================================= */}
        {activeTab === 'merge' && (
          <div>
            {mergeFiles.length === 0 ? (
              <div 
                className="drop-zone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleMergeDrop}
                onClick={() => document.getElementById('merge-input').click()}
              >
                <input 
                  type="file" 
                  id="merge-input" 
                  accept=".pdf" 
                  multiple 
                  onChange={handleMergeFilesAdd} 
                  style={{ display: 'none' }}
                />
                <Upload className="drop-zone-icon" />
                <div className="drop-zone-text">Pilih atau Seret Beberapa File PDF di sini</div>
                <div className="drop-zone-subtext">Minimal unggah 2 file PDF untuk digabungkan</div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <label style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Daftar Dokumen PDF ({mergeFiles.length}):</label>
                  {!mergeResult && !mergeLoading && (
                    <button className="btn btn-secondary" onClick={() => document.getElementById('merge-input-add').click()}>
                      Tambah File
                      <input 
                        type="file" 
                        id="merge-input-add" 
                        accept=".pdf" 
                        multiple 
                        onChange={handleMergeFilesAdd} 
                        style={{ display: 'none' }}
                      />
                    </button>
                  )}
                </div>

                <div className="pdf-files-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                  {mergeFiles.map((file, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-glass-strong)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <File size={22} style={{ color: 'var(--accent-1)' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{file.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{formatBytes(file.size)}</div>
                      </div>
                      {!mergeResult && !mergeLoading && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={() => moveItem(index, -1)} disabled={index === 0}>
                            <ArrowUp size={16} />
                          </button>
                          <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={() => moveItem(index, 1)} disabled={index === mergeFiles.length - 1}>
                            <ArrowDown size={16} />
                          </button>
                          <button className="btn btn-ghost" style={{ padding: '6px', color: 'var(--danger)' }} onClick={() => removeMergeFile(index)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {!mergeResult && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button className="btn btn-secondary" onClick={handleMergeReset} disabled={mergeLoading}>Reset</button>
                    <button className="btn btn-primary" onClick={handleMergeSubmit} disabled={mergeLoading || mergeFiles.length < 2}>
                      {mergeLoading ? (
                        <>
                          <div className="spinner" />
                          <span>Menggabungkan...</span>
                        </>
                      ) : (
                        <>
                          <Merge size={18} />
                          <span>Gabungkan PDF</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {mergeResult && (
                  <div className="result-container" style={{ padding: '24px', background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                    <CheckCircle2 size={48} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>Penggabungan PDF Sukses!</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Dokumen baru Anda telah berhasil dibuat.</p>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '24px', fontWeight: 600 }}>Ukuran file gabungan: {formatBytes(mergeResult.size)}</p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                      <button className="btn btn-secondary" onClick={handleMergeReset}>Mulai Baru</button>
                      <a href={mergeResult.url} download={mergeResult.name} className="btn btn-primary">
                        Unduh PDF Gabungan
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================================= SPLIT TAB ================================= */}
        {activeTab === 'split' && (
          <div>
            {!splitFile ? (
              <div 
                className="drop-zone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleSplitDrop}
                onClick={() => document.getElementById('split-input').click()}
              >
                <input 
                  type="file" 
                  id="split-input" 
                  accept=".pdf" 
                  onChange={handleSplitFileChange} 
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
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{splitFile.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatBytes(splitFile.size)}</div>
                  </div>
                  {!splitResult && !splitLoading && (
                    <button className="btn btn-ghost" onClick={handleSplitReset}>Ganti</button>
                  )}
                </div>

                {!splitResult && !splitLoading && (
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>Rentang Halaman Yang Ingin Dipisah:</label>
                    <input 
                      type="text"
                      className="glass-card"
                      placeholder="Contoh: 1-3, 5 (Artinya halaman 1 s.d 3, dan halaman 5)"
                      value={splitRanges}
                      onChange={(e) => setSplitRanges(e.target.value)}
                      style={{ width: '100%', padding: '12px', fontSize: '14px', outline: 'none', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)', transform: 'none', boxShadow: 'none' }}
                    />
                    <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Format penulisan: `1-3` (untuk range halaman) atau `5` (untuk halaman tunggal), dipisahkan tanda koma.
                    </small>
                  </div>
                )}

                {!splitResult && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button className="btn btn-secondary" onClick={handleSplitReset} disabled={splitLoading}>Batal</button>
                    <button className="btn btn-primary" onClick={handleSplitSubmit} disabled={splitLoading}>
                      {splitLoading ? (
                        <>
                          <div className="spinner" />
                          <span>Memproses...</span>
                        </>
                      ) : (
                        <>
                          <Scissors size={18} />
                          <span>Pisahkan PDF</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {splitResult && (
                  <div className="result-container" style={{ padding: '24px', background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                    <CheckCircle2 size={48} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>Pemisahan PDF Berhasil!</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>File hasil pemisahan Anda siap diunduh.</p>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '24px', fontWeight: 600 }}>Ukuran file hasil: {formatBytes(splitResult.size)}</p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                      <button className="btn btn-secondary" onClick={handleSplitReset}>Mulai Baru</button>
                      <a href={splitResult.url} download={splitResult.name} className="btn btn-primary">
                        Unduh PDF Hasil Pisah
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
