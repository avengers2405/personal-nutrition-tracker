import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.get('/', (req, res)=> {
    res.status(200).send("/ path reached");
})

app.listen(PORT, ()=>{
    console.log(`Backend running on port ${PORT}`);
})