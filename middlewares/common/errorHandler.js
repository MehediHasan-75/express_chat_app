const createError = require('http-errors')

function notFoundHandler(req, res, next){
    next(createError(404, "Your requested content wast not found!")); 
}

function errorHandler(err, req, res, next){
    //res.locals is a temporary object shared with EJS templates
    res.locals.error = 
        process.env.NODE_ENV === 'development'? err: {message: err.message};

        res.status(err.status || 500);

        //we will somewhow jokhon route likhbo tokhon locals er moddhe htlm varaible set kore rakhbo. eita hoy true hbe na hoy false
        if(res.locals.html){
            res.render("error", {
                title: "Error Page"
            });
        }
        else{
            //json response
            res.json(res.locals.error)
        }

}

module.exports = {
    notFoundHandler,
    errorHandler,
}