/**
 * author - mark kibocha
 */

import Joi from "joi";
import { NextFunction, Request, Response } from "express";
import { GlobalError } from "../../types/errorTypes";
import prisma from "../../utils/prismaConfig";


// model Subscription {
//     id String @id @default(auto()) @map("_id") @db.ObjectId

//     startDate DateTime
//     endDate   DateTime
//     plan      SubscriptionPlan?  @relation(fields: [planId], references: [id])
//     planId    String?            @db.ObjectId
//     status    SubscriptionStatus @default(ACTIVE)


// subscription schema

const SubSchema = Joi.object({
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    planId: Joi.string().required(),
    companyId: Joi.string().required(),

});
const updateSchema = Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    planId: Joi.string().optional(),
    isTrial: Joi.boolean().optional(),
    status:Joi.string().valid("ACTIVE", "EXPIRED", "CANCELLED", "SUSPENDED")
});


const getSchema = Joi.object({
    subscriptionId: Joi.string().required()
})


// api to create a subscription based on the above schema

export async function createSubscription(req: Request, res: Response, next: NextFunction) {
    let statusError: GlobalError = new Error("")

    try {

        // Validate the request body against the schema
        const { error, value } = SubSchema.validate(req.body, { abortEarly: false });
        if (error) {
            statusError.message = error.details[0].message; // Set the error message from Joi validation
            statusError.statusCode = 400; // Bad Request
            statusError.status = "fail";
            next(statusError); // Pass the error to the next middleware
        }

        const { startDate, endDate, planId, companyId } = value;




        const [sub, company] = await prisma.$transaction(async (tx) => {
            // create a subscription for a specific company
            const sub = await prisma.subscription.create({
                data: {
                    startDate,
                    endDate,
                    planId
                }
            })

            const company = await prisma.company.update({
                where: {
                    id: companyId
                },
                data: {
                    subscriptionId: sub.id
                }
            })

            return [sub, company]
        }
        )


        return res.status(201).json({
            status: "success",
            data: sub
        }).end()


    } catch (e: any) {
        statusError.status = "fail"
        statusError.statusCode = 500
        statusError.message = e.message
        next(statusError)
    }
}



// get subscription

export async function getSubscriptions(req: Request, res: Response, next: NextFunction) {
    let statusError: GlobalError = new Error("")

    try {



        const subs = await prisma.subscription.findMany()

        return res.status(200).json({
            status: "success",
            data: subs
        }).end()


    } catch (e: any) {
        statusError.status = "fail"
        statusError.statusCode = 500
        statusError.message = e.message
        next(statusError)
    }
}



export async function getSubscription(req: Request, res: Response, next: NextFunction) {
    let statusError: GlobalError = new Error("")

    try {

        // Validate the request body against the schema
        const { error, value } = getSchema.validate(req.params, { abortEarly: false });
        if (error) {
            statusError.message = error.details[0].message; // Set the error message from Joi validation
            statusError.statusCode = 400; // Bad Request
            statusError.status = "fail";
            next(statusError); // Pass the error to the next middleware
        }

        const { subscriptionId } = value;




        const sub = await prisma.subscription.findUnique({
            where: {
                id: subscriptionId
            }
        })


        return res.status(200).json({
            status: "success",
            data: sub
        }).end()


    } catch (e: any) {
        statusError.status = "fail"
        statusError.statusCode = 500
        statusError.message = e.message
        next(statusError)
    }
}



export async function deleteSubscription(req: Request, res: Response, next: NextFunction) {
    let statusError: GlobalError = new Error("")

    try {

        // Validate the request body against the schema
        const { error, value } = getSchema.validate(req.params, { abortEarly: false });
        if (error) {
            statusError.message = error.details[0].message; // Set the error message from Joi validation
            statusError.statusCode = 400; // Bad Request
            statusError.status = "fail";
            next(statusError); // Pass the error to the next middleware
        }

        const { subscriptionId } = value;




        const sub = await prisma.subscription.delete({
            where: {
                id: subscriptionId
            }
        })


        return res.status(204).json().end()


    } catch (e: any) {
        statusError.status = "fail"
        statusError.statusCode = 500
        statusError.message = e.message
        next(statusError)
    }
}

// update subscription
export async function updateSubscription(req: Request, res: Response, next: NextFunction) {
    let statusError: GlobalError = new Error("")

    try {

        // Validate the request body against the schema
        // Validate the request body against the schema
        const { error: firsterror, value: firstvalue } = getSchema.validate(req.params, { abortEarly: false });
        if (firsterror) {
            statusError.message = firsterror.details[0].message; // Set the error message from Joi validation
            statusError.statusCode = 400; // Bad Request
            statusError.status = "fail";
            next(statusError); // Pass the error to the next middleware
        }

        const { subscriptionId } = firstvalue;

        const { error, value } = updateSchema.validate(req.body, { abortEarly: false });
        if (error) {
            statusError.message = error.details[0].message; // Set the error message from Joi validation
            statusError.statusCode = 400; // Bad Request
            statusError.status = "fail";
            next(statusError); // Pass the error to the next middleware
        }

        const { startDate, endDate, planId, isTrial, status } = value;


        // update a subscription for a specific company
        const sub = await prisma.subscription.update({
            where: {
                id: subscriptionId
            },
            data: {
                startDate,
                endDate,
                planId,
                isTrial,
                status
            }
        })


        return res.status(201).json({
            status: "success",
            data: sub
        }).end()


    } catch (e: any) {
        statusError.status = "fail"
        statusError.statusCode = 500
        statusError.message = e.message
        next(statusError)
    }
}


