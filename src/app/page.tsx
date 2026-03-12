'use client';

import { useState, useEffect } from 'react';
import { Palette, Home, Heart, Sparkles, Upload, Plus, Trash2, ArrowRight } from 'lucide-react';

type Tab = 'newimages' | 'discover' | 'anima' | 'room';
type AnimaProfile = { id: string; name: string; images: string[] };

export default function TasteClarifier() {
  const [tab, setTab] = useState<Tab>('newimages');
  const [animaProfiles, setAnimaProfiles] = useState<AnimaProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [inspirationImages, setInspirationImages] = useState<string[]>([]);
  const [tempUploads, setTempUploads] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Load from browser
  useEffect(() => {
    const savedProfiles = localStorage.getItem('animaProfiles');
    const savedInspirations = localStorage.getItem('inspirationImages');
    if (savedProfiles) setAnimaProfiles(JSON.parse(savedProfiles));
    if (savedInspirations) setInspirationImages(JSON.parse(savedInspirations));
  }, []);

  // Auto-save
  useEffect(() => {
    localStorage.setItem('animaProfiles', JSON.stringify(animaProfiles));
    localStorage.setItem('inspirationImages', JSON.stringify(inspirationImages));
  }, [animaProfiles, inspirationImages]);

  const selectedProfile = animaProfiles.find(p => p.id === selectedProfileId);

  const createProfile = () => {
    if (!newProfileName.trim()) return;
    const newP = { id: Date.now().toString(), name: newProfileName.trim(), images: [] };
    setAnimaProfiles([...animaProfiles, newP]);
    setSelectedProfileId(newP.id);
    setNewProfileName('');
  };

  // === HANDLE UPLOAD (click OR drag) ===
  const handleFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setTempUploads(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const sendToDiscover = (img: string) => {
    setInspirationImages(prev => [...prev, img]);
    setTempUploads(prev => prev.filter(i => i !== img));
  };

  const sendToAnima = (img: string, profileId: string) => {
    setAnimaProfiles(prev => prev.map(p => 
      p.id === profileId ? { ...p, images: [...p.images, img] } : p
    ));
    setTempUploads(prev => prev.filter(i => i !== img));
  };

  const sendToNewAnima = (img: string) => {
    const name = prompt("Name this new Anima profile:");
    if (!name) return;
    const newP = { id: Date.now().toString(), name, images: [img] };
    setAnimaProfiles([...animaProfiles, newP]);
    setTempUploads(prev => prev.filter(i => i !== img));
  };

  const deleteTemp = (img: string) => {
    setTempUploads(prev => prev.filter(i => i !== img));
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <Sparkles className="w-10 h-10 gold-accent" />
          <h1 className="text-5xl font-light tracking-tighter">Taste Clarifier</h1>
        </div>
        <p className="text-stone-400">Drag or click → route anywhere</p>
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

      {/* NEW IMAGES – NOW WITH DRAG & DROP */}
      {tab === 'newimages' && (
        <div className="glass p-8 rounded-3xl">
          <h2 className="text-3xl mb-6">New Images – Drag or click</h2>
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl py-16 text-center transition-all ${isDragging ? 'border-amber-300 bg-amber-300/10' : 'border-white/30 hover:border-white/60'}`}
          >
            <Upload className="mx-auto mb-4 w-12 h-12" />
            <p className="text-xl">Drag photos here or click to browse</p>
            <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && handleFiles(e.target.files)} className="hidden" />
          </div>

          {tempUploads.length > 0 && (
            <div className="mt-12">
              <h3 className="mb-6 text-lg">Choose where each image goes ↓</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tempUploads.map((img, i) => (
                  <div key={i} className="relative rounded-3xl overflow-hidden">
                    <img src={img} className="w-full aspect-square object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 p-4 flex flex-col justify-end gap-3">
                      <button onClick={() => sendToDiscover(img)} className="bg-white text-black py-3 rounded-2xl text-sm flex items-center justify-center gap-2 hover:bg-amber-300">
                        <ArrowRight className="w-4 h-4" /> Send to Discover Beauty
                      </button>
                      <button onClick={() => sendToNewAnima(img)} className="bg-amber-400 text-black py-3 rounded-2xl text-sm">Create New Anima Profile</button>
                      {animaProfiles.length > 0 && (
                        <select onChange={e => sendToAnima(img, e.target.value)} className="glass py-3 rounded-2xl text-sm">
                          <option value="">Add to existing Anima...</option>
                          {animaProfiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      )}
                      <button onClick={() => deleteTemp(img)} className="text-red-400 text-xs">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DISCOVER BEAUTY – OLD BUTTONS BACK + YOUR COLLECTION */}
      {tab === 'discover' && (
        <div>
          <h2 className="text-3xl mb-6">Discover Beauty</h2>
          
          {/* OLD CATEGORY BUTTONS RESTORED */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {['Minimalist Interior', 'Elegant Architecture', 'Timeless Clothing', 'Contemporary Art'].map(cat => (
              <button
                key={cat}
                onClick={() => alert(`"${cat}" inspiration coming soon!\n\nFor now: go to "New Images" tab and drag your own photos here.`)}
                className="glass p-8 rounded-3xl text-left hover:scale-105 transition-transform hover:bg-white/10"
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Your actual collection */}
          {inspirationImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {inspirationImages.map((url, i) => (
                <img key={i} src={url} alt="inspiration" className="rounded-3xl shadow-2xl" />
              ))}
            </div>
          ) : (
            <p className="text-stone-500 text-center py-20">Your inspiration collection is empty.<br />Drag images in "New Images" tab and send them here.</p>
          )}
        </div>
      )}

      {/* ANIMA EXPLORER */}
      {tab === 'anima' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 glass p-6 rounded-3xl">
            <div className="flex gap-3 mb-6">
              <input type="text" value={newProfileName} onChange={e => setNewProfileName(e.target.value)} placeholder="e.g. Elena from TV show" className="flex-1 glass px-4 py-3 rounded-2xl" />
              <button onClick={createProfile} className="bg-white text-black px-6 py-3 rounded-2xl">Create</button>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-auto">
              {animaProfiles.map(p => (
                <button key={p.id} onClick={() => setSelectedProfileId(p.id)} className={`w-full p-4 rounded-2xl text-left flex justify-between ${selectedProfileId === p.id ? 'bg-white text-black' : 'hover:bg-white/10'}`}>
                  {p.name} <span className="text-xs text-stone-400">({p.images.length})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 glass p-8 rounded-3xl min-h-[500px]">
            {selectedProfile ? (
              <>
                <h2 className="text-3xl mb-6">{selectedProfile.name}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedProfile.images.map((img, i) => <img key={i} src={img} className="rounded-2xl" />)}
                </div>
              </>
            ) : <p className="text-stone-500 text-center py-20">Select a profile on the left</p>}
          </div>
        </div>
      )}

      {tab === 'room' && <div className="text-center py-20 text-stone-500">Room Visualizer still paused.</div>}
    </div>
  );
}
