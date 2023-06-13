export const getBoard = app.get("/boards/:id/one", async (req, res) => {
  try {
    const boardId = req.params.id;
    const boardData = await dataBoards.findById(boardId);

    if (!boardData) return res.status(400).send("Error");

    return res.status(200).send(boardData);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error");
  }
});

app.get("/boards/:id/all", async (req, res) => {
  try {
    const idUser = req.params.id;

    const boardsData = await dataBoards.find({
      idUser,
    });

    if (!boardsData) return res.status(400).send("Error");

    return res.status(200).send(boardsData);
  } catch (error) {
    console.log(error);
    res.status(400).send("Error");
  }
});

app.post("/boards/create", jsonParser, async (req, res) => {
  try {
    const { nameBoard, idUser } = req.body;

    const newBoard = await new dataBoards({
      nameBoard,
      owner: idUser,
      idUser,
      favorites: false,
      lastVisiting: null,
      shareLink: null,
    });

    newBoard.save((error) => {
      if (error) {
        console.log(error);
        return res.sendStatus(500);
      }
    });

    res.status(200).send(newBoard);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error");
  }
});

app.post("/board/addFavorites", jsonParser, async (req, res) => {
  try {
    const { boardId } = req.body;

    const board = await dataBoards.findById(boardId);

    if (!board) return res.status(400).send("Error");

    board.favorites = true;

    await board.save();

    res.status(200).send({ boardId });
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error");
  }
});
app.post("/board/removeFavorites", jsonParser, async (req, res) => {
  try {
    const { boardId } = req.body;

    const board = await dataBoards.findById(boardId);

    if (!board) return res.status(400).send("Error");

    board.favorites = false;

    await board.save();

    res.status(200).send({ boardId });
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error");
  }
});

app.post("/board/changeData", jsonParser, async (req, res) => {
  try {
    const { boardId, date } = req.body;

    const board = await dataBoards.findById(boardId);

    if (!board) return res.status(400).send("Error");

    board.lastVisiting = date;

    await board.save();

    res.status(200).send({ boardId, date });
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error");
  }
});
