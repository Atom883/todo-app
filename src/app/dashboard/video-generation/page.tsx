"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";

const POSES = [
  { id: 1, name: "フレンチキス", thumb: "/dummy1.jpg" },
  { id: 2, name: "私を解放", thumb: "/dummy2.jpg" },
  { id: 3, name: "ヒーローフライト", thumb: "/dummy3.jpg" },
  { id: 4, name: "ヒロインパワー", thumb: "/dummy4.jpg" },
  { id: 5, name: "フェアリーミー", thumb: "/dummy5.jpg" },
  { id: 6, name: "セクシーに変身", thumb: "/dummy6.jpg" },
];
const TAGS = ["人気", "ラブ", "彼女のムード", "ライフ", "変身", "楽しい", "フィギュア", "製品"];
const RATIOS = [
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
  { label: "1:1", value: "1:1" },
];
const DURATIONS = ["5秒", "10秒"];

export default function VideoGenerationPage() {
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pose, setPose] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(DURATIONS[0]);
  const [ratio, setRatio] = useState(RATIOS[0].value);
  const [bgm, setBgm] = useState(true);
  const [tag, setTag] = useState(TAGS[0]);
  const inputRef = useRef<HTMLInputElement>(null);

  // 画像アップロード処理
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください");
      return;
    }
    setError(null);
    setImage(file);
    setImageUrl(URL.createObjectURL(file));
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください");
      return;
    }
    setError(null);
    setImage(file);
    setImageUrl(URL.createObjectURL(file));
  };
  const handleGenerate = () => {
    if (!image || !pose) {
      setError("画像とテンプレートを選択してください");
      return;
    }
    setError(null);
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setVideoUrl("https://www.w3schools.com/html/mov_bbb.mp4");
    }, 2500);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#181924] text-white">
      {/* サイドバー */}
      <aside className="w-80 min-w-[260px] max-w-xs bg-[#23243a] border-r border-[#23243a] flex flex-col px-6 py-8 gap-8 shadow-2xl z-10">
        <div>
          <div className="font-bold text-lg mb-4 tracking-wide">⏱ 長さ</div>
          <div className="flex gap-3 mb-4">
            {DURATIONS.map(d => (
              <button
                key={d}
                className={`px-4 py-2 rounded-lg font-semibold transition border ${duration === d ? "bg-blue-600 border-blue-400 text-white" : "bg-[#23243a] border-[#444] text-gray-300 hover:bg-[#2d2e4a]"}`}
                onClick={() => setDuration(d)}
              >{d}</button>
            ))}
          </div>
          <div className="font-bold text-lg mb-2 tracking-wide">縦横比</div>
          <div className="flex gap-3 mb-4">
            {RATIOS.map(r => (
              <button
                key={r.value}
                className={`px-4 py-2 rounded-lg font-semibold transition border ${ratio === r.value ? "bg-blue-600 border-blue-400 text-white" : "bg-[#23243a] border-[#444] text-gray-300 hover:bg-[#2d2e4a]"}`}
                onClick={() => setRatio(r.value)}
              >{r.label}</button>
            ))}
          </div>
          <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
            <input type="checkbox" checked={bgm} onChange={e => setBgm(e.target.checked)} className="accent-blue-500 w-5 h-5" />
            <span className="font-semibold">背景音を生成</span>
          </label>
        </div>
        <div>
          <div className="font-bold text-lg mb-2 tracking-wide">テンプレート</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {TAGS.map(t => (
              <button
                key={t}
                className={`px-3 py-1 rounded-full text-sm font-semibold border transition ${tag === t ? "bg-orange-500 border-orange-400 text-white" : "bg-[#23243a] border-[#444] text-gray-300 hover:bg-[#2d2e4a]"}`}
                onClick={() => setTag(t)}
              >{t}</button>
            ))}
          </div>
          <div className="font-bold text-base mb-2">人気</div>
          <div className="grid grid-cols-3 gap-2">
            {POSES.map(p => (
              <button
                key={p.id}
                className={`flex flex-col items-center rounded-lg overflow-hidden border-2 transition shadow group ${pose === p.id ? "border-blue-400 ring-2 ring-blue-400" : "border-[#444] hover:border-blue-400"}`}
                onClick={() => setPose(p.id)}
              >
                <div className="w-16 h-16 bg-gray-700 flex items-center justify-center">
                  <img src={p.thumb} alt={p.name} className="object-cover w-full h-full" />
                </div>
                <span className="text-xs font-semibold py-1 px-2 group-hover:text-blue-400 transition-all">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>
      {/* メインエリア */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-12 relative">
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8">
          <div className="font-extrabold text-2xl md:text-3xl text-center mb-2 tracking-wider drop-shadow-lg">商品動画生成</div>
          <div className="w-full flex flex-col items-center justify-center">
            <div
              className="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-500 rounded-2xl bg-[#23243a] hover:bg-[#23243a]/80 transition p-8 cursor-pointer w-full min-h-[320px] max-w-xl mx-auto"
              onClick={() => inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              {imageUrl ? (
                <img src={imageUrl} alt="preview" className="w-full h-80 object-contain rounded-xl shadow-xl border-4 border-gray-700 bg-black" />
              ) : (
                <>
                  <span className="text-gray-300 text-lg mb-4">画像を追加して動画の作成を始める</span>
                  <button className="mt-4 px-6 py-3 bg-blue-600 rounded-full font-bold text-white shadow hover:bg-blue-700 transition">画像を読み込む</button>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={inputRef}
                onChange={handleImageChange}
              />
            </div>
            {error && <div className="text-red-400 text-base mt-2 font-bold drop-shadow">{error}</div>}
          </div>
          <div className="w-full flex flex-col items-center gap-4 mt-6">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full max-w-md py-4 rounded-xl font-extrabold text-xl transition bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white/10`}
              disabled={!image || !pose || isGenerating}
              onClick={handleGenerate}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                  生成中...
                </span>
              ) : (
                "動画を生成する"
              )}
            </motion.button>
            {videoUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 w-full"
              >
                <label className="block text-white font-bold mb-2 text-lg">動画プレビュー</label>
                <video src={videoUrl} controls className="w-full rounded-2xl shadow-2xl aspect-video bg-black border-4 border-gray-700" />
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
