import { it,expect } from "vitest";
import { factorWeight,riskFactors } from "./factors";
it("shows the five documented backend factor weights, totalling 100",()=>{expect(riskFactors).toEqual(["Usage","Service","Champion","Commitments","Payment"]);expect(factorWeight).toEqual({Usage:30,Service:25,Champion:20,Commitments:15,Payment:10});expect(Object.values(factorWeight).reduce((a,b)=>a+b,0)).toBe(100);});
