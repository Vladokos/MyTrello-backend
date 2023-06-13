const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const dataListsSchema = new Schema(
  {
    nameList: String,
    cards: [
      {
        type: Schema.Types.ObjectId,
        ref: "datacards",
      },
    ],
    boardId: { type: Schema.Types.ObjectId, ref: "databoards" },
    archived: Boolean,
  },
  { versionKey: false }
);

module.exports = mongoose.model("dataList", dataListsSchema);
