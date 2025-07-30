import { describe, it, expect } from "vitest";  
import { Composer } from "./composer";  
import { File } from "../file/file";  
import { Paragraph, TextRun } from "../file/paragraph";  
  
describe("Composer - Document Validation", () => {  
    it("should create valid DOCX structure", async () => {  
        const masterFile = new File({  
            sections: [{  
                children: [  
                    new Paragraph({  
                        children: [new TextRun("Test content")]  
                    })  
                ]  
            }]  
        });  
          
        const composer = new Composer(masterFile);  
          
        // Verificar que el documento se puede guardar sin errores  
        await expect(composer.save("test-output.docx")).resolves.not.toThrow();  
          
        // Verificar que el archivo se creó  
        const fs = require('fs');  
        expect(fs.existsSync("test-output.docx")).toBe(true);  
          
        // Limpiar archivo de test  
        fs.unlinkSync("test-output.docx");  
    });  
});

describe("Composer - Element Creation", () => {  
    it("should create proper Paragraph elements from XML", () => {  
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
                        children: [new TextRun("Source content")],  
                        style: "Heading1"  
                    })  
                ]  
            }]  
        });  
          
        const composer = new Composer(masterFile);  
          
        // Ejecutar append  
        composer.append(sourceFile);  
          
        // Verificar que los elementos se crearon correctamente  
        const body = masterFile.Document.View.Body;  
        const elements = (body as any).root;  
          
        // Debería tener elementos originales + elementos agregados  
        expect(elements.length).toBeGreaterThan(1);  
          
        // Verificar que todos los elementos son válidos  
        elements.forEach((element: any) => {  
            expect(element.constructor?.name).toBe('Paragraph');  
            expect(element.rootKey).toBe('w:p');  
        });  
    });  
});