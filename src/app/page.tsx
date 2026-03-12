'use client';

import { useState, useEffect } from 'react';
import { Palette, Home, Heart, Sparkles, Upload, Plus, Trash2, ArrowRight, ChevronDown } from 'lucide-react';

type Tab = { id: string; name: string; images: string[]; subTabs: SubTab[] };
type SubTab = { id: string; name: string; images: string[] };
type TrashItem = { id: string; image: string; fromTab: string };

export default function Taste() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'newimages', name: 'New Images', images: [], subTabs: [] },
    { id: 'discover', name: 'Discover Beauty', images: [], subTabs: [] },
  ]);
  const [trash, setTrash] = useState<TrashItem[]>([]);
  const [currentTabId, setCurrentTabId] = useState('newimages');
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [tempUploads, setTempUploads] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const currentTab = tabs.find(t => t.id === currentTabId) || tabs[0];
  const isTrashTab = currentTabId === 'trash';

  // Load from browser
  useEffect(() => {
    const savedTabs = localStorage.getItem('tasteTabs');
    const savedTrash = localStorage.getItem('tasteTrash');
    if (savedTabs) setTabs(JSON.parse(savedTabs));
    if (savedTrash) setTrash(JSON.parse(savedTrash));
  }, []);

  // Auto-save
  useEffect(() => {
    localStorage.setItem('tasteTabs', JSON.stringify(tabs));
    localStorage.setItem('tasteTrash', JSON.stringify(trash));
  }, [tabs, trash]);

  // === DRAG & DROP FOR TABS (reorder) ===
  const handleTabDragStart = (id: string) => setDraggedTabId(id);
  const handleTabDrop = (targetId: string) => {
    if (!draggedTabId || draggedTabId === targetId) return;
    setTabs(prev => {
      const fromIndex = prev.findIndex(t => t.id === draggedTabId);
      const toIndex = prev.findIndex(t => t.id === targetId);
      const newTabs = [...prev];
      const [moved] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, moved);
      return newTabs;
    });
    setDraggedTabId(null);
  };

  // === NEW TAB ===
  const createNewTab = () => {
    const name = prompt("Name your new tab (e.g. Architecture Moodboard):");
    if (!name) return;
    const newTab: Tab = { id: Date.now().toString(), name, images: [], subTabs: [] };
    setTabs([...tabs, newTab]);
    setCurrentTabId(newTab.id);
  };

  // === DELETE TAB ===
  const deleteTab = (id: string) => {
    if (!confirm("Delete this tab? All images will go to Trashbin.")) return;
    const tabToDelete = tabs.find(t => t.id === id);
    if (tabToDelete) {
      const newTrash = tabToDelete.images.map(img => ({ id: Date.now().toString() + Math.random(), image: img, fromTab: tabToDelete.name }));
      setTrash(prev => [...prev, ...newTrash]);
      setTabs(prev => prev.filter(t => t.id !== id));
      if (currentTabId === id) setCurrentTabId(tabs[0].id);
    }
  };

  // === SAFE UPLOAD (max 8 + warning) ===
  const handleFiles = (files: FileList) => {
    if (files.length > 8) alert("⚠️ Max 8 images at once.\nOnly the first 8 were added.");
    const toProcess = Array.from(files).slice(0, 8);
    const newImages: string[] = [];
    toProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => newImages.push(ev.target?.result as string);
      reader.readAsDataURL(file);
    });
    setTempUploads(newImages);
  };

  // === SEND TEMP IMAGES TO CURRENT TAB ===
  const sendTempToTab = () => {
    if (!currentTab || tempUploads.length === 0) return;
    setTabs(prev => prev.map(t => 
      t.id === currentTabId ? { ...t, images: [...t.images, ...tempUploads] } : t
    ));
    setTempUploads([]);
  };

  // === DELETE IMAGE TO TRASH ===
  const deleteImageToTrash = (image: string) => {
    setTrash(prev => [...prev, { id: Date.now().toString(), image, fromTab: currentTab.name }]);
    setTabs(prev => prev.map(t => 
      t.id === currentTabId ? { ...t, images: t.images.filter(i => i !== image) } : t
    ));
  };

  // === RESTORE FROM TRASH ===
  const restoreFromTrash = (trashItem: TrashItem, targetTabId: string) => {
    setTabs(prev => prev.map(t => 
      t.id === targetTabId ? { ...t, images: [...t.images, trashItem.image] } : t
    ));
    setTrash(prev => prev.filter(item => item.id !== trashItem.id));
  };

  // === PERMANENT DELETE FROM TRASH ===
  const permanentDelete = (id: string) => {
    if (!confirm("Delete forever?")) return;
    setTrash(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="max-w-[1600px] mx-auto p-12">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <Sparkles className="w-12 h-12 gold-accent" />
          <h1 className="text-6xl font-light tracking-tighter">Taste</h1>
        </div>
        <p className="text-stone-400 text-lg">Your personal beauty universe • everything saved forever</p>
      </header>

      {/* CUSTOMIZABLE TABS BAR */}
      <div className="flex gap-2 mb-12 border-b border-white/10 pb-6 flex-wrap items-center">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            draggable
            onDragStart={() => handleTabDragStart(tab.id)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleTabDrop(tab.id)}
            className={`flex items-center gap-3 px-8 py-4 rounded-3xl transition-all text-lg cursor-grab ${currentTabId === tab.id ? 'bg-white text-black' : 'hover:bg-white/10'}`}
            onClick={() => setCurrentTabId(tab.id)}
          >
            {tab.name}
            <button onClick={e => { e.stopPropagation(); deleteTab(tab.id); }} className="text-red-400 hover:text-red-600">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}

        <button onClick={createNewTab} className="flex items-center gap-2 px-6 py-4 rounded-3xl hover:bg-white/10 text-lg">
          <Plus className="w-6 h-6" /> New Tab
        </button>

        {/* TRASHBIN TAB */}
        <button onClick={() => setCurrentTabId('trash')} className={`flex items-center gap-3 px-8 py-4 rounded-3xl transition-all text-lg ${currentTabId === 'trash' ? 'bg-red-500 text-white' : 'hover:bg-white/10'}`}>
          🗑️ Trashbin ({trash.length})
        </button>
      </div>

      {/* NEW IMAGES / CURRENT TAB */}
      {currentTabId !== 'trash' && currentTab && (
        <div className="glass p-10 rounded-3xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-4xl">{currentTab.name}</h2>
            <button onClick={sendTempToTab} disabled={tempUploads.length === 0} className="bg-white text-black px-8 py-4 rounded-3xl disabled:opacity-50">
              Save uploaded images here
            </button>
          </div>

          {/* Upload area */}
          <div onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }} 
            className={`border-4 border-dashed rounded-3xl py-20 text-center text-2xl transition-all ${isDragging ? 'border-amber-300 bg-amber-300/10' : 'border-white/30 hover:border-white/60'}`}>
            <Upload className="mx-auto mb-6 w-16 h-16" />
            Drag photos here or click
            <input type="file" accept="image/*" multiple onChange={e => e.target.files && handleFiles(e.target.files)} className="hidden" />
          </div>

          {/* Uploaded temp images */}
          {tempUploads.length > 0 && (
            <div className="mt-12 grid grid-cols-4 gap-6">
              {tempUploads.map((img, i) => (
                <div key={i} className="relative rounded-3xl overflow-hidden">
                  <img src={img} className="w-full" />
                </div>
              ))}
            </div>
          )}

          {/* Main images in this tab */}
          {currentTab.images.length > 0 && (
            <div className="mt-16 grid grid-cols-4 gap-8">
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
      {currentTabId === 'trash' && (
        <div className="glass p-10 rounded-3xl">
          <h2 className="text-4xl mb-8">Trashbin ({trash.length} photos)</h2>
          <div className="grid grid-cols-4 gap-8">
            {trash.map((item, i) => (
              <div key={item.id} className="relative rounded-3xl overflow-hidden">
                <img src={item.image} className="w-full" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-4 flex gap-3">
                  <select onChange={e => restoreFromTrash(item, e.target.value)} className="flex-1 glass py-3 rounded-2xl text-sm">
                    <option value="">Restore to...</option>
                    {tabs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <button onClick={() => permanentDelete(item.id)} className="bg-red-600 px-6 py-3 rounded-2xl text-sm">Delete forever</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
