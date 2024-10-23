import express from "express"
import { GlobalError } from "../../types/errorTypes"
import Joi from "joi"
import prisma from "../../utils/prismaConfig"


const ClockSchema = Joi.object({
    id: Joi.string().required(),
    clockout: Joi.date().required()
})
const lunchSchema = Joi.object({
    id: Joi.string().required(),
    lunchStart: Joi.date().required()
})
const lunchBreakSchema = Joi.object({
    id: Joi.string().required(),
    lunchBreak: Joi.date().required()
})


const attendanceHistorySchema = Joi.object({
    userid: Joi.string().required()
})


// controller to handle user clock in or clockout
export async function ClockOut(req: express.Request, res: express.Response, next: express.NextFunction) {
    let statusError: GlobalError = new Error("")
    try {

        const { error, value } = ClockSchema.validate(req.body, { abortEarly: false });
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

        const { clockout, id } = value



        const attendance = await prisma.attendance.update({
            where: {
                id
            },
            data: {
                clockOut: clockout as string,
                status: "OFFLINE",

            }
        })

        return res.status(201).json({
            message: "success",
            data: attendance
        })

    } catch (e: any) {
        statusError.status = "fail"
        statusError.statusCode = 500
        statusError.message = e.message

        next(statusError)
    }
}


export async function LunchStart(req: express.Request, res: express.Response, next: express.NextFunction) {
    let statusError: GlobalError = new Error("")
    try {

        const { error, value } = lunchSchema.validate(req.body, { abortEarly: false });
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

        const { lunchStart, id } = value



        const attendance = await prisma.attendance.update({
            where: {
                id
            },
            data: {
                lunchStart,
                status: "ONBREAK",
            }
        })

        return res.status(200).json({
            message: "success",
            data: attendance
        })

    } catch (e: any) {
        statusError.status = "fail"
        statusError.statusCode = 500
        statusError.message = e.message

        next(statusError)
    }
}

export async function LunchBreak(req: express.Request, res: express.Response, next: express.NextFunction) {
    let statusError: GlobalError = new Error("")
    try {

        const { error, value } = lunchBreakSchema.validate(req.body, { abortEarly: false });
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

        const { lunchEnd, id } = value



        const attendance = await prisma.attendance.update({
            where: {
                id
            },
            data: {
                lunchEnd,
                status: "ONLINE",
            }
        })

        return res.status(200).json({
            message: "success",
            data: attendance
        })

    } catch (e: any) {
        statusError.status = "fail"
        statusError.statusCode = 500
        statusError.message = e.message

        next(statusError)
    }
}

// controller to handle user clock in or clockout
export async function ClockIn(req: express.Request, res: express.Response, next: express.NextFunction) {
    let statusError: GlobalError = new Error("")
    try {

        const user = req.user as any
        const attendance = await prisma.attendance.create({
            data: {
                userid: user?.userId,
                status: "ONLINE",
                clockIn:req.body.date
            }
        })

        return res.status(201).json({
            message: "success",
            data: attendance
        })

    } catch (e: any) {
        statusError.status = "fail"
        statusError.statusCode = 500
        statusError.message = e.message

        next(statusError)
    }
}



// get attendance history
export async function attendanceHistory(req: express.Request, res: express.Response, next: express.NextFunction) {
    let statusError: GlobalError = new Error("")
    try {
        const { error, value } = attendanceHistorySchema.validate(req.params, { abortEarly: false });
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

        const {userId}  = value

        const attendances = await prisma.attendance.findMany({
            where:{
                userid:userId
            }
        })


        return res.status(200).json({
            message:"success",
            data:attendances
        })

    } catch (e) {

    }
}