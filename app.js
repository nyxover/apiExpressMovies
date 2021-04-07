const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();

const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');

const faker = require('faker');
const config = require('./config');

const mongoose = require('mongoose');

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true 
  }
mongoose.connect(`mongodb+srv://${config.db.user}:${config.db.password}@expressmovie.sxicb.mongodb.net/movies?retryWrites=true&w=majority`, options);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error: cannot connect to my DB'));
db.once('open',() => {
    console.log('Connect to the DB :)');
});



const movieSchema = mongoose.Schema({
    movietitle: String,
    movieyear: Number
});

const Movie = mongoose.model('Movie', movieSchema);

/* const title = faker.lorem.sentence(3);
const year = Math.floor(Math.random() *80) + 1950;

const myMovie = new Movie({ movietitle: title, movieyear: year });
myMovie.save((err, savedMovie) => {
    if(err) {
        console.log(err);
    } else {
        console.log('savedMovie', savedMovie);
    }
}); */

const PORT = 3000;
let frenchMovies = [];

app.use('/public',express.static('public'));
//app.use(bodyParser.urlencoded({ extended: false }));

const secret = 'sdgopskdgpof2FE2E2Ezeonfezpo234234325';
app.use(expressJwt({secret: secret, algorithms: ['HS256']})
    .unless({ path: ['/', '/movies', '/movie-details', new RegExp('/movies.*/', 'i'), '/movie-search', '/login', new RegExp('/movie-details.*/', 'i')]}));

app.set('views', './views');
app.set('view engine', 'ejs');



app.get('/movies', (req, res) => {

    const title = 'Film Francais 20 derniere années';

    frenchMovies = [];
    Movie.find((err, movies) => {
        if(err) {
            console.log('could not retrieve movies from DB');
            res.sendStatus(500);
        } else {
            frenchMovies = movies;
            res.render('movies', { title: title, movies: frenchMovies});
        }
    });
});

var urlencodedParser = bodyParser.urlencoded({ extended: false });

/* app.post('/movies', urlencodedParser, (req, res) => {
    console.log('Titre du film: ',req.body.movietitle);
    console.log('Annee: ',req.body.movieyear);
    const newMovie = { title : req.body.movietitle, year : req.body.movieyear };
    frenchMovies = [...frenchMovies, newMovie];
    console.log(frenchMovies);

    res.sendStatus(201);
}); */

app.post('/movies', upload.fields([]), (req, res) => {
    if(!req.body) {
        return res.sendStatus(500);
    } else {
        const formData = req.body;
        console.log('formData: ', formData);

        const title = req.body.movietitle;
        const year = req.body.movieyear;
        const myMovie = new Movie({ movietitle: title, movieyear: year});
        myMovie.save((err, savedMovie) => {
            if(err){
                console.error(err);
                return;
            } else {
                console.log(savedMovie);
                res.sendStatus(201);
            }
        
        });
    }
})

app.get('/movies/add', (req, res) => {
    res.send('creation de film');
});

app.get('/movies/:id', (req, res) => {
    const id = req.params.id;
    const title = req.params.title;
   /*  res.send(`film numero ${id}`); */
    res.render('movie-details', { movieid : id});
});


app.get('/movie-details/:id', (req, res) => {
    const id = req.params.id;
    Movie.findById(id, (err, movie) => {
        console.log('movie', movie);
        res.render('movie-details', { movie : movie})
    });

});

app.post('/movie-details/:id',  urlencodedParser,  (req, res) => {
    console.log('movietitle: ', req.body.movietitle, 'movieyear: ', req.body.movieyear);
    if (!req.body) {
        return res.sendStatus(500);
    }
    const id = req.params.id;
    Movie.findByIdAndUpdate(id, { $set : {movietitle: req.body.movietitle, movieyear: req.body.movieyear}}, 
                                { new: true }, (err, movie) => {
        if(err) {
            console.error(err);
            return res.send('le film n\'a pas pu être mis à jour');
        }
        res.redirect('/movies');
    });
});


app.delete('/movie-details/:id', (req, res) => {
    const id = req.params.id;
    Movie.findByIdAndRemove(id, (err, movie) => {
        res.sendStatus(202);
    });
});




app.get('/', (req, res) => {
    res.render('index');
});

app.get('/movie-search', (req, res) => {
    res.render('movie-search');
});

app.get('/login', (req, res) => {
    res.render('login', {title: 'Espace menbre'});
});

const fakeUser = { email: 'testuser@test.com', password: 'test'};

app.post('/login', urlencodedParser, (req, res) => {
    console.log('login post', req.body);
    if(!req.body){
        res.sendStatus(500);
    } else {
        if(fakeUser.email === req.body.email && fakeUser.password === req.body.password) {
            const myToken = jwt.sign({iss: 'expressmovies.fr', user: 'Bill', scope: 'admin'}, secret);
            res.json(myToken);
           
            
        } else {
            res.sendStatus(401);
        }
    }
});

app.get('/member-only', (req, res) => {
    console.log('req.user', req.user);
    res.send(req.user)

});


app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});
