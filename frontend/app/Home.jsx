"use client";
import Image from "next/image";
import { useState } from "react";
export default function VideoDownloader() {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("video");
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    if (!url) return;
    try {
      setVideoInfo(null);
      setLoading(true);
      setError(null);
      const info = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/info?url=${url}&type=${format}`);
      if (!info.ok) {
        setLoading(false);
        setError("Failed to info video. Please check the URL and try again.");
        return;
      }
      const infoData = await info.json();
      setVideoInfo(infoData);
      console.log(infoData);
    } catch (err) {
      console.error("Error fetching video info:", err);
    } finally {
      setLoading(false);
      setError(null);
    }
  };

  const singleDownload = (videoInfo, format, videoUrl) => {
    if (!format) {
      setError("Invalid format selected for download.");
      return;
    }
    if(!videoUrl) {
      setError("Invalid URL.");
      return;
    }
    const response = `${process.env.NEXT_PUBLIC_API_URL}/api/download?url=${encodeURIComponent(videoUrl)}&title=${encodeURIComponent(videoInfo.title)}&itag=${format.itag}&type=${format.mimeType}`;
    const a = document.createElement("a");
    a.href = response;
    const safeTitle = format.title;
    const extension = (typeof format === "string" && format.startsWith("audio/")) ? "mp3" : "mp4";
    a.download = safeTitle + "." + extension;
    document.body.appendChild(a);
    // a.target = "_blank";
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-10">
      <div className="sticky top-0 p-4 bg-base-100 w-full z-10">
        <div className="flex  flex-col items-center ">
          <h1 className="text-2xl font-bold mb-4">
            🎥 YouTube Video Downloader
          </h1>
          <div className="grid md:grid-cols-4 grid-cols-1 gap-2">
            <label htmlFor="url" className="col-span-2 floating-label">
              <span>YouTube URL</span>
              <input
                type="text"
                placeholder="Paste YouTube URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="input input-primary focus:outline-0  rounded w-80 mb-4"
              />
            </label>

            <select
              name="format"
              id="format"
              className="col-span-1 select select-primary focus:outline-0 rounded"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="video">Video</option>
              <option value="audio">Audio</option>
            </select>
            <button
              onClick={handleDownload}
              className="col-span-1 btn btn-primary rounded"
            >
              {loading ? "Fetching..." : "Fetch Info"}
            </button>
          </div>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      </div>

      {videoInfo && (
        <>
          {/* <div className="mt-4 p-4 border rounded w-80">
            <h2 className="text-xl font-bold">{videoInfo.title}</h2>
            <p>Duration: {videoInfo.length} seconds</p>
          </div> */}
          <div className="mt-4">
            <h3 className="text-lg font-bold">Available Formats:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {videoInfo.formats.map((format) => (
                <div
                  className="card col-span-1 border border-primary p-4"
                  key={format.itag}
                >
                  <Image
                    src={videoInfo.thumbnail}
                    alt={videoInfo.title}
                    className="rounded"
                    width={500}
                    height={200}
                  />

                  <h3 className="text-primary text-base font-semibold mt-2">
                    {videoInfo.title}
                  </h3>

                  <div className="flex justify-between">
                    {/* <p>Size: {format.size}</p> */}
                    <p>{format.quality}</p>
                    {format.mimeType.startsWith('video/') &&
                    <p>
                      Resolution: {format.qualityLabel}
                    </p> }
                    
                  </div>

                  <div className="flex justify-between">
                    {/* <p>Bitrate: {format.bitrate}</p> */}
                    {format.mimeType.startsWith("video/") && 
                    <p>FPS: {format.fps}</p>
                    }
                    
                  </div>

                  {/* <p>Itag: {format.itag}</p> */}
                  <p>Format: {format.mimeType}</p>
                  <button
                    onClick={() => singleDownload(videoInfo, format, url)}
                    className="btn btn-primary mt-2"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
