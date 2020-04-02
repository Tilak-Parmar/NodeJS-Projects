var express = require('express');
var router = express.Router();
var bp = require('body-parser');
var mongo = require("mongodb");
var MongoClient = mongo.MongoClient;
var url = "mongodb://localhost:27017/WebDesign";

router.use(bp.json());

//1st
router.post('/user/create', function (req, res) {
    var emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    var pwdRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/;

    if (req.body.email == undefined || req.body.password == undefined) {
        res.status(400).send("Please enter an Email and Password");
        console.log("Email or Password not entered");
    }
    else {
        if (emailRegex.test(req.body.email) && pwdRegex.test(req.body.password)) {

            console.log("Email: " + req.body.email + " and Password: " + req.body.password + " are valid");

            MongoClient.connect(url, function (err, db) {
                if (err) throw err;
                console.log("Database created!");
                var dbo = db.db("WebDesign");
                dbo.createCollection("users", function (err, res2) {
                    if (err) throw err;
                    console.log("Collection created!");
                    dbo.collection("users").findOne({ email: req.body.email }, function (err, result) {
                        if (err) throw err;
                        if (result) {
                            res.status(400).send("Email: " + req.body.email + " already exists");
                            console.log("Email: " + req.body.email + " already exists ", result);
                        }
                        else {
                            var uobj = {
                                "email": req.body.email,
                                "password": req.body.password,
                                "products": []
                            }
                            dbo.collection("users").insertOne(uobj, function (err, res3) {
                                if (err) throw err;
                                res.send("Email: " + req.body.email + " successfully registered");
                                console.log("Email: " + req.body.email + " and Password added to database ");
                            });
                        }
                        db.close();
                    });
                });
            });
        }
        else {
            res.status(400).send("Please check your Email: " + req.body.email + "\n\nPassword: " + req.body.password + " should be 8 to 15 characters which contains at least \n one lowercase letter, \n one uppercase letter, \n one numeric digit, \n one special character");
            console.log("Invalid Email: " + req.body.email + " or Password: " + req.body.password);
        }
    }
});

//2nd Create a product for the user which takes 2 parameter productName and productPrice
router.post('/user/:email/product', function (req, res) {
    var uemail = req.params.email;
    var emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (req.body.productName == undefined || req.body.productPrice == undefined || !(Number.isInteger(req.body.productPrice))) {
        res.status(400).send("Please enter a valid ProductName and ProductPrice\nProductPrice should be an integer");
        console.log("Please enter a valid ProductName and ProductPrice");
    }
    else {
        if (emailRegex.test(uemail)) {

            MongoClient.connect(url, function (err, db) {
                if (err) throw err;
                console.log("Database access!");
                var dbo = db.db("WebDesign");
                dbo.collection("users").findOne({ email: uemail }, function (err, result) {
                    if (err) throw err;
                    if (result) {
                        var productarr = result.products;
                        var flag = 0;
                        for (var i = 0; i < productarr.length; i++) {
                            if (productarr[i].productName == req.body.productName) {
                                console.log("Product already exists", productarr[i]);
                                flag = 1;
                                break;
                            }
                        }
                        if (flag == 1) {
                            res.status(400).send("The product " + req.body.productName + " already exists");
                        }
                        else {
                            productarr.push(req.body);
                            var myquery = { email: uemail };
                            var newvalues = { $set: { products: productarr } };
                            dbo.collection("users").updateOne(myquery, newvalues, function (err, resp) {
                                if (err) throw err;
                                console.log("1 document updated");
                            });
                            res.status(200).send("Products for Email: " + uemail + "\nProducts:\n" + JSON.stringify(result.products));
                            console.log("For Email: " + uemail + " returned:\n", result.products);
                        }
                    }
                    else {
                        res.status(401).send("The Email:" + uemail + " you entered does not exist");
                        console.log("Email:" + uemail + " does not exist");
                    }
                    db.close();
                });
            });

        }
        else {
            res.status(400).send("Please enter a valid email");
            console.log("Email" + uemail + "is invalid");
        }
    }
});

