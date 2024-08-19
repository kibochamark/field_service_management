/**
 * @type routes
 * this file include api routes for the fsm
 * with http verbs
 */
import { createCompany, createEmployee } from "../controllers/company"
import { createUserWithEmailAndPassword, loginUser } from "../controllers/auth/auth"
import { createRole, deleteRoles, getRoles } from "../controllers/roles"
import { Router } from "express"
import { validateEmail } from "../middleware/emailValidator"
import { authenticateToken } from "../middleware/index"


const routes= Router()


// authentication routes

routes.post("/auth/signup", validateEmail, createUserWithEmailAndPassword)
routes.post("/auth/login", validateEmail, loginUser)




// role routes

routes.post("/role", createRole)
routes.get("/roles", getRoles)
routes.delete("/:roleid/role", deleteRoles)

// Company routes
routes.post("/company", authenticateToken, createCompany);
routes.post("/employee", authenticateToken, createEmployee);

export default routes