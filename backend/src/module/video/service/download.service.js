const play = require("play-dl");
const ffmpeg = require("ffmpeg-static");
const cp = require("child_process");

const downloadService = async (url, title, quality, type, res) => {
  if (!url) return res.status(400).json({ error: "Missing URL" });

  try {
    const safeTitle = title.replace(/[^a-z0-9_\-\.]/gi, "_").toLowerCase();

    // Video info
    const info = await play.video_info(url);

    // সব format play-dl এ থাকে `info.formatStreams` এর মধ্যে
    const format = info.formatStreams.find(
      (f) =>
        f.qualityLabel === quality || // video quality match
        f.audioQuality === quality || // audio quality match
        f.itag?.toString() === quality.toString() // itag দিয়ে match
    );

    if (!format) {
      return res.status(400).json({ error: "Invalid format or quality" });
    }

    // 1️⃣ শুধুমাত্র অডিও ডাউনলোড
    if (type.startsWith('audio/')) {
      console.log(`Downloading audio: ${format.audioQuality}`);

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeTitle}.mp3"`
      );
      res.setHeader("Content-Type", "audio/mpeg");

      const stream = await play.stream_from_info(format);
      return stream.stream.pipe(res);
    }

    // 2️⃣ ভিডিও + অডিও (progressive format)
    if (format.hasVideo && format.hasAudio) {
      console.log(`Downloading progressive video: ${format.qualityLabel}`);

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeTitle}.mp4"`
      );
      res.setHeader("Content-Type", "video/mp4");

      const stream = await play.stream_from_info(format);
      return stream.stream.pipe(res);
    }

    // 3️⃣ শুধু ভিডিও (audio আলাদা merge করতে হবে ffmpeg দিয়ে)
    if (format.hasVideo && !format.hasAudio) {
      console.log(`Merging video + audio: ${format.qualityLabel}`);

      const videoStream = await play.stream_from_info(format);
      const audioStream = await play.stream(url, { quality: "highestaudio" });

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeTitle}.mp4"`
      );
      res.setHeader("Content-Type", "video/mp4");

      const ffmpegProcess = cp.spawn(
        ffmpeg,
        [
          "-loglevel", "error",
          "-thread_queue_size", "512", "-i", "pipe:3", // video
          "-thread_queue_size", "512", "-i", "pipe:4", // audio
          "-c:v", "copy",
          "-c:a", "aac",
          "-movflags", "frag_keyframe+empty_moov+faststart+default_base_moof",
          "-fflags", "+genpts",
          "-f", "mp4",
          "pipe:1",
        ],
        { stdio: ["pipe", "pipe", "inherit", "pipe", "pipe"] }
      );

      videoStream.stream.pipe(ffmpegProcess.stdio[3]);
      audioStream.stream.pipe(ffmpegProcess.stdio[4]);
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

    return res.status(400).json({ error: "Unsupported format" });

  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Download failed" });
  }
};

module.exports = {
  downloadService,
};