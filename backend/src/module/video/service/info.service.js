const play = require("play-dl");

const infoService = async (videoUrl, format, res) => {
  try {
    if (!await play.validate(videoUrl)) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    const videoInfo = await play.video_info(videoUrl);
    const qualityMap = {
      "2160p": "Highest",
      "1440p": "Higher",
      "1080p": "High",
      "720p": "Medium",
      "480p": "Low",
      "360p": "Lower",
      "144p": "Lowest",
    };

    const formats = videoInfo.format; // play-dl এর ফরম্যাট লিস্ট

    console.log(formats)
    if (format === "audio") {
      res.json({
        title: videoInfo.video_details.title,
        length: videoInfo.video_details.durationInSec,
        thumbnail: videoInfo.video_details.thumbnails[0].url,
        formats: formats
          .filter(f => f.mimeType.startsWith("audio/"))
          // .map(f => ({
          //   mimeType: f.mimeType,
          //   bitrate: f.bitrate,
          //   size: f.contentLength
          //     ? (f.contentLength / (1024 * 1024)).toFixed(2) + " MB"
          //     : "N/A",
          //   resolution: f.qualityLabel || "N/A",
          //   url: f.url,
          //   fps: f.fps || "N/A",
          //   container: f.container || "N/A",
          //   codecs: f.codecs,
          //   audioQuality: f.audioQuality || "N/A",
          //   audioChannels: f.audioChannels || "N/A",
          // })),
      });
    } else if (format === "video") {
      res.json({
        title: videoInfo.video_details.title,
        length: videoInfo.video_details.durationInSec,
        thumbnail: videoInfo.video_details.thumbnails[0].url,
        formats: formats
          .filter(f => f.mimeType.startsWith("video/"))
          // .map(f => ({
          //   mimeType: f.mimeType,
          //   bitrate: f.bitrate,
          //   size: f.contentLength
          //     ? (f.contentLength / (1024 * 1024)).toFixed(2) + " MB"
          //     : "N/A",
          //   resolution: f.qualityLabel || "N/A",
          //   url: f.url,
          //   hasAudio: f.hasAudio,
          //   hasVideo: f.hasVideo,
          //   quality: qualityMap[f.qualityLabel] || "N/A",
          //   fps: f.fps || "N/A",
          //   container: f.container,
          //   codecs: f.codecs,
          //   audioQuality: f.audioQuality || "N/A",
          //   audioChannels: f.audioChannels || "N/A",
          // })),
      });
    } else {
      res.json({ error: "Invalid type parameter" });
    }
  } catch (err) {
    console.error("Info fetch error:", err);
    res.status(500).json({ error: "Failed to fetch video info" });
  }
};

module.exports = {
  infoService,
};
