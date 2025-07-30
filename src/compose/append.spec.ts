import { describe, it, expect } from "vitest";  
import { Composer } from "./composer";  
import { File } from "../file/file";  
import { Paragraph, TextRun } from "../file/paragraph";  
  
describe("Composer - append() Integration", () => {  
    it("should append source document to master document", () => {  
        // Crear documento maestro  
        const masterFile = new File({  
            sections: [{  
                children: [  
                    new Paragraph({  
                        children: [new TextRun("Master Document Content")]  
                    })  
                ]  
            }]  
        });  
          
        // Crear documento fuente  
        const sourceFile = new File({  
            sections: [{  
                children: [  
                    new Paragraph({  
                        children: [new TextRun("Source Document Content")]  
                    })  
                ]  
            }]  
        });  
          
        const composer = new Composer(masterFile);  
          
        // Obtener elementos iniciales del master  
        const initialElements = (masterFile.Document.View.Body as any).root.length;  
          
        // Ejecutar append  
        composer.append(sourceFile);  
          
        // Verificar que se agregaron elementos  
        const finalElements = (masterFile.Document.View.Body as any).root.length;  
        expect(finalElements).toBeGreaterThan(initialElements);  
          
        // Verificar que el mapeo de estilos se creó  
        expect(composer.getStyleIdToName().size).toBeGreaterThan(0);  
    });  
});