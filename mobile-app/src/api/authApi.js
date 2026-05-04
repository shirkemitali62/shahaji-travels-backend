import http from "./http";

export const loginUser = async ({ phone, password }) => {
  const res = await http.post("/auth/login", {
    phone,
    password,
  });
  return res.data;
};

export const registerUser = async ({ name, phone, email, password }) => {
  const res = await http.post("/auth/register", {
    name,
    phone,
    email,
    password,
  });
  return res.data;
};