// docx/src/compose/demo.spec.ts  
import { describe, it, expect } from "vitest";  
import { demoDocumentComposition } from "./demo";  
  
describe("Composer - Demo Integration", () => {  
    it("should run complete demo without errors", async () => {  
        // Verificar que la demo se ejecute sin errores  
        await expect(demoDocumentComposition()).resolves.not.toThrow();  
    });  
});