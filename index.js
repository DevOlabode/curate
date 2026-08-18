if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const path = require('path');
const ejsMate = require('ejs-mate');
const LocalStrategy = require('passport-local')
const passport = require('passport')
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');

const User = require('./models/user')
const userRoutes = require('./routes/user');
const ExpressError = require('./utils/expressError');
const bookmarkRoutes = require('./routes/bookmark');
const collectionRoutes = require('./routes/collections');
const collectionBookmarksRoutes = require('./routes/collectionBookmarks');


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejsMate);

app.use(methodOverride('_method'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));

require('./config/dbConfig')();

app.use(session(require('./config/sessionConfig')));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.warning = req.flash('warning');
    res.locals.info = req.flash('info');
    next();
});

app.use('/bookmark', bookmarkRoutes);
app.use('/', userRoutes);
app.use('/collections', collectionRoutes);
app.use('/collections/:id/bookmarks', collectionBookmarksRoutes)

app.get('/', (req, res)=>{
    res.render('home')
});


app.all(/(.*)/, (req, res, next) => {
    next(new ExpressError('Page not found', 404))
});

app.use((err, req, res, next)=>{
    const {statusCode = 500} = err;
    if(!err.message){
        err.message = 'Something Went Wrong!'
    }
    res.status(statusCode).render('error', { err })
});

const PORT=process.env.PORT || 3000;

app.listen(PORT, ()=>{
    console.log(PORT);
    console.log(`App is listening on PORT ${PORT}`)
});