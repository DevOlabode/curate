const MongoStore = require('connect-mongo');

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'defaultsecret',
  resave: false,
  saveUninitialized: false,
  // Serverless instances don't share memory, so persist sessions in Mongo.
  store: process.env.MONGO_URI ? MongoStore.create({ mongoUrl: process.env.MONGO_URI }) : undefined,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60, 
  },
};

module.exports = sessionConfig;
