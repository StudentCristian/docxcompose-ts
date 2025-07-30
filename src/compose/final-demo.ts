import { Composer } from "./composer";  
import { File } from "../file/file";  
import { Paragraph, TextRun } from "../file/paragraph";  
  
async function finalDemo() {  
    console.log("=== DOCX Composer - Demo Final ===");  
      
    try {  
        // Crear documento maestro con múltiples estilos  
        const masterFile = new File({  
            sections: [{  
                children: [  
                    new Paragraph({  
                        children: [new TextRun("Documento Maestro")],  
                        style: "Heading1"  
                    }),  
                    new Paragraph({  
                        children: [new TextRun("Contenido del documento principal con estilos en inglés.")]  
                    })  
                ]  
            }]  
        });  
          
        // Crear documento fuente con estilos en español  
        const sourceFile = new File({  
            sections: [{  
                children: [  
                    new Paragraph({  
                        children: [new TextRun("Documento Agregado")],  
                        style: "Titulo1" // ID en español  
                    }),  
                    new Paragraph({  
                        children: [new TextRun("Este contenido se agregará al documento maestro.")],  
                        style: "Normal"  
                    }),  
                    new Paragraph({  
                        children: [new TextRun("Párrafo con estilo personalizado.")],  
                        style: "EstiloPersonalizado"  
                    })  
                ]  
            }]  
        });  
          
        const composer = new Composer(masterFile);  
          
        console.log("\\n--- Estado Inicial ---");  
        console.log(`Elementos en documento maestro: ${(masterFile.Document.View.Body as any).root.length}`);  
          
        // Ejecutar composición completa  
        composer.append(sourceFile);  
          
        console.log("\\n--- Estado Final ---");  
        console.log(`Elementos en documento maestro: ${(masterFile.Document.View.Body as any).root.length}`);  
          
        // Mostrar mapeo de estilos completo  
        console.log("\\n--- Mapeo de Estilos Completo ---");  
        const styleIdToName = composer.getStyleIdToName();  
        const styleNameToId = composer.getStyleNameToId();  
          
        console.log("Estilos mapeados por ID:");  
        styleIdToName.forEach((name, id) => {  
            console.log(`  ${id} → ${name}`);  
        });  
          
        console.log("Estilos mapeados por nombre:");  
        styleNameToId.forEach((id, name) => {  
            console.log(`  "${name}" → ${id}`);  
        });  
          
        // Guardar documento final  
        await composer.save("docs/demo-final.docx");  
          
        console.log("\\n🎉 ¡Demo final completada exitosamente!");  
        console.log("📄 Documento guardado como: docs/demo-final.docx");  
        console.log("\\n✨ Sistema de composición DOCX completamente funcional ✨");  
          
    } catch (error) {  
        console.error("❌ Error en demo final:", error);  
    }  
}  
  
// Ejecutar demo  
if (require.main === module) {  
    finalDemo();  
}  
  
export { finalDemo };