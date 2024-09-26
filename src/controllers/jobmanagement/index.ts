import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { GlobalError } from "../../types/errorTypes";
import prisma from "../../utils/prismaConfig";

// this represents the request object for the api
const JobSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  jobTypeId: Joi.string().required(),
  location: Joi.object({
    city: Joi.string().required(),
    zip: Joi.string().required(),
    state: Joi.string().required(),   
  }).required(),
  clientId: Joi.array().items(Joi.string()).required(), // Accepting multiple client IDs
  companyId: Joi.string().required(),
  dispatcherId: Joi.string().required(),
  technicianId: Joi.array().items(Joi.string().optional()), // Optional multiple technician IDs
  // jobSchedule: Joi.object({
  //   startDate: Joi.date().required(),
  //   endDate: Joi.date().optional(),
  //   recurrence: Joi.string().valid("DAILY", "WEEKLY", "MONTHLY").optional(),
  // }).required(),
});
export const createJob = async (req: Request, res: Response, next: NextFunction) => {
  let statusError: GlobalError = new Error("");

  try {
    // Validate request body against jobSchema
    const { error, value } = JobSchema.validate(req.body, { abortEarly: false });

    if (error) {
      statusError = new Error(
        JSON.stringify({
          error: error.details.map((detail) => detail.message)
        })
      );
      statusError.statusCode = 400;
      statusError.status = "fail";
      return next(statusError);
    }

    // Destructure the validated fields
    const {
      name,
      description,
      jobTypeId,
      location,
      clientId, 
      companyId,
      dispatcherId,
      technicianId, 
      jobSchedule
    } = value;

    console.log(clientId, "client")

    // User authorization and role checks
    const user = req.user as any;
    const role = await prisma.user.findFirst({
      where: { id: user?.userId },
      select: { role: { select: { name: true } } }
    });

    if (!role || (role?.role.name !== "business owner" && role?.role.name !== "dispatcher")) {
      statusError.message = "You are not authorized to perform this action";
      statusError.statusCode = 400;
      statusError.status = "fail";
      return next(statusError);
        }

    // Create the job instance
    const job = await prisma.job.create({
      data: {
        name,
        description,
        jobType: { connect: { id: jobTypeId } },
        location: location,
        company: { connect: { id: companyId } },
        dispatcher: { connect: { id: dispatcherId } },
        clients: {
          // Create or connect client records (depending on whether they're new or existing)
          create: clientId.map((clientId: string) => ({
            client: { connect: { id: clientId } }
          }))
        },
        technicians: {
          // Create or connect technician records (if technicianId is provided)
          create: technicianId.map((techId: string) => ({
            technician: { connect: { id: techId } }
          }))
        },
        // jobschedule: {
        //   create: {
        //     startDate: jobSchedule.startDate,
        //     endDate: jobSchedule.endDate,
        //     recurrence: jobSchedule.recurrence
        //   }
        // }
      },
      select: {
        id: true,
        name: true,
        clients: { select: { client: { select: { firstName: true, lastName: true } } } },
        technicians: { select: { technician: { select: { firstName: true, lastName: true } } } },
        createdAt: true
      }
    });

    // Respond with the created job
    return res.status(201).json(job).end();
  } catch (e: any) {
    statusError.status = "fail";
    statusError.statusCode = 501;
    statusError.message = e.message;
    next(statusError);
  }
};




export const getJobTypes = async (req: Request, res: Response, next: NextFunction) => {
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



export const addBulkJobTypes = async (req: Request, res: Response, next: NextFunction) => {
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
        name
      })),      
    });

    return res.status(201).json({
      message: "Job types created successfully",
      createdJobTypes
    }).end();
  } catch (error: any) {
    statusError.message = error.message;
    statusError.status = "fail";
    statusError.statusCode = 500;
    return next(statusError);
  }
};

export const getAllJobs = async (req: Request, res: Response, next: NextFunction) => {
  let statusError: GlobalError = new Error("");

  try {
    const { companyId } = req.params;

    // Fetch all jobs that belong to the specified companyId
    const jobs = await prisma.job.findMany({
      where: { companyId }, include: {clients: {select:
         {client:
          {select:
            {id:true, firstName:true, lastName:true}} }}, technicians:{select:{technician:{select:{id:true, firstName:true, lastName:true}}}}, jobType:{select:{id:true, name:true}}}
      
    });  
    
    console.log(jobs, "them jobs")
    // Return the list of jobs
    return res.status(200).json({data:jobs});
  } catch (e: any) {
    statusError.status = "fail";
    statusError.statusCode = 500;
    statusError.message = e.message;
    next(statusError);
  }
};

export const getJob = async (req: Request, res: Response, next: NextFunction) => {
  let statusError: GlobalError = new Error("");

  try {
    const { jobId } = req.params;

    // // Fetch the job that matches the specified jobId
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        clients: {
          select: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        technicians: {
          select: {
            technician: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        jobType: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    // console.log(job, "job")


    

    // Return the job details
    return res.status(200).json({ data: job }).end()
    // return res.status(200).json({ message:"success"}).end()
  } catch (e: any) {
    statusError.status = "fail";
    statusError.statusCode = 500;
    statusError.message = e.message;
    next(statusError);
  }
};



export const updateJob = async (req: Request, res: Response, next: NextFunction) => {
  let statusError: GlobalError = new Error("");

  try {
    const { jobId } = req.params;
    const { name, description, jobTypeId, clients, technicians, location, status, startDate, endDate } = req.body;

    // Update the job with new data
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        name: name || undefined,
        description: description || undefined,
        jobType: {
          connect: jobTypeId ? { id: jobTypeId } : undefined
        },
        location: {
          set: {
            city: location?.city,
            state: location?.state || undefined,
            zip: location?.zip || undefined,
            otherinfo: location?.otherinfo || undefined
          }
        },
        clients: {
          deleteMany: {},
          create: clients?.map((client: any) => ({
            client: {
              connectOrCreate: {
                where: { id: client.id || '' },
                create: { firstName: client.firstName, lastName: client.lastName }
              }
            }
          }))
        },
        technicians: {
          deleteMany: {},
          create: technicians?.map((technician: any) => ({
            technician: {
              connectOrCreate: {
                where: { id: technician.id || '' },
                create: { firstName: technician.firstName, lastName: technician.lastName }
              }
            }
          }))
        }
      },
      // include: {
      //   clients: {
      //     select: {
      //       client: {
      //         select: {
      //           id: true,
      //           firstName: true,
      //           lastName: true
      //         }
      //       }
      //     }
      //   },
      //   technicians: {
      //     select: {
      //       technician: {
      //         select: {
      //           id: true,
      //           firstName: true,
      //           lastName: true
      //         }
      //       }
      //     }
      //   },
      //   jobType: {
      //     select: {
      //       id: true,
      //       name: true
      //     }
      //   }
      // }
    });
    

    // Return the updated job details
    return res.status(200).json({ data: updatedJob }).end();
  } catch (e: any) {
    statusError.status = "fail";
    statusError.statusCode = 500;
    statusError.message = e.message;
    next(statusError);
  }
};

