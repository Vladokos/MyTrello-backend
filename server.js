const express = require("express");
const app = express();
const path = require("path");

const cors = require("cors");
app.use(cors())


const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("./config/database").connect();
const dataUsers = require("./model/user");
const dataBoards = require("./model/boards");
const dataList = require("./model/list");
const dataCard = require("./model/card");

const jsonParser = express.json();

// const prodMiddleWare = require("./middleware/prod");

const { createServer } = require("http");
const { Server } = require("socket.io");


const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5000/*",
      "http://localhost:3000/*",
      "https://mytrello-backend.onrender.com",
      "https://mytrello-frontend.onrender.com"
    ],
    methods: ["GET", "POST"],
  },
});


app.use(express.static(path.join(__dirname, "build")));



const generateAccessToken = (user_id, email) => {
  const payload = {
    user_id,
    email,
  };

  return jwt.sign(payload, process.env.TOKEN_KEY, { expiresIn: "1h" });
};

const generateResetPasswordToken = (user_id, name, email) => {
  const payload = {
    user_id,
    name,
    email,
  };

  return jwt.sign(payload, process.env.RESETTOKEN_KEY, { expiresIn: "30m" });
};

const generateRefreshToken = (user_id, email) => {
  const payload = {
    user_id,
    email,
  };

  return jwt.sign(payload, process.env.REFRESHTOKEN_KEY, { expiresIn: "15d" });
};

const transporter = nodemailer.createTransport({
  host: "smtp.mail.ru",
  port: 465,
  secure: true,
  auth: {
    user: "anonimys.7712@mail.ru",
    pass: "bU7KWawFmwDSrytAyDqt",
  },
});

app.get("/boards/:id/one", async (req, res) => {
  try {
    const boardId = req.params.id;
    const boardData = await dataBoards.findById(boardId);

    if (!boardData) return res.status(400).send("Error");

    return res.status(200).send(boardData);
  } catch (error) {
    console.log(error);
    console.log("/boards/:id/one");
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
    console.log("/boards/:id/all");
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

app.post("/board/lists/get", jsonParser, async (req, res) => {
  try {
    const { boardId } = req.body;

    const listsData = await dataList.find({ boardId });

    if (!listsData) return res.status(400).send("Error");

    return res.status(200).send(listsData);
  } catch (error) {
    console.log(error);
    console.log('/board/lists/get');
    return res.status(400).send("Error");
  }
});

app.post("/board/lists/getOne", jsonParser, async (req, res) => {
  try {
    const { listId } = req.body;

    const listsData = await dataList.findById(listId);

    if (!listsData) return res.status(400).send("Error");

    return res.status(200).send(listsData);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error");
  }
});

app.post("/board/list/create", jsonParser, async (req, res) => {
  try {
    const { nameList, boardId } = req.body;

    const newList = await new dataList({
      nameList,
      boardId,
      archived: false,
    });

    const list = await newList.save();

    const board = await dataBoards.findById(boardId);
    board.lists.push(list);

    await board.save();

    return res.status(200).send(list);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error");
  }
});

app.post("/board/list/move", jsonParser, async (req, res) => {
  try {
    const { position, boardId, currentListId } = req.body;

    const board = await dataBoards.findById(boardId);

    board.lists.splice(board.lists.indexOf(currentListId), 1);
    board.lists.splice(position, 0, currentListId);

    await board.save();

    return res.status(200).send(board);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error");
  }
});

app.post("/board/list/card/get", jsonParser, async (req, res) => {
  try {
    const { boardId } = req.body;

    const cardData = await dataCard.find({ boardId });

    if (!cardData) return res.status(400).send("Error");

    return res.status(200).send(cardData);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error");
  }
});
app.post("/board/list/card/getOne", jsonParser, async (req, res) => {
  try {
    const { cardId } = req.body;

    const cardData = await dataCard.findById(cardId);

    if (!cardData) return res.status(400).send("Error");

    return res.status(200).send(cardData);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error");
  }
});

app.post("/board/list/card/create", jsonParser, async (req, res) => {
  try {
    const { nameCard, boardId, listId } = req.body;

    const newCard = await new dataCard({
      nameCard,
      descriptionCard: "",
      boardId,
      archived: false,
    });

    const card = await newCard.save();

    const list = await dataList.findById(listId);
    list.cards.push(card);

    await list.save();

    return res.status(200).send(card);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error");
  }
});
// change
app.post("/board/list/card/move", jsonParser, async (req, res) => {
  try {
    const { fromListId, toListId, position, cardId } = req.body;

    if (fromListId === toListId) {
      const oldList = await dataList.findById(fromListId);

      oldList.cards.splice(oldList.cards.indexOf(cardId), 1);
      oldList.cards.splice(position, 0, cardId);

      await oldList.save();

      return res.status(200).send({ oldList });
    } else {
      const oldList = await dataList.findById(fromListId);
      const newList = await dataList.findById(toListId);

      oldList.cards.splice(oldList.cards.indexOf(cardId), 1);
      newList.cards.splice(position, 0, cardId);

      await oldList.save();
      await newList.save();

      return res.status(200).send({ oldList, newList });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error");
  }
});

app.post("/board/nameChange", jsonParser, async (req, res) => {
  try {
    const { nameBoard, boardId } = req.body;

    const board = await dataBoards.findById(boardId);

    if (!board) return res.status(400).send("Error");

    board.nameBoard = nameBoard;

    await board.save();

    return res.status(200).send({ nameBoard, boardId });
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error");
  }
});

app.post("/board/list/changeName", jsonParser, async (req, res) => {
  try {
    const { listId, nameList } = req.body;

    const list = await dataList.findById(listId);

    if (!list) return res.status(400).send("Error");

    list.nameList = nameList;

    await list.save();

    return res.status(200).send({ listId, nameList });
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error");
  }
});

app.post("/board/list/card/changeName", jsonParser, async (req, res) => {
  try {
    const { cardId, nameCard } = req.body;

    const card = await dataCard.findById(cardId);

    if (!card) return res.status(400).send("Error");

    card.nameCard = nameCard;

    await card.save();

    return res.status(200).send({ cardId, nameCard });
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error");
  }
});

app.post("/board/list/card/changeDescription", jsonParser, async (req, res) => {
  try {
    const { cardId, description } = req.body;

    const card = await dataCard.findById(cardId);

    if (!card) return res.status(400).send("Error");

    card.descriptionCard = description.trim();

    await card.save();

    return res.status(200).send({ cardId, description });
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error");
  }
});

app.post("/board/list/card/deleteCard", jsonParser, async (req, res) => {
  try {
    const { cardId } = req.body;

    const card = await dataCard.findById(cardId);

    const [list] = await dataList.find({ cards: cardId });

    if (!card || !list) return res.status(400).send("Error");

    await card.remove();
    await list.cards.remove({ _id: cardId });
    await list.save();

    return res.status(200).send({ cardId });
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error");
  }
});

app.post("/board/list/card/archive", jsonParser, async (req, res) => {
  try {
    const { cardId } = req.body;

    const card = await dataCard.findById(cardId);

    if (!card) return res.status(400).send("Error");

    card.archived = true;

    await card.save();

    return res.status(200).send({ cardId });
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error");
  }
});

app.post("/board/list/card/unarchive", jsonParser, async (req, res) => {
  try {
    const { cardId } = req.body;

    const card = await dataCard.findById(cardId);

    if (!card) return res.status(400).send("Error");

    card.archived = false;

    await card.save();

    return res.status(200).send({ cardId });
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error");
  }
});

app.post("/board/list/delete", jsonParser, async (req, res) => {
  try {
    const { listId } = req.body;

    const list = await dataList.findById(listId);

    const [board] = await dataBoards.find({ lists: listId });

    if (!list || !board) return res.status(400).send("Error");

    list.cards.map((card) => {
      dataCard.find({ _id: card }, (err, doc) => {
        if (err) console.log(err);

        if (doc) {
          doc[0].remove();
        }
      });
    });

    await list.remove();
    await board.lists.remove({ _id: listId });
    await board.save();

    return res.status(200).send({ listId });
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error");
  }
});

app.post("/board/list/archive", jsonParser, async (req, res) => {
  try {
    const { listId } = req.body;

    const list = await dataList.findById(listId);

    if (!list) return res.status(400).send("Error");

    list.archived = true;

    await list.save();

    return res.status(200).send({ listId });
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error");
  }
});

app.post("/board/list/unarchive", jsonParser, async (req, res) => {
  try {
    const { listId } = req.body;

    const list = await dataList.findById(listId);

    if (!list) return res.status(400).send("Error");

    list.archived = false;

    await list.save();

    return res.status(200).send({ listId });
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error");
  }
});

app.post("/user/change/name", jsonParser, async (req, res) => {
  try {
    const { userName, oldName } = req.body;

    const user = await dataUsers.findOne({ name: oldName });

    if (!user) return res.status(400).send("Error");

    user.name = userName;

    await user.save();

    return res.status(200).send({ userName });
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error");
  }
});

  // app.get("*", (req, res, next) => {
  //   res.sendFile(path.join(__dirname, "build", "index.html"));
  // });

io.on("connect", (socket) => {
  
  socket.on("oldUser", async (refreshToken) => {
    try {
      jwt.verify(refreshToken, process.env.REFRESHTOKEN_KEY);

      const user = await dataUsers.findOne({ refreshToken });

      if (!user) return socket.emit("oldUser", "Error");

      user.token = generateAccessToken(user._id, user.email);
      user.refreshToken = generateRefreshToken(user._id, user.email);

      await user.save();

      socket.emit("oldUser", {
        refreshToken: user.refreshToken,
        accessToken: user.token,
        userName: user.name,
        userID: user._id,
      });
    } catch (error) {
      console.log(error);
      return socket.emit("oldUser", "Error");
    }
  });


  app.get("*", (req, res, next) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
  });

  socket.on("signIn", async (email, password) => {
    try {
      const user = await dataUsers.findOne({ email });

      const decryptPassword = await bcrypt.compare(password, user.password);

      if (user && decryptPassword) {
        const token = generateAccessToken(user._id, email);
        const refreshToken = generateRefreshToken(user._id, email);

        user.token = token;
        user.refreshToken = refreshToken;

        await user.save();

        socket.emit("signIn", {
          userName: user.name,
          refreshToken,
          accessToken: token,
        });
      }

      // return res.sendStatus(400);
      return socket.emit("signIn", "Error");
    } catch (error) {
      console.log(error);
      return socket.emit("signIn", "Error");
    }
  });
  socket.on("registration", async (email, name, password) => {
    try {
      const oldUser = await dataUsers.findOne({ email });
      if (oldUser) return socket.emit("registration", "Exist");

      const encryptPassword = await bcrypt.hash(password, 12);

      const information = await new dataUsers({
        email: email.toLowerCase(),
        name,
        password: encryptPassword,
      });

      const token = generateAccessToken(information._id, email);
      const refreshToken = generateRefreshToken(information._id, email);

      information.token = token;
      information.refreshToken = refreshToken;

      transporter.sendMail(
        {
          from: "MyTrello <anonimys.7712@mail.ru>",
          to: email,
          subject: "Спаисобо за регистрацию",
          text: "Благодарим за регистрацию на сервисе",
        },
        (error, info) => {
          if (error) return console.log(error);
          return;
        }
      );

      await information.save();

      return socket.emit("registration", {
        userName: name,
        refreshToken,
        accessToken: token,
      });
    } catch (error) {
      console.log(error);
      // res.status(400).send("Error");
      return socket.emit("oldUser", "Error");
    }
  });
  socket.on("forgot", async (email, name) => {
    try {
      const user = await dataUsers.findOne({ email, name });

      if (!user) return socket.emit("forgot", "User not found");

      const resetToken = generateResetPasswordToken(user._id, name, email);

      user.resetToken = resetToken;

      await user.save();

      transporter.sendMail({
        from: "MyTrello <anonimys.7712@mail.ru>",
        to: email,
        subject: "Сброс пароля",
        text:
          "Ваша ссылка для сброса пароля\n ссылка действительна 30 минут\n " +
          "https://mytrello-backend.onrender.com/" +
          user.resetToken +
          "/reset/",
      });

      return socket.emit("forgot", "Success");
    } catch (error) {
      console.log(error);
      // res.status(400).send("Error");
      return socket.emit("oldUser", "Error");
    }
  });

  socket.on("tokenValidate", async (token) => {
    try {
      const { resetToken } = await dataUsers.findOne({ resetToken: token });

      if (!resetToken) return socket.emit("tokenValidate", "User not found");

      return socket.emit("tokenValidate", "Valid");
    } catch (error) {
      console.log(error);
      // res.status(400).send("Error");
      return socket.emit("tokenValidate", "Error");
    }
  });

  socket.on("passwordReset", async (token, password) => {
    try {
      const data = await dataUsers.findOne({ resetToken: token });

      if (!data) return socket.emit("passwordReset", "User not found");

      const decryptPassword = await bcrypt.compare(password, data.password);

      if (decryptPassword) {
        return socket.emit("passwordReset", "Need another password");
      }

      const encryptPassword = await bcrypt.hash(password, 12);

      const newToken = generateAccessToken(data._id, data.email);
      const refreshToken = generateRefreshToken(data._id, data.email);

      data.password = encryptPassword;
      data.resetToken = null;
      data.token = newToken;
      data.refreshToken = refreshToken;

      await data.save();

      return socket.emit("passwordReset", "Success");
    } catch (error) {
      console.log(error);
      // res.status(400).send("Error");
      return socket.emit("passwordReset", "Error");
    }
  });

  socket.on("tokenVerify", async (accessToken) => {
    try {
      const { user_id } = jwt.decode(accessToken, process.env.TOKEN_KEY);

      var data = await dataUsers.findById(user_id);

      if (!data) return socket.emit("tokenVerify", "Error");
      // maybe need generate new access and refresh token
      jwt.verify(accessToken, process.env.TOKEN_KEY);

      const idUser = data._id;
      var userName = data.name;

      return socket.emit("tokenVerify", { idUser, userName });
    } catch (error) {
      if (
        error.message === "jwt expired" ||
        error.name === "TokenExpiredError"
      ) {
        const { refreshToken } = data;
        const idUser = data._id;

        jwt.verify(refreshToken, process.env.REFRESHTOKEN_KEY, (error) => {
          if (error) return error;
        });

        const newToken = generateAccessToken(idUser, data.email);
        const newRefreshToken = generateRefreshToken(idUser, data.email);

        data.token = newToken;
        data.refreshToken = newRefreshToken;

        await data.save();

        return socket.emit("tokenVerify", { newToken, idUser, userName });
      } else {
        socket.emit("tokenVerify", "Error");
      }
    }
  });

  socket.on("room", async (roomId) => {
    // console.log(roomId);
    return await socket.join(roomId);
  });

  socket.on("bond", async (data) => {
    try {
      const { roomId, message, position } = data;
      const { cardId, fromListId, toListId } = data;
      const { listId, currentListId } = data;
      switch (message) {
        case "board changed":
          socket.broadcast.to(roomId).emit("bond", { message: "Update board" });
          break;
        case "list added":
          socket.broadcast.to(roomId).emit("bond", { message: "Update lists" });
          break;
        case "list changed":
          socket.broadcast
            .to(roomId)
            .emit("bond", { message: "Update list", listId });
          break;
        case "list deleted":
          socket.broadcast
            .to(roomId)
            .emit("bond", { message: "Delete list", listId });
          break;
        case "list moved":
          socket.broadcast.to(roomId).emit("bond", {
            message: "Move list",
            position,
            currentListId,
          });
          break;
        case "card added":
          socket.broadcast.to(roomId).emit("bond", { message: "Update cards" });
          break;
        case "card changed":
          socket.broadcast
            .to(roomId)
            .emit("bond", { message: "Update card", cardId });
          break;
        case "card deleted":
          socket.broadcast
            .to(roomId)
            .emit("bond", { message: "Delete card", cardId });
          break;
        case "card moved":
          socket.broadcast
            .to(roomId)
            .emit("bond", { message: "Move card", fromListId, toListId });
          break;
        case "disconnect":
          socket.broadcast.to(roomId).emit("bond", { message: "disconnect" });
          break;
        default:
          break;
      }
    } catch (error) {
      console.log(error);
      // res.status(400).send("Error");
      return socket.emit("bond", "Error");
    }
  });

  socket.on("addLink", async (link, boardId) => {
    try {
      const board = await dataBoards.findById(boardId);

      if (!board) return socket.emit("addLink", "Error");

      // check it later
      board.shareLink = link;
      board.idUser.splice(1, board.idUser.length);

      await board.save();

      socket.join(boardId);

      return socket.emit("addLink", "Added");
    } catch (error) {
      console.log(error);
      // res.status(400).send("Error");
      return socket.emit("addLink", "Error");
    }
  });

  socket.on("checkUser", async (data) => {
    try {
      const { idUser, boardId } = data;

      const board = await dataBoards.findById(boardId);

      if (!board) return socket.emit("addLink", "Error");

      const hasUser = board.idUser.includes(idUser);

      if (hasUser) {
        return socket.emit("checkUser", "True");
      } else {
        return socket.emit("checkUser", "Error");
      }
    } catch (error) {
      console.log(error);

      return socket.emit("addLink", "Error");
    }
  });

  socket.on("validateInvite", async (data) => {
    try {
      const { link, userId } = data;

      const board = await dataBoards.findOne({ shareLink: link });

      for (let i = 0; i < board.idUser.length; i++) {
        if (board.idUser[i].equals(userId)) {
          return socket.emit("validateInvite", "Already added");
        }
      }

      board.idUser.push(userId);

      await board.save();

      return socket.emit("validateInvite", "Added");
    } catch (error) {
      console.log(error);

      return socket.emit("validateInvite", "Error");
    }
  });
});

httpServer.listen(process.env.PORT || 5000, () => {
  console.log("Server is running");
});
