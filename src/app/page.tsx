'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Upload, Plus, Trash2 } from 'lucide-react';

type Tab = { 
  id: string; 
  name: string; 
  images: { url: string; tags: string[] }[]; 
  notes: string; 
  subTabs: SubTab[]; 
};

type SubTab = { 
  id: string; 
  name: string; 
  images: { url: string; tags: string[] }[]; 
  notes: string; 
};

export default function Taste() {
  const [tabs, setTabs] = useState<Tab[]>([
    { 
      id: 'nyebilder', 
      name: 'Nye bilder', 
      images: [], 
      notes: '', 
      subTabs: [] 
    },
    { 
      id: 'discover', 
      name: 'Discover Beauty', 
      images: [], 
      notes: '', 
      subTabs: [] 
    },
  ]);
  const [currentTabId, setCurrentTabId] = useState('nyebilder');
  const [tempUploads, setTempUploads] = useState<string[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [newTag, setNewTag] = useState('');

  const currentTab = tabs.find(t => t.id === currentTabId) || tabs[0];

  // Paste only in Nye bilder
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
      // Also check sub-tabs
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

  const createSubTab = (parentId: string) => {
    const name = prompt("Sub-tab name:");
    if (!name) return;
    setTabs(prev => prev.map(t => t.id === parentId 
      ? { ...t, subTabs: [...t.subTabs, { id: Date.now().toString(), name, images: [], notes: '' }] } 
      : t));
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
            className={`flex items-center gap-3 px-8 py-4 rounded-3xl text-lg cursor-pointer ${currentTabId === tab.id ? 'bg-white text-black' : 'hover:bg-white/10'}`}
            onContextMenu={e => { e.preventDefault(); if (tab.id !== 'nyebilder') createSubTab(tab.id); }}
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
                      placeholder="tag (e.g. warm, anima)" 
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

      {/* Other tabs & sub-tabs – images only */}
      {currentTabId !== 'trash' && currentTab.name !== 'Nye bilder' && (
        <div className="glass p-12 rounded-3xl">
          <h2 className="text-4xl mb-6">{currentTab.name}</h2>

          {/* Sub-tabs */}
          {currentTab.subTabs.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-3">
              {currentTab.subTabs.map(st => (
                <button 
                  key={st.id} 
                  onClick={() => setCurrentTabId(st.id)}
                  className="px-6 py-3 rounded-2xl text-lg glass hover:bg-white/10"
                >
                  ↳ {st.name}
                </button>
              ))}
            </div>
          )}

          {/* Images */}
          <div className="grid grid-cols-4 gap-8">
            {currentTab.images.map((imgObj, i) => (
              <div key={i} className="relative rounded-3xl overflow-hidden" onContextMenu={e => { e.preventDefault(); setImageContext({ image: imgObj.url, x: e.clientX, y: e.clientY }); }}>
                <img src={imgObj.url} className="w-full" />
                <div className="absolute bottom-2 left-2 text-xs bg-black/70 px-2 py-1 rounded">
                  {imgObj.tags.join(' • ') || 'no tag'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trashbin (simple for now) */}
      {currentTabId === 'trash' && (
        <div className="glass p-12 rounded-3xl">
          <h2 className="text-4xl mb-8">Trashbin</h2>
          <p className="text-stone-400">Trashbin will be fully functional in the next update.</p>
        </div>
      )}
    </div>
  );
}
