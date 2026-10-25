if (process.env.NODE_ENV === 'production') {
    for (const name of ['SESSION_SECRET', 'JWT_SECRET']) {
        if (!process.env[name]) throw new Error(`${name} must be set in production`);
    }
}

const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');

const userRoutes = require('./routes/user');
const ExpressError = require('./utils/expressError');
const apiRoutes = require('./routes/api');
const corsOptions = require('./config/corsConfig');
const { apiErrorHandler } = require('./middleware/apiError');
const { friendlyError, redirectForError } = require('./utils/friendlyError');


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejsMate);

if (process.env.NODE_ENV === 'production') {
    // Vercel sits in front of the app; trust it for req.ip and secure cookies.
    app.set('trust proxy', 1);
}

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors(corsOptions));

app.use(session(require('./config/sessionConfig')));

app.use(flash());

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.warning = req.flash('warning');
    res.locals.info = req.flash('info');
    next();
});

app.use('/', userRoutes);

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

module.exports = app;
