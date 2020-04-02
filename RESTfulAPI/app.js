var express = require('express');
var app = express();

app.set('port', process.env.PORT || 3000);

app.use(require("./routes/routes"));

app.listen(app.get('port'), function(){
    console.log("Listen to port " + app.get('port'));
});