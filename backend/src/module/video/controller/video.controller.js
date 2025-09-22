const ytdl = require("@distube/ytdl-core");

async function info(req, res) {
    res.json({message: "video info route in working"})
}

module.exports = {info};