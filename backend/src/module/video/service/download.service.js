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
      res.setHeader("Content-Type", "application/octet-stream");
      ytdl(url, { quality: itag }).pipe(res);
    } else if (format.mimeType.includes("video/")) {
      // res.setHeader(
      //   "Content-Disposition",
      //   `attachment; filename="${safeTitle + "." + container || "video.mp4"}"`
      // );
      // res.setHeader("Content-Type", "application/octet-stream");
      if (format.hasAudio && format.hasVideo) {
        console.log(`Downloading progressive format: ${format.qualityLabel}`);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${safeTitle + ".mp4" || "video.mp4"}"`
        );
        res.setHeader("Content-Type", "application/octet-stream");
        ytdl(url, { quality: itag }).pipe(res);
      } else if (format.hasVideo && !format.hasAudio) {
        console.log(`Downloading separate streams for: ${format.qualityLabel}`);
        const video = ytdl(url, { quality: itag });
        const audio = ytdl(url, { quality: "highestaudio" });

        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${safeTitle}.mp4"`
        );
        res.setHeader("Content-Type", "video/mp4");

        const ffmpegProcess = cp.spawn(
          ffmpeg,
          [
            "-i",
            "pipe:3", // video input
            "-i",
            "pipe:4", // audio input
            "-c:v",
            "libx264", // transcode video to h264
            "-preset",
            "fast",
            "-crf",
            "23",
            "-c:a",
            "aac", // transcode audio to aac
            "-b:a",
            "192k",
            "-f",
            "mp4",
            "pipe:1", // output to stdout
          ],
          { stdio: ["pipe", "pipe", "inherit", "pipe", "pipe"] }
        );

        video.pipe(ffmpegProcess.stdio[3]);
        audio.pipe(ffmpegProcess.stdio[4]);
        ffmpegProcess.stdout.pipe(res);
        
        // handle ffmpeg errors to avoid crashing
        ffmpegProcess.on("error", (err) => {
          console.error("FFmpeg error:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "FFmpeg processing failed" });
          }
        });

        ffmpegProcess.on("close", (code) => {
          console.log(`FFmpeg exited with code ${code}`);
        });

      }
    } else {
      return res.status(400).json({ error: "Unsupported format type" });
    }

    // if (!response.ok) throw new Error("Failed to fetch file");

    // Pipe the response stream back to the client
    // res.setHeader(
    //   "Content-Disposition",
    //   `attachment; filename="${safeTitle + "." + container || "video.mp4"}"`
    // );
    // res.setHeader(
    //   "Content-Type",
    //   response.headers.get("content-type") || "application/octet-stream"
    // );

    // response.body.pipe(res);
  } catch (err) {
    console.error("Proxy download error:", err);
    res.status(500).json({ error: "Download failed" });
  }
};

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

module.exports = {
  downloadService,
};
