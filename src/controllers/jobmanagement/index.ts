// createJob.js
import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import prisma from "../../utils/prismaConfig"; // Adjust this path according to your project structure
import { GlobalError } from "../../types/errorTypes"; // Assuming you have a GlobalError type for error handling
import { stat } from "fs";

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
  jobTypeId: Joi.string().required(),
  clientId: Joi.string().required(),
  companyId: Joi.string().required(),
  dispatcherId: Joi.string().required(),
});


const JobGetSchema = Joi.object({
  companyId: Joi.string().required()
})
// Create Job API
export const createJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

    const { name, description, jobTypeId, clientId, companyId, dispatcherId } =
      req.body;

    const [newJob, newWorkflow] = await prisma.$transaction(async (tx) => {
      // Create the job in the database
      const newJob = await tx.job.create({
        data: {
          name,
          description,
          jobTypeId,
          dispatcherId,
          companyId,
          clientId,
        },
        select: {
          id: true,
          name: true,
          description: true,
          dispatcher: {
            select: {
              firstName: true,
            },
          },
          technicians: {
            select: {
              technician: {
                select: {
                  firstName: true,
                },
              },
            },
          },

          status: true,
        },
      });
      //create workflow
      const newWorkflow = await tx.workflows.create({
        data: {
          Steps: {
            create: [
              {
                status: "CREATED",
              },
            ],
          },
          jobId: newJob.id,
        },
      });

      return [newJob, newWorkflow];
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

// Joi Schema for Job Update
const JobUpdateSchema = Joi.object({
  location: Joi.object({
    city: Joi.string().required(),
    zip: Joi.string().required(),
    state: Joi.string().required(),
    otherinfo: Joi.string().optional(),
  }).required(),
  technicianIds: Joi.array().items(Joi.string()).required(), // Array of technician IDs to connect
});

// Update Job API
export const assignJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

    const { technicianIds, location } = req.body;

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

      techniciansToConnect = technicianIds.map((id: string) => ({
        technicianId: id,
        jobId: jobId,
      })); // Map IDs to the format needed for Prisma
    }

    // // perform a transcation so that both or none should be created
    const [updatejob, jobtech] = await prisma.$transaction(async (tx) => {
      const jobtech = await prisma.jobTechnician.createMany({
        data: techniciansToConnect,
      });

      const jobtechs = await prisma.jobTechnician.findMany({
        where: {
          jobId: jobId,
        },
      });

      let connectlist = jobtechs.map((job: any) => ({ id: job.id }));

      // Update the job in the database
      const updatedJob = await prisma.job.update({
        where: { id: jobId },
        data: {
          location: location,
          technicians:
            connectlist.length > 0
              ? {
                connect: connectlist,
              }
              : undefined,
          status: "ASSIGNED", // Always set status to 'ASSIGNED'
        },
      });

      //create workfow

      const findWorkflow = await prisma.workflows.findFirst({
        where: { jobId: jobId },
      });

      const updateWorkflow = await prisma.workflows.update({
        where: { id: findWorkflow?.id as string },
        data: {
          Steps: {
            create: [
              {
                status: "ASSIGNED",

              },
            ],
          },
        },
      });

      return [updatedJob, jobtech];
    });

    // Return the updated job data
    return res.status(200).json({
      status: "success",
      data: updatejob,
    });
  } catch (e: any) {
    statusError.status = "fail";
    statusError.statusCode = 500; // Internal Server Error
    statusError.message = e.message; // Set the error message
    return next(statusError); // Pass the error to the next middleware
  }
};

export const getJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusError: GlobalError = new Error("");

  try {
    const { jobId } = req.params;

    // // Fetch the job that matches the specified jobId
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        clients: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        technicians: {
          select: {
            technician: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        jobType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    console.log(job, "job");

    // Return the job details
    return res.status(200).json({ data: job }).end();
    // return res.status(200).json({ message:"success"}).end()
  } catch (e: any) {
    statusError.status = "fail";
    statusError.statusCode = 500;
    statusError.message = e.message;
    next(statusError);
  }
};

export const addBulkJobTypes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusError: GlobalError = new Error("");

  try {
    const jobTypes = req.body.jobTypes;

    if (!Array.isArray(jobTypes) || jobTypes.length === 0) {
      statusError.message = "Please provide an array of job types";
      statusError.statusCode = 400;
      statusError.status = "fail";
      return next(statusError);
    }

    // Create bulk job types
    const createdJobTypes = await prisma.jobType.createMany({
      data: jobTypes.map((name: string) => ({
        name,
      })),
    });

    return res
      .status(201)
      .json({
        message: "Job types created successfully",
        createdJobTypes,
      })
      .end();
  } catch (error: any) {
    statusError.message = error.message;
    statusError.status = "fail";
    statusError.statusCode = 500;
    return next(statusError);
  }
};

