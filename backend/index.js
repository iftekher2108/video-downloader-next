const express = require('express');
const videoRoute = require("./src/module/video/route")
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());

// app.use(express.json());

app.use('/api',videoRoute);



app.listen(PORT,() =>{
    console.log(`server is running on port http://localhost:${PORT}`);
})