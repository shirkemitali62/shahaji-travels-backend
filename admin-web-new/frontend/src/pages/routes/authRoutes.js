// routes/authRoutes.js

import express from "express";

const router = express.Router();

// Dummy users (temporary DB)
let users = [];

// REGISTER
router.post("/register", (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  const existingUser = users.find((u) => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password,
    phone,
    wallet: 500, // default wallet
  };

  users.push(newUser);

  res.json({ user: newUser });
});

// LOGIN
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  res.json({ user });
});

export default router;