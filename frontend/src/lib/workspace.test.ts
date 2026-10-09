import { describe,it,expect,vi,afterEach } from "vitest";
import { api, money, renewalDays, elevated } from "./workspace";
afterEach(()=>vi.unstubAllGlobals());
describe("workspace contract",()=>{
 it("keeps unknown contract values and dates unavailable",()=>{expect(money(null)).toBe("Unavailable");expect(renewalDays({businessAsOf:"2026-10-01",renewalDate:null})).toBeNull();expect(renewalDays({businessAsOf:"2026-10-01",renewalDate:"2026-11-05"})).toBe(35);});
 it("does not treat an unclassified score as low or elevated",()=>{expect(elevated({priority:{level:null}})).toBe(false);expect(elevated({priority:{level:"High"}})).toBe(true);});
 it("does not claim a failed write succeeded and preserves the conflict explanation",async()=>{vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({error:"CONFLICT"}),{status:409})));await expect(api("decisions","POST",{reason:"Reviewed"})).rejects.toThrow("changed");});
 it("sends authenticated same-origin JSON without caller identity headers",async()=>{const fetch=vi.fn().mockResolvedValue(new Response(JSON.stringify({id:"stored"}),{status:200}));vi.stubGlobal("fetch",fetch);expect(await api("actions","POST",{note:"Observed"})).toEqual({id:"stored"});expect(fetch).toHaveBeenCalledWith("/api/actions",expect.objectContaining({method:"POST",body:JSON.stringify({note:"Observed"})}));});
});
