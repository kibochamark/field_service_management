/**
 * author mark kibocha  - 10/06/24
 */

import { CompanySize } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { GlobalError } from "../../../types/errorTypes";
import prisma from "../../../utils/prismaConfig";


// ;model SubscriptionPlan {
//     id          String       @id @default(auto()) @map("_id") @db.ObjectId
//     name        String
//     description Json
//     companysize CompanySize  @default(Owner)
//     duration    PlanDuration @default(MONTHLY)
//     price       Float        @db.Double()
//     discount    Float        @db.Double()

//     createdAt    DateTime       @default(now())
//     updatedAt    DateTime       @updatedAt
//     Subscription Subscription[]
//   }

// plan schema

const PlanSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.object().required(),
    companySize: Joi.string().valid("Tenplus",
        "OneTen",
        "ElevenTwentyFive",
        "TwentySixFifty",
        "FiftyPlus"),
    duration: Joi.string().valid("MONTHLY", "QUARTERLY", "SEMI_ANNUALLY", "YEARLY"),
    price: Joi.number().required(),
    discount: Joi.number().optional(),
});

const getSchema = Joi.object({
    planId: Joi.string().required()
})

const UpdatePlanSchema = Joi.object({
    name: Joi.string().optional(),
    description: Joi.object().optional(),
    companySize: Joi.string().valid("Tenplus",
        "OneTen",
        " ElevenTwentyFive",
        "TwentySixFifty",
        "FiftyPlus"),
    duration: Joi.string().valid("MONTHLY", "QUARTERLY", "SEMI_ANNUALLY", "YEARLY").optional(),
    price: Joi.string().optional(),
    discount: Joi.string().optional(),
});
// api to create a plan based on the above schema

export async function createPlan(req: Request, res: Response, next: NextFunction) {
    let statusError: GlobalError = new Error("")

    try {

        // Validate the request body against the schema
        const { error, value } = PlanSchema.validate(req.body, { abortEarly: false });
        if (error) {
            statusError.message = error.details[0].message; // Set the error message from Joi validation
            statusError.statusCode = 400; // Bad Request
            statusError.status = "fail";
            next(statusError); // Pass the error to the next middleware
        }

        const { name, description, companySize, price, duration, discount } = value;


        // add the plan to our db
        const plan = await prisma.subscriptionPlan.create({
            data: {
                name,
                description,
                duration,
                price,
                discount,
                companysize: companySize
            }
        })


        return res.status(201).json({
            status: "success",
            data: plan
        }).end()


    } catch (e: any) {
        statusError.status = "fail"
        statusError.statusCode = 500
        statusError.message = e.message
        next(statusError)
    }
}



// api to get all available plan based on the above schema

export async function getPlans(req: Request, res: Response, next: NextFunction) {
    let statusError: GlobalError = new Error("")

    try {

        // get existing plans
        const plans = await prisma.subscriptionPlan.findMany()
        console.log("plans")

        return res.status(200).json({
            status: "success",
            data: plans
        })


    } catch (e: any) {
        statusError.status = "fail"
        statusError.statusCode = 500
        statusError.message = e.message
        next(statusError)
    }
}


// get plan by id
export async function getPlan(req: Request, res: Response, next: NextFunction) {
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

        const { planId } = value;


        // retrieve the plan to our db
        const plan = await prisma.subscriptionPlan.findUnique({
            where: {
                id: planId
            }
        })


        return res.status(200).json({
            status: "success",
            data: plan
        }).end()


    } catch (e: any) {
        statusError.status = "fail"
        statusError.statusCode = 500
        statusError.message = e.message
        next(statusError)
    }
}



// remove an existing plan
export async function deletePlan(req: Request, res: Response, next: NextFunction) {
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

        const { planId } = value;


        // delete the plan to our db
        await prisma.subscriptionPlan.delete({
            where: {
                id: planId
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




// update plan based on an id
export async function updatePlan(req: Request, res: Response, next: NextFunction) {
    let statusError: GlobalError = new Error("")

    try {


        // Validate the request body against the schema
        const { error: firsterror, value: firstvalue } = getSchema.validate(req.params, { abortEarly: false });
        if (firsterror) {
            statusError.message = firsterror.details[0].message; // Set the error message from Joi validation
            statusError.statusCode = 400; // Bad Request
            statusError.status = "fail";
            next(statusError); // Pass the error to the next middleware
        }

        const { planId } = firstvalue


        // Validate the request body against the schema
        const { error, value } = UpdatePlanSchema.validate(req.body, { abortEarly: false });
        if (error) {
            statusError.message = error.details[0].message; // Set the error message from Joi validation
            statusError.statusCode = 400; // Bad Request
            statusError.status = "fail";
            next(statusError); // Pass the error to the next middleware
        }

        const { name, description, companySize, price, duration, discount } = value;


        // add the plan to our db
        const plan = await prisma.subscriptionPlan.update({
            where: {
                id: planId
            },
            data: {
                name,
                description,
                duration,
                price,
                discount,
                companysize: companySize
            }
        })


        return res.status(201).json({
            status: "success",
            data: plan
        }).end()


    } catch (e: any) {
        statusError.status = "fail"
        statusError.statusCode = 500
        statusError.message = e.message
        next(statusError)
    }
}