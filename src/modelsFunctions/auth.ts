import { User } from "@prisma/client";
import prisma from "../utils/prismaConfig";

export const createUser = async (user: {
    email: string;
    password: string;
    salt: string;
    firstName: string;
    lastName: string;
    roleId: string,
}) => {
    try {
        const newuser = await prisma.user.create({
            data: {
                ...user
            }
        })

        return newuser
    } catch (err) {
        return err
    }

}