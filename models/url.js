const { model, Schema } = require("mongoose");

const ShortURLSchema = new Schema({
  shortId: String,
  shortUrl: String,
  longUrl: String,
  visits: Number,
  qrcode: String,
});
const ShortURL = new model("ShortURL", ShortURLSchema);
module.exports = ShortURL;
