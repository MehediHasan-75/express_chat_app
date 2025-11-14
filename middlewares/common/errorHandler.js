const createError = require('http-errors')

//404 not fuound handler
//jokhon ei amar application 404 not foud part e porbe tokhon ei function ta call kore dibo
//call korar por just deault error handleing middleaware e pathiye dibo.

function notFoundHandler(req, res, next){//we will get always req, res and next in middleware
    console.log("ERROR HANDLER HIT:", err.status, err.message);
    next(createError(404, "Your requested content wast not found!")); //next er moddhe kichu dilei seta error consider hoy 'routes' bade
}

//default error handler
function errorHandler(err, req, res, next){// default error handler recieves 4 parameters including err
    res.render('error', { //this object is accessible from error.ejs
        title: "Error Page",
    }) //If we want to show response as html. we should call res.render() with html path so open an error.ejs in default views folder
}

module.exports = {
    notFoundHandler,
    errorHandler,
}