'use client';
import { useState } from 'react';
export default function VideoDownloader() {
  const [url, setUrl] = useState("");

  const handleDownload = async() => {
    if (!url) return;
    const api_url = process.env.API_URL || '';

    const res = await fetch(`${api_url}/api/download?url=${url}`);
    if (!res.ok) {
      alert("Failed to download video. Please check the URL and try again.");
      return;
    }
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'video.mp4';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-10">
      <h1 className="text-2xl font-bold mb-4">🎥 YouTube Video Downloader</h1>
      <div className='flex gap-2'>
        <input
          type="text"
          placeholder="Paste YouTube URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="input input-primary focus:outline-0  rounded w-80 mb-4"
        />
        <button
          onClick={handleDownload}
          className="btn btn-primary rounded"
        >
          Download
        </button>
      </div>

    </div>
  );
}