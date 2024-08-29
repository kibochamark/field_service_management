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
import passport from 'passport';
import bcrypt from 'bcryptjs';
import "./strategies/local-strategy"
import "./strategies/google-strategy"
import { generateAccessToken, generateRefreshToken } from "./utils/tokens"
import { useTreblle } from "treblle"



dotenv.config()

// initialize our app
const app = express()




// configure some settings

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(compression());
app.use(cookieParser());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  // store: new PrismaSessionStore(prisma),
  cookie: {
    secure: false,
    maxAge: 60000 * 60
  },
}))



app.use(passport.initialize());
app.use(passport.session());

// set up treblle for api monitoring and documentation
useTreblle(app, {
  apiKey: process.env.TREBLLE_API_KEY!,
  projectId: process.env.TREBLLE_PROJECT_ID,
})



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

    // generate token
    const accessToken = generateAccessToken(user?.id)
    const refreshToken = generateRefreshToken(user?.id)


    if (user.companyId) {
      return res.status(200).json({

        status: "success",
        message: "proceed to main page",
        enabled: user.enabled,
        token: {
          accessToken,
          refreshToken,
          companyId:user?.companyId
        }
      })
    }
    return res.status(200).json({
      status: "not finalized",
      message: "set company first",
      enabled: user.enabled,
      token: {
        accessToken,
        refreshToken
      }

    });
  }
);

app.get('/complete-profile', (req: express.Request, res: express.Response) => {
  res.send("Complete your profile here!");
});




// --------------------
app.use("/api/v1/", routes)


app.post('/api/auth', passport.authenticate('local'),
  (req: express.Request, res: express.Response) => {
    console.log(req)
    return res.status(200).end()
  })




// catch all routes that are not specified in the routes folder
app.use("*", (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // create an error object
  const error: GlobalError = new Error(`cant find ${req.originalUrl} on the server`)
  error.status = "fail"
  error.statusCode = 404

  return next(error)
})




// create our global error stack
app.use((error: GlobalError, req: express.Request, res: express.Response, next: express.NextFunction) => {
  error.statusCode = error?.statusCode || 500
  error.status = error.status || "error"

  return res.status(error.statusCode).json({
    status: error.statusCode,
    message: error.message
  })
})







app.listen(8000, () => {
  console.log("server has started")
})