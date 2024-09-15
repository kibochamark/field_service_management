import { Request, Response, NextFunction } from "express";
import prisma from "../../utils/prismaConfig";
import { GlobalError } from "../../types/errorTypes";
import Joi, { object } from "joi";
import { hashPassword } from "../../utils/hashpasswordGenereator";
import { generateAccessToken, generateRefreshToken } from "utils/tokens";
import { permission } from "process";
import { CompanySize } from "@prisma/client";

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
    address:Joi.string().required(),
    stateinfo: Joi.object({
        city: Joi.string().required(),
        zip: Joi.string().required(),
        state:Joi.string().required(),
        otherInfo: Joi.string()
    }),
    subscriptionId: Joi.string()
});

const updateCompanySchema = Joi.object({
    name: Joi.string(),
    description: Joi.string(),
    companySize: Joi.string(),
    email: Joi.string().email(),
    poBox: Joi.string(),
    addressline1: Joi.string(),
    addressline2: Joi.string(),
    imageUrl: Joi.object({
        url: Joi.string()
    }),
    address:Joi.string(),
    stateinfo: Joi.object({
        city: Joi.string(),
        zip: Joi.string(),
        otherInfo: Joi.string()
    }),
    subscriptionId: Joi.string()
});


const employeeSchema = Joi.object({
    firstname: Joi.string().required(),
    lastname: Joi.string().required(),
    phonenumber: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    roleId: Joi.string().required(),
    companyId: Joi.string().required(),
    permissions: Joi.array<string>()
});

const retrieveCompanySchema = Joi.object({
    companyid: Joi.string().required()
})



// create company
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
        return next(statusError)

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
        stateinfo
    } = value;

    const decodeduser = req.user as any

    console.log(decodeduser)

    try {
        // Find the user to ensure they exist
        const user = await prisma.user.findUnique({
            where: { id: decodeduser.userId },
            select: {
                id: true,
                companyId: true,
                role: {
                    select: {
                        name: true
                    }
                }
            }
        });


        if (!user) {
            const error: GlobalError = new Error("User not found");
            error.statusCode = 404;
            error.status = "fail";
            return next(error);
        }

        if (user?.companyId) {
            const error: GlobalError = new Error("User already has a company");
            error.statusCode = 400;
            error.status = "fail";
            return next(error);
        }

        if (user?.role.name !== "business owner") {
            const error: GlobalError = new Error("You are not allowed to perform this");
            error.statusCode = 400;
            error.status = "fail";
            return next(error);
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
                stateinfo:{
                    set:{
                        city:address.city,
                        zip:address.zip,
                        state:address.state,
                        otherinfo:address.otherinfo ?? ""

                    }
                },
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
        }).end();
    } catch (err: any) {
        return next(err.message);
    }
};


