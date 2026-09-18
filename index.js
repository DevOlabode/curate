if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const app = require('./app');

require('./config/dbConfig')();

const PORT=process.env.PORT || 3000;
app.listen(PORT, ()=>{
    console.log(PORT);
    console.log(`App is listening on PORT ${PORT}`)
});
