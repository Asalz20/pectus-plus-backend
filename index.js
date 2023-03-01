const express = require("express");
const dbConnect = require("./config/dbConnect");
const app = express();
dbConnect();
const PORT = process.env.PORT || 4000;

app.use("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
