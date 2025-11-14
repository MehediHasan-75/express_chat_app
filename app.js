//external imports
const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");
const cookieParser = require("cookie-parser");

//internal imports
const {notFoundHandler, errorHandler} = require("./middlewares/common/errorHandler");
const app = express();//1
dotenv.config(); //2. this will eable access using process.env.varaible nave trhougth the app


//3. database connection
mongoose.connect(process.env.MONGO_CONNECTION)
.then(() => console.log("database connection successfull!"))
.catch((err) => console.log(err));

//4. request parsers
app.use(express.json());
app.use(express.urlencoded({extended: true}));


//5. set view engine (first create views folder. exprss will search the viwe by default on this folder)
app.set("view engine", "ejs");

//6. set static folders
app.use(express.static(path.join(__dirname, "public")));

//7. parse cookies
app.use(cookieParser(process.env.COOKIE_SECRET));

//8. routing setup


//9. error handler ---> 404 not found handler
app.use(notFoundHandler)

//--> common error handler
app.use(errorHandler)

//10. post listeeing
app.listen(process.env.PORT, ()=> {
    console.log(`app listening to port ${process.env.PORT}`);
})



