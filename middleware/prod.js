module.exports = (app, cors, express, path) => {
  app.use(cors());
  app.use(express.static(path.join(__dirname, "../build")));

  app.get("*", (req, res, next) => {
    return res.sendFile(path.join(__dirname, "../build", "index.html"));
  });
};
