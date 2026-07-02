import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Eraser, 
  Maximize,
  Maximize2,
  FileImage, 
  Palette,
  Wand2,
  Sparkles,
  Menu,
  X,
  PenTool,
  FileDown,
  Merge,
  FileText,
  FileCheck,
  Images
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  {
    section: 'Menu',
    items: [
      { path: '/', label: 'Home', icon: Home },
    ]
  },
  {
    section: 'Image Tools',
    items: [
      { path: '/remove-bg', label: 'Remove Background', icon: Eraser },
      { path: '/resize', label: 'Resize Image', icon: Maximize },
      { path: '/convert', label: 'Convert Format', icon: FileImage },
      { path: '/change-bg', label: 'Change BG Color', icon: Palette },
      { path: '/upscale', label: 'AI Upscaler', icon: Maximize2 },
      { path: '/enhance', label: 'Enhance Image', icon: Wand2 },
    ]
  },
  {
    section: 'Document Tools',
    items: [
      { path: '/esign', label: 'E-Sign Document', icon: PenTool },
      { path: '/compress-pdf', label: 'Compress PDF', icon: FileDown },
      { path: '/merge-split-pdf', label: 'Merge & Split PDF', icon: Merge },
      { path: '/office-to-pdf', label: 'Office to PDF', icon: FileCheck },
      { path: '/pdf-to-word', label: 'PDF to Word', icon: FileText },
      { path: '/extract-pdf-images', label: 'Extract PDF to Image', icon: Images },
    ]
  }
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const toggleMobile = () => setMobileOpen(!mobileOpen);
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile: top header with hamburger */}
      <div className="mobile-header">
        <button className="btn btn-ghost mobile-menu-btn" onClick={toggleMobile} id="mobile-menu-toggle">
          <Menu size={22} />
        </button>
        <div className="sidebar-logo">
          <Sparkles size={18} color="white" />
        </div>
        <span className="sidebar-title">Magic Tools</span>
      </div>

      {/* Mobile overlay */}
      <div 
        className={`mobile-overlay ${mobileOpen ? 'visible' : ''}`} 
        onClick={closeMobile}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`} id="sidebar-nav">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Sparkles size={18} color="white" />
          </div>
          <span className="sidebar-title">Magic Tools</span>
          {/* Close on mobile */}
          <button 
            className="btn btn-ghost" 
            onClick={closeMobile} 
            style={{ marginLeft: 'auto', display: 'none' }}
            id="sidebar-close"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((section, sIdx) => (
            <div key={sIdx}>
              <div className="nav-section-label">{section.section}</div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={closeMobile}
                    id={`nav-${item.path.replace('/', '') || 'home'}`}
                  >
                    <Icon size={20} className="nav-item-icon" />
                    <span className="nav-item-text">{item.label}</span>
                    {item.badge && (
                      <span className="nav-item-badge">{item.badge}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-footer-text">Magic Tools v1.0</p>
        </div>
      </aside>
    </>
  );
}
