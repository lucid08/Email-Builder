import express from "express";
import multer from "multer";
import fs from "fs";
import cors from "cors";
import mongoose from "mongoose";
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from "./config/db.js";

dotenv.config();

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 5000 || process.env.PORT;

// MongoDB Connection
connectDB()

// Schema for EmailTemplate
const emailTemplateSchema = new mongoose.Schema({
  title: String,
  content: String,
  footer: String,
  imageUrls: [String],
});
const EmailTemplate = mongoose.model("EmailTemplate", emailTemplateSchema);

// Middleware
app.use(express.json());
const corsOptions = {
  origin: 'https://email-builder-co22.vercel.app/',  // Replace with your frontend domain
  methods: 'GET,POST,PUT,DELETE'
};

app.use(cors(corsOptions));
app.use('/uploads', express.static('uploads'));

// Multer Configuration for Image Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// API Endpoints

// 1. Get Email Layout
app.get("/getEmailLayout", (req, res) => {
  const layoutPath = path.join(__dirname, "layout.html");

  fs.readFile(layoutPath, "utf-8", (err, data) => {
    if (err) {
      console.error("Error reading layout file:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.setHeader("Content-Type", "text/html");
    res.send(data);
  });
});

// 2. Upload Image
app.post('/uploadImage', upload.array('images', 10), (req, res) => {
  try {
    const imageUrls = req.files.map((file) => `/uploads/${file.filename}`);
    console.log(imageUrls);
    
    res.status(200).json({ imageUrls });
  } catch (error) {
    console.error('Error processing file upload:', error);
    res.status(500).send('Failed to upload images');
  }
});
// 3. Upload Email Configuration
app.post("/uploadEmailConfig", async (req, res) => {
  const { title, content, footer, imageUrls } = req.body;

  if (!title || !content || !footer || !Array.isArray(imageUrls)) {
    return res.status(400).send("Invalid request data");
  }

  try {
    const emailTemplate = new EmailTemplate({ title, content, footer, imageUrls });
    await emailTemplate.save();
    res.status(201).json({ message: "Email configuration saved successfully" });
  } catch (err) {
    console.error("Error saving template:", err);
    res.status(500).send("Internal Server Error");
  }
});

// 4. Render and Download Template
app.post("/renderAndDownloadTemplate", (req, res) => {
  const { title, content, footer, imageUrls } = req.body;

  if (!title || !content || !footer || !Array.isArray(imageUrls)) {
    return res.status(400).send("Invalid request data");
  }

  const layoutPath = path.join(__dirname, "layout.html");
  console.log(imageUrls);
  

  fs.readFile(layoutPath, "utf-8", (err, template) => {
    if (err) {
      console.error("Error reading layout file:", err);
      return res.status(500).send("Internal Server Error");
    }
    imageUrls.map((url) => console.log(`http://localhost/5000${url}`)).join("")
    const renderedTemplate = template
      .replace("{{title}}", title)
      .replace("{{content}}", content)
      .replace("{{footer}}", footer)
      .replace(
        "{{#imageUrls}}",
        imageUrls.map((url) => `<img src="http://localhost:5000${url}" alt="Image" />`).join("")
      );

    res.setHeader("Content-Disposition", 'attachment; filename="email-template.html"');
    res.setHeader("Content-Type", "text/html");
    res.send(renderedTemplate);
  });
});

// Start Server
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
