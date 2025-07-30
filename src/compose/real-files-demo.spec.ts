// docx/src/compose/real-files-demo.spec.ts  
import { describe, it, expect } from "vitest";  
import { realFilesDemo } from "./real-files-demo";  
  
describe("Composer - Real Files Demo", () => {  
    it("should complete real files demo with master.docx and doc1.docx", async () => {  
        await expect(realFilesDemo()).resolves.not.toThrow();  
    });  
});