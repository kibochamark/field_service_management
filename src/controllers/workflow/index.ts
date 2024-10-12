import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

const prisma = new PrismaClient();

export const getJobWorkflow = async (req: Request, res: Response, next: NextFunction) => {
  let statusError: Error = new Error("");

  try {
    const { companyId } = req.params;

    
    const jobWorkflows = await prisma.workflows.findMany({
      where: {
        job: { companyId: companyId },
        type: 'JOB',       

      },
      include: {
        Steps:true,
        job: {
          select: {
            id: true,
            name: true,
            description: true,                        
            createdAt: true,
            updatedAt: true,
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
        },
      },
    });

    // Return the list of job workflows
    return res.status(200).json({ data: jobWorkflows });
  } catch (e: any) {
    statusError.message = e.message;
    statusError.stack = e.stack;
    res.status(500).json({ error: statusError.message });
    next(statusError);
  }
};
