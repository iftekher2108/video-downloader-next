const ytdl = require("@distube/ytdl-core");
const infoService = async (videoUrl, format, res) => {
  if (!ytdl.validateURL(videoUrl)) {
    return res.status(400).json({ error: "Invalid URL" });
  }
  const videoInfo = await ytdl.getInfo(videoUrl);
  const qualityMap = {
    "2160p": `Highest`,
    "1440p": `Higher`,
    "1080p": `High`,
    "720p": `Medium`,
    "480p": `Low`,
    "360p": `Lower`,
    "144p": `Lowest`
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


module.exports = {
  infoService
}