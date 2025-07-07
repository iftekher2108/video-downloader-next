import { NextResponse } from 'next/server';
import youtubedl from 'youtube-dl-exec'; // Import the wrapper

export const runtime = 'nodejs';
export const maxDuration = 120; // Increase maxDuration if downloading large files

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  const formatId = searchParams.get('format'); // For specific format selection

  if (!url) {
    return NextResponse.json({ error: 'A video URL is required.' }, { status: 400 });
  }

  try {
    // --- Case 1: No format ID is provided. Return a list of available formats. ---
    if (!formatId) {
      // Get video info without downloading
      const info = await youtubedl(url, {
        dumpSingleJson: true, // Get raw JSON info
        noWarnings: true,
        noProgress: true,
        flatPlaylist: true, // Speeds up playlist info for single video if URL has playlist params
      });

      // Filter and map formats similar to how you did with ytdl-core
      // yt-dlp's format structure is different, you'll need to adapt
      const availableFormats = info.formats
        .filter(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.ext === 'mp4') // Example: filter for video+audio mp4
        .map(f => ({
          format_id: f.format_id, // yt-dlp uses format_id, not itag directly for selection
          ext: f.ext,
          resolution: f.height ? `${f.height}p` : 'N/A', // Assuming height is available
          filesize: f.filesize || f.filesize_approx,
          vcodec: f.vcodec,
          acodec: f.acodec,
        }))
        .filter(f => f.resolution !== 'N/A')
        .sort((a, b) => parseInt(b.resolution) - parseInt(a.resolution));

      const audioFormats = info.formats
        .filter(f => f.acodec !== 'none' && f.vcodec === 'none' && f.ext === 'mp3') // Example: filter for audio-only mp3
        .map(f => ({
          format_id: f.format_id,
          ext: f.ext,
          resolution: 'Audio Only',
          filesize: f.filesize || f.filesize_approx,
          vcodec: 'none',
          acodec: f.acodec,
          bitrate: f.abr // audio bitrate
        }))
        .sort((a,b) => b.bitrate - a.bitrate);

      return NextResponse.json([...availableFormats, ...audioFormats]);
    }

    // --- Case 2: A format ID IS provided. Return the direct download URL. ---
    // For direct download, yt-dlp typically streams to stdout or saves to a file.
    // Returning a direct download URL like ytdl-core is less common with yt-dlp,
    // as it's designed for server-side processing/streaming.
    // If you need direct URLs, you might still run into the same issues as ytdl-core.

    // The common approach for downloading on the server with yt-dlp-exec is:
    // 1. Get info to choose the format.
    // 2. Stream the video directly from the backend to the client.

    // If you still want to try to get a direct URL (less reliable with yt-dlp):
    const selectedInfo = await youtubedl(url, {
        dumpSingleJson: true,
        format: formatId, // Request info for the specific format
        noWarnings: true,
        noProgress: true,
    });

    const selectedFormat = selectedInfo.formats.find(f => f.format_id === formatId);

    if (!selectedFormat || !selectedFormat.url) {
        return NextResponse.json({ error: 'Selected format URL not found or unsupported.' }, { status: 404 });
    }

    // Sanitize filename
    const filename = `${selectedInfo.title || 'video'}.${selectedFormat.ext}`.replace(/[\/\\?%*:|"<>]/g, '-');

    return NextResponse.json({
        download_url: selectedFormat.url,
        filename: filename,
    });

    // Alternatively, to stream the file directly from your Next.js API:
    /*
    const process = youtubedl.exec(url, {
        format: formatId,
        output: '-', // Output to stdout
    }, {
        stdio: ['pipe', 'pipe', 'pipe'], // Ensure stdout is piped
    });

    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${info.title || 'video'}.${selectedFormat.ext}"`);
    headers.set('Content-Type', selectedFormat.acodec === 'none' ? `video/${selectedFormat.ext}` : `audio/${selectedFormat.ext}`);

    // Important: You need to stream the output of the yt-dlp process
    // This is more complex in Next.js Server Actions/Route Handlers as you need a ReadableStream.
    // For a direct download stream, you'd typically do something like:
    // return new NextResponse(process.stdout, { headers });
    // This requires careful handling of errors and stream closure.
    */

  } catch (error) {
    console.error('yt-dlp-exec error:', error);
    let errorMessage = 'Failed to process video. ';
    // yt-dlp errors are often more descriptive. You might want to parse error.stderr.
    errorMessage += error.message || 'Please check the URL and try again.';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}