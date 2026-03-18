'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Upload, Plus, Trash2 } from 'lucide-react';

type ImageItem = { url: string; tags: string[] };

type Tab = { 
  id: string; 
  name: string; 
  images: ImageItem[]; 
  notes: string; 
  subTabs: SubTab[]; 
};

type SubTab = { 
  id: string; 
  name: string; 
  images: ImageItem[]; 
  notes: string; 
};

export default function Taste() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'nyebilder', name: 'Nye bilder', images: [], notes: '', subTabs: [] },
    { id: 'discover', name: 'Discover Beauty', images: [], notes: '', subTabs: [] },
  ]);
  const [currentTabId, setCurrentTabId] = useState('nyebilder');
  const [contextMenu, setContextMenu] = useState<{ id: string; type: 'tab' | 'subtab'; parentId?: string; x: number; y: number } | null>(null);
  const [tempUploads, setTempUploads] = useState<string[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [newTag, setNewTag] = useState('');

  const currentTab = tabs.find(t => t.id === currentTabId) || tabs[0];

  // Load & save
  useEffect(() => {
    const saved = localStorage.getItem('tasteTabs');
    if (saved) setTabs(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('tasteTabs', JSON.stringify(tabs));
  }, [tabs]);

  // Paste listener
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
        if (newImages.length > 0) setTempUploads(newImages);
      }, 50);
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [currentTabId]);

  // Right-click handler
  const handleRightClick = (e: React.MouseEvent, id: string, type: 'tab' | 'subtab', parentId?: string) => {
    e.preventDefault();
    if (id === 'nyebilder') return;
    setContextMenu({ id, type, parentId, x: e.clientX, y: e.clientY });
  };

  const renameItem = (id: string, type: 'tab' | 'subtab', parentId?: string) => {
    const name = prompt("New name:");
    if (!name) return;
    if (type === 'tab') {
      setTabs(prev => prev.map(t => t.id === id ? { ...t, name } : t));
    } else if (parentId) {
      setTabs(prev => prev.map(t => t.id === parentId 
        ? { ...t, subTabs: t.subTabs.map(st => st.id === id ? { ...st, name } : st) } 
        : t));
    }
    setContextMenu(null);
  };

  const deleteItem = (id: string, type: 'tab' | 'subtab', parentId?: string) => {
    if (id === 'nyebilder') {
      alert("Nye bilder cannot be deleted.");
      setContextMenu(null);
      return;
    }
    if (!confirm("Delete?")) return;
    if (type === 'tab') {
      const tab = tabs.find(t => t.id === id);
      if (tab) {
        const newTrash = tab.images.map(img => ({ id: Date.now().toString(), image: img.url, fromTab: tab.name }));
        // Trashbin not implemented yet, but you can add it
        setTabs(prev => prev.filter(t => t.id !== id));
      }
    } else if (parentId) {
      setTabs(prev => prev.map(t => t.id === parentId 
        ? { ...t, subTabs: t.subTabs.filter(st => st.id !== id) } 
        : t));
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

  const routeImage = (img: string) => {
    if (!selectedDestination) {
      alert("Choose a destination first");
      return;
    }
    const tags = newTag.trim() ? [newTag.trim()] : [];
    setTabs(prev => prev.map(t => {
      if (t.id === selectedDestination) {
        return { ...t, images: [...t.images, { url: img, tags }] };
      }
      const updatedSubTabs = t.subTabs.map(st => {
        if (st.id === selectedDestination) {
          return { ...st, images: [...st.images, { url: img, tags }] };
        }
        return st;
      });
      return { ...t, subTabs: updatedSubTabs };
    }));
    setTempUploads(prev => prev.filter(i => i !== img));
    setNewTag('');
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
            onClick={() => setCurrentTabId(tab.id)}
            onContextMenu={e => handleRightClick(e, tab.id, 'tab')}
            className={`flex items-center gap-3 px-8 py-4 rounded-3xl text-lg cursor-pointer ${currentTabId === tab.id ? 'bg-white text-black' : 'hover:bg-white/10'}`}
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
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y }} className="glass p-4 rounded-2xl z-50">
          <button onClick={() => rename(contextMenu.id, contextMenu.type, contextMenu.parentId)} className="block w-full text-left py-2 hover:bg-white/10 px-4">Rename</button>
          <button onClick={() => addSubTab(contextMenu.id)} className="block w-full text-left py-2 hover:bg-white/10 px-4">Add sub-tab</button>
          <button onClick={() => deleteItem(contextMenu.id, contextMenu.type, contextMenu.parentId)} className="block w-full text-left py-2 text-red-400 hover:bg-white/10 px-4">Delete</button>
          <button onClick={() => setContextMenu(null)} className="block w-full text-left py-2 hover:bg-white/10 px-4">Cancel</button>
        </div>
      )}

      {/* Nye bilder */}
      {currentTabId !== 'trash' && currentTab.name === 'Nye bilder' && (
        <div className="glass p-12 rounded-3xl">
          <h2 className="text-4xl mb-8">Nye bilder – Paste images here (Ctrl+V)</h2>
          <div className="border-4 border-dashed border-white/30 rounded-3xl py-20 text-center text-2xl">
            Paste images here (Ctrl+V)
          </div>

          {tempUploads.length > 0 && (
            <div className="mt-12">
              <p className="text-xl mb-6">Route these images + add tag (optional)</p>
              <div className="grid grid-cols-4 gap-8">
                {tempUploads.map((img, i) => (
                  <div key={i} className="relative rounded-3xl overflow-hidden">
                    <img src={img} className="w-full" />
                    <select 
                      value={selectedDestination}
                      onChange={e => setSelectedDestination(e.target.value)} 
                      className="absolute bottom-4 left-4 right-4 glass py-4 rounded-2xl text-lg"
                    >
                      <option value="">Choose destination...</option>
                      {tabs.map(t => (
                        <>
                          <option key={t.id} value={t.id}>{t.name} (main)</option>
                          {t.subTabs.map(st => (
                            <option key={st.id} value={st.id}>  ↳ {st.name}</option>
                          ))}
                        </>
                      ))}
                    </select>
                    <input 
                      type="text" 
                      placeholder="tag (e.g. warm)" 
                      value={newTag} 
                      onChange={e => setNewTag(e.target.value)} 
                      className="absolute top-4 left-4 glass px-3 py-1 rounded text-sm w-48"
                    />
                    <button onClick={() => routeImage(img)} className="absolute bottom-4 right-4 bg-white text-black px-6 py-2 rounded-2xl">Send</button>
                    <button onClick={() => setTempUploads(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-4 right-4 bg-black/70 p-2 rounded-full text-red-400">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Other tabs & sub-tabs */}
      {currentTabId !== 'trash' && currentTab.name !== 'Nye bilder' && (
        <div className="glass p-12 rounded-3xl">
          <h2 className="text-4xl mb-6">{currentTab.name}</h2>

          {currentTab.subTabs.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-3">
              {currentTab.subTabs.map(st => (
                <button 
                  key={st.id} 
                  onClick={() => setCurrentTabId(st.id)}
                  onContextMenu={e => handleRightClick(e, st.id, 'subtab', currentTabId)}
                  className="px-6 py-3 rounded-2xl text-lg cursor-pointer glass hover:bg-white/10"
                >
                  ↳ {st.name}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-4 gap-8">
            {currentTab.images.map((imgObj, i) => (
              <div key={i} className="relative rounded-3xl overflow-hidden">
                <img src={imgObj.url} className="w-full" />
                <div className="absolute bottom-2 left-2 text-xs bg-black/70 px-2 py-1 rounded">
                  {imgObj.tags.join(' • ') || 'no tag'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
