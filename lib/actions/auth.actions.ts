'use server';
import { auth } from "../better-auth/auth";
import { inngest } from "../inngest/client";
import { headers } from "next/headers";


export const signUpWithEmail = async ({email,password,fullName,country,investmentGoals,riskTolerance,preferredIndustry}:SignUpFormData) => {
    try{
        if (!auth) {
            throw new Error("Authentication service is not available.");
        }

        const response = await auth.api.signUpEmail({
            body: {email,password,name: fullName}
        });

        if(response){
            await inngest.send({
                name: "app/user.created",
                data: {
                    email,
                    name: fullName,
                    country,
                    investmentGoals,
                    riskTolerance,
                    preferredIndustry
                }
            })
        }

        return {success: true, data: response};
    }catch(error){
        console.error("Error during sign-up:", error);
        throw new Error("Failed to sign up. Please try again.");
    }
}


export const signOut = async () => {
    try{
        await auth?.api.signOut({headers: await headers()});
    }catch(error){
        console.log('Sign out failed',error);
        return {success: false, error: 'Sign out failed'}
    }
}

export const signInWithEmail = async ({email,password}:SignUpFormData) => {
    try{
        if (!auth) {
            throw new Error("Authentication service is not available.");
        }

        const response = await auth.api.signInEmail({
            body: {email,password}
        });

        return {success: true, data: response};
    }catch(error){
        console.error("Error during sign-in:", error);
        throw new Error("Failed to sign in. Please try again.");
    }
}
