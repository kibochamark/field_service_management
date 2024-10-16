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
                },
                select: {
                    profile: true,
                    id: true,
                    email: true,
                    firstName: true,
                    password:true,
                    lastName: true,
                    googleID: true,
                    appleID: true,
                    enabled: true,
                    companyId:true,
                    company:{
                        select:{
                            subscription:{
                                select:{
                                    status:true
                                }
                            }
                        }
                    },
                    role:{
                        select:{
                            name:true
                        }
                    },
                    createdAt: true,
                    
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