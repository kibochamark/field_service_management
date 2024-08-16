import { Request, Response, NextFunction } from "express";
import prisma from "../../utils/prismaConfig";
import { GlobalError } from "../../types/errorTypes";
import Joi from "joi";

// validation schema
const companySchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    companySize: Joi.string().required(),
    email: Joi.string().email().required(),
    poBox: Joi.string().required(),
    addressline1: Joi.string().required(),
    addressline2: Joi.string(),
    imageUrl: Joi.object({
        url: Joi.string()
    }),
    address: Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        zip: Joi.string().required(),
        otherInfo: Joi.string()
    }),
    subscriptionId: Joi.string()
});

export const createCompany = async (req: Request, res: Response, next: NextFunction) => {
    let statusError: GlobalError = new Error("")


    const { error, value } = companySchema.validate(req.body, { abortEarly: false });
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

    const {
        name,
        description,
        companySize,
        email,
        poBox,
        addressline1,
        addressline2,
        subscriptionId,
        imageUrl,
        address,
    } = req.body;

    const decodeduser = req.user as any

    try {
        // Find the user to ensure they exist
        const user = await prisma.user.findUnique({
            where: { id: decodeduser.userId },
        });


        if (!user) {
            const error: GlobalError = new Error("User not found");
            error.statusCode = 404;
            error.status = "fail";
            next(error);
        }

        if (user?.companyId) {
            const error: GlobalError = new Error("User already has a company");
            error.statusCode = 400;
            error.status = "fail";
            next(error);
        }

        // Create the company with the user's ID
        const newCompany = await prisma.company.create({
            data: {
                name,
                description,
                companysize: companySize,
                email,
                poBox,
                addressline1,
                addressline2,
                subscriptionId,
                image: imageUrl ? {
                    url: imageUrl,
                } : undefined,
                address,
                users: {
                    connect: { id:user?.id },
                },
            },
        });

        // Update the user's companyId field
        await prisma.user.update({
            where: { id: decodeduser.userId },
            data: { companyId: newCompany.id },
        });

        // Respond with the newly created company
        res.status(201).json({
            status: "success",
            data: newCompany,
        });
    } catch (err) {
        next(err);
    }
};
