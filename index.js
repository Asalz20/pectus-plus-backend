const express = require("express");
const dbConnect = require("./config/dbConnect");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const app = express();
const authRouter = require("./routes/authRoute");
const PORT = process.env.PORT || 4000;
dbConnect();

app.use(express.json());
app.use("/api/user", authRouter);

app.use(notFound);
app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
