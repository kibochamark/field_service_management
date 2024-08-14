import passport from "passport";
import { Strategy } from "passport-local";
import prisma from "../utils/prismaConfig";


passport.serializeUser((user, done) => {
    console.log("inside log console");
    console.log(user)
    done(null, user)
})


passport.deserializeUser(async (id, done) => {
    try {
        const findUser = await prisma.user.findFirst({
            where: {
                id: id as string
            }
        })
        if (!findUser) throw new Error("user not found")
        done(null, findUser)
    } catch (err) {
        done(err, null)
    }
})



export default passport.use(
    new Strategy({ usernameField: "email" },async (username, password, done) => {
        try {
            const findUser = await prisma.user.findFirst({
                where: {
                    email:username as string
                }
            })
            console.log(findUser)
            if (!findUser) throw new Error("user not found")
            done(null, findUser)
        } catch (err) {
            done(err, undefined);
        }
    })
)