'use client';

import { useState, useEffect } from 'react';
import { Palette, Home, Heart, Sparkles, Upload, Plus, Trash2, ArrowRight, Folder, ChevronDown } from 'lucide-react';

type Tab = 'newimages' | 'discover' | 'anima' | 'room';
type Anima = { id: string; name: string; images: string[]; themeId?: string };
type Theme = { id: string; name: string };

export default function Taste() {
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

  // SUPER RELIABLE DRAG LIMIT
  const handleFiles = async (files: FileList) => {
    if (files.length > 8) {
      alert("⚠️ Only 8 images at a time on laptop.\nThe first 8 were added – upload the rest next.");
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
    if (!confirm("Delete this Anima and all images?")) return;
    setAnimas(prev => prev.filter(a => a.id !== id));
    if (selectedAnimaId === id) setSelectedAnimaId(null);
  };

  const deleteTheme = (id: string) => {
    if (!confirm("Delete this Theme?")) return;
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
    <div className="max-w-[1400px] mx-auto p-12"> {/* wider for laptop */}

      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <Sparkles className="w-12 h-12 gold-accent" />
          <h1 className="text-6xl font-light tracking-tighter">Taste</h1>
        </div>
        <p className="text-stone-400 text-lg">Your personal beauty pyramid</p>
      </header>

      {/* TABS – bigger for laptop */}
      <div className="flex gap-3 mb-12 border-b border-white/10 pb-6 text-xl">
        {[
          { id: 'newimages', label: 'New Images', icon: Upload },
          { id: 'discover', label: 'Discover Beauty', icon: Palette },
          { id: 'anima', label: 'Anima Explorer', icon: Heart },
          { id: 'room', label: 'Room Visualizer', icon: Home },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id as Tab)} 
              className={`flex items-center gap-3 px-8 py-4 rounded-3xl transition-all text-lg ${tab === t.id ? 'bg-white text-black' : 'hover:bg-white/10'}`}>
              <Icon className="w-6 h-6" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* NEW IMAGES – laptop big + reliable warning */}
      {tab === 'newimages' && (
        <div className="glass p-10 rounded-3xl">
          <h2 className="text-4xl mb-8">New Images – Drag or click (max 8)</h2>
          <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            className={`border-4 border-dashed rounded-3xl py-20 text-center transition-all text-2xl ${isDragging ? 'border-amber-300 bg-amber-300/10' : 'border-white/30 hover:border-white/60'}`}>
            <Upload className="mx-auto mb-6 w-16 h-16" />
            <p>Drag photos from your folders here</p>
            <input type="file" accept="image/*" multiple onChange={e => e.target.files && handleFiles(e.target.files)} className="hidden" />
          </div>

          {isProcessing && <p className="text-3xl text-amber-300 mt-8 text-center">Processing...</p>}

          {tempUploads.length > 0 && (
            <div className="mt-16 grid grid-cols-4 gap-8"> {/* 4 columns for laptop */}
              {tempUploads.map((img, i) => (
                <div key={i} className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img src={img} className="w-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 p-6 flex flex-col justify-end gap-4 text-lg">
                    <button onClick={() => sendToDiscover(img)} className="bg-white text-black py-4 rounded-2xl">→ Discover Beauty</button>
                    <button onClick={() => sendToNewAnima(img)} className="bg-amber-400 text-black py-4 rounded-2xl">Create New Anima</button>
                    {animas.length > 0 && (
                      <select onChange={e => { const a = animas.find(an => an.id === e.target.value); if (a) { setAnimas(prev => prev.map(an => an.id === a.id ? {...an, images: [...an.images, img]} : an)); setTempUploads(prev => prev.filter(x => x !== img)); } }} className="glass py-4 rounded-2xl text-lg">
                        <option value="">Add to existing Anima...</option>
                        {animas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    )}
                    <button onClick={() => deleteTemp(img)} className="text-red-400 text-sm">Remove image</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DISCOVER BEAUTY – bigger grids */}
      {tab === 'discover' && (
        <div>
          <h2 className="text-4xl mb-8">Discover Beauty</h2>
          <div className="grid grid-cols-4 gap-6 mb-12">
            {['Minimalist Interior', 'Elegant Architecture', 'Timeless Clothing', 'Contemporary Art'].map(cat => (
              <button key={cat} onClick={() => alert(`"${cat}" coming soon`)} className="glass p-10 rounded-3xl text-xl hover:scale-105">{cat}</button>
            ))}
          </div>
          {inspirationImages.length > 0 ? (
            <div className="grid grid-cols-4 gap-8">
              {inspirationImages.map((url, i) => <img key={i} src={url} className="rounded-3xl shadow-2xl" />)}
            </div>
          ) : <p className="text-stone-500 text-center py-20 text-2xl">Send images from New Images tab</p>}
        </div>
      )}

      {/* ANIMA EXPLORER – laptop size + all deletes + expandable */}
      {tab === 'anima' && (
        <div className="grid grid-cols-12 gap-10">
          {/* Left pyramid */}
          <div className="col-span-5 glass p-10 rounded-3xl text-xl">
            {/* Create Theme & Anima – bigger inputs */}
            <div className="mb-10">
              <h3 className="mb-4 text-2xl">Create Overarching Theme</h3>
              <div className="flex gap-4">
                <input type="text" value={newThemeName} onChange={e => setNewThemeName(e.target.value)} placeholder="e.g. Classic Hollywood Sirens" className="flex-1 glass px-6 py-5 rounded-3xl text-xl" />
                <button onClick={createTheme} className="bg-white text-black px-8 py-5 rounded-3xl text-xl">Theme</button>
              </div>
            </div>

            <div className="mb-10">
              <h3 className="mb-4 text-2xl">Create Anima</h3>
              <div className="flex gap-4">
                <input type="text" value={newAnimaName} onChange={e => setNewAnimaName(e.target.value)} placeholder="e.g. Marilyn Monroe type" className="flex-1 glass px-6 py-5 rounded-3xl text-xl" />
                <button onClick={createAnima} className="bg-white text-black px-8 py-5 rounded-3xl text-xl">Create</button>
              </div>
            </div>

            {/* Expandable Pyramid */}
            <div className="space-y-6">
              {themes.map(theme => {
                const isExpanded = expandedThemes[theme.id] ?? true;
                const themeAnimas = animas.filter(a => a.themeId === theme.id);
                return (
                  <div key={theme.id} className="glass p-8 rounded-3xl">
                    <div className="flex justify-between items-center mb-4 text-2xl" onClick={() => toggleTheme(theme.id)}>
                      📌 {theme.name} ({themeAnimas.length})
                      <ChevronDown className={`w-8 h-8 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                    {isExpanded && (
                      <div className="pl-8 space-y-4">
                        {themeAnimas.map(anima => (
                          <div key={anima.id} className="flex justify-between items-center cursor-pointer py-2 text-xl" onClick={() => setSelectedAnimaId(anima.id)}>
                            ↳ {anima.name} ({anima.images.length})
                            <button onClick={e => { e.stopPropagation(); deleteAnima(anima.id); }} className="text-red-400"><Trash2 className="w-6 h-6" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={() => deleteTheme(theme.id)} className="mt-4 text-red-400 text-sm">Delete Theme</button>
                  </div>
                );
              })}

              {/* Unassigned */}
              {animas.filter(a => !a.themeId).length > 0 && (
                <div className="glass p-8 rounded-3xl">
                  <div className="text-2xl text-amber-300 mb-4">Unassigned Anim as</div>
                  {animas.filter(a => !a.themeId).map(anima => (
                    <div key={anima.id} className="pl-8 py-3 flex justify-between cursor-pointer text-xl" onClick={() => setSelectedAnimaId(anima.id)}>
                      ↳ {anima.name} ({anima.images.length})
                      <div className="flex gap-4">
                        <select onChange={e => assignToTheme(anima.id, e.target.value)} className="text-lg bg-transparent">
                          <option value="">Assign theme...</option>
                          {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <button onClick={() => deleteAnima(anima.id)} className="text-red-400"><Trash2 className="w-6 h-6" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right gallery – big images */}
          <div className="col-span-7 glass p-10 rounded-3xl">
            {selectedAnima ? (
              <>
                <div className="flex justify-between mb-8">
                  <h2 className="text-4xl">{selectedAnima.name}</h2>
                  <button onClick={() => deleteAnima(selectedAnima.id)} className="text-red-400 text-xl flex items-center gap-3"><Trash2 className="w-7 h-7" /> Delete Anima</button>
                </div>
                {selectedAnima.images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-8">
                    {selectedAnima.images.map((img, i) => (
                      <div key={i} className="relative rounded-3xl overflow-hidden group shadow-2xl">
                        <img src={img} className="w-full" />
                        <button onClick={() => deleteImage(selectedAnima.id, i)} className="absolute top-4 right-4 bg-black/70 p-3 rounded-full opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-6 h-6 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-3xl text-stone-500 text-center py-20">No images yet – add some from New Images tab</p>}
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-3xl text-stone-500 text-center">
                Click any Anima name on the left<br />to view and edit its images
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'room' && <div className="text-center py-20 text-stone-500 text-2xl">Room Visualizer still paused.</div>}
    </div>
  );
}
