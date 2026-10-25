const { checkEnv } = require('./config/env');
const APP_ENV = checkEnv();

const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const ejsMate = require('ejs-mate');

const userRoutes = require('./routes/user');
const ExpressError = require('./utils/expressError');
const apiRoutes = require('./routes/api');
const corsOptions = require('./config/corsConfig');
const { apiErrorHandler } = require('./middleware/apiError');
const { friendlyError } = require('./utils/friendlyError');


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejsMate);

if (process.env.NODE_ENV === 'production') {
    // Vercel sits in front of the app; trust it for req.ip and secure cookies.
    app.set('trust proxy', 1);
}

if (APP_ENV !== 'production') {
    // Keep staging and preview deployments out of search engines.
    app.use((req, res, next) => {
        res.set('X-Robots-Tag', 'noindex, nofollow');
        next();
    });
}

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors(corsOptions));

// Pages pass one-off messages straight to render(); no sessions or cookies.
app.use((req, res, next) => {
    Object.assign(res.locals, { success: [], error: [], warning: [], info: [] });
    next();
});

app.use('/', userRoutes);

app.use('/api/v1', apiRoutes);

const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/curate/nlkfmdiphacjgicdcagonbfnpcdjfapo';
const EDGE_STORE_URL ='https://microsoftedge.microsoft.com/addons/detail/curate/ailonhflbailiggfiimmkkmbeoggbjpk';

app.get('/', (req, res)=>{
    const success = req.query.reset === 'done'
        ? ['Your password is updated. Sign in from the Curate extension.']
        : [];
    res.render('home', { landing: true, chromeStoreUrl: CHROME_STORE_URL, edgeStoreUrl: EDGE_STORE_URL, success })
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

    res.status(statusCode).render('error', { message, statusCode })
});

module.exports = app;
