import { Request, Response, NextFunction } from "express";
import { GlobalError } from "../../types/errorTypes";
import Joi from "joi";
import prisma from "../../utils/prismaConfig";
import csv from "csvtojson/v2"
import { Client } from "@prisma/client";
import * as XLSX from "xlsx"


// validations schemas
const retrieveCustomersSchema = Joi.object({
    companyid: Joi.string().required()
})


const CustomerSchema = Joi.object({
    companyId: Joi.string().required()
})

const retrieveCustomerSchema = Joi.object({
    id: Joi.string().required()
})
const retrieveCustomerInfoSchema = Joi.object({
    companyid: Joi.string().required()
})


const createCustomerSChema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    profile: Joi.object({
        phone: Joi.string().required(),
        address: Joi.object({
            street: Joi.string().required(),
            city: Joi.string().required(),
            state: Joi.string().required(),
            zip: Joi.string().required()
        })
    }),
    roleId: Joi.string().required(),
    notes: Joi.string(),
    companyId: Joi.string().required()
})




// ----------------------------

// retrieve customers belonging to a certain company
export async function getCustomers(req: Request, res: Response, next: NextFunction) {
    let statusError: GlobalError = new Error("")

    try {

        // check if user has passed a companyId in the request parameter object
        const { error, value } = retrieveCustomersSchema.validate(req.params, { abortEarly: false });
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

        // console.log(companyid)
        // retrieve user

        // const company = await prisma.company.findFirst({
        //     where: {
        //         id:"66c2eec742a6dd6db4d0a17a"
        //     }
        // })

        // console.log(company)


        // if (!company) {
        //     statusError.statusCode = 404
        //     statusError.status = "Not found"
        //     statusError.message = "Company not found"
        //     next(statusError)
        // }

        const customers = await prisma.client.findMany({
            where: {
                companyId: companyid
            }
        })

        // console.log(customers)

        
            return res.status(200).json({
                status: "success",
                data: [...customers]
            })
        


        

    } catch (e: any) {
        statusError.statusCode = 500
        statusError.status = "server error"
        statusError.message = e?.message
        next(statusError)
    }

}



// retrieve a customer belonging to a certain company
export async function getCustomer(req: Request, res: Response, next: NextFunction) {
    let statusError: GlobalError = new Error("")

    try {

        // check if users has passed a companyId in the request parameter object
        const { error, value } = retrieveCustomerSchema.validate(req.params, { abortEarly: false });
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


        const { id } = value


        const customer = await prisma.client.findUnique({
            where: {
                id: id
            }
        })

        return res.status(200).json(customer).end()



    } catch (e: any) {
        statusError.statusCode = 500
        statusError.status = "server error"
        statusError.message = e?.message
        next(statusError)
    }

}



// create  a customer
export async function createCustomer(req: Request, res: Response, next: NextFunction) {
    let statusError: GlobalError = new Error("")

    try {
        // check if user has passed the right data in the request body object
        const { error, value } = createCustomerSChema.validate(req.body, { abortEarly: false });
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
            companyId,
            firstName,
            lastName,
            email,
            profile,
            roleId,
            notes,
        } = value

        // retrieve user from request
        const user = req.user as { userId: string }

        // check if users role is authorized to perform the above action
        const role = await prisma.user.findUnique({
            where: {
                id: user.userId
            },
            select: {
                role: {
                    select: {
                        name: true
                    }
                }
            }
        })

        if ((role?.role.name !== "business owner") && (role?.role.name !== "business admin")) {
            statusError.statusCode = 400
            statusError.status = "fail"
            statusError.message = "You are not allowed to perform this action"
            next(statusError)
        }


        // create customer

        const customer = await prisma.client.create({
            data: {
                firstName: firstName,
                lastName: lastName,
                email: email,
                notes: notes,
                profile: {
                    set: { ...profile }
                },
                roleId: roleId,
                companyId: companyId
            }
        })


        return res.status(201).json(customer).end()

    } catch (e: any) {
        statusError.statusCode = 500
        statusError.status = "server error"
        statusError.message = e?.message
        next(statusError)
    }
}


