import { NextFunction, Request, Response } from "express"
import Joi from "joi"
import { GlobalError } from "../../types/errorTypes"
import prisma from "../../utils/prismaConfig"

const retrieveEmployeesSchema = Joi.object({
    companyid: Joi.string().required()
})

// get employees
export const getEmployees = async (req: Request, res: Response, next: NextFunction) => {
    let statusError: GlobalError = new Error("")

    try {
        const { error, value } = retrieveEmployeesSchema.validate(req.params, { abortEarly: false });

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

        const { companyid } = value

        const user = req.user as any

        const userrole = await prisma.user.findUnique({
            where: {
                id: user?.userId
            },
            select: {
                role: {
                    select: {
                        name: true
                    }
                }
            }
        })



        if (userrole?.role.name !== "super admin" && userrole?.role.name !== "business owner") {
            statusError.statusCode = 400
            statusError.status = "fail"
            statusError.message = "You are not allowed to perform this request"
            return next(statusError)
        }

        const users = await prisma.user.findMany({
            where:{
                companyId:companyid,
            },
            
        })


        return res.status(200).json(users)

    } catch (e: any) {
        statusError.statusCode = 500
        statusError.status = "server error"
        return next(statusError)
    }
}