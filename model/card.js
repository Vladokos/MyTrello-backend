const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const dataCardsSchema = new Schema(
  {
    nameCard: String,
    descriptionCard: String,
    boardId: { type: Schema.Types.ObjectId, ref: "databoards" },
    archived: Boolean,
  },
  { versionKey: false }
);

module.exports = mongoose.model("dataCard", dataCardsSchema);