// update  a customer
export async function updateCustomer(req: Request, res: Response, next: NextFunction) {
    let statusError: GlobalError = new Error("")

    try {
        if (!req.params.id) {
            statusError.statusCode = 400
            statusError.status = "fail"
            statusError.message = "client id should be set"
            next(statusError)
        }
        // check if user has passed the right data in the request body object
        const { error, value } = createCustomerSChema.validate(req.body, { abortEarly: false });
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
            companyId,
            firstName,
            lastName,
            email,
            profile,
            roleId,
            notes,
        } = value

        // retrieve user from request
        const user = req.user as { userId: string }

        // check if users role is authorized to perform the above action
        const role = await prisma.user.findUnique({
            where: {
                id: user.userId
            },
            select: {
                role: {
                    select: {
                        name: true
                    }
                }
            }
        })

        if ((role?.role.name !== "business owner") && (role?.role.name !== "business admin")) {
            statusError.statusCode = 400
            statusError.status = "fail"
            statusError.message = "You are not allowed to perform this action"
            next(statusError)
        }


        // upsert customer

        const customer = await prisma.client.upsert({
            where: {
                id: req.params.id as string
            },
            update: {
                firstName: firstName,
                lastName: lastName,
                email: email,
                notes: notes,
                profile: {
                    set: { ...profile }
                },
                roleId: roleId,
                companyId: companyId
            },
            create: {
                firstName: firstName,
                lastName: lastName,
                email: email,
                notes: notes,
                profile: {
                    set: { ...profile }
                },
                roleId: roleId,
                companyId: companyId
            }
        })


        return res.status(201).json(customer).end()

    } catch (e: any) {
        statusError.statusCode = 500
        statusError.status = "server error"
        statusError.message = e?.message
        next(statusError)
    }
}



// delete customer
export async function deleteCustomer(req: Request, res: Response, next: NextFunction) {
    let statusError: GlobalError = new Error("")


    try {
        // get and validate values from params using schema defined
        const { error, value } = retrieveCustomerSchema.validate(req.params, { abortEarly: false });

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
            id
        } = value;


        // restrict user to update an employee if he/she is not a business owner or  business admin
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



        if ((role?.role.name !== "business owner") && (role?.role.name !== "business admin")) {
            statusError.statusCode = 400
            statusError.status = "fail"
            statusError.message = "You are not allowed to delete employees"
            next(statusError)

        }



        await prisma.client.delete({
            where: {
                id: id
            }
        })

        return res.status(204).end()

    } catch (e: any) {
        statusError.statusCode = 500
        statusError.status = "server error"
        statusError.message = e.message
        next(statusError)
    }
}







// create bulk customers
export async function createBulkCustomers(req: Request, res: Response, next: NextFunction) {
    let statusError: GlobalError = new Error("")

    try {
        // Parse the Excel file using XLSX
        const workbook = XLSX.read(req.file?.buffer, { type: "buffer" });
        var sheet_name_list = workbook.SheetNames;
        var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
        console.log(xlData); // To inspect data from the Excel file

        let jsonArray: any = xlData


        // Validate request body 


        const { error, value } = CustomerSchema.validate(req.body, { abortEarly: false });

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

        const { companyId } = value


        let array: any = []

        // retrieve client role id
        const role = await prisma.role.findFirst({
            where: {
                name: "client"
            },
            select: {
                id: true
            }
        })

        if (!role) {
            statusError.message = "Role not found"
            statusError.statusCode = 404
            statusError.status = "Not found"
            next(statusError)
        }


        if (jsonArray.length > 0) {
            array = jsonArray.map((client: { firstName: any; lastName: any; email: any; phone: any; city: any; state: any; zipcode: any; notes: any; }) => {
                return {
                    firstName: client?.firstName,
                    lastName: client?.lastName,
                    email: client?.email,
                    profile: {
                        phone: client?.phone,
                        address: {
                            city: client?.city,
                            state: client?.state,
                            zip: client?.zipcode
                        }
                    },
                    notes: client?.notes,
                    roleId: role?.id,
                    companyId: companyId
                }
            })


        }




        // create many customers

        const customers = await prisma.client.createMany({
            data: [
                ...array,

            ]
        })

        res.status(200).json(customers).end()
    } catch (e: any) {
        statusError.statusCode = 500
        statusError.status = "server error"
        statusError.message = e.message
        next(statusError)
    }

}







export async function getCustomersInfo(req: Request, res: Response, next: NextFunction) {
    let statusError: GlobalError = new Error("")

    try {

        // check if users has passed a companyId in the request parameter object
        const { error, value } = retrieveCustomerInfoSchema.validate(req.params, { abortEarly: false });
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


        const number_of_active_customers = await prisma.client.count({
            where: {
                companyId: companyid,
                enabled: true
            },
        })
        const number_of_customers = await prisma.client.count({
            where: {
                companyId: companyid,
            },
        })
        const number_of_inactive_customers = await prisma.client.count({
            where: {
                companyId: companyid,
                enabled: false
            },
        })

        return res.status(200).json({
            number_of_active_customers,
            number_of_customers,
            number_of_inactive_customers
        }).end()



    } catch (e: any) {
        statusError.statusCode = 500
        statusError.status = "server error"
        statusError.message = e?.message
        next(statusError)
    }

}



