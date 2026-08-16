import type { Request, Response } from "express";

export const home = (req:Request,res:Response)=>{
    try {
        res.render("home");
    } catch (error) {
        console.log(error)
    }
}