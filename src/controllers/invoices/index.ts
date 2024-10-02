
/**
 * author- MArk Kibocha 27/09/24
 */
import Joi from "joi";
import { GlobalError } from "../../types/errorTypes";
import { NextFunction, Response, Request } from "express";
import prisma from "../../utils/prismaConfig";


const getSchema = Joi.object({
    companyId:Joi.string().required()
})
const getInvoiceSchema = Joi.object({
    invoiceId:Joi.string().required()
})

export async function getAllInvoices(req: Request, res: Response, next: NextFunction) {
    let statusError: GlobalError = new Error()

    try {

        // get request body and validate against invoice schema
        const { error, value } = getSchema.validate(req.params, { abortEarly: false });

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
            companyId
        } = value;

        // retrieve user
        const user = req.user as any
        

        const allinvoices = await prisma.invoice.findMany({
            where:{
                companyId:companyId
            },
            select:{
                id:true,
                client:{
                    select:{
                        firstName:true,
                        lastName:true
                    }
                },
                job:{
                    select:{
                        name:true
                    }
                },
                type:true,
                status:true,
                dueDate:true,
                issueDate:true,
                totalAmount:true
            }
        })


        return res.status(200).json({
            message:"success",
            invoices:allinvoices
        })

    } catch (e: any) {
        statusError.message = e.message
        statusError.status = "Fail"
        statusError.statusCode = 500
        next(statusError)
    }
}


export async function getInvoice(req: Request, res: Response, next: NextFunction) {
    let statusError: GlobalError = new Error()

    try {

        // get request body and validate against invoice schema
        const { error, value } = getInvoiceSchema.validate(req.params, { abortEarly: false });

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
            invoiceId
        } = value;

        // retrieve user
        const user = req.user as any
        

        const invoice = await prisma.invoice.findMany({
            where:{
                id:invoiceId
            },
            select:{
                id:true,
                client:{
                    select:{
                        firstName:true,
                        lastName:true
                    }
                },
                job:{
                    select:{
                        name:true
                    }
                },
                type:true,
                status:true,
                dueDate:true,
                issueDate:true,
                totalAmount:true
            }
        })


        return res.status(200).json({
            message:"success",
            invoice:invoice
        }).end()

    } catch (e: any) {
        statusError.message = e.message
        statusError.status = "Fail"
        statusError.statusCode = 500
        next(statusError)
    }
}



export async function deleteInvoice(req: Request, res: Response, next: NextFunction) {
    let statusError: GlobalError = new Error()

    try {

        // get request body and validate against invoice schema
        const { error, value } = getInvoiceSchema.validate(req.params, { abortEarly: false });

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
            invoiceId
        } = value;

        // retrieve user
        const user = req.user as any

        const requestuser = await prisma.user.findUnique({
            where:{
                id:user?.userId
            },
            select:{
                role:{
                    select:{
                        name:true
                    }
                }
            }
        })
        

        if ((requestuser?.role.name !== "business owner") && (requestuser?.role.name !== "business admin")) {
            statusError.statusCode = 403
            statusError.status = "fail"
            statusError.message = "You are not allowed to perform this action"
            next(statusError)

        }

        const invoice = await prisma.invoice.delete({
            where:{
                id:invoiceId
            },
        })


        return res.status(204).end()

    } catch (e: any) {
        statusError.message = e.message
        statusError.status = "Fail"
        statusError.statusCode = 500
        next(statusError)
    }
}