// runs scraper and pulls resulting articles to page on page ready
$(document).ready(function() {
  $.get("/scrape");
  // $.get("/articles");
});

$(document).on("click", "#noteBtn", function() {
  $("#noteBox").empty();
  console.log("clicked");

  var thisId = $(this).attr("data-id");

  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  }).then(function(data) {
    console.log(data);
    $("#noteBox").append("<h2 class='subtitle'>" + data.title + "</h2>");
    $("#noteBox").append("<input id='titleinput' name='title' placeholder='Note Title'><br><br>");
    $("#noteBox").append("<textarea id='bodyinput' name='body' placeholder='Note Body'></textarea><br>");
    $("#noteBox").append(
      "<button data-id='" +
        data._id +
        "' class='button is-small' id='saveBtn'>Save Note</button>"
    );

    if (data.note) {
      $("#noteBox").append(
        "<button class='button is-small' data-note-id='" +
          data.note._id +
          "' id='delBtn'>Delete Note</button>"
      );
    }
    console.log("Note ID:" + data.note._id);
    $("#titleinput").val(data.note.title);
    $("#bodyinput").val(data.note.body);
  });
});

$(document).on("click", "#saveBtn", function() {
  var thisId = $(this).attr("data-id");
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      title: $("#titleinput").val(),
      body: $("#bodyinput").val()
    }
  }).then(function(data) {
    console.log(data);
    $("#noteBox").empty();
  });

  $("#titleinput").val("");
  $("#bodyinput").val("");
});

$(document).on("click", "#delBtn", function() {
  var thisId = $(this).attr("data-note-id");
  console.log("clicked delete for ", thisId);

  $.ajax({
    method: "DELETE",
    url: "/notes/" + thisId
  });
  $("#noteBox").empty();
  $("#titleinput").val("");
  $("#bodyinput").val("");
});
