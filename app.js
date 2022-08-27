//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');


app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true
});
const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema); //singular version of the collection

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Think of the work"
});

const item2 = new Item({
  name: "Plan the work"
});

const item3 = new Item({
  name: "Do the work"
});

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems) { // {} to find all the items
    if (foundItems.length === 0) { // insert deafults only if the array is empty
      Item.insertMany(defaultItems, function(error) {
        if (error) console.log(error);
        else console.log("Successfully added default items");
      });
      res.redirect("/");
    }
    res.render("list", {
      listTitle: "Today",
      newListItems: foundItems
    });
  });


});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });
  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {

      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res) {
      const listName = req.body.listName;
      let deletedId = req.body.checkbox;
      if (listName === "Today") {
        Item.deleteOne({
          _id: deletedId
        }, function(err) {
          if (err) console.log("some error in deleting");
          else {
            console.log(deletedId);
            console.log("deleted");
            res.redirect("/");
          }
          });
        }
          else {
            List.findOneAndUpdate({
                name: listName
              }, {
                $pull: {
                  items: {
                    _id: deletedId
                  }
                }
              }, function(err, foundList) {
                if (!err) res.redirect("/"+ listName);

              });

            }

          });

    app.get("/:listName", function(req, res) {
      const listName = _.capitalize(req.params.listName); //used lodash to only capitalize the first letter

      List.findOne({
        name: listName
      }, function(err, foundList) { // returns result as a list document
        if (!err) {
          if (!foundList) { //creates a new list
            const list = new List({
              name: listName,
              items: defaultItems
            });

            list.save();
            res.redirect("/" + listName);
          } else { // renders the existing list
            res.render("list", {
              listTitle: foundList.name,
              newListItems: foundList.items
            });
          }
        }
      })





    });

    app.get("/about", function(req, res) {
      res.render("about");
    });

    app.listen(3000, function() {
      console.log("Server started on port 3000");
    });
