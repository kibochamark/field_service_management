import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { GlobalError } from "../../types/errorTypes";
import prisma from "../../utils/prismaConfig";



const userSchema = Joi.object({
    userid: Joi.string().required(),
    profile: Joi.object({
        address: Joi.object({
            city: Joi.string().required(),
            zip: Joi.string().required(),
            state: Joi.string().required(),
            otherInfo: Joi.string()
        }),
        image: Joi.object({
            height: Joi.number(),
            width: Joi.number(),
            url: Joi.string().required()
        }),
        phone: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
    })
})


const userpasswordschema = Joi.object({
    userid:Joi.string().required(),
    password:Joi.string().required()
})



// update personal information
/*
address- state, street, city, zipcode
image - height, width, url
*/

export async function UpdateCompanyUserProfileInformation(req: Request, res: Response, next: NextFunction) {
    // global stack error
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
            return next(statusError)

        }

        const {
            userid, profile
        } = value


        // update user info

        const updateduser = await prisma.user.update({
            where:{
                id:userid
            },
            data:{
                profile
            }
        })


        return res.status(200).json(updateduser).end()

    } catch (e: any) {
        statusError.status = "fail"
        statusError.statusCode = 500
        statusError.message = "failed to update user"
    }


}


export async function UpdateCompanyUserPassword(req: Request, res: Response, next: NextFunction) {
    // global stack error
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
            return next(statusError)

        }

        const {
            userid, profile
        } = value


        // update user info

        const updateduser = await prisma.user.update({
            where:{
                id:userid
            },
            data:{
                profile
            }
        })


        return res.status(200).json(updateduser).end()

    } catch (e: any) {
        statusError.status = "fail"
        statusError.statusCode = 500
        statusError.message = "failed to update user"
    }


}




