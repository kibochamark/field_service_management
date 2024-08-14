import express from "express"
import { GlobalError } from "../../types/errorTypes"
import Joi from "joi";
import prisma from "../../utils/prismaConfig";


// validation schema
const roleSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    permissions: Joi.object().required(),
});


export async function createRole(req: express.Request, res: express.Response, next: express.NextFunction) {
    try {

        let statusError:GlobalError
        const { error, value } = roleSchema.validate(req.body, { abortEarly: false });

        if (error) {
            statusError = new Error(JSON.stringify(
                {
                    error: error.details.map(detail => detail.message),
                }
            ))
            statusError.statusCode=400
            statusError.status="fail"
            next(statusError)
            
        }


        const { name, description, permissions} = value;


        const createdRole = await prisma.role.create({
            data:{
                name:name,
                description:description,
                permissions:permissions
            }
        })

        return res.status(201).json(createdRole).end()


    } catch (e: any) {
        let error: GlobalError = new Error(`{e.message}`)
        error.statusCode = 500
        error.status = "server error"
        next(error)
    }
}