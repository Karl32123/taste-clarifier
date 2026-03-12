'use client';

import { useState, useEffect } from 'react';
import { Palette, Home, Heart, Sparkles, Upload, Plus, Trash2 } from 'lucide-react';

type Tab = 'discover' | 'room' | 'anima' | 'gallery';
type AnimaProfile = { id: string; name: string; images: string[] };

export default function TasteClarifier() {
  const [tab, setTab] = useState<Tab>('anima'); // default to Anima since that's what you want now
  const [animaProfiles, setAnimaProfiles] = useState<AnimaProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [roomPreview, setRoomPreview] = useState<string | null>(null);
  const [roomEdited, setRoomEdited] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  // Load profiles from browser memory
  useEffect(() => {
    const saved = localStorage.getItem('animaProfiles');
    if (saved) setAnimaProfiles(JSON.parse(saved));
  }, []);

  // Save profiles to browser memory
  useEffect(() => {
    localStorage.setItem('animaProfiles', JSON.stringify(animaProfiles));
  }, [animaProfiles]);

  const selectedProfile = animaProfiles.find(p => p.id === selectedProfileId);

  // === CREATE NEW PROFILE ===
  const createProfile = () => {
    if (!newProfileName.trim()) return;
    const newProfile: AnimaProfile = {
      id: Date.now().toString(),
      name: newProfileName.trim(),
      images: [],
    };
    setAnimaProfiles([...animaProfiles, newProfile]);
    setSelectedProfileId(newProfile.id);
    setNewProfileName('');
  };

  // === UPLOAD IMAGES TO SELECTED PROFILE ===
  const handleMultipleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedProfileId) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setAnimaProfiles(prev =>
          prev.map(p =>
            p.id === selectedProfileId
              ? { ...p, images: [...p.images, base64] }
              : p
          )
        );
      };
      reader.readAsDataURL(file);
    });
  };

  // === DELETE PROFILE ===
  const deleteProfile = (id: string) => {
    if (!confirm('Delete this Anima profile?')) return;
    setAnimaProfiles(prev => prev.filter(p => p.id !== id));
    if (selectedProfileId === id) setSelectedProfileId(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <Sparkles className="w-10 h-10 gold-accent" />
          <h1 className="text-5xl font-light tracking-tighter">Taste Clarifier</h1>
        </div>
        <p className="text-stone-400">Your personal beauty eye + Grok (API paused for now)</p>
      </header>

      {/* TABS */}
      <div className="flex gap-2 mb-10 border-b border-white/10 pb-4">
        {[
          { id: 'discover', label: 'Discover Beauty', icon: Palette },
          { id: 'room', label: 'Room Visualizer', icon: Home },
          { id: 'anima', label: 'Anima Explorer', icon: Heart },
          { id: 'gallery', label: 'My Gallery', icon: Sparkles },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all ${tab === t.id ? 'bg-white text-black' : 'hover:bg-white/10'}`}
            >
              <Icon className="w-5 h-5" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ANIMA EXPLORER – NEW FEATURE */}
      {tab === 'anima' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: List of your named profiles */}
          <div className="lg:col-span-4 glass p-6 rounded-3xl h-fit">
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Name (e.g. Elena from TV show)"
                className="flex-1 glass px-4 py-3 rounded-2xl"
              />
              <button
                onClick={createProfile}
                className="bg-white text-black px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-amber-300"
              >
                <Plus className="w-5 h-5" /> Create
              </button>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {animaProfiles.length === 0 && (
                <p className="text-stone-500 text-center py-8">No profiles yet.<br />Create your first one above ↑</p>
              )}
              {animaProfiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => setSelectedProfileId(profile.id)}
                  className={`w-full text-left p-4 rounded-2xl flex justify-between items-center transition-all ${selectedProfileId === profile.id ? 'bg-white text-black' : 'hover:bg-white/10'}`}
                >
                  <div>
                    <div className="font-medium">{profile.name}</div>
                    <div className="text-xs text-stone-400">{profile.images.length} images</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteProfile(profile.id); }}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Selected profile area */}
          <div className="lg:col-span-8 glass p-8 rounded-3xl">
            {!selectedProfile ? (
              <div className="h-96 flex items-center justify-center text-stone-400">
                Create or click a profile on the left to start collecting images
              </div>
            ) : (
              <>
                <h2 className="text-3xl mb-6">{selectedProfile.name}</h2>

                {/* Upload more images */}
                <label className="block cursor-pointer border-2 border-dashed border-white/30 rounded-3xl py-12 text-center hover:border-white/60 mb-8">
                  <Upload className="mx-auto mb-3 w-10 h-10" />
                  <p className="text-lg">Add more photos of her</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMultipleUpload}
                    className="hidden"
                  />
                </label>

                {/* Gallery */}
                {selectedProfile.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedProfile.images.map((img, i) => (
                      <div key={i} className="relative rounded-2xl overflow-hidden">
                        <img src={img} className="w-full h-64 object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-stone-500 text-center py-12">No images yet – upload some above</p>
                )}

                {/* Future analysis note */}
                <div className="mt-10 p-6 glass rounded-2xl text-center">
                  <p className="text-amber-300">When xAI is ready again, click one button and I’ll analyse the whole collection for your Anima projection.</p>
                  <p className="text-sm text-stone-500 mt-2">For now just collect – the more images, the clearer your taste becomes.</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Other tabs (kept simple – they need API later) */}
      {tab === 'discover' && <div className="text-center py-20 text-stone-500">Discover tab needs API credits to generate images. We’ll turn it on later.</div>}
      {tab === 'room' && <div className="text-center py-20 text-stone-500">Room Visualizer needs API credits. We’ll turn it on later.</div>}
      {tab === 'gallery' && <div className="text-center py-20 text-stone-500">Your generated images will appear here when API is back.</div>}
    </div>
  );
}