export const getAllJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusError: GlobalError = new Error("");

  try {
    const { companyId } = req.params;

    // Fetch all jobs that belong to the specified companyId
    const jobs = await prisma.job.findMany({
      where: { companyId },
      include: {
        clients: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        technicians: {
          select: {
            technician: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        jobType: { select: { id: true, name: true } },
      },
    });

    console.log(jobs, "them jobs");
    // Return the list of jobs
    return res.status(200).json({ data: jobs });
  } catch (e: any) {
    statusError.status = "fail";
    statusError.statusCode = 500;
    statusError.message = e.message;
    next(statusError);
  }
};
export const getJobTypes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusError: GlobalError = new Error("");

  try {
    // Retrieve job types from the database
    const jobTypes = await prisma.jobType.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    // Check if job types are found
    if (!jobTypes || jobTypes.length === 0) {
      statusError.message = "No job types found";
      statusError.statusCode = 404;
      statusError.status = "fail";
      return next(statusError);
    }

    // Return job types
    return res.status(200).json({
      status: "success",
      data: jobTypes,
    });
  } catch (e: any) {
    statusError.status = "fail";
    statusError.statusCode = 501;
    statusError.message = e.message;
    return next(statusError);
  }
};

//Schedule job
const JobScheduleSchema = Joi.object({
  jobSchedule: Joi.object({
    startDate: Joi.date().required(),
    endDate: Joi.date().optional(),
    recurrence: Joi.string().valid("DAILY", "WEEKLY", "MONTHLY").optional(),
  }).required(),
});

export const scheduleJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusError: GlobalError = new Error("");
  const jobId = req.params.jobId;

  try {
    // Validate the request body against the schema
    const { error } = JobScheduleSchema.validate(req.body);
    if (error) {
      statusError.message = error.details[0].message; // Set the error message from Joi validation
      statusError.statusCode = 400; // Bad Request
      statusError.status = "fail";
      return next(statusError); // Pass the error to the next middleware
    }

    const { jobSchedule } = req.body;
    const { startDate, endDate, recurrence } = jobSchedule;

    // Find the existing job
    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      statusError.message = "Job not found"; // Handle case where job does not exist
      statusError.statusCode = 404; // Not Found
      statusError.status = "fail";
      return next(statusError); // Pass the error to the next middleware
    }

    // Check if the endDate is earlier than the startDate
    if (endDate && new Date(endDate) < new Date(startDate)) {
      statusError.message = "End date cannot be earlier than start date"; // Handle invalid date range
      statusError.statusCode = 400; // Bad Request
      statusError.status = "fail";
      return next(statusError); // Pass the error to the next middleware
    }

    const [updatedJob, updateWorkflow] = await prisma.$transaction(
      async (tx) => {
        // Update the job with schedule information
        const updatedJob = await prisma.job.update({
          where: { id: jobId },
          data: {
            jobschedule: {
              startDate: new Date(startDate),
              endDate: endDate ? new Date(endDate) : new Date(startDate),
              recurrence: recurrence || null,
            },
            status: "SCHEDULED", // Set job status to SCHEDULED
          },
        });

        //update workfow

        const findWorkflow = await prisma.workflows.findFirst({
          where: { jobId: jobId },
        });

        const updateWorkflow = await prisma.workflows.update({
          where: { id: findWorkflow?.id as string },
          data: {
            Steps: {
              create: [
                {
                  status: "SCHEDULED",

                },
              ],
            },
          },
        });
        return [updatedJob, updateWorkflow];
      }
    );

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

export const deleteJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusError: GlobalError = new Error("");

  try {
    const { jobId } = req.params;

    // First, delete all related JobTechnician entries for the job
    await prisma.jobTechnician.deleteMany({
      where: {
        jobId: jobId,
      },
    });

    // Then, delete the Job itself
    const deletedJob = await prisma.job.delete({
      where: {
        id: jobId,
      },
    });

    // Return success response
    return res
      .status(200)
      .json({
        message: "Job deleted successfully",
        data: deletedJob,
      })
      .end();
  } catch (e: any) {
    statusError.status = "fail";
    statusError.statusCode = 500;
    statusError.message = e.message;
    next(statusError);
  }
};

// export const updateJob = async (req: Request, res: Response) => {
//   try {
//     // Extract the job ID from the route parameters
//     const { jobId } = req.params;

//     // Check if the job exists
//     const existingJob = await prisma.job.findUnique({
//       where: { id: jobId },
//     });

//     if (!existingJob) {
//       return res.status(404).json({ message: 'Job not found' });
//     }

//     // Get the update data from the request body
//     const { name, description, jobTypeId, location, status, dispatcherId, clientId, technicians, companyId, jobschedule } = req.body;

//     // Perform the update
//     const updatedJob = await prisma.job.update({
//       where: { id: jobId },
//       data: {
//         name,
//         description,
//         jobTypeId,
//         location,
//         status,
//         dispatcherId,
//         clientId,
//         technicians,
//         jobschedule,
//       },
//     });

