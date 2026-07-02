import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  PenTool,
  Trash2,
  Download,
  Plus,
  Calendar,
  Type,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  Info,
  Check
} from 'lucide-react';

// Initialize PDF.js worker
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function ESignPage() {
  // Document State
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(null); // 'pdf' | 'image'
  const [imageSrc, setImageSrc] = useState(null); // for images
  const [pdfBytes, setPdfBytes] = useState(null); // for pdfs
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isGenerating, setIsGenerating] = useState(false);

  // Signatures Library
  const [signatures, setSignatures] = useState([]);
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);

  // Overlay placements (signatures, text, date)
  const [overlays, setOverlays] = useState([]);
  const [activeOverlayId, setActiveOverlayId] = useState(null);

  // Signature Creator Tab State
  const [sigTab, setSigTab] = useState('draw'); // 'draw' | 'type' | 'upload'
  const [penColor, setPenColor] = useState('#000000');
  const [penWidth, setPenWidth] = useState(3);
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState('font-dancing');

  // References
  const fileInputRef = useRef(null);
  const docCanvasRef = useRef(null);
  const drawCanvasRef = useRef(null);
  const sigUploadRef = useRef(null);

  // Stroke history for canvas drawing undo
  const [strokes, setStrokes] = useState([]);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  // Load signatures from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('magic_esign_signatures');
    if (saved) {
      try {
        setSignatures(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save signatures to LocalStorage
  const saveSignaturesToStorage = (newSigs) => {
    setSignatures(newSigs);
    localStorage.setItem('magic_esign_signatures', JSON.stringify(newSigs));
  };

  // Render PDF page onto document canvas
  useEffect(() => {
    if (!pdfDoc || fileType !== 'pdf') return;

    let isCurrent = true;

    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(currentPage);
        
        // Define a target viewport size (e.g. 700px width for standard container size)
        const containerWidth = 700;
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const scale = containerWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        if (!isCurrent) return;

        const canvas = docCanvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        setCanvasSize({ width: viewport.width, height: viewport.height });

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Error rendering page: ', err);
      }
    }

    renderPage();

    return () => {
      isCurrent = false;
    };
  }, [pdfDoc, currentPage, fileType]);

  // Load Image onto workspace
  useEffect(() => {
    if (fileType !== 'image' || !imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const containerWidth = 700;
      const displayWidth = Math.min(containerWidth, img.naturalWidth);
      const scale = displayWidth / img.naturalWidth;
      const displayHeight = img.naturalHeight * scale;

      const canvas = docCanvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      setCanvasSize({ width: displayWidth, height: displayHeight });

      context.drawImage(img, 0, 0, displayWidth, displayHeight);
    };
  }, [imageSrc, fileType]);

  // Keyboard listener for deleting selected overlay
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeOverlayId) {
        // Prevent trigger if user is focusing an input field
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
          return;
        }
        removeOverlay(activeOverlayId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeOverlayId]);

  // Handle document upload
  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setOverlays([]);
    setActiveOverlayId(null);
    setFile(uploadedFile);

    const reader = new FileReader();

    if (uploadedFile.type === 'application/pdf') {
      setFileType('pdf');
      reader.onload = async (event) => {
        const bytes = event.target.result;
        // Make a copy of the ArrayBuffer before passing it to pdfjsLib,
        // because pdfjsLib transfers/detaches the buffer it receives.
        setPdfBytes(bytes.slice(0));
        try {
          const loadingTask = pdfjsLib.getDocument({ data: bytes });
          const pdf = await loadingTask.promise;
          setPdfDoc(pdf);
          setNumPages(pdf.numPages);
          setCurrentPage(1);
        } catch (err) {
          alert('Gagal memuat dokumen PDF: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(uploadedFile);
    } else if (uploadedFile.type.startsWith('image/')) {
      setFileType('image');
      setNumPages(1);
      setCurrentPage(1);
      reader.onload = (event) => {
        setImageSrc(event.target.result);
      };
      reader.readAsDataURL(uploadedFile);
    } else {
      alert('Format file tidak didukung! Pilih dokumen PDF atau file Gambar (PNG/JPG).');
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  // Drag and drop file handlers
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      e.target.files = [droppedFile];
      handleFileChange({ target: e.target });
    }
  };

  // Add signature/text overlay
  const addOverlay = (type, content = '', font = '') => {
    if (!canvasSize.width || !canvasSize.height) return;

    const width = type === 'signature' ? 150 : 180;
    const height = type === 'signature' ? 65 : 35;
    
    // Spawn in the center of page
    const x = (canvasSize.width - width) / 2;
    const y = (canvasSize.height - height) / 2;

    const newOverlay = {
      id: 'overlay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      type,
      page: currentPage,
      x: Math.max(0, x),
      y: Math.max(0, y),
      width,
      height,
      content,
      fontFamily: font,
      canvasWidth: canvasSize.width,
      canvasHeight: canvasSize.height
    };

    setOverlays(prev => [...prev, newOverlay]);
    setActiveOverlayId(newOverlay.id);
  };

  const removeOverlay = (id) => {
    setOverlays(prev => prev.filter(o => o.id !== id));
    if (activeOverlayId === id) {
      setActiveOverlayId(null);
    }
  };

  const updateOverlayText = (id, newText) => {
    setOverlays(prev => prev.map(o => o.id === id ? { ...o, content: newText } : o));
  };

  // Drag handles for overlays
  const handleOverlayMouseDown = (e, id) => {
    e.preventDefault();
    setActiveOverlayId(id);

    const overlay = overlays.find(o => o.id === id);
    if (!overlay) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startOffsetX = overlay.x;
    const startOffsetY = overlay.y;

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let newX = startOffsetX + dx;
      let newY = startOffsetY + dy;

      // Bound check
      const maxX = canvasSize.width - overlay.width;
      const maxY = canvasSize.height - overlay.height;
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      setOverlays(prev => prev.map(o => o.id === id ? { ...o, x: newX, y: newY } : o));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Resize handle for overlays
  const handleResizeMouseDown = (e, id) => {
    e.preventDefault();
    e.stopPropagation();

    const overlay = overlays.find(o => o.id === id);
    if (!overlay) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = overlay.width;
    const startHeight = overlay.height;
    const startOffsetX = overlay.x;
    const startOffsetY = overlay.y;

    const handleResizeMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let newWidth = startWidth + dx;
      let newHeight = startHeight + dy;

      const minWidth = 40;
      const minHeight = 20;

      newWidth = Math.max(minWidth, Math.min(newWidth, canvasSize.width - startOffsetX));
      newHeight = Math.max(minHeight, Math.min(newHeight, canvasSize.height - startOffsetY));

      // Maintain aspect ratio for signatures
      if (overlay.type === 'signature') {
        const ratio = startWidth / startHeight;
        newHeight = newWidth / ratio;
      }

      setOverlays(prev => prev.map(o => o.id === id ? { ...o, width: newWidth, height: newHeight } : o));
    };

    const handleResizeMouseUp = () => {
      window.removeEventListener('mousemove', handleResizeMouseMove);
      window.removeEventListener('mouseup', handleResizeMouseUp);
    };

    window.addEventListener('mousemove', handleResizeMouseMove);
    window.addEventListener('mouseup', handleResizeMouseUp);
  };

  // ================= SIGNATURE CANVAS PAD DRAWING LOGIC =================
  const getCanvasCoords = (e) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Check if it is a touch event
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const coords = getCanvasCoords(e);
    isDrawingRef.current = true;
    lastPointRef.current = coords;

    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, penWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = penColor;
    ctx.fill();

    // Start a new stroke
    setStrokes(prev => [...prev, [coords]]);
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    
    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPointRef.current = coords;

    // Append point to current stroke (last stroke in state)
    setStrokes(prev => {
      if (prev.length === 0) return [[coords]];
      const updated = [...prev];
      const lastStroke = [...updated[updated.length - 1], coords];
      updated[updated.length - 1] = lastStroke;
      return updated;
    });
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearDrawCanvas = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokes([]);
  };

  const undoDrawCanvas = () => {
    if (strokes.length === 0) return;

    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const remainingStrokes = strokes.slice(0, -1);
    setStrokes(remainingStrokes);

    // Redraw strokes
    remainingStrokes.forEach(stroke => {
      if (stroke.length === 0) return;
      ctx.beginPath();
      
      // Draw first point
      ctx.arc(stroke[0].x, stroke[0].y, penWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = penColor;
      ctx.fill();
      
      // Draw lines
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    });
  };

  // Add drawn signature
  const saveDrawnSignature = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas || strokes.length === 0) return;

    // We trim the transparent bounding box of the signature drawing to avoid large margins
    const trimmedCanvas = getTrimmedCanvas(canvas);
    const dataUrl = trimmedCanvas.toDataURL('image/png');
    
    const newSigs = [dataUrl, ...signatures];
    saveSignaturesToStorage(newSigs);
    setIsSigModalOpen(false);
    clearDrawCanvas();
  };

  // Helper function to crop transparent edges of canvas
  const getTrimmedCanvas = (sourceCanvas) => {
    const ctx = sourceCanvas.getContext('2d');
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;
    
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let found = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const alpha = pixels[index + 3];
        if (alpha > 0) {
          found = true;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!found) return sourceCanvas;

    // Add small padding
    const padding = 10;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width, maxX + padding);
    maxY = Math.min(height, maxY + padding);

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = maxX - minX;
    croppedCanvas.height = maxY - minY;
    
    const croppedCtx = croppedCanvas.getContext('2d');
    croppedCtx.drawImage(
      sourceCanvas,
      minX, minY, croppedCanvas.width, croppedCanvas.height,
      0, 0, croppedCanvas.width, croppedCanvas.height
    );

    return croppedCanvas;
  };

  // Save typed signature
  const saveTypedSignature = () => {
    if (!typedName.trim()) return;

    // Create an offscreen canvas to draw text as transparent png
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    // Font family mapping
    let fontName = 'sans-serif';
    if (selectedFont === 'font-dancing') fontName = '"Dancing Script", cursive';
    if (selectedFont === 'font-caveat') fontName = '"Caveat", cursive';
    if (selectedFont === 'font-vibes') fontName = '"Great Vibes", cursive';
    if (selectedFont === 'font-pacifico') fontName = '"Pacifico", cursive';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = penColor; // uses selected ink color!
    ctx.font = `italic 72px ${fontName}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

    const trimmedCanvas = getTrimmedCanvas(canvas);
    const dataUrl = trimmedCanvas.toDataURL('image/png');

    const newSigs = [dataUrl, ...signatures];
    saveSignaturesToStorage(newSigs);
    setIsSigModalOpen(false);
    setTypedName('');
  };

  // Handle uploaded signature
  const handleSigUpload = (e) => {
    const sigFile = e.target.files[0];
    if (!sigFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const newSigs = [dataUrl, ...signatures];
      saveSignaturesToStorage(newSigs);
      setIsSigModalOpen(false);
    };
    reader.readAsDataURL(sigFile);
  };

  const deleteSignatureFromLibrary = (e, index) => {
    e.stopPropagation();
    const updated = signatures.filter((_, idx) => idx !== index);
    saveSignaturesToStorage(updated);
  };

  // Reset current document workspace
  const handleReset = () => {
    if (window.confirm('Hapus semua tanda tangan dan teks dari dokumen ini?')) {
      setOverlays([]);
      setActiveOverlayId(null);
    }
  };

  // ================= SIGNED EXPORT logic =================
  const downloadSignedDocument = async () => {
    if (overlays.length === 0) {
      alert('Tambahkan setidaknya satu tanda tangan atau teks pada dokumen sebelum mengunduh!');
      return;
    }

    setIsGenerating(true);

    try {
      if (fileType === 'pdf' && pdfBytes) {
        // Load original PDF using pdf-lib, slicing it to prevent detaching
        const pdfDocInstance = await PDFDocument.load(pdfBytes.slice(0));
        const pages = pdfDocInstance.getPages();

        for (const overlay of overlays) {
          const pageIndex = overlay.page - 1;
          if (pageIndex < 0 || pageIndex >= pages.length) continue;

          const page = pages[pageIndex];
          const { width: pdfWidth, height: pdfHeight } = page.getSize();

          // Scale overlay coordinates to fit PDF points
          const canvasW = overlay.canvasWidth || canvasSize.width;
          const canvasH = overlay.canvasHeight || canvasSize.height;

          const scaleX = pdfWidth / canvasW;
          const scaleY = pdfHeight / canvasH;

          const pdfX = overlay.x * scaleX;
          // PDF origin is bottom-left, CSS is top-left
          const pdfY = (canvasH - overlay.y - overlay.height) * scaleY;
          const pdfW = overlay.width * scaleX;
          const pdfH = overlay.height * scaleY;

          if (overlay.type === 'signature') {
            const pngUrl = overlay.content;
            
            // Fetch the image bytes
            const imgBytes = await fetch(pngUrl).then(res => res.arrayBuffer());
            
            let embeddedImage;
            if (pngUrl.includes('image/png') || pngUrl.includes('png')) {
              embeddedImage = await pdfDocInstance.embedPng(imgBytes);
            } else {
              embeddedImage = await pdfDocInstance.embedJpg(imgBytes);
            }

            page.drawImage(embeddedImage, {
              x: pdfX,
              y: pdfY,
              width: pdfW,
              height: pdfH
            });
          } else if (overlay.type === 'text' || overlay.type === 'date') {
            const font = await pdfDocInstance.embedFont('Helvetica-Bold');
            const fontSize = Math.max(8, pdfH * 0.75); // approx size based on height

            // Draw text onto PDF page
            page.drawText(overlay.content, {
              x: pdfX,
              y: pdfY + (pdfH * 0.15), // shift baseline slightly up
              size: fontSize,
              font: font,
              color: { type: 'RGB', colors: [0, 0, 0] } // Black text
            });
          }
        }

        const signedBytes = await pdfDocInstance.save();
        triggerDownload(new Blob([signedBytes], { type: 'application/pdf' }), 'signed_' + file.name);

      } else if (fileType === 'image' && imageSrc) {
        // Load original image into canvas, merge, and export
        const img = new Image();
        img.src = imageSrc;
        await new Promise((resolve, reject) => {
          img.onload = async () => {
            const exportCanvas = document.createElement('canvas');
            exportCanvas.width = img.naturalWidth;
            exportCanvas.height = img.naturalHeight;
            const ctx = exportCanvas.getContext('2d');
            
            // Draw background
            ctx.drawImage(img, 0, 0);

            // Compute scaling
            const scaleX = img.naturalWidth / canvasSize.width;
            const scaleY = img.naturalHeight / canvasSize.height;

            for (const overlay of overlays) {
              const x = overlay.x * scaleX;
              const y = overlay.y * scaleY;
              const w = overlay.width * scaleX;
              const h = overlay.height * scaleY;

              if (overlay.type === 'signature') {
                const overlayImg = new Image();
                overlayImg.src = overlay.content;
                await new Promise((r) => {
                  overlayImg.onload = () => {
                    ctx.drawImage(overlayImg, x, y, w, h);
                    r();
                  };
                  overlayImg.onerror = () => r();
                });
              } else if (overlay.type === 'text' || overlay.type === 'date') {
                ctx.fillStyle = '#000000';
                const fontSize = h * 0.8;
                ctx.font = `bold ${fontSize}px sans-serif`;
                ctx.textBaseline = 'top';
                ctx.fillText(overlay.content, x, y);
              }
            }

            exportCanvas.toBlob((blob) => {
              triggerDownload(blob, 'signed_' + file.name);
              resolve();
            }, file.type);
          };
          img.onerror = reject;
        });
      }
    } catch (err) {
      console.error('Error generating document: ', err);
      alert('Gagal membuat dokumen: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper date formatter (YYYY-MM-DD)
  const getFormattedDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header animate-fade-in-up">
        <h1 className="page-title">E-Sign Document</h1>
        <p className="page-subtitle">
          Tanda tangani dokumen PDF atau file Gambar secara aman. Proses dilakukan 100% di browsermu, menjaga kerahasiaan dokumenmu.
        </p>
      </div>

      {!file ? (
        // Drop zone file uploader
        <div className="glass-card animate-fade-in-up delay-1" style={{ maxWidth: '600px', margin: '40px auto' }}>
          <div
            className="drop-zone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            id="esign-drop-zone"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept=".pdf,image/png,image/jpeg,image/jpg"
            />
            <Upload className="drop-zone-icon" />
            <div className="drop-zone-text">Pilih Dokumen PDF atau Gambar</div>
            <div className="drop-zone-subtext">Seret & taruh file di sini atau klik untuk mencari (Maks. 15MB)</div>
          </div>
          
          <div style={{ marginTop: '24px', display: 'flex', gap: '10px', alignItems: 'flex-start' }} className="drop-zone-subtext">
            <Info size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent-1)' }} />
            <div>
              <strong>Mengapa Aman?</strong> Dokumen yang Anda upload tidak akan dikirim ke server.
              Semua proses pengolahan PDF, pembuatan tanda tangan, dan penggabungan file dilakukan langsung di dalam browser Anda.
            </div>
          </div>
        </div>
      ) : (
        // Workspace
        <div className="esign-workspace animate-fade-in">
          {/* Left Sidebar controls */}
          <div className="esign-sidebar">
            {/* File Info Card */}
            <div className="glass-card-static">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="badge badge-secondary" style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                  {fileType === 'pdf' ? 'PDF Document' : 'Image File'}
                </span>
                <button
                  className="btn btn-ghost"
                  onClick={() => setFile(null)}
                  style={{ padding: '4px', height: 'auto', minHeight: 'unset' }}
                  title="Ganti File"
                >
                  <X size={14} />
                </button>
              </div>
              <div style={{ fontWeight: 600, fontSize: '14px', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {fileType === 'pdf' ? <FileText size={16} className="text-info" /> : <ImageIcon size={16} className="text-success" />}
                {file.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Ukuran: {(file.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>

            {/* Placed Active Editor controls */}
            {activeOverlayId && (
              <div className="glass-card-static" style={{ borderColor: 'var(--accent-1)' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--accent-1)' }}>
                  Pengaturan Elemen
                </div>
                {overlays.find(o => o.id === activeOverlayId)?.type !== 'signature' ? (
                  <div className="esign-tool-box">
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Isi Teks:</label>
                    <input
                      type="text"
                      className="esign-type-input"
                      style={{ marginBottom: 0, padding: '8px 12px', fontSize: '14px' }}
                      value={overlays.find(o => o.id === activeOverlayId)?.content || ''}
                      onChange={(e) => updateOverlayText(activeOverlayId, e.target.value)}
                    />
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Gunakan handle sudut kanan bawah tanda tangan untuk mengubah ukurannya, atau drag untuk memindahkan posisi.
                  </div>
                )}
                <button
                  className="btn btn-secondary"
                  onClick={() => removeOverlay(activeOverlayId)}
                  style={{ width: '100%', marginTop: '12px', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                >
                  <Trash2 size={14} /> Hapus Elemen
                </button>
              </div>
            )}

            {/* Tools Panel */}
            <div className="glass-card-static">
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '16px' }}>Alat E-Sign</div>
              <div className="esign-tool-box">
                <button className="esign-draggable-tool" onClick={() => addOverlay('text', 'Ketik Teks Di Sini')}>
                  <span className="esign-draggable-tool-icon"><Type size={16} /></span>
                  <span className="esign-draggable-tool-label">Teks Kustom</span>
                </button>
                <button className="esign-draggable-tool" onClick={() => addOverlay('date', getFormattedDate())}>
                  <span className="esign-draggable-tool-icon"><Calendar size={16} /></span>
                  <span className="esign-draggable-tool-label">Tanggal Hari Ini</span>
                </button>
              </div>
            </div>

            {/* Signature Library */}
            <div className="glass-card-static" style={{ flex: 1, minHeight: '220px', display: 'flex', flexDirection: 'column' }}>
              <div className="signature-library-header">
                <div style={{ fontWeight: 700, fontSize: '14px' }}>Tanda Tangan</div>
                <button className="btn btn-primary" onClick={() => setIsSigModalOpen(true)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                  <Plus size={14} /> Buat
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', marginTop: '12px' }}>
                {signatures.length === 0 ? (
                  <div className="signature-empty">
                    Belum ada tanda tangan. Klik 'Buat' untuk menggambar atau mengetik tanda tangan baru.
                  </div>
                ) : (
                  <div className="signature-list">
                    {signatures.map((sig, idx) => (
                      <div
                        key={idx}
                        className="signature-item"
                        onClick={() => addOverlay('signature', sig)}
                        title="Klik untuk menaruh di dokumen"
                      >
                        <img src={sig} alt={`Tanda Tangan ${idx + 1}`} />
                        <button
                          className="signature-item-delete"
                          onClick={(e) => deleteSignatureFromLibrary(e, idx)}
                          title="Hapus dari daftar"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center Document workspace */}
          <div className="esign-board">
            <div className="esign-board-header">
              <span className="esign-board-title">Workspace Editor</span>
              
              <div className="esign-board-controls">
                {fileType === 'pdf' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage <= 1}
                      style={{ padding: '6px' }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>
                      Halaman {currentPage} dari {numPages}
                    </span>
                    <button
                      className="btn btn-ghost"
                      onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
                      disabled={currentPage >= numPages}
                      style={{ padding: '6px' }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                <div style={{ width: '1px', height: '20px', background: 'var(--border-default)' }} />
                
                <button className="btn btn-secondary" onClick={handleReset}>
                  Reset
                </button>
                <button
                  className="btn btn-primary"
                  onClick={downloadSignedDocument}
                  disabled={isGenerating || overlays.length === 0}
                >
                  {isGenerating ? (
                    <>
                      <div className="spinner" /> Memproses...
                    </>
                  ) : (
                    <>
                      <Download size={14} /> Download File
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Document preview viewport */}
            <div className="esign-viewer-container">
              <div
                className="esign-page-wrapper"
                style={{
                  width: canvasSize.width ? `${canvasSize.width}px` : 'auto',
                  height: canvasSize.height ? `${canvasSize.height}px` : 'auto',
                }}
                onClick={() => setActiveOverlayId(null)}
              >
                {/* Background rendered PDF or Image */}
                <canvas ref={docCanvasRef} style={{ display: 'block' }} />

                {/* Overlays on current page */}
                {overlays
                  .filter(overlay => overlay.page === currentPage)
                  .map(overlay => {
                    const isActive = activeOverlayId === overlay.id;
                    return (
                      <div
                        key={overlay.id}
                        className={`esign-overlay ${isActive ? 'active' : ''}`}
                        style={{
                          left: `${overlay.x}px`,
                          top: `${overlay.y}px`,
                          width: `${overlay.width}px`,
                          height: `${overlay.height}px`,
                        }}
                        onMouseDown={(e) => handleOverlayMouseDown(e, overlay.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveOverlayId(overlay.id);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          if (overlay.type !== 'signature') {
                            const newText = prompt('Ubah teks:', overlay.content);
                            if (newText !== null) {
                              updateOverlayText(overlay.id, newText);
                            }
                          }
                        }}
                      >
                        <div className="esign-overlay-content">
                          {overlay.type === 'signature' ? (
                            <img src={overlay.content} className="esign-overlay-img" alt="Tanda Tangan" />
                          ) : (
                            <div className="esign-overlay-text">{overlay.content}</div>
                          )}
                        </div>

                        {/* Control Delete Button */}
                        <div
                          className="esign-overlay-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeOverlay(overlay.id);
                          }}
                          title="Hapus"
                        >
                          <X size={10} />
                        </div>

                        {/* Drag Resize Handle */}
                        <div
                          className="esign-overlay-resize"
                          onMouseDown={(e) => handleResizeMouseDown(e, overlay.id)}
                          title="Ubah Ukuran"
                        />
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SIGNATURE CREATOR MODAL ================= */}
      {isSigModalOpen && (
        <div className="esign-modal-overlay">
          <div className="esign-modal">
            <div className="esign-modal-header">
              <span className="esign-modal-title">Buat Tanda Tangan Baru</span>
              <button className="esign-modal-close" onClick={() => setIsSigModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="esign-modal-tabs">
              <div className={`esign-modal-tab ${sigTab === 'draw' ? 'active' : ''}`} onClick={() => setSigTab('draw')}>
                Gambar
              </div>
              <div className={`esign-modal-tab ${sigTab === 'type' ? 'active' : ''}`} onClick={() => setSigTab('type')}>
                Ketik
              </div>
              <div className={`esign-modal-tab ${sigTab === 'upload' ? 'active' : ''}`} onClick={() => setSigTab('upload')}>
                Upload Gambar
              </div>
            </div>

            <div className="esign-modal-body">
              {/* TAB DRAW */}
              {sigTab === 'draw' && (
                <div>
                  <div className="esign-canvas-container">
                    <canvas
                      ref={drawCanvasRef}
                      className="esign-canvas"
                      width={500}
                      height={200}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>
                  <div className="esign-canvas-controls">
                    {/* Ink Colors */}
                    <div className="esign-color-picker">
                      {['#000000', '#0000ff', '#ff0000'].map(color => (
                        <button
                          key={color}
                          className={`esign-color-btn ${penColor === color ? 'active' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setPenColor(color)}
                        />
                      ))}
                    </div>

                    {/* Pen thickness */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tebal Pen:</span>
                      <select
                        style={{ background: 'var(--bg-glass)', color: 'white', border: '1px solid var(--border-default)', borderRadius: '4px', fontSize: '12px', padding: '2px 4px' }}
                        value={penWidth}
                        onChange={(e) => setPenWidth(Number(e.target.value))}
                      >
                        <option value={1.5}>Tipis</option>
                        <option value={3}>Sedang</option>
                        <option value={5}>Tebal</option>
                      </select>
                    </div>

                    {/* Clear/Undo */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary" onClick={undoDrawCanvas} disabled={strokes.length === 0} style={{ padding: '6px 12px', fontSize: '12px' }}>
                        <RotateCcw size={12} /> Undo
                      </button>
                      <button className="btn btn-secondary" onClick={clearDrawCanvas} disabled={strokes.length === 0} style={{ padding: '6px 12px', fontSize: '12px' }}>
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB TYPE */}
              {sigTab === 'type' && (
                <div>
                  <input
                    type="text"
                    className="esign-type-input"
                    placeholder="Masukkan nama Anda..."
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                  />
                  {typedName && (
                    <div className="esign-font-selector">
                      {[
                        { id: 'font-dancing', label: 'Dancing Script' },
                        { id: 'font-caveat', label: 'Caveat' },
                        { id: 'font-vibes', label: 'Great Vibes' },
                        { id: 'font-pacifico', label: 'Pacifico' }
                      ].map(font => (
                        <div
                          key={font.id}
                          className={`esign-font-option ${font.id} ${selectedFont === font.id ? 'selected' : ''}`}
                          onClick={() => setSelectedFont(font.id)}
                        >
                          {typedName}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="esign-canvas-controls" style={{ marginTop: '16px' }}>
                    <div className="esign-color-picker">
                      {['#000000', '#0000ff', '#ff0000'].map(color => (
                        <button
                          key={color}
                          className={`esign-color-btn ${penColor === color ? 'active' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setPenColor(color)}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pilih tinta warna untuk tulisan</span>
                  </div>
                </div>
              )}

              {/* TAB UPLOAD */}
              {sigTab === 'upload' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <button
                    className="btn btn-secondary btn-lg"
                    onClick={() => sigUploadRef.current.click()}
                    style={{ width: '100%', borderStyle: 'dashed' }}
                  >
                    <Upload size={16} /> Pilih File Tanda Tangan
                  </button>
                  <input
                    type="file"
                    ref={sigUploadRef}
                    onChange={handleSigUpload}
                    accept="image/png,image/jpeg,image/jpg"
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
                    Gunakan file dengan format PNG transparan untuk hasil terbaik.
                  </div>
                </div>
              )}
            </div>

            <div className="esign-modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsSigModalOpen(false)}>
                Batal
              </button>
              {sigTab === 'draw' && (
                <button className="btn btn-primary" onClick={saveDrawnSignature} disabled={strokes.length === 0}>
                  Simpan Tanda Tangan
                </button>
              )}
              {sigTab === 'type' && (
                <button className="btn btn-primary" onClick={saveTypedSignature} disabled={!typedName.trim()}>
                  Simpan Tanda Tangan
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
