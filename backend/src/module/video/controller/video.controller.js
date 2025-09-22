const ytdl = require("@distube/ytdl-core");

async function info(req, res) {
    res.json({message: "video info route in working"})
}

const download = async(req, res) => {
    const videoUrl = req.query.url;
    if( !ytdl.validateURL(videoUrl)) {
        return res.status(400).json({error: "Invalid URL"});
    }
    const videoInfo = await ytdl.getInfo(videoUrl);
    const format = ytdl.chooseFormat(videoInfo.formats, {quality: "highest"});
    res.header('content-disposition', `attachment; filename="${videoInfo.videoDetails.title}.mp4"`);
    ytdl(videoUrl,{format}).pipe(res);
    res.json({message: "download route is working"})
}


module.exports = {info, download};