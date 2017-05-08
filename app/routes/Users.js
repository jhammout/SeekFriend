var express = require('express');
var mongoose = require('mongoose');
var User = require('../models/user.js');
var jwt         = require('jwt-simple');
var config      = require('../../config/database');

var apiRoutes = express.Router();
var path = require('path');
var multer  = require('multer');
var upload = multer({ dest: 'upload/'});
var fs = require('fs');
var type = upload.single('file');




// create a new user account (POST http://localhost:80/api/signup)




apiRoutes.post('/signup', function(req, res, next) {
    User.findOne({
	email: req.body.email
    },function(err, user) {
	if (err) throw err;
	if (!user) {
            var newUser = new User({
		email:req.body.email,
		name: req.body.name,
		password: req.body.password
            });
	    newUser.save(function(err) {
		if (err) {
		    return next(err);
		}else{
		    res.json(newUser);
		}
	    });
	}else{
            return res.status(403).send({success: false, msg: 'already exist'});

        }
    });
});

// route to authenticate a user (POST http://localhost:80/api/authenticate)
apiRoutes.post('/authenticate', function(req, res) {
    User.findOne({
	email: req.body.email
    }, function(err, user) {
	if (err) throw err;

	if (!user) {
	    return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
	} else {
	    // check if password matches
	    user.comparePassword(req.body.password, function (err, isMatch) {
		if (isMatch && !err) {
		    res.json(user);
		} else {
		    return res.status(403).send({success: false, msg: 'Authentication failed. Wrong password.'});
		}
	    });
	}
    });
});
// route to get all the members in the app
apiRoutes.get('/members', function(req, res) {
    User.find(function (err, list) {
	if (err) return next(err);
	res.json(list);
    });

});

// route to get information of one member
apiRoutes.get('/memberinfo/:email', function(req, res) {
    User.findOne({
	email: req.params.email
    }, function(err, user) {
        if (err) throw err;

        if (!user) {
            return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
        } else {
            res.json(user);
        }
    });

});
// route to search friend
apiRoutes.get('/searchfriend/:email', function(req, res) {

    User.findOne({
	email: req.query.name
    }, function(err, userWanted) {
        if (err) throw err;

        if (!userWanted) { // no one in the database with this name
            return res.status(403).send({success: false, msg: 'User not found.'});
        } else {

            User.findOne({
		email: req.query.email,
		"friends.email" : req.query.name

            }, function(err, userConnected) {
                if (err) throw err;
		if(!userConnected){ 
                    res.json(userWanted)
		} else { // if they are already friends
		    return res.status(403).send({email: userWanted.email, name: userWanted.name,  msg: 'friend.'});

		}
            });
	};

    });
});

// route to add friends
apiRoutes.put('/addfriend/:email', function(req, res, next) {
// add a friend to the user's account
    User.findOneAndUpdate({email: req.params.email}, {$push: {"friends": {email: req.body.email, name: req.body.name}}},
                          {safe: true, upsert: true}, function (err, post) {
			      if (err) return next(err);
			      res.json(post);
			      // add the user to the friend's account
			      User.findOneAndUpdate({email: req.body.email}, {$push: {"friends": {email: post.email, name: post.name}}},
                                                    {safe: true, upsert: true},function(err, post){
							if (err) return next(err);


                                                    });

			  });
});
//route to delete friends 
apiRoutes.delete('/deletefriend/:email', function(req, res, next) {
// delete friends from the user's account
    User.findOneAndUpdate({email: req.params.email},{$pull: {"friends": {email: { $in: req.body.email}}}},{ multi: true } , function (err, post) {
	if (err) return next(err);
	res.json(post);
	for(var i=0 ; i<req.body.email.length ; i++) {
	    //delete the user from the friends account 
	    User.findOneAndUpdate({email:req.body.email[i] } , {$pull: {"friends": {email: req.params.email}}},
                                  {safe: true, upsert: true},function(err, post){
				      if (err) return next(err);



                                  });
        }
    });
});
// route to add a location 
apiRoutes.put('/addlocation/:email', function(req, res, next) {
    User.findOneAndUpdate({email: req.params.email}, {$push: {"location": {lat: req.body.lat, lng: req.body.lng}}},
                          {safe: true, upsert: true}, function (err, post) {
			      if (err) return next(err);
			      res.json(post);
			  });
});
// route to delete all registered locations
apiRoutes.delete('/deletehistory/:email', function(req, res, next) {
    console.log(req.body.email)
    User.findOneAndUpdate({email: req.params.email},{$unset: {location: ""}} , function (err, post) {
	if (err) return next(err);
	res.json(post);
    });
});


//route to save image


apiRoutes.post('/upload', type, function (req,res) {

  var tmp_path = req.file.path;

  var target_path = 'images/' + req.body.email;

  var src = fs.createReadStream(tmp_path);
  var dest = fs.createWriteStream(target_path);
  src.pipe(dest);
  src.on('end', function() { res.send('complete'); });
  src.on('error', function(err) { res.send('error'); });

});


//route to get image
apiRoutes.get('/image/:email', function (req,res, next) {
    var img = fs.readFileSync('images/' + req.params.email);

    fs.readFile('images/' + req.params.email, function(err, original_data){

    var base64Image = new Buffer(original_data, 'binary').toString('base64');
    res.send(base64Image);
	});

});


module.exports= apiRoutes;
