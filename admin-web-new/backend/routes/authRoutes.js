import express from "express";
const router = express.Router();

let users = [];

// REGISTER
router.post("/register", (req, res) => {
  console.log("BODY:", req.body); // 👈 debug

  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const exists = users.find((u) => u.email === email);
  if (exists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password,
    phone,
    wallet: 500,
  };

  users.push(newUser);

  res.json({ user: newUser });
});

// LOGIN
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  res.json({ user });
});

export default router;