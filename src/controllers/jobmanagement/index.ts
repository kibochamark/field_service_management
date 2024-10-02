// createJob.js
import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import prisma from "../../utils/prismaConfig"; // Adjust this path according to your project structure
import { GlobalError } from "../../types/errorTypes"; // Assuming you have a GlobalError type for error handling

// Joi Schema for Job
// const JobSchema = Joi.object({
//   name: Joi.string().required(),
//   description: Joi.string().required(),
//   jobTypeId: Joi.string().required(), // Reference to JobType
//   status: Joi.string().valid('CREATED' ,   'ASSIGNED', 'SCHEDULED', 'ONGOING', 'COMPLETED').default('CREATED'), // Allowable statuses
//   clientsId: Joi.string().required(), // Reference to Client
//   companyId: Joi.string().required(), // Reference to Company
// });

// // Create Job API
// export const createJob = async (req: Request, res: Response, next: NextFunction) => {
//   let statusError: GlobalError = new Error(""); // Initialize a new GlobalError object

//   try {
//     // Validate the request body against the schema
//     const { error } = JobSchema.validate(req.body);
//     if (error) {
//       statusError.message = error.details[0].message; // Set the error message from Joi validation
//       statusError.statusCode = 400; // Bad Request
//       statusError.status = "fail";
//       return next(statusError); // Pass the error to the next middleware
//     }

//     const { name, description, jobTypeId, status, clientsId, companyId } = req.body;

//     // Create the job in the database
//     const newJob = await prisma.job.create({
//       data: {
//         name,
//         description,
//         jobType: {
//           connect: { id: jobTypeId }, // Connect to existing JobType
//         },
//         status, // Status can be set as 'CREATED' or the provided value
//         clients: {
//           connect: { id: clientsId }, // Connect to existing Client
//         },
//         company: {
//           connect: { id: companyId }, // Connect to existing Company
//         },
//       },
//     });

//     // Return the created job data
//     return res.status(201).json({
//       status: "success",
//       data: newJob,
//     });
//   } catch (e: any) {
//     statusError.status = "fail";
//     statusError.statusCode = 500; // Internal Server Error
//     statusError.message = e.message; // Set the error message
//     return next(statusError); // Pass the error to the next middleware
//   }
// };


/**
 * Author - Mark kibocha 2/10/24
 * 
 */
// Joi Schema for Job
const JobSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  jobTypeId: Joi.string().required(), // Reference to JobType
  clientsId: Joi.string().required(), // Reference to Client
  companyId: Joi.string().required(), // Reference to Company
});

// Create Job API
export const createJob = async (req: Request, res: Response, next: NextFunction) => {
  let statusError: GlobalError = new Error(""); // Initialize a new GlobalError object

  try {
    // Validate the request body against the schema
    const { error } = JobSchema.validate(req.body);
    if (error) {
      statusError.message = error.details[0].message; // Set the error message from Joi validation
      statusError.statusCode = 400; // Bad Request
      statusError.status = "fail";
      return next(statusError); // Pass the error to the next middleware
    }

    const { name, description, jobTypeId, clientsId, companyId } = req.body;

    // Create the job in the database
    const newJob = await prisma.job.create({
      data: {
        name,
        description,
        jobType: {
          connect: { id: jobTypeId }, // Connect to existing JobType
        },
        clients: {
          connect: { id: clientsId }, // Connect to existing Client
        },
        company: {
          connect: { id: companyId }, // Connect to existing Company
        },
      },
    });

    // Return the created job data
    return res.status(201).json({
      status: "success",
      data: newJob,
    });
  } catch (e: any) {
    statusError.status = "fail";
    statusError.statusCode = 500; // Internal Server Error
    statusError.message = e.message; // Set the error message
    return next(statusError); // Pass the error to the next middleware
  }
};


// // Joi Schema for Job Update
// const JobUpdateSchema = Joi.object({
//   name: Joi.string().optional(),
//   description: Joi.string().optional(),
//   jobTypeId: Joi.string().optional(), // Reference to JobType (if updating)
//   clientsId: Joi.string().optional(), // Reference to Client (if updating)
//   companyId: Joi.string().optional(), // Reference to Company (if updating)
//   technicianIds: Joi.array().items(Joi.string()).optional(), // Array of technician IDs to connect
// });

// // Update Job API
// export const assignJob = async (req: Request, res: Response, next: NextFunction) => {
//   let statusError: GlobalError = new Error(""); 
//   const jobId = req.params.id; 

//   try {
//     // Validate the request body against the schema
//     const { error } = JobUpdateSchema.validate(req.body);
//     if (error) {
//       statusError.message = error.details[0].message; // Set the error message from Joi validation
//       statusError.statusCode = 400; // Bad Request
//       statusError.status = "fail";
//       return next(statusError); // Pass the error to the next middleware
//     }

