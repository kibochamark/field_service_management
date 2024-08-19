import { Request, Response, NextFunction } from "express";
import prisma from "../../utils/prismaConfig";
import { GlobalError } from "../../types/errorTypes";
import Joi, { object } from "joi";
import { hashPassword } from "../../utils/hashpasswordGenereator";
import { generateAccessToken, generateRefreshToken } from "utils/tokens";

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


// validation schema
const employeeSchema = Joi.object({
    firstname: Joi.string().required(),
    lastname: Joi.string().required(),
    phonenumber: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    roleId: Joi.string().required(),
    companyId: Joi.string().required()
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
    } = value;

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
                    connect: { id: user?.id },
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



// create company employee
export async function createEmployee(req: Request, res: Response, next: NextFunction) {
    let statusError: GlobalError = new Error("")

    try {

        const { error, value } = employeeSchema.validate(req.body, { abortEarly: false });

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


        const { firstname, lastname, phonenumber, email, password, roleId, companyId } = value;

        // restrict user not create an employee if he/she is not a business owner or  business admin
        const user = req.user as any

        console.log(user)

        const role = await prisma.user.findUnique({
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

        const roleofnewuser = await prisma.user.findUnique({
            where: {
                id: roleId
            },
            select: {
                role: {
                    select: {
                        name: true
                    }
                }
            }
        })

        const company = await prisma.company.findUnique({
            where: {
                id: companyId
            },
            select: {
                name: true
            }
        })

        if ((role?.role.name !== "business owner") && (role?.role.name !== "business admin")) {
            statusError.statusCode = 400
            statusError.status = "fail"
            statusError.message = "You are not allowed to add employees"
            return next(statusError)

        }

        if (roleofnewuser?.role.name !== "business admin") {
            statusError.statusCode = 400
            statusError.status = "fail"
            statusError.message = "We can only have one business owner"
            return next(statusError)
        }

        if (!company) {
            statusError.statusCode = 400
            statusError.status = "fail"
            statusError.message = "Company does not exist"
            return next(statusError)
        }





        const { salt, hashedPassword } = await hashPassword(password)

        const newuser: any = await prisma.user.create({
            data: {
                email: email,
                password: hashedPassword,
                salt: salt,
                firstName: firstname,
                lastName: lastname,
                roleId: roleId,
                companyId: companyId
            },
            select: {
                profile: true,
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                googleID: true,
                appleID: true,
                enabled: true,
                company: {
                    select: {
                        name: true
                    }
                },
                role: {
                    select: {
                        name: true
                    }
                },
                createdAt: true,
            }

        })


        if (!newuser) {
            statusError.statusCode = 400
            statusError.status = "fail"
            statusError.message = "something went wrong"
            next(statusError)
        }


        return res.status(201).json({
            status: "success",
            data: {
                newuser
            }
        }).end()





    } catch (e: any) {
        let error: GlobalError = new Error(`${e.message}`)
        error.statusCode = 500
        error.status = "server error"
        next(error)
    }
}