//3. Update the product by taking productName and productPrice as input
router.put('/user/:email/product/:productId', function (req, res) {
    var uemail = req.params.email;
    var upid = req.params.productId;
    var emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (req.body.productName == undefined || req.body.productPrice == undefined || !(Number.isInteger(req.body.productPrice))) {
        res.status(400).send("Please enter a valid 'productName' and 'productPrice'\n\nproductPrice should be an integer");
        console.log("Invalid ProductName and ProductPrice");
    }
    else if (emailRegex.test(uemail)) {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db("WebDesign");
            dbo.collection("users").findOne({ email: uemail }, function (err, result) {
                if (err) throw err;
                if (result) {
                    var productarr = result.products;
                    if (productarr.length == 0) {
                        res.status(400).send("The user " + uemail + " does not have any products to update");
                        console.log("The user " + uemail + " does not have any products to update");
                    }
                    else if (upid >= productarr.length || upid < 0) {
                        res.status(400).send("Please enter a value between 0 and " + (productarr.length - 1) + " to update product");
                        console.log("User didn't enter a value between 0 and " + (productarr.length - 1));
                    }
                    else {
                        var flag = 0;
                        for (var i = 0; i < productarr.length; i++) {
                            if (productarr[i].productName == req.body.productName) {
                                console.log("Product already exists", productarr[i]);
                                flag = 1;
                                break;
                            }
                        }
                        if (flag == 1) {
                            res.status(400).send("The product " + req.body.productName + " already exists");
                        }
                        else {
                            productarr[upid].productName = req.body.productName;
                            productarr[upid].productPrice = req.body.productPrice;
                            var myquery = { email: uemail };
                            var newvalues = { $set: { products: productarr } };
                            dbo.collection("users").updateOne(myquery, newvalues, function (err, resp) {
                                if (err) throw err;
                                console.log("1 document updated");
                            });
                            res.status(204).send("Products for Email: " + uemail + " updated successfully!\n\nProducts:\n" + JSON.stringify(result.products));
                            console.log("For Email: " + uemail + " returned:\n", result.products);
                            db.close();
                        }
                    }
                }
                else {
                    res.status(401).send("The Email:" + uemail + " you entered does not exist");
                    console.log("Email:" + uemail + " does not exist");
                }
            });
        });
    }
    else {
        res.status(400).send("Please enter valid email");
        console.log("Email is invalid");
    }
});

//4th 
router.delete('/user/:email/product/:productId', function (req, res) {
    var uemail = req.params.email;
    var upid = req.params.productId;
    var emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (emailRegex.test(uemail) && !(Number.isInteger(upid))) {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db("WebDesign");
            dbo.collection("users").findOne({ email: uemail }, function (err, result) {
                if (err) throw err;
                if (result) {
                    var productarr = result.products;
                    if (productarr.length == 0) {
                        res.status(400).send("The user " + uemail + " does not have any products to delete");
                        console.log("The user " + uemail + " does not have any products to delete");
                    }
                    else if (upid >= productarr.length || upid < 0) {
                        res.status(400).send("Please enter a value between 0 and " + (productarr.length - 1) + " to delete product");
                        console.log("User didn't enter a value between 0 and " + (productarr.length - 1));
                    }
                    else {
                        productarr.splice(upid, 1);
                        var myquery = { email: uemail };
                        var newvalues = { $set: { products: productarr } };
                        dbo.collection("users").updateOne(myquery, newvalues, function (err, resp) {
                            if (err) throw err;
                            console.log("1 document updated");
                            db.close();
                        });
                        res.status(204).send("Product at id " + upid + " successfully deleted\n" + JSON.stringify(productarr));
                        console.log("Product successfully deleted");
                    }
                }
                else {
                    res.status(401).send("The Email:" + uemail + " you entered does not exist");
                    console.log("Email:" + uemail + " does not exist");
                }
            });
        });
    }
    else {
        res.status(400).send("Please enter valid email and productid");
        console.log("Email or productId is invalid");
    }

});

//5th
router.get('/user/:email/product', function (req, res) {
    var uemail = req.params.email;
    var emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (emailRegex.test(uemail)) {

        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            console.log("Database accessed!");
            var dbo = db.db("WebDesign");
            dbo.collection("users").findOne({ email: uemail }, function (err, result) {
                if (err) throw err;
                if (result) {
                    res.status(200).send("Products for Email: " + uemail + "\n" + JSON.stringify(result.products));
                    console.log("For Email: " + uemail + " returned:\n", result.products);
                }
                else {
                    res.status(401).send("Please check the email you entered");
                    console.log("Email:" + uemail + " does not exist");
                }
                db.close();
            });
        });
    }
    else {
        res.status(400).send("Please enter valid email");
        console.log("Email is invalid");
    }
});

module.exports = router;