if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
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
const apiRoutes = require('./routes/api');
const corsOptions = require('./config/corsConfig');
const { apiErrorHandler } = require('./middleware/apiError');
const { friendlyError, redirectForError } = require('./utils/friendlyError');


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejsMate);

app.use(methodOverride('_method'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors(corsOptions));

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

app.use('/api/v1', apiRoutes);

const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/curate/nlkfmdiphacjgicdcagonbfnpcdjfapo';
const EDGE_STORE_URL ='https://microsoftedge.microsoft.com/addons/detail/curate/ailonhflbailiggfiimmkkmbeoggbjpk';

app.get('/', (req, res)=>{
    res.render('home', { landing: true, chromeStoreUrl: CHROME_STORE_URL, edgeStoreUrl: EDGE_STORE_URL })
});

app.get('/privacy', (req, res) => {
    res.render('privacy', { landing: true, chromeStoreUrl: CHROME_STORE_URL, edgeStoreUrl: EDGE_STORE_URL })
});


app.all(/(.*)/, (req, res, next) => {
    next(new ExpressError("That page doesn’t exist.", 404))
});

app.use(apiErrorHandler);

app.use((err, req, res, next)=>{
    const { statusCode, message } = friendlyError(err);

    if (statusCode >= 500) {
        console.error(err);
    }

    if (statusCode === 400 || statusCode === 404) {
        req.flash(statusCode === 404 ? 'error' : 'warning', message);
        return res.redirect(redirectForError(req));
    }

    res.status(statusCode).render('error', { message, statusCode })
});

const PORT=process.env.PORT || 3000;
app.listen(PORT, ()=>{
    console.log(PORT);
    console.log(`App is listening on PORT ${PORT}`)
});
