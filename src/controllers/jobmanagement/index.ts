import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { GlobalError } from "../../types/errorTypes";
import prisma from "../../utils/prismaConfig";


// this represents the request object for the api
const JobSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    jobType: Joi.string().required(),
    location: Joi.object({
        city: Joi.string().required(),
        zip: Joi.string().required(),
        state: Joi.string().required(),
        otherinfo: Joi.string()
    }),
    clientId: Joi.string().required(),
    dispatcherId: Joi.string().required(),
    technicianId: Joi.string(),
    jobSchedule: Joi.object({
        startDate: Joi.date().required(),
        endDate: Joi.date(),
        recurrence: Joi.string().valid("DAILY", "WEEKLY", "MONTHLY")
    })
});



export const createJob=async(
    req:Request, res:Response, next:NextFunction
)=>{
    let statusError: GlobalError = new Error("")

    try{
        // validate request body against our jobSchema

        const { error, value } = JobSchema.validate(req.body, { abortEarly: false });

        if (error) {
            statusError = new Error(JSON.stringify(
                {
                    error: error.details.map(detail => detail.message),
                }
            ))
            statusError.statusCode = 400
            statusError.status = "fail"
            return next(statusError)

        }


        const { name, description,
             jobType,
            location,
            clientId,
            dispatcherId,
            technicianId,
            jobSchedule
            } = value;
    
        const user = req.user as any

        // check the role of user if it matches business admin / dispatcher
        const role = await prisma.role.findFirst({
            where: {
                id: user?.userId
            },
            select: {
                name:true
            }
        })

        if (!role) {
            statusError.message = "seems the role of the user does not exist in the system"
            statusError.statusCode = 400
            statusError.status = "fail"
            next(statusError)
        }

        if(role?.name !== "business owner" && role?.name !== "dispatcher"){
            statusError.message = "You are not authorized to perform this action"
            statusError.statusCode = 400
            statusError.status = "fail"
            return next(statusError)
        }


        // create job instance in the database
        const job = await prisma.job.create({
            data:{
                name,
                description,
                jobType,
                clientId,
                dispatcherId,
                location:{
                    set:{
                        city:location.city,
                        zip:location.zip,
                        state:location.state,
                        otherinfo:location?.otherinfo ?? ""
                    }
                },
                jobschedule:{
                    set:{
                        startDate:jobSchedule.startDate,
                        endDate:jobSchedule.endDate,
                        recurrence: jobSchedule.recurrence ?? "DAILY"
                    }
                }

            },
            select:{
                id:true,
                name:true,
                client:{
                    select:{
                        firstName:true,
                        lastName:true
                    }
                },
                dispatcher:{
                    select:{
                        firstName:true,
                        lastName:true
                    }
                },
                jobschedule:true,
                createdAt:true
            }
        })


        return res.status(201).json(job).end()


    }catch(e:any){
        statusError.status="fail"
        statusError.statusCode=501
        statusError.message=e.message
        next(statusError)
    }

}

export const getJobById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusError: GlobalError = new Error("");

  try {
    const jobId = req.params.id;

    // Fetch job by its ID
    const job = await prisma.job.findUnique({
      where: {
        id: jobId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        jobType: true,
        client: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        dispatcher: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        technician: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        jobschedule: true,
        location: true,
        createdAt: true,
      },
    });

    // Check if job was found
    if (!job) {
      statusError.message = "Job not found";
      statusError.statusCode = 404;
      statusError.status = "fail";
      return next(statusError);
    }

    // Return job details
    return res.status(200).json(job).end();
  } catch (e: any) {
    statusError.status = "fail";
    statusError.statusCode = 501;
    statusError.message = e.message;
    return next(statusError);
  }
};
