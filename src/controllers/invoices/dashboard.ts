import { differenceInDays, formatDistance } from "date-fns";
import { NextFunction, Request, Response } from "express";
import { GlobalError } from "types/errorTypes";
import prisma from "utils/prismaConfig";


/**
 * 
 * @param req get overdue amount, count of overdue , unpaid total, draft total, average paid time
 * @param res 
 * @param next 
 */

export async function getDashboarddata(req: Request, res: Response, next: NextFunction) {
    let statusError: GlobalError = new Error("")

    try {
        const [formattedResult] = await prisma.$transaction(async (tx) => {
            const today = new Date()
            today.setHours(0, 0, 0)
            // overdue amount
            const overdue = await tx.invoice.aggregate({
                where: {
                    status: "SENT",
                    dueDate: {
                        gt: today
                    }
                },
                _sum: {
                    totalAmount: true
                },
                _count: {
                    id: true
                }


            })

            const unpaidtotal = await tx.invoice.aggregate({
                where: {
                    status: "SENT"
                },
                _sum: {
                    totalAmount: true
                }
            })
            const drafttotal = await tx.invoice.aggregate({
                where: {
                    status: "DRAFT"
                },
                _sum: {
                    totalAmount: true
                }
            })

            const averagedays = await tx.invoice.findMany({
                where: {
                    status: "PAID"
                },
                select: {
                    issueDate: true,
                    paidDate: true
                }
            })

            // Calculate the difference in days for each invoice
            const days = averagedays.map((inv) => differenceInDays(inv.paidDate as Date, inv.issueDate));

            // Sum the total days and calculate the average
            const totalDays = days.reduce((acc, cur) => acc + cur, 0);
            const averageDays = totalDays / days.length;

            console.log("Average days:", averageDays);
            //             const averagedays = await tx.`
            //     SELECT AVG(DATE_PART('day', "paidDate" - "issueDate")) as average_days
            //     FROM "Invoice"
            //     WHERE "status" = 'PAID';
            // `;

            let formattedResult = {
                overdueamount: overdue._sum.totalAmount,
                overduecount: overdue._count.id,
                unpaidtotal: unpaidtotal._sum.totalAmount,
                drafttotal: drafttotal._sum.totalAmount,
                averagedays: averageDays
            }
            return [formattedResult]
        })


        return res.status(200).json({
            message:"success",
            data:formattedResult
        })

    } catch (e: any) {
        statusError.status = "500"
        statusError.statusCode = 500
        statusError.message = e?.message
    }

}