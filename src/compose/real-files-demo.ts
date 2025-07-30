// docx/src/compose/real-files-demo.ts  
import { Composer } from "./composer";  
  
async function realFilesDemo() {  
    console.log("=== Demo con Archivos DOCX Reales ===");  
      
    try {  
        // Verificar que los archivos existen  
        const fs = require('fs');  
        if (!fs.existsSync("docs/master.docx") || !fs.existsSync("docs/doc1.docx")) {  
            console.log("❌ Archivos master.docx o doc1.docx no encontrados en docs/");  
            console.log("Por favor, coloca tus archivos DOCX en la carpeta docs/");  
            return;  
        }  
          
    console.log("📁 Cargando doc1.docx como master...");    
    const masterFile = await Composer.createFileWithExternalStyles("docs/doc1.docx");    
        
    console.log("📁 Cargando master.docx como source...");    
    const sourceFile = await Composer.createFileWithExternalStyles("docs/master.docx");
          
        // Crear compositor (equivalente a Composer(master) en Python)  
        const composer = new Composer(masterFile);  
          
        // Mostrar estilos antes de la composición  
        console.log("\\n--- Estilos en master.docx ---");  
        const masterStyles = composer.extractStylesFromFile(masterFile);  
        masterStyles.forEach(s => console.log(`  ${s.id}: ${s.name}`));  
          
        console.log("\\n--- Estilos en doc1.docx ---");  
        const sourceStyles = composer.extractStylesFromFile(sourceFile);  
        sourceStyles.forEach(s => console.log(`  ${s.id}: ${s.name}`));  
          
        // Ejecutar composición (equivalente a composer.append(doc1) en Python)  
        console.log("\\n🔄 Ejecutando composición...");  
        composer.append(sourceFile);  
          
        // Mostrar mapeo de estilos (equivalente a tu análisis en Python)  
        console.log("\\n--- Mapeo de Estilos ---");  
        console.log("style_id2name:", Object.fromEntries(composer.getStyleIdToName()));  
        console.log("style_name2id:", Object.fromEntries(composer.getStyleNameToId()));  
          
        // Mostrar ejemplos de mapped_style_id  
        const ejemplos = Array.from(composer.getStyleIdToName().keys()).slice(0, 5);  
        console.log("\\n--- Ejemplos de mapped_style_id ---");  
        ejemplos.forEach(styleId => {  
            const mapped = composer.mappedStyleId(styleId);  
            console.log(`mapped_style_id('${styleId}') = '${mapped}'`);  
        });  
          
        // Guardar documento combinado  
        await composer.save("docs/combined-inverso.docx");  
          
        console.log("\\n🎉 ¡Composición completada!");  
        console.log("📄 Documento guardado como: docs/combined-real.docx");  
          
    } catch (error) {  
        console.error("❌ Error en demo con archivos reales:", error);  
    }  
}  
  
// Ejecutar demo  
if (require.main === module) {  
    realFilesDemo();  
}  
  
export { realFilesDemo };