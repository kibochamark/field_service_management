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


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { googleID: profile.id },
      });

      if (existingUser) {
        return done(null, existingUser);  // Pass the user object if found
      }

      const newUser = await prisma.user.create({
        data: {
          email: profile.emails?.[0].value || '',
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
          googleID: profile.id,
          roleId: "66bc963e4e311a259ca4df43",  // Assuming you have a role ID for standard users
        },
      });

      return done(null, newUser);  // Pass the new user object if created
    } catch (err) {
      return done(err, undefined);  // Pass the error as the first argument
    }
  }
));

passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id },  // Correctly query by id without any nested fields
      });
  
      if (user) {
        done(null, user);  // Successfully found the user
      } else {
        done(null, false); // User not found
      }
    } catch (err) {
      done(err, null); // Pass the error if something goes wrong
    }
  });
  
  



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


app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/complete-profile');
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