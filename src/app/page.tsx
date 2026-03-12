'use client';

import { useState, useEffect } from 'react';
import { Palette, Home, Heart, Sparkles, Upload, Plus, Trash2, ChevronDown } from 'lucide-react';

type Tab = { id: string; name: string; images: string[]; notes: string; subTabs: SubTab[]; linkedTo?: string };
type SubTab = { id: string; name: string; images: string[]; notes: string };
type TrashItem = { id: string; image: string; fromTab: string };

export default function Taste() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'newimages', name: 'New Images', images: [], notes: '', subTabs: [], linkedTo: '' },
    { id: 'discover', name: 'Discover Beauty', images: [], notes: '', subTabs: [], linkedTo: '' },
  ]);
  const [trash, setTrash] = useState<TrashItem[]>([]);
  const [currentTabId, setCurrentTabId] = useState('newimages');
  const [contextMenu, setContextMenu] = useState<{ tabId: string; x: number; y: number } | null>(null);
  const [tempUploads, setTempUploads] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const currentTab = tabs.find(t => t.id === currentTabId) || tabs[0];
  const isTrashTab = currentTabId === 'trash';

  // Load
  useEffect(() => {
    const saved = localStorage.getItem('tasteTabs');
    const savedTrash = localStorage.getItem('tasteTrash');
    if (saved) setTabs(JSON.parse(saved));
    if (savedTrash) setTrash(JSON.parse(savedTrash));
  }, []);

  // Save
  useEffect(() => {
    localStorage.setItem('tasteTabs', JSON.stringify(tabs));
    localStorage.setItem('tasteTrash', JSON.stringify(trash));
  }, [tabs, trash]);

  // Right-click menu
  const handleRightClick = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({ tabId, x: e.clientX, y: e.clientY });
  };

  const closeMenu = () => setContextMenu(null);

  const renameTab = (id: string) => {
    const name = prompt("New name for tab:");
    if (name) setTabs(prev => prev.map(t => t.id === id ? { ...t, name } : t));
    closeMenu();
  };

  const deleteTab = (id: string) => {
    if (!confirm("Delete tab? Images go to Trashbin.")) return;
    const tab = tabs.find(t => t.id === id);
    if (tab) {
      const newTrash = tab.images.map(img => ({ id: Date.now().toString(), image: img, fromTab: tab.name }));
      setTrash(prev => [...prev, ...newTrash]);
      setTabs(prev => prev.filter(t => t.id !== id));
      if (currentTabId === id) setCurrentTabId(tabs[0].id);
    }
    closeMenu();
  };

  const addSubTab = (tabId: string) => {
    const name = prompt("Name for new sub-tab:");
    if (!name) return;
    setTabs(prev => prev.map(t => t.id === tabId 
      ? { ...t, subTabs: [...t.subTabs, { id: Date.now().toString(), name, images: [], notes: '' }] } 
      : t));
    closeMenu();
  };

  const linkTab = (id: string) => {
    const target = prompt("Link this tab to which other tab name? (for future Grok use)");
    if (target) setTabs(prev => prev.map(t => t.id === id ? { ...t, linkedTo: target } : t));
    closeMenu();
  };

  // Upload only in New Images
  const handleFiles = (files: FileList) => {
    if (files.length > 8) alert("Max 8 images at once.");
    const newImages: string[] = [];
    Array.from(files).slice(0, 8).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => newImages.push(ev.target?.result as string);
      reader.readAsDataURL(file);
    });
    setTempUploads(newImages);
  };

  const routeImage = (img: string, targetTabId: string) => {
    setTabs(prev => prev.map(t => t.id === targetTabId 
      ? { ...t, images: [...t.images, img] } 
      : t));
    setTempUploads(prev => prev.filter(i => i !== img));
  };

  const deleteImageToTrash = (image: string) => {
    setTrash(prev => [...prev, { id: Date.now().toString(), image, fromTab: currentTab.name }]);
    setTabs(prev => prev.map(t => t.id === currentTabId 
      ? { ...t, images: t.images.filter(i => i !== image) } 
      : t));
  };

  const restoreFromTrash = (item: TrashItem, targetTabId: string) => {
    setTabs(prev => prev.map(t => t.id === targetTabId 
      ? { ...t, images: [...t.images, item.image] } 
      : t));
    setTrash(prev => prev.filter(i => i.id !== item.id));
  };

  const permanentDelete = (id: string) => {
    if (!confirm("Delete forever?")) return;
    setTrash(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="max-w-[1600px] mx-auto p-12">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <Sparkles className="w-12 h-12 gold-accent" />
          <h1 className="text-6xl font-light tracking-tighter">Taste</h1>
        </div>
        <p className="text-stone-400 text-lg">Right-click tabs to edit • everything saved forever</p>
      </header>

      {/* CUSTOM TABS BAR */}
      <div className="flex gap-2 mb-12 border-b border-white/10 pb-6 flex-wrap">
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => setCurrentTabId(tab.id)}
            onContextMenu={e => handleRightClick(e, tab.id)}
            className={`flex items-center gap-3 px-8 py-4 rounded-3xl transition-all text-lg cursor-pointer ${currentTabId === tab.id ? 'bg-white text-black' : 'hover:bg-white/10'}`}
          >
            {tab.name} {tab.linkedTo && <span className="text-amber-300 text-xs">↔ {tab.linkedTo}</span>}
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

        {/* Clean white-line Trashbin */}
        <button onClick={() => setCurrentTabId('trash')} className={`flex items-center gap-3 px-8 py-4 rounded-3xl text-lg ${currentTabId === 'trash' ? 'bg-zinc-800' : 'hover:bg-white/10'}`}>
          <Trash2 className="w-6 h-6 stroke-white" /> Trashbin ({trash.length})
        </button>
      </div>

      {/* CONTEXT MENU */}
      {contextMenu && (
        <div style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y }} className="glass p-4 rounded-2xl shadow-2xl z-50">
          <button onClick={() => renameTab(contextMenu.tabId)} className="block w-full text-left py-2 hover:bg-white/10 px-4 rounded-xl">Rename</button>
          <button onClick={() => addSubTab(contextMenu.tabId)} className="block w-full text-left py-2 hover:bg-white/10 px-4 rounded-xl">Add sub-tab</button>
          <button onClick={() => linkTab(contextMenu.tabId)} className="block w-full text-left py-2 hover:bg-white/10 px-4 rounded-xl">Link to another tab</button>
          <button onClick={() => deleteTab(contextMenu.tabId)} className="block w-full text-left py-2 text-red-400 hover:bg-white/10 px-4 rounded-xl">Delete tab</button>
          <button onClick={closeMenu} className="block w-full text-left py-2 hover:bg-white/10 px-4 rounded-xl">Cancel</button>
        </div>
      )}

      {/* NEW IMAGES TAB – ONLY drag & drop + routing */}
      {currentTabId !== 'trash' && currentTab.name === 'New Images' && (
        <div className="glass p-10 rounded-3xl">
          <h2 className="text-4xl mb-8">New Images – Drag here then choose destination</h2>
          <div onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
            className={`border-4 border-dashed rounded-3xl py-20 text-center text-2xl transition-all ${isDragging ? 'border-amber-300 bg-amber-300/10' : 'border-white/30 hover:border-white/60'}`}>
            <Upload className="mx-auto mb-6 w-16 h-16" />
            Drag photos here
            <input type="file" accept="image/*" multiple onChange={e => e.target.files && handleFiles(e.target.files)} className="hidden" />
          </div>

          {tempUploads.length > 0 && (
            <div className="mt-12">
              <p className="mb-6 text-xl">Where should these go?</p>
              <div className="grid grid-cols-4 gap-6">
                {tempUploads.map((img, i) => (
                  <div key={i} className="relative rounded-3xl overflow-hidden">
                    <img src={img} className="w-full" />
                    <select onChange={e => routeImage(img, e.target.value)} className="absolute bottom-4 left-4 right-4 glass py-3 rounded-2xl">
                      <option value="">Choose destination...</option>
                      {tabs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* NORMAL TAB VIEW */}
      {currentTabId !== 'trash' && currentTab.name !== 'New Images' && (
        <div className="glass p-10 rounded-3xl">
          <h2 className="text-4xl mb-4">{currentTab.name}</h2>
          
          {/* Notes */}
          <textarea 
            value={currentTab.notes} 
            onChange={e => setTabs(prev => prev.map(t => t.id === currentTabId ? {...t, notes: e.target.value} : t))}
            placeholder="Write your thoughts here..." 
            className="w-full glass p-6 rounded-2xl h-32 mb-8 text-lg"
          />

          {/* Sub-tabs */}
          {currentTab.subTabs.length > 0 && (
            <div className="mb-8 flex gap-3 flex-wrap">
              {currentTab.subTabs.map(st => (
                <div key={st.id} className="glass px-6 py-3 rounded-2xl text-lg cursor-pointer" onClick={() => alert(`Sub-tab ${st.name} – coming in next update`)}>
                  {st.name}
                </div>
              ))}
            </div>
          )}

          {/* Images */}
          {currentTab.images.length > 0 && (
            <div className="grid grid-cols-4 gap-8">
              {currentTab.images.map((img, i) => (
                <div key={i} className="relative rounded-3xl overflow-hidden group">
                  <img src={img} className="w-full" />
                  <button onClick={() => deleteImageToTrash(img)} className="absolute top-4 right-4 bg-black/70 p-3 rounded-full opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-6 h-6 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TRASHBIN */}
      {isTrashTab && (
        <div className="glass p-10 rounded-3xl">
          <h2 className="text-4xl mb-8">Trashbin ({trash.length})</h2>
          <div className="grid grid-cols-4 gap-8">
            {trash.map(item => (
              <div key={item.id} className="relative rounded-3xl overflow-hidden">
                <img src={item.image} className="w-full" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-4 flex gap-3">
                  <select onChange={e => restoreFromTrash(item, e.target.value)} className="flex-1 glass py-3 rounded-2xl">
                    <option value="">Restore to...</option>
                    {tabs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <button onClick={() => permanentDelete(item.id)} className="bg-red-600 px-6 py-3 rounded-2xl">Delete forever</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
