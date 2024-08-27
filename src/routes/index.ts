/**
 * @type routes
 * this file include api routes for the fsm
 * with http verbs
 */
import { createCompany, createEmployee, deleteCompany, getCompanies, getCompany, updateCompany } from "../controllers/company"
import { createUserWithEmailAndPassword, createUserwithGoogle, loginUser } from "../controllers/auth/auth"
import { createRole, deleteRoles, getRoles } from "../controllers/roles"
import { Router } from "express"
import { validateEmail } from "../middleware/emailValidator"
import { authenticateToken } from "../middleware/index"
import { getEmployees } from "../controllers/employee"


const routes= Router()


// authentication routes

routes.post("/auth/signup", validateEmail, createUserWithEmailAndPassword)
routes.post("/auth/google", validateEmail, createUserwithGoogle)
routes.post("/auth/login", validateEmail, loginUser)




// role routes

routes.post("/role", createRole)
routes.get("/roles", getRoles)
routes.delete("/:roleid/role", deleteRoles)

// Company routes
routes.get("/companies", authenticateToken, getCompanies)
routes.get("/:companyid/company", authenticateToken, getCompany)
routes.post("/company", authenticateToken, createCompany);
routes.patch("/company", authenticateToken, updateCompany);
routes.post("/employee", authenticateToken, createEmployee);
routes.delete("/:companyid/company", authenticateToken, deleteCompany)


// company employees
routes.get("/:companyid/employees", authenticateToken, getEmployees)



export default routes