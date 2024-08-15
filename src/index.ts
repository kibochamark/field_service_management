import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import compression from "compression"
import routes from "./routes"
import prisma from "./utils/prismaConfig"
import { GlobalError } from "./types/errorTypes"
import session from "express-session"
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import "./strategies/local-strategy"
import "./strategies/google-strategy"





  
  



dotenv.config()

// initialize our app
const app = express()


// // prisma functions to handle session in the db

// class PrismaSessionStore {
//     prisma: any
//     constructor(prisma: any) {
//         this.prisma = prisma;
//     }

//     async get(sessionId: any) {
//         return this.prisma.session.findUnique({
//             where: { sessionId }
//         });
//     }

//     async set(sessionId: any, session: { data: any; expiresAt: any }) {
//         return this.prisma.session.upsert({
//             where: { sessionId },
//             update: { data: session.data, expiresAt: session.expiresAt },
//             create: { sessionId, data: session.data, expiresAt: session.expiresAt }
//         });
//     }

//     async destroy(sessionId: any) {
//         return this.prisma.session.delete({
//             where: { sessionId }
//         });
//     }
// }


// configure some settings

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ credentials: true }));
app.use(compression());
app.use(cookieParser());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    // store: new PrismaSessionStore(prisma),
    cookie: { secure: false,
        maxAge: 60000 * 60
     },
}))



app.use(passport.initialize());
app.use(passport.session());


// Route to start Google authentication
app.get('/auth/google', (req, res, next) => {
  // Pass state parameter with the request
  const state = req.query.role as string; // You can dynamically generate or retrieve this value
  passport.authenticate('google', {
      scope: ['profile', 'email'],
      state: state // Pass the state parameter
  })(req, res, next);
});


app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
      const user = req.user as any
      if(user.companyId){
        return res.status(200).json({
          
          status:"success",
          message:"proceed to main page",
          enabled:user.enabled
        })
      }
      return res.status(200).json({
        status:"error",
        message:"set profile first",
        enabled:user.enabled
      });
    }
);

app.get('/complete-profile', (req: express.Request, res: express.Response) => {
    res.send("Complete your profile here!");
});
  



// --------------------
app.use("/api/v1/", routes)


app.post('/api/auth', passport.authenticate('local'), 
(req:express.Request, res:express.Response)=>{
    console.log(req)
    return res.status(200).end()
})




// catch all routes that are not specified in the routes folder
app.use("*", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // create an error object
    const error: GlobalError = new Error(`cant find ${req.originalUrl} on the server`)
    error.status = "fail"
    error.statusCode = 404

    next(error)
})




// create our global error stack
app.use((error: GlobalError, req: express.Request, res: express.Response, next: express.NextFunction) => {
    error.statusCode = error.statusCode || 500
    error.status = error.status || "error"

    res.status(error.statusCode).json({
        status: error.statusCode,
        message: error.message
    }).end()
})





app.listen(8000, () => {
    console.log("server has started")
})