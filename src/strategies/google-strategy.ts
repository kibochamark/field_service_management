
import passport from "passport";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from "../utils/prismaConfig";

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id },  // Correctly query by id without any nested fields
        });


        if (user) {
            done(null, user.id);  // Successfully found the user
        } else {
            done(null, false); // User not found
        }
    } catch (err) {
        done(err, null); // Pass the error if something goes wrong
    }
})



export default passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: "/auth/google/callback",
    passReqToCallback: true
},
    async (request, accessToken, refreshToken, profile, done) => {
        try {
            const state = request.query.state as string
            const existingUser = await prisma.user.findUnique({
                where: { email: profile.emails ? profile.emails[0]?.value : "" },
                select: {
                    profile: true,
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    googleID: true,
                    appleID: true,
                    enabled: true,
                    company: true,
                    role:{
                        select:{
                            name:true
                        }
                    },
                    createdAt: true,
                }
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
                    roleId: state,  // Assuming you have a role ID for standard users
                },
                select: {
                    profile: true,
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    googleID: true,
                    appleID: true,
                    enabled: true,
                    company: true,
                    role:{
                        select:{
                            name:true
                        }
                    },
                    createdAt: true,
                }
            });

            return done(null, newUser);  // Pass the new user object if created
        } catch (err) {
            return done(err, undefined);  // Pass the error as the first argument
        }
    }
));