//     const { name, description, jobTypeId, clientsId, companyId, technicianIds } = req.body;

//     // Find the existing job
//     const existingJob = await prisma.job.findUnique({
//       where: { id: jobId },
//       include: {
//         technicians: true, // Include technicians to check current associations
//       },
//     });

//     if (!existingJob) {
//       statusError.message = "Job not found"; // Handle case where job does not exist
//       statusError.statusCode = 404; // Not Found
//       statusError.status = "fail";
//       return next(statusError); // Pass the error to the next middleware
//     }

//     // Prepare the technician connection
//     let techniciansToConnect = [];
//     if (technicianIds && technicianIds.length > 0) {
//       // Validate if technicians exist in the database
//       const technicians = await prisma.user.findMany({
//         where: { id: { in: technicianIds } }, // Find technicians by the provided IDs
//       });

//       // Check if all provided IDs are valid
//       if (technicians.length !== technicianIds.length) {
//         statusError.message = "One or more technician IDs are invalid"; // Error message for invalid IDs
//         statusError.statusCode = 400; // Bad Request
//         statusError.status = "fail";
//         return next(statusError); // Pass the error to the next middleware
//       }

//       techniciansToConnect = technicianIds.map((id:string) => ({ id })); // Map IDs to the format needed for Prisma
//     }

//     // Update the job in the database
//     const updatedJob = await prisma.job.update({
//       where: { id: jobId },
//       data: {
//         name: name || existingJob.name, // Only update if new value provided
//         description: description || existingJob.description,
//         jobType: jobTypeId ? { connect: { id: jobTypeId } } : undefined, // Update if jobTypeId is provided
//         clients: clientsId ? { connect: { id: clientsId } } : undefined, // Update if clientsId is provided
//         company: companyId ? { connect: { id: companyId } } : undefined, // Update if companyId is provided
//         technicians: techniciansToConnect.length > 0 ? {
//           connect: techniciansToConnect,
//         } : undefined,
//         status: "ASSIGNED", // Always set status to 'ASSIGNED'
//       },
//     });

//     // Return the updated job data
//     return res.status(200).json({
//       status: "success",
//       data: updatedJob,
//     });
//   } catch (e: any) {
//     statusError.status = "fail";
//     statusError.statusCode = 500; // Internal Server Error
//     statusError.message = e.message; // Set the error message
//     return next(statusError); // Pass the error to the next middleware
//   }
// };


/**
 * Author Mark Kibocha 2/10/24
 */



// Joi Schema for Job Update
const JobUpdateSchema = Joi.object({
  technicianIds: Joi.array().items(Joi.string()).required(), // Array of technician IDs to connect
});

// Update Job API
export const assignJob = async (req: Request, res: Response, next: NextFunction) => {
  let statusError: GlobalError = new Error(""); 
  const jobId = req.params.id; 

  try {
    // Validate the request body against the schema
    const { error } = JobUpdateSchema.validate(req.body);
    if (error) {
      statusError.message = error.details[0].message; // Set the error message from Joi validation
      statusError.statusCode = 400; // Bad Request
      statusError.status = "fail";
      return next(statusError); // Pass the error to the next middleware
    }

    const { technicianIds } = req.body;

    // Find the existing job
    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        technicians: true, // Include technicians to check current associations
      },
    });

    if (!existingJob) {
      statusError.message = "Job not found"; // Handle case where job does not exist
      statusError.statusCode = 404; // Not Found
      statusError.status = "fail";
      return next(statusError); // Pass the error to the next middleware
    }

    // Prepare the technician connection
    let techniciansToConnect = [];
    if (technicianIds && technicianIds.length > 0) {
      // Validate if technicians exist in the database
      const technicians = await prisma.user.findMany({
        where: { id: { in: technicianIds } }, // Find technicians by the provided IDs
      });

      // Check if all provided IDs are valid
      if (technicians.length !== technicianIds.length) {
        statusError.message = "One or more technician IDs are invalid"; // Error message for invalid IDs
        statusError.statusCode = 400; // Bad Request
        statusError.status = "fail";
        return next(statusError); // Pass the error to the next middleware
      }

      techniciansToConnect = technicianIds.map((id:string) => ({ id })); // Map IDs to the format needed for Prisma
    }

    // Update the job in the database
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        technicians: techniciansToConnect.length > 0 ? {
          connect: techniciansToConnect,
        } : undefined,
        status: "ASSIGNED", // Always set status to 'ASSIGNED'
      },
    });

    // Return the updated job data
    return res.status(200).json({
      status: "success",
      data: updatedJob,
    });
  } catch (e: any) {
    statusError.status = "fail";
    statusError.statusCode = 500; // Internal Server Error
    statusError.message = e.message; // Set the error message
    return next(statusError); // Pass the error to the next middleware
  }
};

