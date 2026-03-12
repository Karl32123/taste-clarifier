'use client';

import { useState, useEffect } from 'react';
import { Palette, Home, Heart, Sparkles, Upload, Plus, Trash2, ArrowRight, Folder } from 'lucide-react';

type Tab = 'newimages' | 'discover' | 'anima' | 'room';
type AnimaProfile = { id: string; name: string; images: string[]; themeId?: string };
type Theme = { id: string; name: string };

export default function TasteClarifier() {
  const [tab, setTab] = useState<Tab>('newimages');
  const [animaProfiles, setAnimaProfiles] = useState<AnimaProfile[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [newThemeName, setNewThemeName] = useState('');
  const [inspirationImages, setInspirationImages] = useState<string[]>([]);
  const [tempUploads, setTempUploads] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Load (backward compatible with old data)
  useEffect(() => {
    const savedProfiles = localStorage.getItem('animaProfiles');
    const savedThemes = localStorage.getItem('animaThemes');
    const savedInspirations = localStorage.getItem('inspirationImages');
    if (savedProfiles) setAnimaProfiles(JSON.parse(savedProfiles));
    if (savedThemes) setThemes(JSON.parse(savedThemes));
    if (savedInspirations) setInspirationImages(JSON.parse(savedInspirations));
  }, []);

  // Auto-save
  useEffect(() => {
    localStorage.setItem('animaProfiles', JSON.stringify(animaProfiles));
    localStorage.setItem('animaThemes', JSON.stringify(themes));
    localStorage.setItem('inspirationImages', JSON.stringify(inspirationImages));
  }, [animaProfiles, themes, inspirationImages]);

  const selectedProfile = animaProfiles.find(p => p.id === selectedProfileId);

  // === SAFE DRAG & DROP (max 8 + clear warning) ===
  const handleFiles = async (files: FileList) => {
    if (files.length > 8) {
      alert("⚠️ Max 8 images at once to keep everything fast and safe.\nOnly the first 8 were added – upload the rest next time.");
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

  const createProfile = () => {
    if (!newProfileName.trim()) return;
    const newP: AnimaProfile = { id: Date.now().toString(), name: newProfileName.trim(), images: [] };
    setAnimaProfiles([...animaProfiles, newP]);
    setSelectedProfileId(newP.id);
    setNewProfileName('');
  };

  const assignProfileToTheme = (profileId: string, themeId: string) => {
    setAnimaProfiles(prev => prev.map(p => p.id === profileId ? { ...p, themeId } : p));
  };

  const sendToDiscover = (img: string) => {
    setInspirationImages(prev => [...prev, img]);
    setTempUploads(prev => prev.filter(i => i !== img));
  };

  const sendToNewAnima = (img: string) => {
    const name = prompt("Name this new Anima profile:");
    if (!name) return;
    const newP: AnimaProfile = { id: Date.now().toString(), name, images: [img] };
    setAnimaProfiles([...animaProfiles, newP]);
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
        <p className="text-stone-400">All images saved in your browser forever</p>
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

      {/* NEW IMAGES – fixed limit */}
      {tab === 'newimages' && (
        <div className="glass p-8 rounded-3xl">
          <h2 className="text-3xl mb-6">New Images – Drag or click (max 8 at once)</h2>
          <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl py-16 text-center transition-all ${isDragging ? 'border-amber-300 bg-amber-300/10' : 'border-white/30 hover:border-white/60'}`}>
            <Upload className="mx-auto mb-4 w-12 h-12" />
            <p className="text-xl">Drag photos here or click to browse</p>
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
                    <button onClick={() => sendToNewAnima(img)} className="bg-amber-400 text-black py-3 rounded-2xl text-sm">Create New Profile</button>
                    {animaProfiles.length > 0 && (
                      <select onChange={e => { const p = animaProfiles.find(pr => pr.id === e.target.value); if (p) { setAnimaProfiles(prev => prev.map(pr => pr.id === p.id ? {...pr, images: [...pr.images, img]} : pr)); setTempUploads(prev => prev.filter(x => x !== img)); } }} className="glass py-3 rounded-2xl text-sm">
                        <option value="">Add to existing profile...</option>
                        {animaProfiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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

      {/* ANIMA EXPLORER – FULLY WORKING PYRAMID */}
      {tab === 'anima' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left side: Create + Pyramid list */}
          <div className="lg:col-span-4 glass p-6 rounded-3xl">
            {/* Create Theme */}
            <div className="mb-8">
              <h3 className="mb-3">Create Overarching Theme</h3>
              <div className="flex gap-3">
                <input type="text" value={newThemeName} onChange={e => setNewThemeName(e.target.value)} placeholder="e.g. Classic Hollywood Sirens" className="flex-1 glass px-4 py-3 rounded-2xl" />
                <button onClick={createTheme} className="bg-white text-black px-6 py-3 rounded-2xl">Theme</button>
              </div>
            </div>

            {/* Create Profile */}
            <div className="mb-8">
              <h3 className="mb-3">Create Profile</h3>
              <div className="flex gap-3">
                <input type="text" value={newProfileName} onChange={e => setNewProfileName(e.target.value)} placeholder="e.g. Marilyn Monroe type" className="flex-1 glass px-4 py-3 rounded-2xl" />
                <button onClick={createProfile} className="bg-white text-black px-6 py-3 rounded-2xl">Create</button>
              </div>
            </div>

            {/* Pyramid */}
            <div className="space-y-6">
              {themes.length > 0 && themes.map(theme => (
                <div key={theme.id} className="glass p-5 rounded-2xl">
                  <div className="font-medium mb-3 flex items-center gap-2">📌 {theme.name}</div>
                  {animaProfiles.filter(p => p.themeId === theme.id).length > 0 ? (
                    animaProfiles.filter(p => p.themeId === theme.id).map(profile => (
                      <div key={profile.id} className="pl-6 py-1 cursor-pointer" onClick={() => setSelectedProfileId(profile.id)}>
                        ↳ {profile.name} ({profile.images.length} images)
                      </div>
                    ))
                  ) : <p className="pl-6 text-stone-500 text-sm">No profiles yet under this theme</p>}
                </div>
              ))}

              {/* Unassigned profiles */}
              {animaProfiles.filter(p => !p.themeId).length > 0 && (
                <div className="glass p-5 rounded-2xl">
                  <div className="font-medium mb-3 text-amber-300">Unassigned Profiles</div>
                  {animaProfiles.filter(p => !p.themeId).map(profile => (
                    <div key={profile.id} className="pl-6 py-1 flex justify-between items-center cursor-pointer" onClick={() => setSelectedProfileId(profile.id)}>
                      ↳ {profile.name} ({profile.images.length})
                      <select onChange={e => assignProfileToTheme(profile.id, e.target.value)} className="text-xs bg-transparent">
                        <option value="">Assign to theme…</option>
                        {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right side: Gallery of selected profile */}
          <div className="lg:col-span-8 glass p-8 rounded-3xl min-h-[500px]">
            {selectedProfile ? (
              <>
                <h2 className="text-3xl mb-6">{selectedProfile.name}</h2>
                {selectedProfile.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedProfile.images.map((img, i) => <img key={i} src={img} className="rounded-2xl" />)}
                  </div>
                ) : <p className="text-stone-500">No images yet in this profile</p>}
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-stone-500 text-center">
                Click any profile name on the left<br />to see its images here
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'room' && <div className="text-center py-20 text-stone-500">Room Visualizer still paused.</div>}
    </div>
  );
}
