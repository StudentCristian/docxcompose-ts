import { describe, it, expect } from "vitest";  
import { Composer } from "./composer";  
import { File } from "../file/file";  
import { Paragraph, TextRun } from "../file/paragraph";  
  
describe("Composer - Post-processing", () => {  
    it("should handle post-processing without errors", () => {  
        const masterFile = new File({  
            sections: [{  
                children: [  
                    new Paragraph({  
                        children: [new TextRun("Master content")]  
                    })  
                ]  
            }]  
        });  
          
        const sourceFile = new File({  
            sections: [{  
                children: [  
                    new Paragraph({  
                        children: [new TextRun("Source content")]  
                    })  
                ]  
            }]  
        });  
          
        const composer = new Composer(masterFile);  
          
        // Ejecutar append que incluye post-procesamiento  
        expect(() => {  
            composer.append(sourceFile);  
        }).not.toThrow();  
          
        // Verificar que el documento sigue siendo válido  
        const body = masterFile.Document.View.Body;  
        const elements = (body as any).root;  
        expect(elements.length).toBeGreaterThan(0);  
    });  
});