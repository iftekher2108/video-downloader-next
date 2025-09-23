const ytdl = require("@distube/ytdl-core");
const ffmpeg = require("ffmpeg-static");
const fs = require("fs");
const cp = require("child_process");

const downloadService = async (url, title, itag, container, res) => {
  if (!url) return res.status(400).json({ error: "Missing URL" });
  try {
    const safeTitle = title.replace(/[^a-z0-9_\-\.]/gi, "_").toLowerCase();
    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, { quality: itag });
    if (!format) {
      return res
        .status(400)
        .json({ error: "Invalid itag or format not found" });
    }
    if (format.mimeType.includes("audio/")) {
      console.log(`Downloading audio format: ${format.audioQuality}`);

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeTitle + ".mp3" || "audio.mp3"}"`
      );
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Transfer-Encoding", "chunked");
      return ytdl(url, { quality: itag }).pipe(res);
    } else if (format.mimeType.includes("video/")) {
      if (format.hasAudio && format.hasVideo) {
        console.log(`Downloading progressive format: ${format.qualityLabel}`);

        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${safeTitle + ".mp4" || "video.mp4"}"`
        );
        res.setHeader("Content-Type", "video/mp4");
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Transfer-Encoding", "chunked");
        return ytdl(url, { quality: itag }).pipe(res);
      } else if (format.hasVideo && !format.hasAudio) {
        console.log(`Downloading separate streams for: ${format.qualityLabel}`);
        const video = ytdl(url, { quality: itag });
        const audio = ytdl(url, { quality: "highestaudio" });

        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${safeTitle}.mp4"`
        );
        res.setHeader("Content-Type", "video/mp4");
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Transfer-Encoding", "chunked");

        const ffmpegProcess = cp.spawn(
          ffmpeg,
          [
            "-loglevel", "error",
            "-thread_queue_size", "512", "-i", "pipe:3", // video
            "-thread_queue_size", "512", "-i", "pipe:4", // audio
            "-c:v", "copy",      // video re-encode না
            "-c:a", "aac", // audio AAC   
            // "-ar", "48000",      // sample rate fixed
            // "-ac", "2",          // stereo
            "-movflags", "frag_keyframe+empty_moov+faststart+default_base_moof",
            "-fflags", "+genpts", // timestamp fix
            "-f", "mp4",
            "pipe:1"
          ],
          { stdio: ["pipe", "pipe", "inherit", "pipe", "pipe"] }
        );

        video.pipe(ffmpegProcess.stdio[3]);
        audio.pipe(ffmpegProcess.stdio[4]);
        ffmpegProcess.stdout.pipe(res);

        ffmpegProcess.on("error", (err) => {
          console.error("FFmpeg error:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "FFmpeg processing failed" });
          }
        });

        ffmpegProcess.on("close", (code) => {
          console.log(`FFmpeg exited with code ${code}`);
        });
        return;
      }
    } else {
      return res.status(400).json({ error: "Unsupported format type" });
    }

  } catch (err) {
    console.error("Proxy download error:", err);
    res.status(500).json({ error: "Download failed" });
  }
};

module.exports = {
  downloadService,
};
