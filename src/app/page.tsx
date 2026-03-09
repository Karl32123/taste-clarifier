'use client';

import { useState } from 'react';
import { Palette, Home, Heart, Sparkles, Upload } from 'lucide-react';

type Tab = 'discover' | 'room' | 'anima' | 'gallery';

export default function TasteClarifier() {
  const [tab, setTab] = useState<Tab>('discover');
  const [roomPreview, setRoomPreview] = useState<string | null>(null);
  const [roomEdited, setRoomEdited] = useState<string | null>(null);
  const [animaPreview, setAnimaPreview] = useState<string | null>(null);
  const [animaAnalysis, setAnimaAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  // === DISCOVER TAB ===
  const generateInspiration = async (category: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Highly beautiful ${category}, masterpiece, perfect composition, elegant lighting, cinematic` }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setGeneratedImages(prev => [data.url, ...prev].slice(0, 6));
    } catch (error: any) {
      alert('Error generating inspiration: ' + error.message + '. Check console/logs for details.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // === ROOM VISUALIZER ===
  const handleRoomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setRoomPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const visualizeRoomChange = async (change: string) => {
    if (!roomPreview) return;
    setIsLoading(true);
    try {
      const base64 = roomPreview.split(',')[1];
      const res = await fetch('/api/edit-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: change, imageBase64: base64 }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setRoomEdited(data.url);
    } catch (error: any) {
      alert('Error visualizing room: ' + error.message + '. Check if image editing is supported or key issue.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // === ANIMA EXPLORER ===
  const handleAnimaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setAnimaPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const analyzeAnima = async () => {
    if (!animaPreview) return;
    setIsLoading(true);
    try {
      const base64 = animaPreview.split(',')[1];
      const res = await fetch('/api/analyze-anima', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setAnimaAnalysis(data.analysis);
    } catch (error: any) {
      alert('Error analyzing Anima: ' + error.message + '. Check API key, model access, or logs.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <Sparkles className="w-10 h-10 gold-accent" />
          <h1 className="text-5xl font-light tracking-tighter">Taste Clarifier</h1>
        </div>
        <p className="text-stone-400">You + Grok refining beauty together</p>
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

      {/* DISCOVER TAB */}
      {tab === 'discover' && (
        <div>
          <h2 className="text-3xl mb-6">What kind of beauty shall we explore today?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Minimalist Interior', 'Elegant Architecture', 'Timeless Clothing', 'Contemporary Art'].map(cat => (
              <button
                key={cat}
                onClick={() => generateInspiration(cat)}
                className="glass p-8 rounded-3xl text-left hover:scale-105 transition-transform"
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {generatedImages.map((url, i) => (
              <img key={i} src={url} alt="inspiration" className="rounded-3xl shadow-2xl" />
            ))}
          </div>
        </div>
      )}

      {/* ROOM VISUALIZER */}
      {tab === 'room' && (
        <div className="max-w-4xl mx-auto">
          <div className="glass p-8 rounded-3xl">
            <label className="block text-center cursor-pointer border-2 border-dashed border-white/30 rounded-3xl py-16 hover:border-white/60">
              <Upload className="mx-auto mb-4" />
              <p>Upload photo of your room</p>
              <input type="file" accept="image/*" onChange={handleRoomUpload} className="hidden" />
            </label>

            {roomPreview && (
              <div className="mt-8 grid grid-cols-2 gap-8">
                <div>
                  <p className="mb-2 text-sm text-stone-400">Original</p>
                  <img src={roomPreview} className="rounded-2xl" />
                </div>
                <div>
                  <p className="mb-2 text-sm text-stone-400">Grok&apos;s version</p>
                  {roomEdited ? (
                    <img src={roomEdited} className="rounded-2xl" />
                  ) : (
                    <div className="bg-zinc-900 h-full rounded-2xl flex items-center justify-center text-stone-500">
                      Describe the change below ↓
                    </div>
                  )}
                </div>
              </div>
            )}

            {roomPreview && (
              <div className="mt-8">
                <textarea
                  id="change"
                  placeholder="e.g. change walls to warm beige, replace sofa with deep green velvet, add oak shelves and soft lighting"
                  className="w-full glass p-6 rounded-2xl h-32"
                />
                <button
                  onClick={() => visualizeRoomChange((document.getElementById('change') as HTMLTextAreaElement).value)}
                  disabled={isLoading}
                  className="mt-4 w-full bg-white text-black py-4 rounded-2xl font-medium hover:bg-amber-300"
                >
                  {isLoading ? 'Grok is painting...' : 'Visualize the change'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ANIMA EXPLORER */}
      {tab === 'anima' && (
        <div className="max-w-2xl mx-auto glass p-10 rounded-3xl">
          <label className="block text-center cursor-pointer border-2 border-dashed border-white/30 rounded-3xl py-20">
            <Heart className="mx-auto mb-4 w-12 h-12" />
            <p>Upload image of a woman that instantly captivates you</p>
            <input type="file" accept="image/*" onChange={handleAnimaUpload} className="hidden" />
          </label>

          {animaPreview && (
            <>
              <img src={animaPreview} className="mx-auto mt-8 rounded-3xl max-h-96" />
              <button
                onClick={analyzeAnima}
                disabled={isLoading}
                className="mt-8 w-full py-4 bg-gradient-to-r from-amber-400 to-yellow-600 text-black rounded-2xl font-semibold"
              >
                {isLoading ? 'Uncovering your Anima projection...' : 'Reveal my Anima projection'}
              </button>
            </>
          )}

          {animaAnalysis && (
            <div className="mt-10 prose prose-invert max-w-none">
              <h3 className="gold-accent">Your Anima speaks through her:</h3>
              <p className="whitespace-pre-wrap text-lg leading-relaxed">{animaAnalysis}</p>
            </div>
          )}
        </div>
      )}

      {/* GALLERY */}
      {tab === 'gallery' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {generatedImages.length > 0 ? generatedImages.map((url,i) => (
            <img key={i} src={url} className="rounded-3xl" />
          )) : (
            <p className="col-span-3 text-center text-stone-500">Generate images in Discover tab to fill your gallery</p>
          )}
        </div>
      )}
    </div>
  );
}
