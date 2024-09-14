import express, { NextFunction } from "express"
import { GlobalError } from "../../types/errorTypes"
import Joi from "joi";
import prisma from "../../utils/prismaConfig";
import expressAsyncHandler from "express-async-handler";


// validation schema
const roleSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    permissions: Joi.array<{
        id: string;
        key: string;
        value: string;
    }>(),
});


const deleteschema = Joi.object({
    roleid: Joi.string().required()
})


export async function createRole(req: express.Request, res: express.Response, next: express.NextFunction) {
    try {

        let statusError: GlobalError
        const { error, value } = roleSchema.validate(req.body, { abortEarly: false });

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


        const { name, description, permissions } = value;


        const createdRole = await prisma.role.create({
            data: {
                name: name,
                description: description,
                permissions: permissions
            }
        })

        return res.status(201).json(createdRole).end()


    } catch (e: any) {
        let error: GlobalError = new Error("")
        error.statusCode = 500
        error.status = "server error"
        error.message = e.message
        next(error)
    }
}



export const getRoles = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    let statusError: GlobalError = new Error("")

    try {
        const roles = await prisma.role.findMany()


        return res.status(200).json({
            status: "success",
            data: roles
        })

    } catch (e: any) {
        statusError.message = e.message
        statusError.status = "fail"
        statusError.statusCode = 500
        next(statusError)
    }


}



export const deleteRoles = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    let statusError: GlobalError = new Error("")
    try {
        const { error, value } = deleteschema.validate(req.params, { abortEarly: false });

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

        const { roleid } = value

        await prisma.role.delete({
            where: {
                id: roleid
            }
        })

        return res.status(204).end()

    } catch (e: any) {
        statusError.message = e.message
        statusError.status = "fail"
        statusError.statusCode = 500
        return next(statusError)
    }

}