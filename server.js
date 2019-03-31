var express = require("express");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");

var db = require("./models");

var PORT = process.env.PORT || 3000;

var app = express();

// app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

var MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.connect(MONGODB_URI);

// api call to scrape the site and store each title, link and summary in dbArticle objects
app.get("/scrape", function(req, res) {
  axios.get("https://www.apnews.com/").then(function(response) {
    var $ = cheerio.load(response.data);

    $(".WireStory").each(function() {
      var result = {};

      result.title = $(this)
        .children(".CardHeadline")
        .children(".headline")
        .children("h1")
        .text();
      result.summary = $(this)
        .children(".content-container")
        .children(".content")
        .children("p")
        .text();
      result.link =
        "https://www.apnews.com" +
        $(this)
          .children(".CardHeadline")
          .children(".headline")
          .attr("href");

      // checks to see if article's link already exists in DB before adding it
      db.Article.findOne({
        link: result.link
      }).then(function(existing) {
        if (existing) {
        } else {
          db.Article.create(result)
            .then(function(dbArticle) {
              console.log(dbArticle);
            })
            .catch(function(err) {
              if (err) {
                console.log("Error: " + err);
              }
            });
        }
      });
    });
    res.send("Scrape complete!");
  });
});

// gets all articles in the database and renders into index.hbs
app.get("/", function(req, res) {
  db.Article.find({})
    .then(function(results) {
      var hbsObject = {
        articles: results
      };
      console.log(hbsObject);
      res.render("index", hbsObject);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// gets notes associated with the given article
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// adds note to given article
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate(
        { _id: req.params.id },
        { note: dbNote._id },
        { new: true }
      );
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// deletes given note
app.delete("/notes/:id", function(req, res) {
  console.log("got to server");
  db.Note.deleteOne({ _id: req.params.id }).then(function(err) {
    console.log(req.params.id);
    if (err) {
      console.log(err);
    }
    console.log("deleted on server");
    return res.status(200);
  });
});

app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