//     return res.status(200).json({ message: 'Job updated successfully', job: updatedJob });
//   } catch (error) {
//     console.error('Error updating the job:', error);
//     return res.status(500).json({
//       message: 'An error occurred while updating the job',
//       error: error instanceof Error ? error.message : 'Unknown error',
//     });
//   }
// };

export const updateJob = async (req: Request, res: Response) => {
  try {
    // Extract the job ID from the route parameters
    const { jobId } = req.params;

    // Check if the job exists
    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Get the update data from the request body
    const {
      name,
      description,
      jobTypeId,
      location,
      status,
      dispatcherId,
      clientId,
      technicians,
      companyId,
      jobschedule,
    } = req.body;

    // Use a transaction to ensure both job and workflow updates are performed together
    const [updatedJob, jobTech] = await prisma.$transaction(async (tx) => {
      // Remove existing technicians associated with the job
      await tx.jobTechnician.deleteMany({
        where: { jobId },
      });

      // Update the job technicians if provided
      let connectList: string | any[] = [];
      if (technicians && technicians.length > 0) {
        await tx.jobTechnician.createMany({
          data: technicians.map((id: { id: string }) => ({
            jobId,
            technicianId: id?.id,
          })),
        });

        const jobTechs = await tx.jobTechnician.findMany({
          where: { jobId },
        });

        connectList = jobTechs.map((jobTech) => ({ id: jobTech.id }));
      }

      // Update the job in the database
      const updatedJob = await tx.job.update({
        where: { id: jobId },
        data: {
          name,
          description,
          jobTypeId,
          location,
          status,
          dispatcherId,
          clientId: clientId,
          technicians: connectList.length > 0 ? { connect: connectList } : undefined,
        },
      });

      // Check if the status has changed before updating the workflow
      if (existingJob.status !== status) {
        const findWorkflow = await tx.workflows.findFirst({
          where: { jobId },
          select: {
            id: true,
            Steps: true,
          },
        });

        if (findWorkflow) {
          const steps = await prisma.steps.findFirst({
            where: {
              workflowId: findWorkflow.id,
              status: status,
            },
          });
          if (!steps) {
            await tx.workflows.update({
              where: { id: findWorkflow.id },
              data: {
                Steps: {
                  create: {
                    status: status,
                  },
                },
              },
            });
          }
        }
      }

      return [updatedJob, connectList];
    });

    return res.status(200).json({ message: "Job updated successfully", job: updatedJob });
  } catch (error) {
    console.error("Error updating the job:", error);
    return res.status(500).json({
      message: "An error occurred while updating the job",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};





const UpdateJobStatusSchema = Joi.object({
  status: Joi.string().valid("CREATED", "ACCEPTED",
    "ASSIGNED",
    "SCHEDULED",
    "ONGOING",
    "COMPLETED",
    "CANCELLED").required()

})

  ; export const updateJobStatus = async (req: Request, res: Response, next: NextFunction) => {
    let statusError: GlobalError = new Error("");



    try {
      // Retrieve job types from the database
      // Validate the request body against the schema
      const { error } = UpdateJobStatusSchema.validate(req.body);
      if (error) {
        statusError.message = error.details[0].message; // Set the error message from Joi validation
        statusError.statusCode = 400; // Bad Request
        statusError.status = "fail";
        return next(statusError); // Pass the error to the next middleware
      }

      const { status } = req.body;

      //  retieve jobId
      const { id } = req.params


      const [updatedjob, updatedworkflow] = await prisma.$transaction(async (tx) => {

        const updateJob = await tx.job.update({
          where: {
            id: id
          },
          data: {
            status: status
          },
          select: {
            status: true,
            Workflows: {
              select: {
                id: true,
                Steps: true
              }
            },
            updatedAt: true

          }
        })



        const updatedworkflow = await tx.workflows.update({
          where: {
            id: updateJob.Workflows[0].id
          },
          data: {
            Steps: {
              create: {
                status: status
              }
            }
          }
        })




        return [updateJob, updatedworkflow]
      })

      return res.status(200).json({
        message: "success",
        data: { updatedjob, updatedworkflow }
      })

    } catch (e: any) {
      statusError.status = "fail";
      statusError.statusCode = 500;
      statusError.message = e.message;
      next(statusError);
    }
  }





// get Recent Job Feed

export const getJobFeed = async (req: Request, res: Response, next: NextFunction) => {
  let statusError: GlobalError = new Error("");
  try {
    // Retrieve job types from the database
    // Validate the request body against the schema
    const { error, value } = JobGetSchema.validate(req.params);
    if (error) {
      statusError.message = error.details[0].message; // Set the error message from Joi validation
      statusError.statusCode = 400; // Bad Request
      statusError.status = "fail";
      return next(statusError); // Pass the error to the next middleware
    }

    const { companyId } = value;

    const jobs = await prisma.job.findMany({
      where: {
        companyId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5

    })


    return res.status(200).json({
      message: "success",
      data: jobs
    })

  } catch (e: any) {
    statusError.status = "fail";
    statusError.statusCode = 500;
    statusError.message = e.message;
    next(statusError);
  }

}




