// docx/src/compose/demo.ts  
import { Composer } from "./composer";  
import { File } from "../file/file";  
import { Paragraph, TextRun } from "../file/paragraph";  
  
async function demoDocumentComposition() {  
    console.log("=== DOCX Composer Demo ===");  
      
    try {  
        // Crear documento maestro (equivalente a master.docx)  
        const masterFile = new File({  
            sections: [{  
                children: [  
                    new Paragraph({  
                        children: [new TextRun("Master Document - Documento Maestro")],  
                        style: "Heading1"  
                    }),  
                    new Paragraph({  
                        children: [new TextRun("Este es el contenido del documento maestro.")]  
                    })  
                ]  
            }],  
            styles: {  
                paragraphStyles: [  
                    {  
                        id: "Heading1",  
                        name: "Heading 1", // Nombre en inglés  
                        run: { bold: true, size: 32 }  
                    }  
                ]  
            }  
        });  
          
        // Crear documento fuente (equivalente a doc1.docx)  
        const sourceFile = new File({  
            sections: [{  
                children: [  
                    new Paragraph({  
                        children: [new TextRun("Documento Fuente")],  
                        style: "Titulo1" // ID en español  
                    }),  
                    new Paragraph({  
                        children: [new TextRun("Este contenido será agregado al documento maestro.")]  
                    })  
                ]  
            }],  
            styles: {  
                paragraphStyles: [  
                    {  
                        id: "Titulo1",  
                        name: "Heading 1", // Mismo nombre, diferente ID  
                        run: { bold: true, size: 32 }  
                    }  
                ]  
            }  
        });  
          
        // Crear compositor  
        const composer = new Composer(masterFile);  
          
        console.log("\\n--- Antes de la composición ---");  
        console.log(`Elementos en documento maestro: ${(masterFile.Document.View.Body as any).root.length}`);  
          
        // Ejecutar composición (equivalente a composer.append(doc1))  
        composer.append(sourceFile);  
          
        console.log("\\n--- Después de la composición ---");  
        console.log(`Elementos en documento maestro: ${(masterFile.Document.View.Body as any).root.length}`);  
          
        // Mostrar mapeo de estilos (equivalente al output de Python)  
        console.log("\\n--- Mapeo de Estilos ---");  
        console.log("styleIdToName:", Array.from(composer.getStyleIdToName().entries()));  
        console.log("styleNameToId:", Array.from(composer.getStyleNameToId().entries()));  
          
        // Guardar documento combinado  
        await composer.save("docs/combined.docx");  
          
        console.log("\\n✅ Demo completada exitosamente!");  
        console.log("📄 Documento guardado como: docs/combined.docx");  
          
    } catch (error) {  
        console.error("❌ Error en la demo:", error);  
    }  
}  
  
// Ejecutar demo  
if (require.main === module) {  
    demoDocumentComposition();  
}  
  
export { demoDocumentComposition };