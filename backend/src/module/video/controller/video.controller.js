const infoService = require("../service/info.service");
const downloadService = require("../service/download.service");

async function info(req, res) {
  const videoUrl = req.query.url;
  const format = req.query.type;
  infoService.infoService(videoUrl, format, res);
}


const download = async (req, res) => {
  const { url, title, itag, container } = req.query;
  downloadService.downloadService(url, title, itag, container, res);
};

module.exports = { info, download };
