import { NextFunction, Request, Response } from "express"
import Joi from "joi"
import { GlobalError } from "../../types/errorTypes"
import prisma from "../../utils/prismaConfig"
import csv from "csvtojson/v2"
import * as XLSX from "xlsx"


const retrieveEmployeesSchema = Joi.object({
    companyid: Joi.string().required()
})
const deleteemployeeSchema = Joi.object({
    employeeid: Joi.string().required()
})

const employeeSchema = Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    profile: Joi.object({
        phone: Joi.string()
    }),
    email: Joi.string().email(),
    password: Joi.string().min(6),
    roleId: Joi.string(),
    permissions: Joi.array<string>()
});

// get employees
export const getEmployees = async (req: Request, res: Response, next: NextFunction) => {
    let statusError: GlobalError = new Error("")

    try {

        const { error, value } = retrieveEmployeesSchema.validate(req.params, { abortEarly: false });

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

        const { companyid } = value

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



        if (userrole?.role.name !== "super admin" && userrole?.role.name !== "business owner") {
            statusError.statusCode = 400
            statusError.status = "fail"
            statusError.message = "You are not allowed to perform this request"
            return next(statusError)
        }

        const users = await prisma.user.findMany({
            where: {
                companyId: companyid,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                googleID: true,
                appleID: true,


                profile: {
                    select: {
                        phone: true
                    }

                },

                createdAt: true,
                role: {
                    select: {
                        name: true
                    }
                }


            }

        })


        return res.status(200).json(users)

    } catch (e: any) {
        statusError.statusCode = 500
        statusError.status = "server error"
        return next(statusError)
    }
}



// update an employee
export const updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
    let statusError: GlobalError = new Error("")

    try {
        // retrieve employee id from params
        const employeeid = req.params.employeeid as string

        // get and validate values from body using schema defined
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

        if (!employeeid) {
            statusError.statusCode = 400
            statusError.status = "fail"
            statusError.message = "employee id missing"
            next(statusError)
        }



        const {

            firstName,
            lastName,
            profile,
            email,
            password,
            roleId,
            permissions
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
            statusError.message = "You are not allowed to update employees"
            next(statusError)

        }

        if (roleId) {
            // now perform a check if there is an update in the role id and the role is a business owner
            const roleofupdateduser = await prisma.role.findUnique({
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




            if (roleofupdateduser?.name === "business owner") {
                statusError.statusCode = 400
                statusError.status = "fail"
                statusError.message = "We can only have one business owner"
                next(statusError)
            }
        }


        const data = {
            ...(firstName && { firstName }),  // Include 'firstname' only if it is truthy
            ...(lastName && { lastName }),
            ...(profile && { profile: { update: { phone: profile?.phone } } }),  // Conditionally update profile's phone number
            ...(email && { email }),
            ...(password && { password }),
            ...(roleId && { roleId }),
            ...(permissions && { permissions }),
        };



        const employee = await prisma.user.update({
            where: {
                id: employeeid,
            },
            data: {

                ...(firstName && { firstName }), // Conditionally update 'firstName'
                ...(lastName && { lastName }), // Conditionally update 'lastName'
                ...(email && { email }), // Conditionally update 'email'
                ...(password && { password }), // Conditionally update 'password'
                ...(roleId && { roleId }), // Conditionally update 'roleId'
                ...(permissions && { permissions }), // Conditionally update 'permissions'

            },
        });



        return res.status(201).json(employee).end()

    } catch (e: any) {
        statusError.statusCode = 500
        statusError.status = "server error"
        statusError.message = e.message
        next(statusError)
    }
}


// delete an employee
export const deleteEmployee = async (req: Request, res: Response, next: NextFunction) => {
    let statusError: GlobalError = new Error("")

    try {

        // get and validate values from params using schema defined
        const { error, value } = deleteemployeeSchema.validate(req.params, { abortEarly: false });

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
            employeeid
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



        await prisma.user.delete({
            where: {
                id: employeeid
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


// create bulk employees
export async function createBulkEmployees(req: Request, res: Response, next: NextFunction) {
    let statusError: GlobalError = new Error("");

    try {
        // Parse the Excel file using XLSX
        var workbook = XLSX.readFile(req?.file?.path as string);
        var sheet_name_list = workbook.SheetNames;
        var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
        // console.log(xlData); // To inspect data from the Excel file

        // Remove header rows, only process actual employee data
        const jsonArray = xlData.slice(3); // Skip first two rows (headers and labels)

        // Validate request body
        const { error, value } = retrieveEmployeesSchema.validate(req.body, { abortEarly: false });

        if (error) {
            statusError = new Error(JSON.stringify(
                {
                    error: error.details.map(detail => detail.message),
                }
            ));
            statusError.statusCode = 400;
            statusError.status = "fail";
            next(statusError);
            return;
        }

        const { companyid } = value;
        const user = req.user as any;

        // Check if the user has the correct role to perform this action
        const userrole = await prisma.user.findUnique({
            where: { id: user?.userId },
            select: {
                role: { select: { name: true } }
            }
        });

        if (userrole?.role.name !== "super admin" && userrole?.role.name !== "business owner" && userrole?.role.name !== "business admin") {
            statusError.statusCode = 400;
            statusError.status = "fail";
            statusError.message = "You are not allowed to perform this request";
            return next(statusError);
        }

        let array: any = [];

        if (jsonArray.length > 0) {
            for (let employee of jsonArray as any) {
                // Lookup role by name from the Excel data
                const role = await prisma.role.findUnique({
                    where: { name: employee["__EMPTY_8"] }, // Match role names in the Excel sheet (e.g., "business admin", "dispatcher")
                    select: { id: true, name: true }
                });

                if (!role) {
                    statusError = new Error(`Role ${employee.__EMPTY_9} not found for ${employee.__EMPTY} ${employee.__EMPTY_1}`);
                    statusError.statusCode = 400;
                    statusError.status = "fail";
                    return next(statusError);
                }

                // Construct employee object to be inserted
                array.push({
                    firstName: employee?.__EMPTY,
                    lastName: employee?.__EMPTY_1,
                    email: employee?.__EMPTY_6,
                    profile: {
                        phone: (employee?.__EMPTY_3).toLocaleString(),
                        address: {
                            street: employee?.__EMPTY_7,
                            city: employee?.__EMPTY_4,
                            state: employee?.__EMPTY_2,
                            zip: `${employee?.__EMPTY_5}`
                        }
                    },
                    roleId: role.id, // Use the role id retrieved from the database
                    companyId: companyid
                });
            }
        }

        // Insert bulk employees into the database
        const employees = await prisma.user.createMany({
            data: array,
        });

        // Return success response
        res.status(200).json(employees).end();
    } catch (e: any) {
        // Handle server error
        statusError.statusCode = 500;
        statusError.status = "server error";
        statusError.message = e.message;
        next(statusError);
    }
}

