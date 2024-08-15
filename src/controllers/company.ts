import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prismaConfig";
import { GlobalError } from "../types/errorTypes";

export const createCompany = async (req: Request, res: Response, next: NextFunction) => {
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

    const userId = req.user; // Assuming req.user contains the authenticated user
    console.log(userId)

//     try {
//         // Find the user to ensure they exist
//         const user = await prisma.user.findUnique({
//             where: { id: userId },
//         });

//         if (!user) {
//             const error: GlobalError = new Error("User not found");
//             error.statusCode = 404;
//             error.status = "fail";
//             return next(error);
//         }

//         if (user.companyId) {
//             const error: GlobalError = new Error("User already has a company");
//             error.statusCode = 400;
//             error.status = "fail";
//             return next(error);
//         }

//         // Create the company with the user's ID
//         const newCompany = await prisma.company.create({
//             data: {
//                 name,
//                 description,
//                 companysize: companySize,
//                 email,
//                 poBox,
//                 addressline1,
//                 addressline2,
//                 subscriptionId,
//                 image: imageUrl ? {
//                     url: imageUrl, 
//                 } : undefined,
//                 address, 
//                 users: {
//                     connect: { id: userId },
//                 },
//             },
//         });

//         // Update the user's companyId field
//         await prisma.user.update({
//             where: { id: userId },
//             data: { companyId: newCompany.id },
//         });

//         // Respond with the newly created company
//         res.status(201).json({
//             status: "success",
//             data: newCompany,
//         });
//     } catch (err) {
//         next(err);
//     }
};
