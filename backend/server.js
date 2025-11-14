/* ==========================================================
   Saheli Backend (Minimal API)
   - Express server for user signup/login
   - Uses JSON file as local database
   ========================================================== */

const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Local JSON file to act as DB
const usersFile = path.join(__dirname, "users.json");

// Ensure users.json exists
if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, "[]", "utf8");
  console.log("✅ Created users.json");
}

// Utility to read/write users
function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(usersFile, "utf8"));
  } catch {
    return [];
  }
}
function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

/* ======================================
   SIGNUP — POST /api/signup
   ====================================== */
app.post("/api/signup", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields required" });

  const users = readUsers();
  if (users.find((u) => u.email === email))
    return res.status(400).json({ message: "User already exists" });

  const newUser = { id: Date.now(), name, email, password };
  users.push(newUser);
  saveUsers(users);

  console.log(`🆕 Registered user: ${email}`);
  res.json({ message: "User registered successfully!" });
});

/* ======================================
   LOGIN — POST /api/login
   ====================================== */
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();

  const user = users.find(
    (u) => u.email === email && u.password === password
  );
  if (!user)
    return res.status(401).json({ message: "Invalid credentials" });

  console.log(`✅ Login success: ${email}`);
  res.json({ message: "Login successful", user });
});

/* ======================================
   ROOT CHECK — GET /
   ====================================== */
app.get("/", (req, res) => {
  res.send("🌸 Saheli Backend Active!");
});

/* ======================================
   START SERVER
   ====================================== */
app.listen(PORT, () => {
  console.log(`🚀 Saheli backend running on http://localhost:${PORT}`);
});

/* ===============================
   🩸 Saheli Story Wall API
   =============================== */
import path from "path";
import fs from "fs";
import sqlite3 from "sqlite3";
import multer from "multer";
import express from "express";
import cors from "cors";

const __dirname = path.resolve();
const dbPath = path.join(__dirname, "backend", "stories.db");
const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const db = new sqlite3.Database(dbPath);
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    age INTEGER,
    story TEXT,
    tags TEXT,
    image TEXT,
    likes INTEGER DEFAULT 0,
    created_at INTEGER
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id INTEGER,
    name TEXT,
    comment TEXT,
    created_at INTEGER
  )`);
});

const upload = multer({ dest: uploadsDir });

// Serve uploads folder
app.use("/uploads", express.static(uploadsDir));

/* -------- GET stories (with search and tags) -------- */
app.get("/api/stories", (req, res) => {
  const q = req.query.q ? `%${req.query.q.toLowerCase()}%` : "%";
  db.all(
    `SELECT * FROM stories WHERE LOWER(story) LIKE ? OR LOWER(tags) LIKE ? ORDER BY created_at DESC`,
    [q, q],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

/* -------- POST story -------- */
app.post("/api/stories", upload.single("photo"), (req, res) => {
  const { name, age, story, tags } = req.body;
  if (!story) return res.status(400).json({ error: "Story text required" });

  const filename = req.file ? `/uploads/${req.file.filename}` : null;
  const ts = Date.now();
  db.run(
    `INSERT INTO stories (name, age, story, tags, image, created_at) VALUES (?,?,?,?,?,?)`,
    [name || "Anonymous", age || null, story, tags || "", filename, ts],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        id: this.lastID,
        name,
        age,
        story,
        tags,
        image: filename,
        created_at: ts,
        likes: 0,
      });
    }
  );
});

/* -------- LIKE a story -------- */
app.post("/api/stories/:id/like", (req, res) => {
  db.run(`UPDATE stories SET likes = likes + 1 WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

/* -------- GET comments -------- */
app.get("/api/stories/:id/comments", (req, res) => {
  db.all(
    `SELECT * FROM comments WHERE story_id = ? ORDER BY created_at DESC`,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

/* -------- POST comment -------- */
app.post("/api/stories/:id/comments", (req, res) => {
  const { name, comment } = req.body;
  if (!comment) return res.status(400).json({ error: "Comment required" });

  const ts = Date.now();
  db.run(
    `INSERT INTO comments (story_id, name, comment, created_at) VALUES (?,?,?,?)`,
    [req.params.id, name || "Anonymous", comment, ts],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        id: this.lastID,
        story_id: req.params.id,
        name,
        comment,
        created_at: ts,
      });
    }
  );
});
