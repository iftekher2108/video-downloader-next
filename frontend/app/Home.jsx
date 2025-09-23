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
      const info = await fetch(`http://localhost:3001/api/info?url=${url}&type=${format}`);
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
    const response = `http://localhost:3001/api/download?url=${encodeURIComponent(videoUrl)}&title=${encodeURIComponent(videoInfo.title)}&itag=${format.itag}&container=${format.container}`;
    // const blob = await response.blob();
    // if (blob.size === 0) {
    //   throw new Error("Downloaded file is empty");
    // }
    // const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = response;
    // .replace(/[^a-z0-9]/gi, "_").toLowerCase()
    const safeTitle = format.title;
    a.download = safeTitle + "." + (format.includes('audio/') === "audio" ? "mp3" : "mp4");
    document.body.appendChild(a);
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
                  className="card col-span-1 p-4 border border-primary"
                  key={format.itag}
                >
                  <div className="flex justify-between gap-2 mb-2">
                    <p>
                      {format.quality}{" "}
                      {format.hasVideo && !format.hasAudio
                        ? "(Video Only)"
                        : ""}
                      {format.hasAudio && !format.hasVideo
                        ? "(Audio Only)"
                        : ""}{" "}
                      {format.hasAudio && format.hasVideo
                        ? "(Audio & Video)"
                        : ""}
                    </p>
                  </div>
                  <Image
                    src={format.thumbnail}
                    alt={format.resolution}
                    className="rounded"
                    width={500}
                    height={200}
                  />

                  <h3 className="text-primary text-base font-semibold mt-2">
                    {videoInfo.title}
                  </h3>

                  <div className="flex justify-between">
                    <p>Size: {format.size}</p>
                    <p className="col-span-3">
                      Resolution: {format.resolution}
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <p>Bitrate: {format.bitrate}</p>
                    <p>FPS: {format.fps}</p>
                  </div>

                  <p>Itag: {format.itag}</p>
                  <p>Format: {format.mimeType}</p>
                  <p>Container: {format.container}</p>
                  <button
                    onClick={() => singleDownload(videoInfo, format, url)}
                    className="btn btn-primary my-2"
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
