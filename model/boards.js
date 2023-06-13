const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const dataBoardsSchema = new Schema(
  {
    nameBoard: String,
    owner: { type: Schema.Types.ObjectId, ref: "datausers" },
    lists: [
      {
        type: Schema.Types.ObjectId,
        ref: "datalists",
      },
    ],
    idUser: [{ type: Schema.Types.ObjectId, ref: "datausers" }],
    favorites: Boolean,
    lastVisiting: Date,
    shareLink: String,

  },
  { versionKey: false }
);

module.exports = mongoose.model("dataBoard", dataBoardsSchema);
