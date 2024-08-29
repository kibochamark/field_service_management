import { NextFunction, Request, Response } from "express"
import Joi from "joi"
import { GlobalError } from "../../types/errorTypes"
import prisma from "../../utils/prismaConfig"

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




            if (roleofupdateduser?.name !== "business admin") {
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

        console.log(data)


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
          

        console.log(employee)

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
