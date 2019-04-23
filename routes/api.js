/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;
//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  let booksCollection;
  MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db) => {
    if (err) {
      throw err;
    }
    console.log('successfully connected to database');
    booksCollection = db.collection('books');
  });

  app.route('/api/books')
    .get(async function (req, res, next){
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      let result;
      try {
        result = await booksCollection.aggregate([
          {
            $project: {
              _id: 1,
              title: 1,
              commentcount: { $size: "$comments" }
            }
          }
        ]).toArray();
      } catch (e) {
        next(e);
      }
      res.json(result);
    })
    
    .post(async function (req, res){
      var title = req.body.title;
      //response will contain new book object including atleast _id and title
      if (!title) {
        return res.send('no _id was provided');
      }
      let result;
      try {
        result = await booksCollection.insertOne({ title, comments: [] });
      } catch (e) {
        next(e);
      }
      res.json(result.ops[0]);
    })
    
    .delete(async function(req, res, next){
      //if successful response will be 'complete delete successful'
      try {
        await booksCollection.deleteMany({});
      } catch (e) {
        next(e);
      }
      res.send('complete delete successful');
    });



  app.route('/api/books/:id')
    .get(async function (req, res){
      var bookid = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      let result;
      try {
        result = await booksCollection.findOne({ _id: ObjectId(bookid) });
      } catch (e) {
        return res.send('no book exists');
      }
      if (!result) {
        return res.send('no book exists');
      }
      res.json(result);
    })
    
    .post(async function(req, res, next){
      var bookid = req.params.id;
      var comment = req.body.comment;
      //json res format same as .get
      let result;
      try {
        result = await booksCollection.findOneAndUpdate(
          { _id: ObjectId(bookid) }, 
          { $push: { comments: comment } },
          { returnOriginal: false }
        );
      } catch (e) {
        return res.send('no book exists');
      }
      res.json(result.value);
    })
    
    .delete(async function(req, res){
      var bookid = req.params.id;
      //if successful response will be 'delete successful'
      try {
        await booksCollection.deleteOne({ _id: ObjectId(bookid)});
      } catch (e) {
        return res.send('no book exists');
      }
      res.send('delete successful');
    });
  
};
