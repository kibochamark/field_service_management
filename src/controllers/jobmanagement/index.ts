import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { GlobalError } from "../../types/errorTypes";
import prisma from "../../utils/prismaConfig";

// this represents the request object for the api
const JobSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  jobTypeId: Joi.string().required(), // Updated to refer to JobType ID
  location: Joi.object({
    city: Joi.string().required(),
    zip: Joi.string().required(),
    state: Joi.string().required(),
    otherinfo: Joi.string()
  }),
  clientId: Joi.string().required(),
  companyId: Joi.string().required(),
  dispatcherId: Joi.string().required(),
  technicianId: Joi.string(),
  jobSchedule: Joi.object({
    startDate: Joi.date().required(),
    endDate: Joi.date(),
    recurrence: Joi.string().valid("DAILY", "WEEKLY", "MONTHLY")
  })
});

export const createJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusError: GlobalError = new Error("");

  try {
    // validate request body against our jobSchema
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

    const {
      name,
      description,
      jobTypeId, // Get jobTypeId instead of jobType string
      location,
      clientId,
      companyId,
      dispatcherId,
      technicianId,
      jobSchedule
    } = value;

    const user = req.user as any;

    // Check the role of user if it matches business admin / dispatcher
    const role = await prisma.user.findFirst({
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
    });

    if (!role) {
      statusError.message = "Seems the role of the user does not exist in the system";
      statusError.statusCode = 400;
      statusError.status = "fail";
      next(statusError);
    }

    if (role?.role.name !== "business owner" && role?.role.name !== "dispatcher") {
      statusError.message = "You are not authorized to perform this action";
      statusError.statusCode = 400;
      statusError.status = "fail";
      return next(statusError);
    }

    // Create job instance in the database
    const job = await prisma.job.create({
      data: {
        name,
        description,
        jobType: {
          connect: {
            id: jobTypeId // Link the job type by its ID
          }
        },
        client: {
          connect: {
            id: clientId // Link the client by its ID
          }
        },
        company: {
          connect: {
            id: companyId // Link the company by its ID
          }
        },
        dispatcher: {
          connect: {
            id: dispatcherId // Link the dispatcher by its ID
          }
        },
        technician: technicianId
          ? {
              connect: {
                id: technicianId // Link the technician by its ID (optional)
              }
            }
          : undefined, // Handle the optional technician
        location: {
          set: {
            city: location.city,
            zip: location.zip,
            state: location.state,
            otherinfo: location?.otherinfo ?? ""
          }
        },
        // jobschedule: {
        //   set: {
        //     startDate: jobSchedule.startDate,
        //     endDate: jobSchedule.endDate,
        //     recurrence: jobSchedule.recurrence ?? "DAILY"
        //   }
        // }
      },
      select: {
        id: true,
        name: true,
        client: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        dispatcher: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        technician: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        jobschedule: true,
        createdAt: true
      }
    });
    

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
