var http = require('http');
var fs = require('fs');
var path = require('path');
var express = require('express');
var app = express();
var url = require('url');

var rootDir = null;
var fileHierarchyJson = "{}";

/* Creates an object to represent a node in a file hierarchy with properties
   that represent the name of the node and its logical and physical size on
   disk
*/
function fileobject(name, parentobj, fpath) {
  this.name = name;
  this.parent = parentobj;
  this.children = null;
  this.fullpath = fpath;

  this.logicalSize = 0;
  this.diskSize = 0;
 }

/* Member callback function invoked when asynchronous directory read is
   finished
*/
fileobject.prototype.onReadDirDone = function(err, files) {
  if (err) {
    console.log("error reading: ", this.fullpath);
    return;
  }

  var parentobj = this;
  if (files) {
    parentobj.children = files.map(function(file) {
      var filepath = path.join(parentobj.fullpath, file);
      var childobj = new fileobject(file, parentobj, filepath);
      fs.stat(filepath, function(err, stats) { childobj.onStatsDone(err, stats);} );
      return childobj;
    });
  }
};

/* Member callback function invoked when asynchronous stats query is finished */
fileobject.prototype.onStatsDone = function(err, fstats) {
  if (err) {
    console.log("onStatsDone error: ", this.fullpath);
    return;
  }

  this.logicalSize = fstats.size;
  this.diskSize = fstats.blksize * fstats.blocks;

  if (fstats && fstats.isDirectory()) {
    var thisptr = this;
    fs.readdir(this.fullpath, function(err, files) {
      thisptr.onReadDirDone(err, files);
	  });
  }
}

/* Filtering function for JSON.stringify when called on a fileobject to
   prevent circular object reference traversal.
*/
function skipParent(key, value) {
  if (key == "parent") {
    return undefined;
  }
  return value;
}

/* Writes the filemap to the given filename.  Not safe at all.
*/
function writeFileHierarchy(filemapname) {
  console.log("writing filemap ...", filemapname);
  // var fd = fs.openSync(filemapname, "w");
  var fmjson = JSON.stringify(rootDir, skipParent, '\t');
  fileHierarchyJson = fmjson;
  // fs.writeFile(filemapname, fmjson, function(err) {
  //   if (err) throw err;
  //   console.log("wrote filemap");
  // });
}

/* Traverse the file hierarchy and updates the file map */
function updateRootDir(rootFullPath) {
  rootDir = new fileobject(null, null, rootFullPath);
  console.log("reading root: ", rootDir.fullpath);
  fs.readdir(rootDir.fullpath, function(err, files) {
    rootDir.onReadDirDone(err, files);
  });
}

app.get("/update", function(req, res) {
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  var path =
    query == null
      ? "/"
      : query.path == null
        ? "/"
        : query.path;
  res.send("updating filemap ... " + path);
  updateRootDir(path);
})

app.get("/write", function(req, res) {
  res.send("writing filemap ...");
  writeFileHierarchy("filemap.json");
});

app.use(express.static(__dirname + '/public'));

/*
app.get("/", function(req, res) {
  res.send("Hello world!");
});
*/

app.get("/display", function(req, res) {
  res.send(fileHierarchyJson);
});

app.listen(4242);
