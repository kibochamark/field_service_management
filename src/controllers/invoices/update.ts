import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { GlobalError } from "../../types/errorTypes";
import prisma from "../../utils/prismaConfig";

// Validation schema
const invoiceSchema = Joi.object({
    invoiceId: Joi.string().required(),
    totalAmount: Joi.number(),
    subTotal: Joi.number(),
    tax: Joi.number(),
    dueDate: Joi.date(),
    notes: Joi.string(),
    status: Joi.string().valid("DRAFT", "SENT", "APPROVED", "PAID", "CANCELED"),
});

export async function updateInvoice(req: Request, res: Response, next: NextFunction) {
    let statusError: GlobalError = new Error();

    try {
        // Get request body and validate against invoice schema
        const { error, value } = invoiceSchema.validate(req.body, { abortEarly: false });

        if (error) {
            statusError = new Error(JSON.stringify({
                error: error.details.map(detail => detail.message),
            }));
            statusError.statusCode = 400;
            statusError.status = "fail";
            return next(statusError);
        }

        const {
            totalAmount,
            subTotal,
            tax,
            invoiceId,
            dueDate,
            notes,
            status
        } = value;

        // Retrieve user
        const user = req.user as any;

        // Retrieve the current invoice to check its status
        const currentInvoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            select: { status: true }
        });

        const currentStatus  = currentInvoice?.status;
        // Check if the new status is valid and if it's not reverting to DRAFT
        if (currentInvoice) {
            // Prevent reverting to DRAFT
            if (status === "DRAFT" && currentStatus !== "DRAFT") {
                statusError.message = "Cannot revert status back to DRAFT.";
                statusError.statusCode = 400;
                statusError.status = "fail";
                return next(statusError);
            }
        }

        // Perform a transaction to ensure consistency
        const [updatedInvoice, workflowEntry] = await prisma.$transaction(async (tx) => {
            const updatedInvoice = await prisma.invoice.update({
                where: {
                    id: invoiceId
                },
                data: {
                    totalAmount,
                    subTotal,
                    tax,
                    dueDate,
                    notes,
                    status,
                },
                select: {
                    id: true,
                    status: true,
                    issueDate: true,
                    dueDate: true,
                    createdby: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    },
                    createdAt: true,
                }
            });

            let workflowEntry = null;

            // If the status is updated and is not DRAFT, create a new workflow entry
            if (status !== currentStatus && status !== "DRAFT") {
                workflowEntry = await prisma.invoiceWorkflow.create({
                    data: {
                        invoiceId: invoiceId,
                        currentStage: status,
                        updatedById: user?.userId as string 
                    },
                    select: {
                        id: true,
                        currentStage: true,
                        createdAt: true,
                        updatedBy: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                });
            }

            return [updatedInvoice, workflowEntry];
        });

        return res.status(200).json({
            message: "success",
            invoice: updatedInvoice,
            workflow: workflowEntry // Could be null if no new entry was created
        }).end();

    } catch (e: any) {
        statusError.message = e.message;
        statusError.status = "Fail";
        statusError.statusCode = 500;
        next(statusError);
    }
}
