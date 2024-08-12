import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import compression from "compression"
import routes from "./routes"
import prisma from "./utils/prismaConfig"
import { GlobalError } from "./types/errorTypes"




dotenv.config()

// initialize our app
const app = express()


// configure some settings

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ credentials: true }));
app.use(compression());
app.use(cookieParser());
app.use("/api/v1/", routes)

// catch all routes that are not specified in the routes folder

app.use("*", (req:express.Request, res:express.Response, next:express.NextFunction)=>{
    // create an error object
    const error:GlobalError= new Error(`cant find ${req.originalUrl} on the server`)
    error.status = "fail"
    error.statusCode=404

    next(error)
})


// create our global error stack
app.use((error:GlobalError, req:express.Request, res:express.Response, next:express.NextFunction)=>{
        error.statusCode = error.statusCode || 500
        error.status = error.status || "error"

        res.status(error.statusCode).json({
            status:error.statusCode,
            message:error.message
        }).end()
})



app.listen(8000, ()=>{
    console.log("server has started")
})