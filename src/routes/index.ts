/**
 * @type routes
 * this file include api routes for the fsm
 * with http verbs
 */
import { createCompany } from "../controllers/company"
import { createUserWithEmailAndPassword, loginUser } from "../controllers/auth/auth"
import { createRole } from "../controllers/roles"
import { Router } from "express"
import { validateEmail } from "../middleware/emailValidator"
import { authenticateToken } from "../middleware/index"


const routes= Router()


// authentication routes

routes.post("/auth/signup", validateEmail, createUserWithEmailAndPassword)
routes.post("/auth/login", validateEmail, loginUser)




// role routes

routes.post("/role", createRole)

// Company routes
routes.post("/company", authenticateToken, createCompany);

export default routes