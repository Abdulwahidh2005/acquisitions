import app from "./app.js"

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port http://${PORT}`);
});

export default server;

