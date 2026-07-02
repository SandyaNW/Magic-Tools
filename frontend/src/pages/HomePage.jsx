import { Link } from 'react-router-dom';
import { 
  Eraser, 
  Maximize, 
  Maximize2, 
  FileImage, 
  Palette, 
  Wand2, 
  Sparkles, 
  Zap, 
  Shield, 
  PenTool,
  FileDown,
  Merge,
  FileText,
  FileCheck,
  Images
} from 'lucide-react';

const imageFeatures = [
  {
    title: 'Remove Background',
    desc: 'Hapus background gambar secara otomatis dengan AI. Hasil bersih dan transparan, siap dipakai!',
    icon: <Eraser size={24} />,
    color: 'purple',
    path: '/remove-bg',
    status: 'ready',
    statusLabel: 'Ready',
  },
  {
    title: 'Resize Image',
    desc: 'Ubah ukuran gambar ke dimensi px, cm, atau inch. Fitur fit/crop anti gepeng & preset pas foto.',
    icon: <Maximize size={24} />,
    color: 'blue',
    path: '/resize',
    status: 'ready',
    statusLabel: 'Ready',
  },
  {
    title: 'Convert Format',
    desc: 'Konversi gambar dari satu format ke format lain. PNG, JPG, WEBP, dan lainnya.',
    icon: <FileImage size={24} />,
    color: 'pink',
    path: '/convert',
    status: 'ready',
    statusLabel: 'Ready',
  },
  {
    title: 'Change BG Color',
    desc: 'Ganti warna background foto. AI hapus background lama, lalu kamu pilih warna baru sesukamu.',
    icon: <Palette size={24} />,
    color: 'cyan',
    path: '/change-bg',
    status: 'ready',
    statusLabel: 'Ready',
  },
  {
    title: 'AI Image Upscaler',
    desc: 'Perbesar foto lama atau buram agar jadi tajam. Model AI khusus untuk meningkatkan resolusi tanpa blur.',
    icon: <Maximize2 size={24} />,
    color: 'yellow',
    path: '/upscale',
    status: 'ready',
    statusLabel: 'Ready',
  },
  {
    title: 'Enhance Image',
    desc: 'Percantik foto buram atau kurang terang. Gunakan AI Auto-Enhance atau kontrol warna secara live & manual.',
    icon: <Wand2 size={24} />,
    color: 'emerald',
    path: '/enhance',
    status: 'ready',
    statusLabel: 'Ready',
  },
];

const documentFeatures = [
  {
    title: 'E-Sign Document',
    desc: 'Tanda tangani dokumen PDF secara digital langsung di browser. Aman, privat, dan cepat!',
    icon: <PenTool size={24} />,
    color: 'purple',
    path: '/esign',
    status: 'ready',
    statusLabel: 'Ready',
  },
  {
    title: 'Compress PDF',
    desc: 'Perkecil ukuran file PDF secara signifikan dengan kompresi tingkat tinggi tanpa merusak kualitas teks.',
    icon: <FileDown size={24} />,
    color: 'blue',
    path: '/compress-pdf',
    status: 'ready',
    statusLabel: 'Ready',
  },
  {
    title: 'Merge & Split PDF',
    desc: 'Gabungkan beberapa file PDF menjadi satu atau pisahkan halaman tertentu menjadi file PDF terpisah.',
    icon: <Merge size={24} />,
    color: 'pink',
    path: '/merge-split-pdf',
    status: 'ready',
    statusLabel: 'Ready',
  },
  {
    title: 'Office to PDF',
    desc: 'Konversi file Word (.docx), Excel (.xlsx), atau PowerPoint (.pptx) menjadi PDF presisi tinggi.',
    icon: <FileCheck size={24} />,
    color: 'emerald',
    path: '/office-to-pdf',
    status: 'ready',
    statusLabel: 'Ready',
  },
  {
    title: 'PDF to Word',
    desc: 'Konversi PDF kembali ke dokumen Word editable (.docx). Dilengkapi dengan dukungan opsi OCR.',
    icon: <FileText size={24} />,
    color: 'cyan',
    path: '/pdf-to-word',
    status: 'ready',
    statusLabel: 'Ready',
  },
  {
    title: 'Extract PDF to Image',
    desc: 'Ekstrak dan ubah seluruh halaman PDF menjadi gambar PNG terpisah dalam satu file unduhan ZIP.',
    icon: <Images size={24} />,
    color: 'yellow',
    path: '/extract-pdf-images',
    status: 'ready',
    statusLabel: 'Ready',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="hero-section animate-fade-in-up">
        <h1 className="hero-title">
          Olah File & Gambar Jadi <br />
          <span className="gradient-text">Lebih Ajaib</span> ✨
        </h1>
        <p className="hero-subtitle">
          Tool canggih berbasis AI untuk memproses gambar dan dokumen PDF secara instan, aman, dan tanpa batasan.
        </p>
      </section>

      {/* Stats */}
      <div className="stats-row animate-fade-in-up delay-2">
        <div className="stat-item">
          <div className="stat-number">12</div>
          <div className="stat-label">Power Tools</div>
        </div>
        <div className="stat-item">
          <div className="stat-number"><Zap size={28} style={{ verticalAlign: 'middle' }} /></div>
          <div className="stat-label">AI Engine</div>
        </div>
        <div className="stat-item">
          <div className="stat-number"><Shield size={28} style={{ verticalAlign: 'middle' }} /></div>
          <div className="stat-label">100% Secure</div>
        </div>
      </div>

      {/* Section: Image Tools */}
      <div className="section-title-wrapper animate-fade-in-up delay-3">
        <h2 className="section-group-title">🖼️ Image Magic Tools</h2>
        <p className="section-group-desc">Kumpulan alat pintar untuk mengedit, memperbesar, dan memoles gambar secara otomatis.</p>
      </div>

      <div className="features-grid animate-fade-in-up delay-3" style={{ marginBottom: '3rem' }}>
        {imageFeatures.map((f, i) => (
          <Link to={f.path} className="feature-card" key={i} id={`image-card-${i}`}>
            <div className={`feature-card-icon ${f.color}`}>
              {f.icon}
            </div>
            <div className="feature-card-title">{f.title}</div>
            <div className="feature-card-desc">{f.desc}</div>
            <span className={`feature-card-status status-${f.status}`}>
              {f.statusLabel}
            </span>
          </Link>
        ))}
      </div>

      {/* Section: Document Tools */}
      <div className="section-title-wrapper animate-fade-in-up delay-4">
        <h2 className="section-group-title">📄 Document Magic Tools</h2>
        <p className="section-group-desc">Kumpulan alat pintar untuk mengompres, mengonversi, membagi, dan menandatangani file PDF/Office.</p>
      </div>

      <div className="features-grid animate-fade-in-up delay-4">
        {documentFeatures.map((f, i) => (
          <Link to={f.path} className="feature-card" key={i} id={`doc-card-${i}`}>
            <div className={`feature-card-icon ${f.color}`}>
              {f.icon}
            </div>
            <div className="feature-card-title">{f.title}</div>
            <div className="feature-card-desc">{f.desc}</div>
            <span className={`feature-card-status status-${f.status}`}>
              {f.statusLabel}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
