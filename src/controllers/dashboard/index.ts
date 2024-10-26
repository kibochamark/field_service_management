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

    // Other metric queries remain the same
    const totalEmployees = await prisma.user.count({
      where: { companyId: companyId },
    });

    const subscription = await prisma.subscription.findFirst({
      where: {
        Company: { some: { id: companyId } },
      },
      select: { status: true },
    });

    const scheduledJobsCount = await prisma.job.count({
      where: {
        companyId: companyId,
        status: "SCHEDULED",
      },
    });

    const completedJobsCount = await prisma.job.count({
      where: {
        companyId: companyId,
        status: "COMPLETED",
      },
    });

    const totalRevenue = await prisma.invoice.aggregate({
      where: { companyId: companyId },
      _sum: { totalAmount: true },
    });

    const totalClients = await prisma.client.count({
      where: { companyId: companyId },
    });

    const pendingInvoicesCount = await prisma.invoice.count({
      where: {
        companyId: companyId,
        status: "APPROVED",
      },
    });

    const ongoingJobsCount = await prisma.job.count({
      where: {
        companyId: companyId,
        status: "ONGOING",
      },
    });

    // Fetch recent jobs
    const recentJobs = await prisma.job.findMany({
      where: { companyId: companyId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        name: true,
        status: true,
        createdAt: true,
        clients: { select: { firstName: true, lastName: true } },
        technicians: {
          select: {
            technician: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Format the recent jobs data for the response
    const formattedRecentJobs = recentJobs.map(job => ({
      jobName: job.name,
      client: `${job.clients.firstName} ${job.clients.lastName}`,
      status: job.status,
      date: job.createdAt,
      technician: job.technicians.map(t => `${t.technician.firstName} ${t.technician.lastName}`).join(", "),
    }));

    res.status(200).json({
      totalEmployees,
      subscriptionStatus: subscription?.status || "Unknown",
      scheduledJobsCount,
      completedJobsCount,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalClients,
      pendingInvoicesCount,
      ongoingJobsCount,
      recentJobs: formattedRecentJobs,
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    const serverError: GlobalError = new Error("An error occurred while retrieving metrics");
    serverError.statusCode = 500;
    next(serverError);
  }
};

