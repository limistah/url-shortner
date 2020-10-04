const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const loki = require("lokijs");
const randomstring = require("randomstring");

var db = new loki("urlShortener");
var shortLinkDB = db.addCollection("shortLinkDB", {
  indices: ["code", "visitCount"],
});

const app = express();

app.use(bodyParser.json());
app.use(cors({}));

const PORT = process.env.PORT || 8899;

app.get("/", (req, res, next) => {
  return res.json({ status: "Online", date: new Date() });
});

app.post("/shorten", function (req, res, next) {
  let { url, code } = req.body;
  code = code || randomstring.generate(5);

  const linkExists = shortLinkDB.findOne({ code });

  if (linkExists) {
    return res.json({ error: true, message: "Code already in use" });
  }

  const shortLink = shortLinkDB.insert({
    code,
    url,
  });
  res.status(201).json(shortLink);
});

app.get("/:code", function (req, res, next) {
  let { code } = req.params;

  const shortenedURL = shortLinkDB.findOne({ code });

  if (!shortenedURL) {
    return res.json({ error: true, message: `No URL matching code ${code}` });
  }

  (shortenedURL.visitCount = (shortenedURL.visitCount || 0) + 1),
    shortLinkDB.update(shortenedURL);

  res.status(301).redirect(shortenedURL.url);
});

app.get("/analysis/:code", function (req, res, next) {
  let { code } = req.params;

  const shortenedURL = shortLinkDB.findOne({ code });

  if (!shortenedURL) {
    return res.json({ error: true, message: `No matching for ${code}` });
  }

  res.status(200).json(shortenedURL);
});

app.listen(PORT, () => {
  console.log(`"Application" is listening on ${PORT}`);
});
