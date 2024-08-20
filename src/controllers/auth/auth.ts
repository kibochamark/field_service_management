import express from "express"
import { GlobalError } from "../../types/errorTypes"
import Joi from "joi";
import { hashPassword } from "../../utils/hashpasswordGenereator";
import { generateAccessToken, generateRefreshToken } from "../../utils/tokens";
import passport from "passport";
import prisma from "../../utils/prismaConfig";


// validation schema
const userSchema = Joi.object({
    firstname: Joi.string().required(),
    lastname: Joi.string().required(),
    phonenumber: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    roleId: Joi.string().required()
});



const googleUser = Joi.object({
    firstname: Joi.string().required(),
    lastname: Joi.string().required(),
    email:Joi.string().email().required(),
    googleId: Joi.string().required(),
});


export async function createUserWithEmailAndPassword(req: express.Request, res: express.Response, next: express.NextFunction) {
    let statusError: GlobalError = new Error("")

    try {

        const { error, value } = userSchema.validate(req.body, { abortEarly: false });

        if (error) {
            statusError = new Error(JSON.stringify(
                {
                    error: error.details.map(detail => detail.message),
                }
            ))
            statusError.statusCode = 400
            statusError.status = "fail"
            next(statusError)

        }


        const { firstname, lastname, phonenumber, email, password, roleId } = value;

        const { salt, hashedPassword } = await hashPassword(password)

        const newuser: any = await prisma.user.create({
            data: {
                email: email,
                password: hashedPassword,
                salt: salt,
                firstName: firstname,
                lastName: lastname,
                roleId: roleId,
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
                company: {
                    select: {
                        name: true
                    }
                },
                role: {
                    select: {
                        name: true
                    }
                },
                createdAt: true,
            }

        })


        if (!newuser) {
            statusError.statusCode = 400
            statusError.status = "fail"
            statusError.message = "something went wrong"
            next(statusError)
        }

        // generate token
        const accessToken = generateAccessToken(newuser?.id)
        const refreshToken = generateRefreshToken(newuser.id)



        return res.status(201).json({
            status: "success",
            data: {
                token: {
                    accessToken,
                    refreshToken
                },
                newuser
            }
        }).end()


    } catch (e: any) {
        let error: GlobalError = new Error(`${e.message}`)
        error.statusCode = 500
        error.status = "server error"
        next(error)
    }
}

export async function createUserwithGoogle(req: express.Request, res: express.Response, next: express.NextFunction) {
    let statusError: GlobalError = new Error("")

    try {

        const { error, value } = googleUser.validate(req.body, { abortEarly: false });

        if (error) {
            statusError = new Error(JSON.stringify(
                {
                    error: error.details.map(detail => detail.message),
                }
            ))
            statusError.statusCode = 400
            statusError.status = "fail"
            return next(statusError)

        }


        const { firstname, lastname, email, googleId } = value;

        const role= await prisma.role.findFirst({
            where:{
                name:"business owner"
            },
            select:{
                id:true
            }
        })

        if(!role){
            statusError.message="roles of the business are not present in the system"
            statusError.statusCode = 400
            statusError.status = "fail"
            return next(statusError)
        }

        // find existing user
        const existinguser = await prisma.user.findFirst({
            where: {
                googleID: googleId as string
            }
        })


        if (existinguser) {
            // generate token
            const accessToken = generateAccessToken(existinguser?.id)
            const refreshToken = generateRefreshToken(existinguser.id)



            return res.status(201).json({
                status: "success",
                data: {
                    token: {
                        accessToken,
                        refreshToken,
                        hascompany:existinguser?.companyId ? true :false
                    }
                }
            }).end()
            
        } else {
            const newuser: any = await prisma.user.create({
                data: {
                    email: email,
                    googleID:googleId,
                    firstName: firstname,
                    lastName: lastname,
                    roleId: role.id,
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
                    company: {
                        select: {
                            name: true
                        }
                    },
                    role: {
                        select: {
                            name: true
                        }
                    },
                    createdAt: true,
                }

            })


            if (!newuser) {
                statusError.statusCode = 400
                statusError.status = "fail"
                statusError.message = "something went wrong"
                next(statusError)
            }

            // generate token
            const accessToken = generateAccessToken(newuser?.id)
            const refreshToken = generateRefreshToken(newuser.id)



            return res.status(201).json({
                status: "success",
                data: {
                    token: {
                        accessToken,
                        refreshToken,
                        hascompany:newuser?.companyId ? true :false

                    },
                }
            }).end()

        }







    } catch (e: any) {
        let error: GlobalError = new Error(`${e.message}`)
        error.statusCode = 500
        error.status = "server error"
        next(error)
    }
}



// controller to handle user login
export async function loginUser(req: express.Request, response: express.Response, next: express.NextFunction) {
    let error: GlobalError = new Error("")
    try {
        passport.authenticate('local', async (err: any, user: any, info: any) => {

            if (err) {
                error.status = "fail"
                error.statusCode = 400
                error.message = err
                return next(error);
            }
            if (!user) {
                error.status = "fail"
                error.statusCode = 400
                error.message = info.message
                next(error)
            };

            console.log(user)

            const accessToken = generateAccessToken(user.id);
            const refreshToken = generateRefreshToken(user.id)

            response.json({ accessToken, refreshToken,  hascompany:user?.companyId ? true :false });
        })(req, response, next);
    } catch (e: any) {
        error.status = "fail"
        error.statusCode = 400
        error.message = e.message
        next(error)
    }
}