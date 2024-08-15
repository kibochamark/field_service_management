import express from "express"
import { GlobalError } from "../../types/errorTypes"
import Joi from "joi";
import { hashPassword } from "../../utils/hashpasswordGenereator";
import { createUser } from "../../modelsFunctions/auth";


// validation schema
const userSchema = Joi.object({
    firstname: Joi.string().required(),
    lastname: Joi.string().required(),
    phonenumber: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});


export async function createUserWithEmailAndPassword(req: express.Request, res: express.Response, next: express.NextFunction) {
    try {

        let statusError:GlobalError
        const { error, value } = userSchema.validate(req.body, { abortEarly: false });

        if (error) {
            statusError = new Error(JSON.stringify(
                {
                    error: error.details.map(detail => detail.message),
                }
            ))
            statusError.statusCode=400
            statusError.status="fail"
            next(statusError)
            
        }


        const { firstname, lastname, phonenumber, email, password, role } = value;

        const {  salt, hashedPassword } = await hashPassword(password)

        const user = await createUser({
            email: email,
            password: hashedPassword,
            salt: salt,
            firstName: firstname,
            lastName: lastname,
            roleId: role,
           
        })

        return res.status(201).json(user).end()


    } catch (e: any) {
        let error: GlobalError = new Error(`{e.message}`)
        error.statusCode = 500
        error.status = "server error"
        next(error)
    }
}