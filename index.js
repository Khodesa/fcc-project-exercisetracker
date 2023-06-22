const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const nanoid = import("nanoid");
const shortid = require('shortid')

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/api/hello', function(err, req, res) {
  console.error(err);
  res.json({ greeting: 'hello API' });
});

mongoose.connect(process.env.URI, { useNewUrlParser: true, useUnifiedTopology: true });

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  count: { type: Number, default: 0 },
  log: [],
});

const User = mongoose.model("User", UserSchema);

const ExerciseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: String
});

const Exercise = mongoose.model("Exercise", ExerciseSchema);

app.post("/api/users", (req, res) => {
  var username = req.body.username;

  var user = new User({ username: username });
  user.save((error, savedUser) => {
    let resObj = {}
    resObj['username'] = savedUser.username
    resObj['_id'] = savedUser.id
    res.json(resObj)
  })
});

app.get("/api/users", (req, res, next) => {
  User.find({},(err, users) => {
    res.json(users);
  });
});

app.post("/api/users/:_id/exercises", (req, res, next) => {
  var id = req.params._id;
  var description = req.body.description;
  var duration = parseInt(req.body.duration);
  var date = !!(req.body.date) ? new Date(req.body.date).toDateString() : new Date().toDateString();

  var exercise = new Exercise({
    description: description,
    duration: duration,
    date: date
  });

  User.findByIdAndUpdate(
    id,
    { $push: { log: exercise } },
    { new: true },
    (err, updatedUser) => {
      let resObj = {}
      resObj['_id'] = updatedUser.id
      resObj['username'] = updatedUser.username
      resObj['date'] = date
      resObj['description'] = description
      resObj['duration'] = duration
      res.json(resObj)
    }
  )

});

app.get('/api/users/:_id/logs', (req, res) => {
  User.findById(req.params._id, (err, user) => {
    console.log('Log user:', user)
    if (!err) {
      let resObj = user

      if (req.query.from || req.query.to) {
        let fromDate = (req.query.from) ? new Date(req.query.from) : new Date(0)
        let toDate = (req.query.to) ? new Date(req.query.to) : new Date()


        fromDate = fromDate.getTime()
        toDate = toDate.getTime()
        
        resObj.log = resObj.log.filter((session) => {
          let sessionDate = new Date(session.date).getTime();

          return sessionDate >= fromDate && sessionDate <= toDate;
        });
      }

      if (req.query.limit) {
        resObj.log = resObj.log.slice(0, req.query.limit)
      }

      resObj['count'] = user.log.length
      res.json(resObj)
    }
  })
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
app.use(function(req, res, next) {
  res.status(404).send('Sorry cant find that!')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
