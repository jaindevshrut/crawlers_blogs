require("dotenv").config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
require("dotenv").config();
const app = express();
const port = process.env.PORT;
const mongodb = require('mongodb');
const multer = require('multer');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect(process.env.mongoose)
    .then(() => {
        console.log('Mongoose Connected');
    }).catch(e => {
        console.error("Mongoose Not Connected", e);
    });

// Set up multer for file uploads (storing in memory)
const upload = multer({ storage: multer.memoryStorage() });

// Define schema and model
const blogSchema = new mongoose.Schema({
    author: String,
    title: String,
    date: String,
    newImg: {
        filename: String,
        contentType: String,
        data: Buffer
    },
    msg: String
});

const Blogs = mongoose.model("blogs", blogSchema);

// Serve static HTML files
app.get('/', async (req, res) => {
    try {
        const blogs = await Blogs.find({});
        res.render('index', {
            blogList: blogs
        });
    } catch (err) {
        console.log(err);
        res.status(500).send("Error retrieving blogs");
    }
});


app.get('/submit', (req, res) => {
    res.sendFile(path.join(__dirname, './submit.html'));
});

// Handle form submissions
app.post("/submit", upload.single('bookPic'), async (req, res) => {
    const date = new Date();

const day = String(date.getDate()).padStart(2, '0');
const month = String(date.getMonth() + 1).padStart(2, '0'); 
const year = String(date.getFullYear()).slice(-2);


const formattedDate = `${day}-${month}-${year}`;


    try {
        const { author, title, msg } = req.body;
        if (!author || !msg) {
            console.log("Empty fields detected");
            return res.status(400).render('index', { error: "Please fill in all fields" });
        }

        let fileDocument = {};
        if (req.file) {
            fileDocument = {
                filename: req.file.originalname,
                contentType: req.file.mimetype,
                data: req.file.buffer
            };
        }
        const newData = new Blogs({
            author: author,
            title,
            date: formattedDate,
            newImg: fileDocument,
            msg: msg
        });

        await newData.save();
        console.log("New blog saved:", newData);
        res.redirect('/');
    } catch (error) {
        console.error("Error saving blog:", error);
        res.status(500).render('index', { error: "Error saving blog" });
    }
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
