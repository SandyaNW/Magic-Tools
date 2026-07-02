import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Eraser,
  Paintbrush,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Check,
  X,
  Download,
  RotateCcw,
} from 'lucide-react';
import '../styles/editor.css';

const MAX_HISTORY = 30;

export default function MaskEditor({ originalImageUrl, resultImageUrl, onApply, onCancel }) {
  const canvasRef = useRef(null);
  const originalCanvasRef = useRef(null); // hidden canvas holding the original (pre-AI) image
  const containerRef = useRef(null);

  const [tool, setTool] = useState('eraser'); // 'eraser' | 'restore'
  const [brushSize, setBrushSize] = useState(20);
  const [zoom, setZoom] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [showCursor, setShowCursor] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  // Load images and set up canvases
  useEffect(() => {
    const resultImg = new Image();
    resultImg.crossOrigin = 'anonymous';
    resultImg.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Size canvas to image
      canvas.width = resultImg.width;
      canvas.height = resultImg.height;
      setCanvasSize({ w: resultImg.width, h: resultImg.height });

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(resultImg, 0, 0);

      // Save initial state
      const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialData]);
      setHistoryIndex(0);
    };
    resultImg.src = resultImageUrl;

    // Load original image into hidden canvas for restore brush
    if (originalImageUrl) {
      const origImg = new Image();
      origImg.crossOrigin = 'anonymous';
      origImg.onload = () => {
        const oCanvas = originalCanvasRef.current;
        if (!oCanvas) return;
        oCanvas.width = origImg.width;
        oCanvas.height = origImg.height;
        const ctx = oCanvas.getContext('2d');
        ctx.drawImage(origImg, 0, 0);
      };
      origImg.src = originalImageUrl;
    }
  }, [resultImageUrl, originalImageUrl]);

  // --- Drawing ---
  const getCanvasCoords = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const drawBrush = useCallback((x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (tool === 'restore') {
      // Copy pixels from original image
      const oCanvas = originalCanvasRef.current;
      if (!oCanvas) return;
      const oCtx = oCanvas.getContext('2d');

      const radius = brushSize / 2;
      const sx = Math.max(0, Math.floor(x - radius));
      const sy = Math.max(0, Math.floor(y - radius));
      const sw = Math.min(oCanvas.width - sx, Math.ceil(brushSize));
      const sh = Math.min(oCanvas.height - sy, Math.ceil(brushSize));

      if (sw <= 0 || sh <= 0) return;

      // Use a temp canvas to create a circular clip
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');

      // Draw circular mask
      tempCtx.beginPath();
      tempCtx.arc(x, y, radius, 0, Math.PI * 2);
      tempCtx.clip();

      // Draw original image pixels into the clipped area
      tempCtx.drawImage(oCanvas, 0, 0);

      // Composite onto main canvas
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(tempCanvas, 0, 0);
    }
  }, [tool, brushSize]);

  const lastPosRef = useRef(null);

  const interpolateDraw = useCallback((fromX, fromY, toX, toY) => {
    const dist = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
    const step = Math.max(1, brushSize / 6);
    const steps = Math.ceil(dist / step);

    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const ix = fromX + (toX - fromX) * t;
      const iy = fromY + (toY - fromY) * t;
      drawBrush(ix, iy);
    }
  }, [drawBrush, brushSize]);

  const startDraw = useCallback((e) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCanvasCoords(e);
    lastPosRef.current = { x, y };
    drawBrush(x, y);
  }, [getCanvasCoords, drawBrush]);

  const moveDraw = useCallback((e) => {
    e.preventDefault();

    // Update cursor position
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setCursorPos({ x: clientX, y: clientY });

    if (!isDrawing) return;
    const { x, y } = getCanvasCoords(e);

    if (lastPosRef.current) {
      interpolateDraw(lastPosRef.current.x, lastPosRef.current.y, x, y);
    } else {
      drawBrush(x, y);
    }
    lastPosRef.current = { x, y };
  }, [isDrawing, getCanvasCoords, drawBrush, interpolateDraw]);

  const endDraw = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPosRef.current = null;

    // Save to history
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(imageData);
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [isDrawing, historyIndex]);

  // --- Undo / Redo ---
  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(history[newIndex], 0, 0);
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(history[newIndex], 0, 0);
  }, [historyIndex, history]);

  // --- Zoom ---
  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 4));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.25));
  const zoomReset = () => setZoom(1);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handle = (e) => {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
      if (e.key === 'e' || e.key === 'E') setTool('eraser');
      if (e.key === 'r' || e.key === 'R') setTool('restore');
      if (e.key === '[') setBrushSize((s) => Math.max(2, s - 2));
      if (e.key === ']') setBrushSize((s) => Math.min(80, s + 2));
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [undo, redo]);

  // --- Apply (export) ---
  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      onApply(url);
    }, 'image/png');
  };

  // --- Download ---
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'edited_result.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  // Calculate display size to fit in container
  const getDisplayStyle = () => {
    const container = containerRef.current;
    if (!container || !canvasSize.w) return {};

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const padding = 40;
    const maxW = cw - padding;
    const maxH = ch - padding;

    let displayW = canvasSize.w;
    let displayH = canvasSize.h;

    const scaleToFit = Math.min(maxW / displayW, maxH / displayH, 1);
    displayW *= scaleToFit;
    displayH *= scaleToFit;

    return {
      width: displayW,
      height: displayH,
      transform: `scale(${zoom})`,
      transformOrigin: 'center center',
    };
  };

  return (
    <div className="editor-modal-overlay">
      {/* Header */}
      <div className="editor-header">
        <div className="editor-header-left">
          <Paintbrush size={18} color="var(--accent-1)" />
          <span className="editor-header-title">Mask Editor</span>
        </div>
        <div className="editor-header-right">
          <button className="btn btn-ghost" onClick={handleDownload} id="editor-download">
            <Download size={16} />
          </button>
          <button className="btn btn-secondary" onClick={onCancel} id="editor-cancel">
            <X size={16} /> Batal
          </button>
          <button className="btn btn-primary" onClick={handleApply} id="editor-apply">
            <Check size={16} /> Terapkan
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="editor-toolbar">
        {/* Tool buttons */}
        <div className="toolbar-group">
          <button
            className={`toolbar-btn ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool('eraser')}
            id="tool-eraser"
          >
            <Eraser size={18} />
            <span className="tooltip">Hapus (E)</span>
          </button>
          <button
            className={`toolbar-btn ${tool === 'restore' ? 'active' : ''}`}
            onClick={() => setTool('restore')}
            id="tool-restore"
          >
            <Paintbrush size={18} />
            <span className="tooltip">Kembalikan (R)</span>
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Brush size */}
        <div className="brush-size-control">
          <span className="brush-size-label">Brush</span>
          <input
            type="range"
            className="brush-slider"
            min="2"
            max="80"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            id="brush-size-slider"
          />
          <span className="brush-size-value">{brushSize}px</span>
        </div>

        <div className="toolbar-divider" />

        {/* Undo / Redo */}
        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            onClick={undo}
            disabled={historyIndex <= 0}
            id="btn-undo"
          >
            <Undo2 size={18} />
            <span className="tooltip">Undo (Ctrl+Z)</span>
          </button>
          <button
            className="toolbar-btn"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            id="btn-redo"
          >
            <Redo2 size={18} />
            <span className="tooltip">Redo (Ctrl+Y)</span>
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Zoom */}
        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={zoomOut} id="btn-zoom-out">
            <ZoomOut size={18} />
            <span className="tooltip">Zoom Out</span>
          </button>
          <button className="toolbar-btn" onClick={zoomReset} id="btn-zoom-reset">
            <RotateCcw size={14} />
            <span className="tooltip">Reset Zoom</span>
          </button>
          <button className="toolbar-btn" onClick={zoomIn} id="btn-zoom-in">
            <ZoomIn size={18} />
            <span className="tooltip">Zoom In</span>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        className="editor-canvas-area"
        ref={containerRef}
        onMouseEnter={() => setShowCursor(true)}
        onMouseLeave={() => { setShowCursor(false); setIsDrawing(false); lastPosRef.current = null; }}
      >
        <div className="editor-canvas-wrapper" style={getDisplayStyle()}>
          <canvas
            ref={canvasRef}
            onMouseDown={startDraw}
            onMouseMove={moveDraw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={moveDraw}
            onTouchEnd={endDraw}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Zoom badge */}
        <div className="zoom-badge">{Math.round(zoom * 100)}%</div>
      </div>

      {/* Hidden canvas for original image */}
      <canvas ref={originalCanvasRef} style={{ display: 'none' }} />

      {/* Custom cursor */}
      {showCursor && (
        <div
          className="brush-cursor"
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            width: brushSize * zoom,
            height: brushSize * zoom,
            borderColor: tool === 'eraser'
              ? 'rgba(239, 68, 68, 0.7)'
              : 'rgba(34, 197, 94, 0.7)',
          }}
        />
      )}
    </div>
  );
}
