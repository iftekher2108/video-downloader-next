'use client';

import { useState } from 'react';

export default function VideoDownloader() {
  const [url, setUrl] = useState('');
  const [formats, setFormats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingFormat, setLoadingFormat] = useState(null);

  // Helper function to clean YouTube URLs
  const cleanYouTubeUrl = (inputUrl) => {
    try {
      const urlObj = new URL(inputUrl);
      // Only keep the 'v' parameter for standard YouTube video URLs
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
      // Handle short URLs like youtu.be
      if (urlObj.hostname === 'youtu.be' && urlObj.pathname.length > 1) {
        return `https://www.youtube.com/watch?v=${urlObj.pathname.substring(1)}`;
      }
      // Handle youtube.com/embed/VIDEO_ID or similar patterns
      const embedMatch = urlObj.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/);
      if (embedMatch && embedMatch[1]) {
        return `https://www.youtube.com/watch?v=${embedMatch[1]}`;
      }
    } catch (e) {
      // Not a valid URL, return original or handle as error
      console.warn("Invalid URL format during cleaning:", e);
    }
    return inputUrl; // Fallback to original if cleaning fails
  };

  const fetchFormats = async () => {
    if (!url) {
      setError('Please enter a video URL.');
      return;
    }

    setLoading(true);
    setError('');
    setFormats([]);

    // Clean the URL before sending it to the backend
    const processedUrl = cleanYouTubeUrl(url);

    try {
      const response = await fetch(`/api/download?url=${encodeURIComponent(processedUrl)}`);
      const data = await response.json();

      if (response.ok) {
        setFormats(data);
      } else {
        setError(data.error || 'Failed to fetch formats. Check the URL or try again later.');
      }
    } catch (err) {
      setError('A network error occurred. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const downloadVideo = async (formatId) => {
    setLoadingFormat(formatId);
    setError('');

    // Clean the URL before sending it to the backend for download
    const processedUrl = cleanYouTubeUrl(url);

    try {
      const response = await fetch(`/api/download?url=${encodeURIComponent(processedUrl)}&format=${formatId}`);
      const data = await response.json();

      if (response.ok && data.download_url) {
        const a = document.createElement('a');
        a.href = data.download_url;
        a.download = data.filename || 'video.mp4';
        a.target = '_blank'; // Open in a new tab
        a.rel = 'noopener noreferrer'; // Security best practice
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        setError(data.error || 'Failed to get download link.');
      }
    } catch (err) {
      setError('An error occurred while preparing the download.');
    } finally {
      setLoadingFormat(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 font-sans">
      <h1 className="text-3xl font-bold mb-6 text-center">Video Downloader</h1>

      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter YouTube video URL"
          className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button
          onClick={fetchFormats}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Fetching...' : 'Get Formats'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {formats.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-md">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-semibold text-lg">Available Formats</h3>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resolution</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formats.map((format) => (
                  <tr key={format.format_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{format.resolution}</div>
                      <div className="text-sm text-gray-500">{format.ext.toUpperCase()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      Video: {format.vcodec !== 'none' ? format.vcodec : 'N/A'}<br />
                      Audio: {format.acodec !== 'none' ? format.acodec : 'N/A'}<br />
                      {format.filesize && `Size: ~${(format.filesize / 1024 / 1024).toFixed(2)} MB`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => downloadVideo(format.format_id)}
                        disabled={!!loadingFormat}
                        className="bg-green-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors w-28 text-center"
                      >
                        {loadingFormat === format.format_id ? 'Working...' : 'Download'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}