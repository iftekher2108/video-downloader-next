const express = require('express');
const ytdl = require('@distube/ytdl-core');
const videoRoute = require("./src/module/video/route")
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());

app.get('/',(req,res) => {
    res.json({name: "iftekher mahmud pervez"})
})
// app.use(express.json());

app.use('/',videoRoute);

app.get('/api/download', async(req, res) => {
    const videoUrl = req.query.url;
    if( !ytdl.validateURL(videoUrl)) {
        return res.status(400).json({error: "Invalid URL"});
    }
    const videoInfo = await ytdl.getInfo(videoUrl);
    const format = ytdl.chooseFormat(videoInfo.formats, {quality: 'highestvideo'});
    res.header('content-disposition', `attachment; filename="${videoInfo.videoDetails.title}.mp4"`);
    ytdl(videoUrl,{format}).pipe(res);
})



app.listen(PORT,() =>{
    console.log(`server is running on port http://localhost:${PORT}`);
})