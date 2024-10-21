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
// import { addBulkJobTypes, createJob, getAllJobs, getJob, getJobTypes, updateJob } from "../controllers/jobmanagement"
import { UpdateCompanyUserProfileInformation } from "../controllers/profilemanagement"
import { addBulkJobTypes, assignJob, createJob, deleteJob, getAllJobs, getJob, getJobFeed, getJobTypes, scheduleJob, updateJob, updateJobStatus } from "../controllers/jobmanagement"
import { createInvoice } from "../controllers/invoices/create"
import { deleteInvoice, getAllInvoices, getInvoice } from "../controllers/invoices"
import { updateInvoice } from "../controllers/invoices/update"
import { createPlan, deletePlan, getPlan, getPlans, updatePlan } from "../controllers/subscription/plans/create"
import { createSubscription, deleteSubscription, getSubscription, getSubscriptions, updateSubscription } from "../controllers/subscription"
import { getJobWorkflow } from "../controllers/workflow"
import { attendanceHistory, ClockIn, ClockOut, LunchBreak, LunchStart } from "../controllers/Attendance"



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

//workflow
routes.get("/:companyid/workflow", authenticateToken, getJobWorkflow)



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
routes.put("/assign/:id", authenticateToken, assignJob);
routes.get("/jobtype", getJobTypes);
routes.post("/addjobtype", addBulkJobTypes);
routes.get("/:companyId/retrievejobs", authenticateToken, getAllJobs);
routes.get("/:jobId/retrievejob", authenticateToken, getJob);
routes.put("/:jobId/schedulejob", authenticateToken, scheduleJob);
routes.delete("/:jobId/deletejob", authenticateToken, deleteJob);
routes.put("/:jobId/editjob", authenticateToken, updateJob);
routes.patch("/:id/updatejobstatus", authenticateToken, updateJobStatus);
routes.get("/:companyId/jobfeed", authenticateToken, getJobFeed);


// invoices
routes.post("/invoice", authenticateToken, createInvoice);
routes.get("/:companyId/invoices", authenticateToken, getAllInvoices)
routes.get("/:invoiceId/invoice", authenticateToken, getInvoice)
routes.delete("/:invoiceId/invoice", authenticateToken, deleteInvoice)
routes.patch("/invoice", authenticateToken, updateInvoice)


// plans
routes.post("/plan", authenticateToken, createPlan);
routes.get("/plans", authenticateToken, getPlans)
routes.get("/:planId/plan", authenticateToken, getPlan)
routes.delete("/:planId/plan", authenticateToken, deletePlan)
routes.patch("/:planId/plan", authenticateToken, updatePlan)

// subscriptions
routes.post("/subscription", authenticateToken, createSubscription);
routes.get("/subscriptions", authenticateToken, getSubscriptions)
routes.get("/:subscriptionId/subscription", authenticateToken, getSubscription)
routes.delete("/:subscriptionId/subscription", authenticateToken, deleteSubscription)
routes.patch("/:subscriptionId/subscription", authenticateToken, updateSubscription)



// clock in
routes.post("/clockin", authenticateToken, ClockIn)
routes.post("/clockout", authenticateToken, ClockOut)
routes.post("/lunchStart", authenticateToken, LunchStart)
routes.post("/lunchbreak", authenticateToken, LunchBreak)
routes.get("/:userId/attendances", authenticateToken, attendanceHistory)


export default routes