const express = require("express");
const { connect } = require("mongoose");
const path = require("path");
const shortid = require("shortid");
const { isValidUrl } = require("./common");
const dotenv = require("dotenv");
const ShortURL = require("./models/url");
const qrcode = require("qrcode");

dotenv.config();

const app = express();

app.use("/public", express.static("public"));

app.use(express.json());

app.post("/get-short-url", async (req, res) => {
  if (!req.body.url || !isValidUrl(req.body.url)) {
    return res.status(400).json("Enter Valid Url");
  }
  try {
    let data = await ShortURL.findOne({
      longUrl: req.body.url,
    });
    if (data) {
      return res.status(200).json(data);
    }
    const shortId = shortid.generate();
    const shortUrl = req.headers.origin + "/" + shortId;
    await qrcode.toFile(
      path.join("public", "qrcode", shortId + ".svg"),
      shortUrl,
      {
        type: "svg",
      }
    );
    const newUrl = new ShortURL({
      shortId: shortId,
      shortUrl: req.headers.origin + "/" + shortId,
      longUrl: req.body.url,
      visits: 0,
      qrcode: "/public/qrcode/" + shortId + ".svg",
    });
    await newUrl.save();
    const sendingItems = { ...newUrl._doc };
    delete sendingItems.visits;
    return res.status(201).json(sendingItems);
  } catch (err) {
    return res.status(500).json("Internal Server Error");
  }
});

app.get("/:id", async (req, res) => {
  try {
    const url = await ShortURL.findOneAndUpdate(
      {
        shortId: req.params.id,
      },
      {
        $inc: {
          visits: 1,
        },
      }
    );
    if (url) {
      res.redirect(url.longUrl);
    }
    return res.redirect("/");
  } catch (err) {
    return res.status(500).json("Internal Server Error");
  }
});

app.get("/", (req, res) => {
  return res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.use("/", (req, res) => {
  return res.redirect("/");
});

connect(process.env.MONOGO_URL, (err) => {
  app.listen(8080);
});