// get companies
export const getCompanies = async (req: Request, res: Response, next: NextFunction) => {
    let statusError: GlobalError = new Error("")

    try {
        const user = req.user as any

        const userrole = await prisma.user.findUnique({
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

        if (userrole?.role.name !== "super admin") {
            statusError.statusCode = 400
            statusError.status = "fail"
            statusError.message = "You are not allowed to perform this request"
            return next(statusError)
        }

        const companies = await prisma.company.findMany()

        return res.status(200).json(companies).end()

    } catch (e: any) {
        statusError.statusCode = 500
        statusError.status = "server error"
        return next(statusError)
    }
}

// delete  company
export const deleteCompany = async (req: Request, res: Response, next: NextFunction) => {
    let statusError: GlobalError = new Error("")

    try {
        const { error, value } = retrieveCompanySchema.validate(req.params, { abortEarly: false });
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
        const user = req.user as any

        const userrole = await prisma.user.findUnique({
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

        if (userrole?.role.name !== "super admin") {
            statusError.statusCode = 400
            statusError.status = "You are not allowed to perform this request"
            return next(statusError)
        }

        const { companyId } = value

        const companies = await prisma.company.delete({
            where: {
                id: companyId
            }
        })

        return res.status(204).end()

    } catch (e: any) {
        statusError.statusCode = 500
        statusError.status = "server error"
        return next(statusError)
    }
}


// get company by id
export const getCompany = async (req: Request, res: Response, next: NextFunction) => {
    let statusError: GlobalError = new Error("")

    try {
        const { error, value } = retrieveCompanySchema.validate(req.params, { abortEarly: false });

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

        const { companyid } = value



        const company = await prisma.company.findUnique({
            where: {
                id: companyid
            }
        })

        return res.status(200).json(company).end()

    } catch (e: any) {
        statusError.statusCode = 500
        statusError.status = "server error"
        return next(statusError)
    }
}


// update company
export const updateCompany = async (req: Request, res: Response, next: NextFunction) => {
    let statusError: GlobalError = new Error("")

    try {
        const { error, value } = updateCompanySchema.validate(req.body, { abortEarly: false });

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
            stateinfo,
            address,
        } = value;

        // get user company id
        const user = req.user as any
        // Find the user to ensure they exist
        const retrieveduser = await prisma.user.findUnique({
            where: { id: user.userId },
            select: {
                id: true,
                companyId: true,
                role: {
                    select: {
                        name: true
                    }
                }
            }
        });


        if (!retrieveduser) {
            const error: GlobalError = new Error("User not found");
            error.statusCode = 404;
            error.status = "fail";
            return next(error);
        }

        if (retrieveduser?.companyId) {
            const error: GlobalError = new Error("User already has a company");
            error.statusCode = 400;
            error.status = "fail";
            return next(error);
        }

        if (retrieveduser?.role.name !== "business owner") {
            const error: GlobalError = new Error("You are not allowed to perform this");
            error.statusCode = 400;
            error.status = "fail";
            return next(error);
        }




        const company = await prisma.company.update({
            where: {
                id: retrieveduser?.companyId as string
            },
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
                stateinfo
            }
        })

        return res.status(201).json(company).end()

    } catch (e: any) {
        statusError.statusCode = 500
        statusError.status = "server error"
        return next(statusError)
    }
}



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


        const { firstname, lastname, phonenumber, email, password, roleId, companyId, permissions } = value;

        // restrict user not create an employee if he/she is not a business owner or  business admin
        const user = req.user as any


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

        const roleofnewuser = await prisma.role.findUnique({
            where: {
                id: roleId as string
            },
            select: {

                name: true,
                permissions: {
                    select: {
                        key: true
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

        // retrieve config that checks if business owner already exists

        const config= await prisma.config.findFirst()

        if ((role?.role.name !== "business owner") && (role?.role.name !== "business admin")) {
            statusError.statusCode = 400
            statusError.status = "fail"
            statusError.message = "You are not allowed to add employees"
            return next(statusError)

        }

        if (config?.businessownerexistense && roleofnewuser?.name === "business owner") {
            statusError.statusCode = 400
            statusError.status = "fail"
            statusError.message = "We can only have one business owner"
            return next(statusError)
        }

        
        if (roleofnewuser?.name === "client") {
            statusError.statusCode = 400
            statusError.status = "fail"
            statusError.message = "You cant add this role"
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
                companyId: companyId,
                profile:{
                    set:{
                        phone:phonenumber
                        
                    }
                },
                permissions: permissions
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

        console.log(newuser, "user")


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



// retrieve comapny size
export async function getCompanySize(req:Request, res:Response, next:NextFunction){
    // initialize global error stack
    let statusError: GlobalError = new Error("")

    try{
        
        let companysizedict = {
            "owner": CompanySize.Owner,
            "5":CompanySize.Five,
            "10":CompanySize.Ten,
            "10+":CompanySize.Tenplus
        }

        return res.status(200).json(companysizedict).end()

    }catch(e:any){
        statusError.status = "fail",
        statusError.statusCode = 500
        statusError.message ="server error - failed to retrieve data"
        next(statusError)
    }

}