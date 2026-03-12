'use client';

import { useState, useEffect } from 'react';
import { Palette, Home, Heart, Sparkles, Upload, Plus, Trash2, ArrowRight, Folder, ChevronDown } from 'lucide-react';

type Tab = 'newimages' | 'discover' | 'anima' | 'room';
type Anima = { id: string; name: string; images: string[]; themeId?: string };
type Theme = { id: string; name: string };

export default function TasteClarifier() {
  const [tab, setTab] = useState<Tab>('newimages');
  const [animas, setAnimas] = useState<Anima[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedAnimaId, setSelectedAnimaId] = useState<string | null>(null);
  const [expandedThemes, setExpandedThemes] = useState<Record<string, boolean>>({});
  const [newAnimaName, setNewAnimaName] = useState('');
  const [newThemeName, setNewThemeName] = useState('');
  const [inspirationImages, setInspirationImages] = useState<string[]>([]);
  const [tempUploads, setTempUploads] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Load
  useEffect(() => {
    const savedAnimas = localStorage.getItem('animas');
    const savedThemes = localStorage.getItem('themes');
    const savedInspirations = localStorage.getItem('inspirationImages');
    if (savedAnimas) setAnimas(JSON.parse(savedAnimas));
    if (savedThemes) setThemes(JSON.parse(savedThemes));
    if (savedInspirations) setInspirationImages(JSON.parse(savedInspirations));
  }, []);

  // Auto-save
  useEffect(() => {
    localStorage.setItem('animas', JSON.stringify(animas));
    localStorage.setItem('themes', JSON.stringify(themes));
    localStorage.setItem('inspirationImages', JSON.stringify(inspirationImages));
  }, [animas, themes, inspirationImages]);

  const selectedAnima = animas.find(a => a.id === selectedAnimaId);

  // SAFE DRAG – max 8 with clear warning
  const handleFiles = async (files: FileList) => {
    if (files.length > 8) {
      alert("⚠️ Maximum 8 images at once.\nOnly the first 8 were added.");
    }
    const toProcess = Array.from(files).slice(0, 8);
    setIsProcessing(true);
    const newImages: string[] = [];
    for (const file of toProcess) {
      await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = ev => { newImages.push(ev.target?.result as string); resolve(null); };
        reader.readAsDataURL(file);
      });
    }
    setTempUploads(prev => [...prev, ...newImages]);
    setIsProcessing(false);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const createTheme = () => {
    if (!newThemeName.trim()) return;
    setThemes([...themes, { id: Date.now().toString(), name: newThemeName.trim() }]);
    setNewThemeName('');
  };

  const createAnima = () => {
    if (!newAnimaName.trim()) return;
    const newA: Anima = { id: Date.now().toString(), name: newAnimaName.trim(), images: [] };
    setAnimas([...animas, newA]);
    setSelectedAnimaId(newA.id);
    setNewAnimaName('');
  };

  const deleteAnima = (id: string) => {
    if (!confirm("Delete this Anima and all its images?")) return;
    setAnimas(prev => prev.filter(a => a.id !== id));
    if (selectedAnimaId === id) setSelectedAnimaId(null);
  };

  const deleteTheme = (id: string) => {
    if (!confirm("Delete this Theme? (Anim as will become unassigned)")) return;
    setThemes(prev => prev.filter(t => t.id !== id));
  };

  const deleteImage = (animaId: string, imageIndex: number) => {
    setAnimas(prev => prev.map(a => 
      a.id === animaId ? { ...a, images: a.images.filter((_, i) => i !== imageIndex) } : a
    ));
  };

  const toggleTheme = (themeId: string) => {
    setExpandedThemes(prev => ({ ...prev, [themeId]: !prev[themeId] }));
  };

  const assignToTheme = (animaId: string, themeId: string) => {
    setAnimas(prev => prev.map(a => a.id === animaId ? { ...a, themeId } : a));
  };

  const sendToDiscover = (img: string) => {
    setInspirationImages(prev => [...prev, img]);
    setTempUploads(prev => prev.filter(i => i !== img));
  };

  const sendToNewAnima = (img: string) => {
    const name = prompt("Name this new Anima:");
    if (!name) return;
    const newA: Anima = { id: Date.now().toString(), name, images: [img] };
    setAnimas([...animas, newA]);
    setTempUploads(prev => prev.filter(i => i !== img));
  };

  const deleteTemp = (img: string) => setTempUploads(prev => prev.filter(i => i !== img));

  return (
    <div className="max-w-7xl mx-auto p-8">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <Sparkles className="w-10 h-10 gold-accent" />
          <h1 className="text-5xl font-light tracking-tighter">Taste Clarifier</h1>
        </div>
        <p className="text-stone-400">Everything saved forever in your browser</p>
      </header>

      {/* TABS */}
      <div className="flex gap-2 mb-10 border-b border-white/10 pb-4 flex-wrap">
        {[
          { id: 'newimages', label: 'New Images', icon: Upload },
          { id: 'discover', label: 'Discover Beauty', icon: Palette },
          { id: 'anima', label: 'Anima Explorer', icon: Heart },
          { id: 'room', label: 'Room Visualizer', icon: Home },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id as Tab)} 
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all ${tab === t.id ? 'bg-white text-black' : 'hover:bg-white/10'}`}>
              <Icon className="w-5 h-5" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* NEW IMAGES – fixed warning */}
      {tab === 'newimages' && (
        <div className="glass p-8 rounded-3xl">
          <h2 className="text-3xl mb-6">New Images – Drag or click (max 8 at once)</h2>
          <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl py-16 text-center transition-all ${isDragging ? 'border-amber-300 bg-amber-300/10' : 'border-white/30 hover:border-white/60'}`}>
            <Upload className="mx-auto mb-4 w-12 h-12" />
            <p className="text-xl">Drag photos here or click</p>
            <input type="file" accept="image/*" multiple onChange={e => e.target.files && handleFiles(e.target.files)} className="hidden" />
          </div>

          {isProcessing && <p className="text-amber-300 mt-4 text-center">Processing…</p>}

          {tempUploads.length > 0 && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {tempUploads.map((img, i) => (
                <div key={i} className="relative rounded-3xl overflow-hidden">
                  <img src={img} className="w-full aspect-square object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 p-4 flex flex-col justify-end gap-3">
                    <button onClick={() => sendToDiscover(img)} className="bg-white text-black py-3 rounded-2xl text-sm">→ Discover Beauty</button>
                    <button onClick={() => sendToNewAnima(img)} className="bg-amber-400 text-black py-3 rounded-2xl text-sm">Create New Anima</button>
                    {animas.length > 0 && (
                      <select onChange={e => { const a = animas.find(an => an.id === e.target.value); if (a) { setAnimas(prev => prev.map(an => an.id === a.id ? {...an, images: [...an.images, img]} : an)); setTempUploads(prev => prev.filter(x => x !== img)); } }} className="glass py-3 rounded-2xl text-sm">
                        <option value="">Add to existing Anima...</option>
                        {animas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    )}
                    <button onClick={() => deleteTemp(img)} className="text-red-400 text-xs">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DISCOVER BEAUTY */}
      {tab === 'discover' && (
        <div>
          <h2 className="text-3xl mb-6">Discover Beauty</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {['Minimalist Interior', 'Elegant Architecture', 'Timeless Clothing', 'Contemporary Art'].map(cat => (
              <button key={cat} onClick={() => alert(`"${cat}" coming soon`)} className="glass p-8 rounded-3xl hover:scale-105">{cat}</button>
            ))}
          </div>
          {inspirationImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {inspirationImages.map((url, i) => <img key={i} src={url} className="rounded-3xl" />)}
            </div>
          ) : <p className="text-stone-500 text-center py-20">Send images from New Images tab</p>}
        </div>
      )}

      {/* ANIMA EXPLORER – expandable + delete everything */}
      {tab === 'anima' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Create + Pyramid */}
          <div className="lg:col-span-4 glass p-6 rounded-3xl">
            <div className="mb-8">
              <h3 className="mb-3">Create Overarching Theme</h3>
              <div className="flex gap-3">
                <input type="text" value={newThemeName} onChange={e => setNewThemeName(e.target.value)} placeholder="e.g. Classic Hollywood Sirens" className="flex-1 glass px-4 py-3 rounded-2xl" />
                <button onClick={createTheme} className="bg-white text-black px-6 py-3 rounded-2xl">Theme</button>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="mb-3">Create Anima</h3>
              <div className="flex gap-3">
                <input type="text" value={newAnimaName} onChange={e => setNewAnimaName(e.target.value)} placeholder="e.g. Marilyn Monroe type" className="flex-1 glass px-4 py-3 rounded-2xl" />
                <button onClick={createAnima} className="bg-white text-black px-6 py-3 rounded-2xl">Create</button>
              </div>
            </div>

            {/* Expandable Pyramid */}
            <div className="space-y-4">
              {themes.map(theme => {
                const isExpanded = expandedThemes[theme.id] ?? true;
                const themeAnimas = animas.filter(a => a.themeId === theme.id);
                return (
                  <div key={theme.id} className="glass p-5 rounded-2xl">
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-medium flex items-center gap-2 cursor-pointer" onClick={() => toggleTheme(theme.id)}>
                        📌 {theme.name} ({themeAnimas.length})
                        <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                      <button onClick={() => deleteTheme(theme.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    {isExpanded && (
                      <div className="pl-6 space-y-2">
                        {themeAnimas.map(anima => (
                          <div key={anima.id} className="flex justify-between items-center cursor-pointer py-1" onClick={() => setSelectedAnimaId(anima.id)}>
                            ↳ {anima.name} ({anima.images.length})
                            <button onClick={e => { e.stopPropagation(); deleteAnima(anima.id); }} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Unassigned Anim as */}
              {animas.filter(a => !a.themeId).length > 0 && (
                <div className="glass p-5 rounded-2xl">
                  <div className="font-medium mb-3 text-amber-300">Unassigned Anim as</div>
                  {animas.filter(a => !a.themeId).map(anima => (
                    <div key={anima.id} className="pl-6 py-1 flex justify-between items-center cursor-pointer" onClick={() => setSelectedAnimaId(anima.id)}>
                      ↳ {anima.name} ({anima.images.length})
                      <div className="flex gap-2">
                        <select onChange={e => assignToTheme(anima.id, e.target.value)} className="text-xs bg-transparent">
                          <option value="">Assign theme…</option>
                          {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <button onClick={() => deleteAnima(anima.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Gallery + delete images */}
          <div className="lg:col-span-8 glass p-8 rounded-3xl min-h-[500px]">
            {selectedAnima ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl">{selectedAnima.name}</h2>
                  <button onClick={() => deleteAnima(selectedAnima.id)} className="text-red-400 flex items-center gap-2">
                    <Trash2 className="w-5 h-5" /> Delete Anima
                  </button>
                </div>
                {selectedAnima.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedAnima.images.map((img, i) => (
                      <div key={i} className="relative rounded-2xl overflow-hidden group">
                        <img src={img} className="w-full" />
                        <button onClick={() => deleteImage(selectedAnima.id, i)} className="absolute top-2 right-2 bg-black/70 p-2 rounded-full opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-stone-500 text-center py-12">No images yet</p>}
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-stone-500 text-center">
                Click any Anima name on the left<br />to see and manage its images
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'room' && <div className="text-center py-20 text-stone-500">Room Visualizer still paused.</div>}
    </div>
  );
}
