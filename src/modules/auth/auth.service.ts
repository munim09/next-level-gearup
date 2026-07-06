import bcrypt from "bcryptjs";
import { JwtPayload, SignOptions } from "jsonwebtoken";
import { Role } from "../../../generated/prisma/enums";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { jwtUtils } from "../../utils/jwt";
import { ILoginUser, RegisterUserPayload } from "./auth.interface";

const getMyProfileFromDB = async (userId: string) => {
    const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        omit: {
            password: true,
        },
        include: {
            profile: true,
        },
    });

    return user;
};

const registerUserIntoDB = async (payload: RegisterUserPayload) => {
    const { name, email, password, profilePhoto, role } = payload;
    const isUserExist = await prisma.user.findUnique({
        where: { email },
    });

    if (payload.role && payload.role === Role.ADMIN) {
        throw new Error("ADMIN role cannot be assigned during registration.");
    }

    if (isUserExist) {
        throw new Error("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(
        password,
        Number(config.bcrypt_salt_rounds),
    );

    const createdUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role,
            profile: {
                create: {
                    profilePhoto,
                },
            },
        },
    });

    const user = await prisma.user.findUnique({
        where: {
            id: createdUser.id,
            email: createdUser.email || email,
        },
        omit: {
            password: true,
        },
        include: {
            profile: true,
        },
    });

    return user;
};

const loginUser = async (payload: ILoginUser) => {
    const { email, password } = payload;

    // const user = await prisma.user.findUnique({
    //     where : {email}
    // })

    // if(!user){
    //     throw new Error("User not found");
    // }

    const user = await prisma.user.findUniqueOrThrow({
        where: { email },
    });

    if (user.activeStatus === "BLOCKED") {
        throw new Error(
            "Your account has been blocked. Please contact support.",
        );
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
        throw new Error("Password is incorrect");
    }

    const jwtPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };

    // const accessToken = jwt.sign(
    //     jwtPayload,
    //     config.jwt_access_secret,
    //     {
    //         expiresIn : config.jwt_access_expires_in
    //     } as SignOptions
    // )

    const accessToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.jwt_access_expires_in as SignOptions,
    );

    // const refreshToken = jwt.sign(
    //     jwtPayload,
    //     config.jwt_refresh_secret,
    //     {
    //         expiresIn : config.jwt_refresh_expires_in
    //     } as SignOptions
    // );

    const refreshToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        config.jwt_refresh_expires_in as SignOptions,
    );

    return {
        accessToken,
        refreshToken,
    };
};

const refreshToken = async (refreshToken: string) => {
    const verifiedRefreshToken = jwtUtils.verifyToken(
        refreshToken,
        config.jwt_refresh_secret as string,
    );

    if (!verifiedRefreshToken.success) {
        throw new Error(verifiedRefreshToken.error);
    }

    const { id } = verifiedRefreshToken.data as JwtPayload;

    const user = await prisma.user.findUniqueOrThrow({
        where: {
            id,
        },
    });

    if (user.activeStatus === "BLOCKED") {
        throw new Error("User is blocked!");
    }

    const jwtPayload = {
        id,
        name: user.name,
        email: user.email,
        role: user.role,
    };

    const accessToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.jwt_access_expires_in as SignOptions,
    );

    return { accessToken };
};

export const authService = {
    loginUser,
    refreshToken,
    registerUserIntoDB,
    getMyProfileFromDB,
};
