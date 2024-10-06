import { NextFunction, Request, Response } from "express";
import prisma from "../utils/prismaConfig";

const checkSubscriptionStatus = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req?.user as any;
    const company= await prisma.user.findUnique({
        where:{
            id:userId?.userId
        },
        select:{
            company:{
                select:{
                    subscriptionId:true
                }
            }
        }
    })

    const subscription = await prisma.subscription.findFirst({
      where: {
        id:company?.company?.subscriptionId as string,
        status: "ACTIVE"
      }
    });
  
    if ((!subscription || subscription.status === "EXPIRED") && subscription?.isTrial) {
      return res.status(403).json({ message: "Your trial has expired. Please upgrade to continue." });
    }else if(!subscription || subscription.status === "EXPIRED"){
      return res.status(403).json({ message: "Your Subscription has expired. Please pay to continue." });
    }else{
        next();
    }
  

  };
  