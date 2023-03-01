const express = require("express");
const dbConnect = require("./config/dbConnect");
const app = express();
const authRouter = require("./routes/authRoute");
dbConnect();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use("/api/user", authRouter);

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
