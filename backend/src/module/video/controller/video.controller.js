const ytdl = require("@distube/ytdl-core");

async function info(req, res) {
  const videoUrl = req.query.url;
  const format = req.query.type;

  if (!ytdl.validateURL(videoUrl)) {
    return res.status(400).json({ error: "Invalid URL" });
  }
  const videoInfo = await ytdl.getInfo(videoUrl);
  const qualityMap = {
    "144p": `Lowest`,
    "2160p": `Highest`,
    "1080p": `High`,
    "720p": `Medium`,
    "480p": `Low`,
    "360p": `Very Low`,
  };

  if (format === "audio") {
    res.json({
      title: videoInfo.videoDetails.title,
      length: videoInfo.videoDetails.lengthSeconds,
      thumbnail: videoInfo.videoDetails.thumbnails[0].url,
      formats: videoInfo.formats
        .filter(
          (format, index, self) =>
            format.hasAudio &&
            !format.hasVideo &&
            index === self.findIndex((f) => f.itag === format.itag)
        )
        .map((f) => ({
          itag: f.itag,
          mimeType: f.mimeType,
          bitrate: f.bitrate,
          size: f.contentLength
            ? (f.contentLength / (1024 * 1024)).toFixed(2) + " MB"
            : "N/A",
          resolution: f.qualityLabel || "N/A",
          thumbnail: videoInfo.videoDetails.thumbnails[0].url,
          url: f.url,
          hasAudio: f.hasAudio,
          hasVideo: f.hasVideo,
          quality: qualityMap[f.qualityLabel],
          fps: f.fps || "N/A",
          container: f.container,
          codecs: f.codecs,
          audioQuality: f.audioQuality || "N/A",
          audioChannels: f.audioChannels || "N/A",
        })),
    });
  } else if (format === "video") {
    res.json({
      title: videoInfo.videoDetails.title,
      length: videoInfo.videoDetails.lengthSeconds,
      thumbnail: videoInfo.videoDetails.thumbnails[0].url,
      formats: videoInfo.formats
        .filter(
          (format, index, self) =>
            format.hasVideo &&
            index === self.findIndex((f) => f.itag === format.itag)
        )
        .map((f) => ({
          itag: f.itag,
          mimeType: f.mimeType,
          bitrate: f.bitrate,
          size: f.contentLength
            ? (f.contentLength / (1024 * 1024)).toFixed(2) + " MB"
            : "N/A",
          resolution: f.qualityLabel || "N/A",
          thumbnail: videoInfo.videoDetails.thumbnails[0].url,
          url: f.url,
          hasAudio: f.hasAudio,
          hasVideo: f.hasVideo,
          quality: qualityMap[f.qualityLabel],
          fps: f.fps || "N/A",
          container: f.container,
          codecs: f.codecs,
          audioQuality: f.audioQuality || "N/A",
          audioChannels: f.audioChannels || "N/A",
        })),
    });
  } else {
    res.json({ error: "Invalid type parameter" });
  }

  // isLive: f.isLive || false,
  // isHLS: f.isHLS || false,
  // isDash: f.isDash || false,
  // approxDurationMs: f.approxDurationMs || "N/A",
  // lastModified: f.lastModified || "N/A",
  // averageBitrate: f.averageBitrate || "N/A",
  // projectionType: f.projectionType || "N/A",
  // signatureCipher: f.signatureCipher || "N/A",
  // client: f.client || "N/A",
  // lmt: f.lmt || "N/A",
}

// const download = async(req, res) => {
//     const videoUrl = req.query.url;
//     if( !ytdl.validateURL(videoUrl)) {
//         return res.status(400).json({error: "Invalid URL"});
//     }
//     const videoInfo = await ytdl.getInfo(videoUrl);
//     const format = ytdl.chooseFormat(videoInfo.formats, {quality: "highestvideo"});
//     res.header('content-disposition', `attachment; filename="${videoInfo.videoDetails.title}.mp4"`);
//     ytdl(videoUrl,{format}).pipe(res);
// }

const download = async (req, res) => {
  const { url, title, container } = req.query;
  if (!url) return res.status(400).json({ error: "Missing URL" });
  try {
    const response = await fetch(url);
    const safeTitle = title.replace(/[^a-z0-9_\-\.]/gi, "_").toLowerCase();

    if (!response.ok) throw new Error("Failed to fetch file");

    // Pipe the response stream back to the client
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeTitle + "." + container || "video.mp4"}"`
    );
    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") || "application/octet-stream"
    );

    ytdl(videoUrl, { quality: "highestvideo", filter: "audioandvideo" }).pipe(
      res
    );

    // response.body.pipe(res);
  } catch (err) {
    console.error("Proxy download error:", err);
    res.status(500).json({ error: "Download failed" });
  }
};

module.exports = { info, download };
