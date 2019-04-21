var http = require('http');
var fs = require('fs');
var url = require('url');
var mongoClient = require('mongodb').MongoClient;
var mongoUrl = "mongodb://localhost:27017/";
http.createServer(function(req, res) {

//Route 1 (/)
if (req.url === '/' && req.method === 'GET') {
res.writeHead(200, {'Content-Type': 'text/html'});
res.end(`
        <!doctype html>
        <html>
        <body>
            <h1> Welcome. Following are possible routes </h1>
            <a href="http://localhost:1337/">Home Page</a><br>
            <a href="http://localhost:1337/readfile">Read File</a><br>
            <a href="http://localhost:1337/writefile">Write File</a><br>
            <a href="http://localhost:1337/readstream">Read Stream</a><br>
            <a href="http://localhost:1337/writestream">Write Stream</a><br>
            <a href="http://localhost:1337/pipe">Pipe</a><br>
            <a href="http://localhost:1337/addemp">Add Employee</a><br>
            <a href="http://localhost:1337/showemp">Show Employees</a>
        </body>
        </html>      `);

}

//Route 2 (/readfile)
else if (req.url === '/readfile' && req.method === 'GET') {
  var pathname = url.parse(req.url).pathname;
  fs.readFile('file.txt', function (err, data) {
    if (err) {
             console.log(err);
             // HTTP Status: 404 : NOT FOUND
             // Content Type: text/plain
             res.writeHead(404, {'Content-Type': 'text/html'});
          }else {
             //Page found
             // HTTP Status: 200 : OK
             // Content Type: text/plain
             res.writeHead(200, {'Content-Type': 'text/html'});

     // Write the content of the file to response body
             res.write(data.toString());
          }
          // Send the response body
          res.end();
           });
}

// Route 3 (/writefile)
else if (req.url === '/writefile' && req.method === 'GET') {
  process.stdin.once('data', function(data) {
  fs.writeFile('file.txt', data, 
  function (err) {
    if (err) 
    throw err;
    console.log('File Written Successfully. Go back to Web page');
    res.end('\nFile Written Successfully');
  });
  process.stdin.pause();
  });
  process.stdout.write('Add the data you wish to write to the file : ');
  process.stdin.resume();
  res.writeHead(200, {'Content-Type': 'text/plaintext'});
  res.write('Enter input in console');

}

// Route 4 (Read Stream)
else if (req.url === '/readstream' && req.method === 'GET') {
  var data='';
  var chunk='';
  var readerStream = fs.createReadStream('file.txt');
  // Set the encoding to be utf8.
  readerStream.setEncoding('UTF8');
  // Handle stream events --> data, end, and error
  readerStream.on('data', function(chunk) {
     data += chunk;
  });
  readerStream.on('end',function(){
      res.writeHead(200, {'Content-Type': 'text/plaintext'});
      res.write(data);
      res.end();
  });
  readerStream.on('error', function(err){
    console.log(err);
    // HTTP Status: 404 : NOT FOUND
    // Content Type: text/plain
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.end();
  });
}

//Route 5 (Write Stream)
else if (req.url === '/writestream' && req.method === 'GET') {
  process.stdin.once('data', function(data) {

  var writerStream = fs.createWriteStream('file.txt');
  // Write the data to stream with encoding to be utf8
  writerStream.write(data,'UTF8');
  // Mark the end of file
  writerStream.end();
  // Handle stream events --> finish, and error
  writerStream.on('finish', function() {
      console.log('File Written Successfully. Go back to Web page');
      res.end('\nFile Written Successfully');
  });
  writerStream.on('error', function(err){
     console.log(err.stack);
  });

  process.stdin.pause();
  });
  process.stdout.write('Add the data you wish to write to the file : ');
  process.stdin.resume();
  res.writeHead(200, {'Content-Type': 'text/plaintext'});
  res.write('Enter input in console');
}

// Route 6 (Pipe)
else if (req.url === '/pipe' && req.method === 'GET') {
  process.stdin.once('data', function() {
  console.log('File Appended Successfully. Go back to Web page');
  res.write('File Appended Successfully. Updated file is as follows : \n');
  var readableStream = fs.createReadStream('file.txt');
  readableStream.pipe(res);
  process.stdin.unpipe(writableStream);
  process.stdin.pause();
  });
  var writableStream = fs.createWriteStream('file.txt',{flags : 'a'});
  process.stdin.pipe(writableStream);
  process.stdout.write('Add the data you wish to write to the file : ');
  process.stdin.resume();
  res.writeHead(200, {'Content-Type': 'text/plaintext'});
  res.write('Enter input in console\n');
}

// Route 7 (Add Employee)
else if (req.url === '/addemp' && req.method === 'GET') {
  process.stdin.once('data', function(data) {
  mongoClient.connect(mongoUrl,{useNewUrlParser:true},function(err, db)
      {
        if (err) 
        throw err;
        var dbo = db.db("khuzaima");
        var myEmp = {name : data.toString()};
        dbo.collection("emp").insertOne(myEmp,function(err, res)
          {
            if (err) 
            throw err;
            console.log("1 document inserted. Go back to Web Page\n");
            db.close();
          });
        });
  res.end('Document Written Successfully');
  process.stdin.pause();
  });
  process.stdout.write('Name of Employee : ');
  process.stdin.resume();
  res.writeHead(200, {'Content-Type': 'text/plaintext'});
  res.write('Enter input in console');

}

// Route 8 (Show Employee)
else if (req.url === '/showemp' && req.method === 'GET') {
  var results;
  mongoClient.connect(mongoUrl,{useNewUrlParser:true}, function(err, db)
  {
    if (err)
    throw err;
    var dbo = db.db("khuzaima");
    dbo.collection("emp").find({}).toArray(function(err, result)
    {
      if (err)
      throw err;
      var i;
      for (i = 0; i < result.length; i++)
      {
      res.write(JSON.stringify(result[i]));
      res.write('\n');
      }
      res.end();
      db.close();
    });
  });
  res.writeHead(200, {'Content-Type': 'text/plaintext'});
  res.write('Following are all the documents in emp collections : \n');
}

 else {
res.writeHead(404, {'Content-Type': 'text/html'});
res.end();
}

}).listen(1337);
console.log('Server running at http://127.0.0.1:1337/');
