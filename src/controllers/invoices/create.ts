/**
 * author - MArk Kibocha 27/9/24
 */
// id             String        @id @default(auto()) @map("_id") @db.ObjectId
//   type           WorkFlowType  @default(JOB)
//   client         Client        @relation(fields: [clientId], references: [id])
//   clientId       String        @db.ObjectId
//   job            Job?          @relation(fields: [jobId], references: [id])
//   jobId          String?       @db.ObjectId
//   subscription   Subscription? @relation(fields: [subscriptionId], references: [id])
//   subscriptionId String?       @db.ObjectId
//   createdby     User?         @relation(fields: [userid], references: [id])
//   userid  String?       @db.ObjectId
//   payment        Payment?      @relation(fields: [paymentId], references: [id])
//   paymentId      String?       @db.ObjectId

import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { GlobalError } from "../../types/errorTypes";
import prisma from "../../utils/prismaConfig";

//   subTotal    Float @default(0.00)
//   tax         Float @default(0.00)
//   totalAmount Float @default(0.00)

//   dueDate   DateTime
//   issueDate DateTime @default(now())

//   status InvoiceStatus @default(DRAFT)

//   notes String

//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt

//   InvoiceWorkflow InvoiceWorkflow[]


// validation schema
const invoiceSchema = Joi.object({
    type: Joi.string().valid("JOB", "SUBSCRIPTION"),
    clientId: Joi.string().required(),
    companyId: Joi.string().required(),
    jobId: Joi.string(), // optional if type is subscription
    subscriptionId: Joi.string(), //optional if type is job
    createdBy: Joi.string().required(),  // dispatcher, admin, technician or owner
    totalAmount: Joi.number().required(),
    subTotal: Joi.number().required(),
    tax: Joi.number().required(),
    dueDate: Joi.date().required(),
    notes: Joi.string().required(), //"Please include a short comment"
});




// create an invoice of Type Job Or Subscription


export async function createInvoice(req: Request, res: Response, next: NextFunction) {
    let statusError: GlobalError = new Error()

    try {

        // get request body and validate against invoice schema
        const { error, value } = invoiceSchema.validate(req.body, { abortEarly: false });

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
            type,
            clientId,
            companyId,
            jobId,
            subscriptionId,
            createdBy,
            totalAmount,
            subTotal,
            tax,
            dueDate,
            notes
        } = value;

        // retrieve user
        const user = req.user as any
        

      

        // perform a transcation so that both or none should be created
        const [invoice, workflow] =await prisma.$transaction(async (tx) => {
            const newinvoice = await prisma.invoice.create({
                data: {
                    type: type,
                    clientId,
                    jobId: jobId,
                    companyId,
                    subscriptionId: subscriptionId,
                    userid: user?.userId,
                    totalAmount,
                    subTotal,
                    tax,
                    dueDate,
                    notes,
                },
                select: {
                    id: true,
                    status: true,
                    issueDate: true,
                    dueDate:true,
                    createdby: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    },
                    createdAt:true
                }
            })

            const invoiceworkflow = await prisma.invoiceWorkflow.create({
                data: {
                    invoiceId: newinvoice.id,
                    updatedById: user?.userId,
                },
                select:{
                    id:true,
                    currentStage:true,
                    updatedBy:{
                        select:{
                            firstName:true,
                            lastName:true
                        }
                    },
                    createdAt:true
                }
            })
    

            return [newinvoice, invoiceworkflow]
    
        })


        return res.status(201).json({
            message:"success",
            invoice:invoice,
            workflow:workflow
        }).end()

    } catch (e: any) {
        statusError.message = e.message
        statusError.status = "Fail"
        statusError.statusCode = 500
        next(statusError)
    }
}