'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Plus, Trash2, Sparkles } from 'lucide-react';

type Tab = { 
  id: string; 
  name: string; 
  images: string[]; 
  notes: string; 
  subTabs: SubTab[]; 
};

type SubTab = { 
  id: string; 
  name: string; 
  images: string[]; 
  notes: string; 
};

type TrashItem = { id: string; image: string; fromTab: string };

export default function Taste() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'nyebilder', name: 'Nye bilder', images: [], notes: '', subTabs: [] },
    { id: 'discover', name: 'Discover Beauty', images: [], notes: '', subTabs: [] },
  ]);
  const [trash, setTrash] = useState<TrashItem[]>([]);
  const [currentTabId, setCurrentTabId] = useState('nyebilder');
  const [contextMenu, setContextMenu] = useState<{ tabId: string; x: number; y: number } | null>(null);
  const [imageContext, setImageContext] = useState<{ image: string; x: number; y: number } | null>(null);
  const [tempUploads, setTempUploads] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const nyeBilderRef = useRef<HTMLDivElement>(null);

  const currentTab = tabs.find(t => t.id === currentTabId) || tabs[0];

  // Load & save
  useEffect(() => {
    const saved = localStorage.getItem('tasteTabs');
    const savedTrash = localStorage.getItem('tasteTrash');
    if (saved) setTabs(JSON.parse(saved));
    if (savedTrash) setTrash(JSON.parse(savedTrash));
  }, []);

  useEffect(() => {
    localStorage.setItem('tasteTabs', JSON.stringify(tabs));
    localStorage.setItem('tasteTrash', JSON.stringify(trash));
  }, [tabs, trash]);

  // Paste listener on Nye bilder div
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (currentTabId !== 'nyebilder') return;
      e.preventDefault();
      const items = e.clipboardData?.items || [];
      const newImages: string[] = [];

      Array.from(items).forEach(item => {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = ev => {
              if (ev.target?.result) newImages.push(ev.target.result as string);
            };
            reader.readAsDataURL(blob);
          }
        }
      });

      setTimeout(() => {
        if (newImages.length > 0) {
          setTempUploads(prev => [...prev, ...newImages]);
        }
      }, 50);
    };

    const ref = nyeBilderRef.current;
    if (ref) ref.addEventListener('paste', handlePaste);
    return () => {
      if (ref) ref.removeEventListener('paste', handlePaste);
    };
  }, [currentTabId]);

  // Right-click on tabs
  const handleRightClick = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    if (tabId === 'nyebilder') return;
    setContextMenu({ tabId, x: e.clientX, y: e.clientY });
  };

  // Right-click on images – copy to clipboard
  const handleImageRightClick = (e: React.MouseEvent, image: string) => {
    e.preventDefault();
    setImageContext({ image, x: e.clientX, y: e.clientY });
  };

  const copyImageToClipboard = (image: string) => {
    navigator.clipboard.writeText(image);
    alert("Image copied to clipboard! Paste it back into Nye bilder (Ctrl+V) or anywhere.");
    setImageContext(null);
  };

  const renameTab = (id: string) => {
    const name = prompt("New name:");
    if (name) setTabs(prev => prev.map(t => t.id === id ? { ...t, name } : t));
    setContextMenu(null);
  };

  const deleteTab = (id: string) => {
    if (id === 'nyebilder') {
      alert("Nye bilder cannot be deleted.");
      setContextMenu(null);
      return;
    }
    if (!confirm("Delete tab? Images go to Trashbin.")) return;
    const tab = tabs.find(t => t.id === id);
    if (tab) {
      const newTrash = tab.images.map(img => ({ id: Date.now().toString(), image: img, fromTab: tab.name }));
      setTrash(prev => [...prev, ...newTrash]);
      setTabs(prev => prev.filter(t => t.id !== id));
    }
    setContextMenu(null);
  };

  const addSubTab = (tabId: string) => {
    const name = prompt("Sub-tab name:");
    if (name) setTabs(prev => prev.map(t => t.id === tabId 
      ? { ...t, subTabs: [...t.subTabs, { id: Date.now().toString(), name, images: [], notes: '' }] } 
      : t));
    setContextMenu(null);
  };

  // Drag reorder tabs
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const handleTabDrop = (targetId: string) => {
    if (!draggedTabId || draggedTabId === targetId) return;
    setTabs(prev => {
      const from = prev.findIndex(t => t.id === draggedTabId);
      const to = prev.findIndex(t => t.id === targetId);
      const newTabs = [...prev];
      const [moved] = newTabs.splice(from, 1);
      newTabs.splice(to, 0, moved);
      return newTabs;
    });
    setDraggedTabId(null);
  };

  // Drag & drop files for Nye bilder
  const handleFiles = (files: FileList) => {
    const newImages: string[] = [];
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) newImages.push(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    });
    setTempUploads(newImages);
  };

  const routeImage = (img: string, targetId: string) => {
    setTabs(prev => prev.map(t => t.id === targetId ? { ...t, images: [...t.images, img] } : t));
    setTempUploads(prev => prev.filter(i => i !== img));
  };

  const deleteImageToTrash = (image: string) => {
    setTrash(prev => [...prev, { id: Date.now().toString(), image, fromTab: currentTab.name }]);
    setTabs(prev => prev.map(t => t.id === currentTabId ? { ...t, images: t.images.filter(i => i !== image) } : t));
  };

  const restoreFromTrash = (item: TrashItem, targetTabId: string) => {
    setTabs(prev => prev.map(t => t.id === targetTabId ? { ...t, images: [...t.images, item.image] } : t));
    setTrash(prev => prev.filter(i => i.id !== item.id));
  };

  return (
    <div className="max-w-[1600px] mx-auto p-12">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <Sparkles className="w-12 h-12 gold-accent" />
          <h1 className="text-6xl font-light tracking-tighter">Taste</h1>
        </div>
      </header>

      {/* Tabs bar */}
      <div className="flex gap-2 mb-12 border-b border-white/10 pb-6 flex-wrap">
        {tabs.map(tab => (
          <div
            key={tab.id}
            draggable
            onDragStart={() => setDraggedTabId(tab.id)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleTabDrop(tab.id)}
            onClick={() => setCurrentTabId(tab.id)}
            onContextMenu={e => handleRightClick(e, tab.id)}
            className={`flex items-center gap-3 px-8 py-4 rounded-3xl text-lg cursor-grab ${currentTabId === tab.id ? 'bg-white text-black' : 'hover:bg-white/10'}`}
          >
            {tab.name}
          </div>
        ))}

        <button onClick={() => {
          const name = prompt("New tab name:");
          if (name) {
            const newTab = { id: Date.now().toString(), name, images: [], notes: '', subTabs: [] };
            setTabs([...tabs, newTab]);
            setCurrentTabId(newTab.id);
          }
        }} className="flex items-center gap-2 px-6 py-4 rounded-3xl hover:bg-white/10 text-lg">
          <Plus className="w-6 h-6" /> New Tab
        </button>

        <button onClick={() => setCurrentTabId('trash')} className="flex items-center gap-3 px-8 py-4 rounded-3xl text-lg hover:bg-white/10">
          <Trash2 className="w-6 h-6 stroke-white" /> Trashbin ({trash.length})
        </button>
      </div>

      {/* Context menu for tabs */}
      {contextMenu && (
        <div style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y }} className="glass p-4 rounded-2xl z-50">
          <button onClick={() => renameTab(contextMenu.tabId)} className="block w-full text-left py-2 hover:bg-white/10 px-4">Rename</button>
          <button onClick={() => addSubTab(contextMenu.tabId)} className="block w-full text-left py-2 hover:bg-white/10 px-4">Add sub-tab</button>
          <button onClick={() => deleteTab(contextMenu.tabId)} className="block w-full text-left py-2 text-red-400 hover:bg-white/10 px-4">Delete tab</button>
          <button onClick={() => setContextMenu(null)} className="block w-full text-left py-2 hover:bg-white/10 px-4">Cancel</button>
        </div>
      )}

      {/* Context menu for images */}
      {imageContext && (
        <div style={{ position: 'fixed', left: imageContext.x, top: imageContext.y }} className="glass p-4 rounded-2xl z-50">
          <button onClick={() => copyImageToClipboard(imageContext.image)} className="block w-full text-left py-2 hover:bg-white/10 px-4">Copy image</button>
          <button onClick={() => setImageContext(null)} className="block w-full text-left py-2 hover:bg-white/10 px-4">Cancel</button>
        </div>
      )}

      {/* Nye bilder – ONLY this has upload UI */}
      {currentTabId !== 'trash' && currentTab.name === 'Nye bilder' && (
        <div className="glass p-12 rounded-3xl" ref={nyeBilderRef} tabIndex={0}>
          <h2 className="text-4xl mb-8">Nye bilder – Drag or Ctrl+V here</h2>
          
          <div 
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragEnter={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { 
              e.preventDefault(); 
              setIsDragging(false); 
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFiles(e.dataTransfer.files);
              }
            }}
            className={`border-4 border-dashed rounded-3xl py-24 text-center text-2xl transition-all ${isDragging ? 'border-amber-300 bg-amber-300/10' : 'border-white/30 hover:border-white/60'}`}
          >
            <Upload className="mx-auto mb-6 w-16 h-16" />
            Drag photos or Ctrl+V to paste
          </div>

          {tempUploads.length > 0 && (
            <div className="mt-12">
              <p className="text-xl mb-6">Where should these {tempUploads.length} images go?</p>
              <div className="grid grid-cols-4 gap-8">
                {tempUploads.map((img, i) => (
                  <div key={i} className="relative rounded-3xl overflow-hidden" onContextMenu={e => handleImageRightClick(e, img)}>
                    <img src={img} className="w-full" />
                    <select 
                      onChange={e => routeImage(img, e.target.value)} 
                      className="absolute bottom-4 left-4 right-4 glass py-4 rounded-2xl text-lg"
                    >
                      <option value="">Choose destination...</option>
                      {tabs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <button onClick={() => setTempUploads(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-4 right-4 bg-black/70 p-2 rounded-full text-red-400">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* All other tabs and sub-tabs – images only */}
      {currentTabId !== 'trash' && currentTab.name !== 'Nye bilder' && (
        <div className="glass p-12 rounded-3xl">
          <h2 className="text-4xl mb-6">{currentTab.name}</h2>

          {currentTab.subTabs.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-3">
              {currentTab.subTabs.map(st => (
                <div 
                  key={st.id} 
                  className={`px-6 py-3 rounded-2xl text-lg cursor-pointer ${currentTabId === st.id ? 'bg-white text-black' : 'glass hover:bg-white/10'}`}
                  onClick={() => setCurrentTabId(st.id)}
                >
                  ↳ {st.name}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-4 gap-8">
            {currentTab.images.map((img, i) => (
              <div key={i} className="relative rounded-3xl overflow-hidden group" onContextMenu={e => handleImageRightClick(e, img)}>
                <img src={img} className="w-full" />
                <button onClick={() => deleteImageToTrash(img)} className="absolute top-4 right-4 bg-black/70 p-3 rounded-full opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trashbin */}
      {currentTabId === 'trash' && (
        <div className="glass p-12 rounded-3xl">
          <h2 className="text-4xl mb-8">Trashbin ({trash.length})</h2>
          <div className="grid grid-cols-4 gap-8">
            {trash.map(item => (
              <div key={item.id} className="relative rounded-3xl overflow-hidden">
                <img src={item.image} className="w-full" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-4 flex gap-3">
                  <select 
                    onChange={e => { if (e.target.value) restoreFromTrash(item, e.target.value); }} 
                    className="flex-1 glass py-3 rounded-2xl"
                  >
                    <option value="">Restore to...</option>
                    {tabs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <button 
                    onClick={() => { if (confirm("Delete forever?")) setTrash(prev => prev.filter(i => i.id !== item.id)); }} 
                    className="bg-red-600 px-6 py-3 rounded-2xl"
                  >
                    Delete forever
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
