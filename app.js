//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//1. create and connect to mongo db
// const url = "mongodb://localhost:27017/todolistDB";
const mongoAtlassUrl = "mongodb+srv://admin-zeerak:admin@cluster0.0nkuo.mongodb.net/todolistDB";
mongoose.connect(mongoAtlassUrl, { useUnifiedTopology: true}, { useNewUrlParser: true });

//2. create an items schema and put whatever field we want in that schema.
const itemsSchema = {
  name: String
};

//3. create a mongoose model based on the itemsSchema that we will use moving forward. (This line also creates a collection called "Items")
const Item = mongoose.model("Item", itemsSchema);

//4. Create new documents for our collection. We create a constant and bind it to a new model name(Item) and specify the values for each of the fields
// in our schema. These will pre-exist in the todo list
const item1 = new Item({
  name: "Welcome to your todolist",
});
const item2 = new Item({
  name: "Hit the + button to add a new item",
});
const item3 = new Item({
  name: "<-- Hit this to delete an item",
});

//create an array that will keep all these items
const defaultItems = [item1, item2, item3];

//create a list schema for the express routing on line 63
const listSchema = {
  name: String,
  items: [itemsSchema]
};

//create mongoose model for the customListName using list schema
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){
    if (foundItems.length === 0){
      //use mongoose insertmany method so we can insert all these items in one go into our items collection
      Item.insertMany(defaultItems, function(err){
        if (err){
          console.log(err);
        } else {
          console.log("Successfully inserted items into the collection!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

//Setting express route for user search through url
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        console.log("Doesnt exist");
        // create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);

      } else {
        // show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        console.log("Exists");
      }
    }
  });


});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  };


});

//new route to delete items from list
app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err){
        console.log("Successfully deleted item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  };

});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
