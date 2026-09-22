const axios = require('axios');
const mongoose = require('mongoose');

async function test() {
  try {
    const res = await axios.get('http://localhost:5000/api/user?role=ROLE_DRIVER');
    console.log("Without Auth:");
    console.log(res.data);
  } catch (err) {
    console.log("Without Auth Failed:", err.response?.status);
  }
}

test();
