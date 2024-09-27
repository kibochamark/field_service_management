/**
 * @type routes
 * this file include api routes for the fsm
 * with http verbs
 */
import { createCompany, createEmployee, deleteCompany, getCompanies, getCompany, getCompanySize, updateCompany } from "../controllers/company"
import { createUserWithEmailAndPassword, createUserwithGoogle, loginUser } from "../controllers/auth/auth"
import { createRole, deleteRoles, getRoles } from "../controllers/roles"
import { Router } from "express"
import { validateEmail } from "../middleware/emailValidator"
import { authenticateToken } from "../middleware/index"
import { createBulkEmployees, deleteEmployee, getEmployees, getTechnician, updateEmployee } from "../controllers/employee"
import { createBulkCustomers, createCustomer, deleteCustomer, getCustomer, getCustomers, getCustomersInfo, updateCustomer } from "../controllers/customers"
import { upload } from "../utils/multerStorage"
import { auth } from "google-auth-library"
import { addBulkJobTypes, createJob, getAllJobs, getJob, getJobTypes } from "../controllers/jobmanagement"
import { UpdateCompanyUserProfileInformation } from "../controllers/profilemanagement"
import { createInvoice } from "../controllers/invoices/create"
import { deleteInvoice, getAllInvoices, getInvoice } from "../controllers/invoices"
import { updateInvoice } from "../controllers/invoices/update"


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
routes.get("/companysize", getCompanySize);
routes.patch("/company", authenticateToken, updateCompany);
routes.post("/employee", authenticateToken, createEmployee);
routes.post("/employee/bulk", authenticateToken, upload.single("file"), createBulkEmployees);
routes.patch("/:employeeid/employee", authenticateToken, updateEmployee);
routes.delete("/:employeeid/employee", authenticateToken, deleteEmployee);
routes.delete("/:companyid/company", authenticateToken, deleteCompany)


// company employees
routes.get("/:companyid/employees", authenticateToken, getEmployees)
routes.put("/:userid/profile", authenticateToken, UpdateCompanyUserProfileInformation)
routes.get("/:companyid/technician", authenticateToken, getTechnician)



// customers
routes.post("/customers/bulk", authenticateToken, upload.single("file"), createBulkCustomers);
routes.post("/customers", authenticateToken, createCustomer);
routes.put("/customer/:id", authenticateToken, updateCustomer);
routes.get("/customer/:id", authenticateToken, getCustomer);
routes.get("/customers/:companyid", authenticateToken, getCustomers);
routes.get("/customerinfo/:companyid", authenticateToken, getCustomersInfo);
routes.delete("/customer/:id", authenticateToken, deleteCustomer);

// job
routes.post("/job", authenticateToken, createJob);
routes.get("/jobtype", getJobTypes);
routes.post("/addjobtype", addBulkJobTypes);
routes.get("/:companyId/retrievejobs", authenticateToken, getAllJobs);
routes.get("/retrievejob/:jobId", authenticateToken, getJob);



// invoices
routes.post("/invoice", authenticateToken, createInvoice);
routes.get("/:companyId/invoices", authenticateToken, getAllInvoices)
routes.get("/:invoiceId/invoice", authenticateToken, getInvoice)
routes.delete("/:invoiceId/invoice", authenticateToken, deleteInvoice)
routes.patch("/invoice", authenticateToken, updateInvoice)


export default routes