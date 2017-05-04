var express = require('express');
var mongoose = require('mongoose');
var User = require('../models/user.js');
var jwt         = require('jwt-simple');
var config      = require('../../config/database');


var apiRoutes = express.Router();

// create a new user account (POST http://localhost:8080/api/signup)
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

// route to authenticate a user (POST http://localhost:8080/api/authenticate)
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

apiRoutes.get('/members', function(req, res) {
User.find(function (err, list) {
    if (err) return next(err);
    res.json(list);
  });


});


apiRoutes.get('/friend/:email', function(req, res) {
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

apiRoutes.get('/searchFriend/:email', function(req, res) {

    User.findOne({
      email: req.query.name
    }, function(err, userWanted) {
        if (err) throw err;

        if (!userWanted) {
          return res.status(403).send({success: false, msg: 'User not found.'});
        } else {

         User.findOne({
              email: req.query.email,
              "amis.email" : req.query.name

            }, function(err, userConnected) {
                       if (err) throw err;
               if(!userConnected){
                        res.json(userWanted)
               } else {
               return res.status(403).send({email: userWanted.email, name: userWanted.name,  msg: 'friend.'});

               }
        });
    };

});
});

apiRoutes.put('/account/:email', function(req, res, next) {
  console.log(req.params.email);
  User.findOneAndUpdate({email: req.params.email}, {$push: {"amis": {email: req.body.email, name: req.body.name}}},
                                                  {safe: true, upsert: true}, function (err, post) {
    if (err) return next(err);
    res.json(post);
    User.findOneAndUpdate({email: req.body.email}, {$push: {"amis": {email: post.email, name: post.name}}},
                                                      {safe: true, upsert: true},function(err, post){
                    if (err) return next(err);


                                                      });

  });
});

apiRoutes.delete('/friend/:email', function(req, res, next) {
  console.log(req.body.email)
  User.findOneAndUpdate({email: req.params.email},{$pull: {"amis": {email: { $in: req.body.email}}}},{ multi: true } , function (err, post) {
    if (err) return next(err);
    res.json(post);
       for(var i=0 ; i<req.body.email.length ; i++) {
       User.findOneAndUpdate({email:req.body.email[i] } , {$pull: {"amis": {email: req.params.email}}},
                                                          {safe: true, upsert: true},function(err, post){
                        if (err) return next(err);



                                                          });
                                                           }
  });
});

apiRoutes.put('/addPosition/:email', function(req, res, next) {
  console.log(req.params.email);
  User.findOneAndUpdate({email: req.params.email}, {$push: {"position": {lat: req.body.lat, lng: req.body.lng}}},
                                                  {safe: true, upsert: true}, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

apiRoutes.delete('/position/:email', function(req, res, next) {
  console.log(req.body.email)
  User.findOneAndUpdate({email: req.params.email},{$unset: {position: ""}} , function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});


module.exports= apiRoutes;
