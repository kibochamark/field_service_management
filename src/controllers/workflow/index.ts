import { NextFunction, Request, Response } from "express";
import prisma from "../../utils/prismaConfig"; 
import { GlobalError } from "../../types/errorTypes"; 


export const getJobWorkflow = async (req: Request, res: Response, next: NextFunction) => {
  let statusError: GlobalError = new Error(""); // Initialize a new GlobalError object

  try {
    const { companyId } = req.params;

    // Fetch jobs that belong to the specified companyId
    const companyJobs = await prisma.job.findMany({
      where: { companyId },
      include: {
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
      },
    });

    if (!companyJobs || companyJobs.length === 0) {
      statusError.message = "No jobs found for this company";
      statusError.statusCode = 404;
      statusError.status = "fail";
      return next(statusError); // Pass the error to the next middleware
    }

    // Format the response data
    const formattedJobs = companyJobs.map((job) => ({
      jobId: job.id,
      name: job.name,
      description: job.description,
      status: job.status,
      completionDate: job.updatedAt,
      technicians: job.technicians.map((tech) => ({
        id: tech.technician.id,
        firstName: tech.technician.firstName,
        lastName: tech.technician.lastName,
      })),
    }));

    // Return the job details
    return res.status(200).json({
      status: "success",
      data: formattedJobs,
    });
  } catch (e: any) {
    statusError.status = "fail";
    statusError.statusCode = 500; // Internal Server Error
    statusError.message = e.message; // Set the error message
    return next(statusError); // Pass the error to the next middleware
  }
};
