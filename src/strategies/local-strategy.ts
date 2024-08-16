import passport from "passport";
import { Strategy } from "passport-local";
import prisma from "../utils/prismaConfig";
import { comparePassword } from "../utils/hashpasswordGenereator";




export default passport.use(
    new Strategy({ usernameField: "email" }, async (username, password, done) => {
        try {
            const findUser = await prisma.user.findFirst({
                where: {
                    email: username as string
                }
            })
            if (!findUser) throw new Error("user not found")
            const passwordmatch = await comparePassword(password, findUser?.password as string)
            passwordmatch ? done(null, findUser) : done("incorrect password", false)

        } catch (err) {
            done(err, undefined)
        }
    })
)