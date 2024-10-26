import { NextFunction, Request, Response } from "express";
import { GlobalError } from "../../types/errorTypes";
import prisma from "../../utils/prismaConfig";
import Joi from "joi";

export const getDashboardMetrics = async (
  req: Request<{ companyId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyId } = req.params;

    // Validate companyId
    const { error } = Joi.string().required().validate(companyId);
    if (error) {
      const validationError: GlobalError = new Error("Invalid company ID");
      validationError.statusCode = 400;
      throw validationError;
    }

    // Get total number of employees
    const totalEmployees = await prisma.user.count({
      where: { companyId: companyId },
    });

    // Get subscription status
    const subscription = await prisma.subscription.findFirst({
      where: {
        Company: { some: { id: companyId } },
      },
      select: { status: true },
    });

    // Get count of jobs with status "SCHEDULED"
    const scheduledJobsCount = await prisma.job.count({
      where: {
        companyId: companyId,
        status: "SCHEDULED",
      },
    });

    // Get count of jobs with status "COMPLETED"
    const completedJobsCount = await prisma.job.count({
      where: {
        companyId: companyId,
        status: "COMPLETED",
      },
    });

    // Calculate total revenue from invoices
    const totalRevenue = await prisma.invoice.aggregate({
      where: { companyId: companyId },
      _sum: { totalAmount: true },
    });

    res.status(200).json({
      totalEmployees,
      subscriptionStatus: subscription?.status || "Unknown",
      scheduledJobsCount,
      completedJobsCount,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    const serverError: GlobalError = new Error("An error occurred while retrieving metrics");
    serverError.statusCode = 500;
    next(serverError);
  }
};
