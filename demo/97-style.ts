// demo/97-styles.ts  
import * as fs from "fs";  
import JSZip from "jszip";  
import xmljs from "xml-js";
const { xml2js } = xmljs;
  
interface StyleInfo {  
    id: string;  
    name: string;  
    type: 'paragraph' | 'character' | 'table';  
}  
  
/**  
 * Extrae estilos de un documento DOCX usando JSZip y xml-js  
 * Adaptado de docxcompose-ts para usar las dependencias del proyecto docx  
 */  
async function extractStylesFromDocx(filePath: string): Promise<StyleInfo[]> {  
    try {  
        // Leer el archivo DOCX  
        const docxBuffer = fs.readFileSync(filePath);  
          
        // Cargar con JSZip (como hace el proyecto docx)  
        const zip = await JSZip.loadAsync(docxBuffer);  
          
        // Obtener el archivo styles.xml  
        const stylesFile = zip.file("word/styles.xml");  
        if (!stylesFile) {  
            console.log("No se encontró word/styles.xml en el documento");  
            return [];  
        }  
          
        // Leer el contenido XML  
        const stylesXmlContent = await stylesFile.async("text");  
          
        // Parsear con xml-js (como hace ExternalStylesFactory)  
        const xmlObj = xml2js(stylesXmlContent, { compact: false }) as any;

        let stylesElement: any | undefined;
        for (const xmlElm of xmlObj.elements || []) {
            if (xmlElm.name === "w:styles") {
                stylesElement = xmlElm;
                break;
            }
        }  
          
        if (!stylesElement) {  
            console.log("No se encontró el elemento w:styles");  
            return [];  
        }  
          
        // Extraer información de cada estilo  
        const styles: StyleInfo[] = [];  
        const styleElements = stylesElement.elements || [];  
          
        for (const element of styleElements) {  
            if (element.name === "w:style" && element.attributes) {  
                const id = element.attributes["w:styleId"] as string || '';  
                const type = (element.attributes["w:type"] as string) || 'paragraph';  
                  
                // Buscar el nombre del estilo en subelementos w:name  
                let name = id; // fallback al ID  
                if (element.elements) {  
                    for (const subElement of element.elements) {  
                        if (subElement.name === "w:name" && subElement.attributes) {  
                            name = subElement.attributes["w:val"] as string || id;  
                            break;  
                        }  
                    }  
                }  
                  
                styles.push({  
                    id,  
                    name,  
                    type: type as 'paragraph' | 'character' | 'table'  
                });  
            }  
        }  
          
        return styles;  
          
    } catch (error) {  
        console.error("Error al extraer estilos:", error);  
        return [];  
    }  
}  
  
/**  
 * Función principal de demostración  
 */  
async function main() {  
    const documentPath = "docs/doc_japones.docx"; // Ajusta la ruta según tu documento  
      
    console.log("=== EXTRACCIÓN DE ESTILOS DOCX ===");  
    console.log(`Procesando documento: ${documentPath}`);  
    console.log("");  
      
    const styles = await extractStylesFromDocx(documentPath);  
      
    if (styles.length === 0) {  
        console.log("No se encontraron estilos en el documento");  
        return;  
    }  
      
    console.log(`Se encontraron ${styles.length} estilos:`);  
    console.log("");  
      
    // Agrupar por tipo para mejor visualización  
    const stylesByType = styles.reduce((acc, style) => {  
        if (!acc[style.type]) acc[style.type] = [];  
        acc[style.type].push(style);  
        return acc;  
    }, {} as Record<string, StyleInfo[]>);  
      
    // Mostrar estilos agrupados por tipo  
    for (const [type, typeStyles] of Object.entries(stylesByType)) {  
        console.log(`--- ESTILOS DE ${type.toUpperCase()} ---`);  
        typeStyles.forEach((style, index) => {  
            console.log(`${index + 1}. ID: "${style.id}" | Nombre: "${style.name}"`);  
        });  
        console.log("");  
    }  
      
    // Mostrar resumen  
    console.log("=== RESUMEN ===");  
    console.log(`Total de estilos: ${styles.length}`);  
    Object.entries(stylesByType).forEach(([type, typeStyles]) => {  
        console.log(`- ${type}: ${typeStyles.length} estilos`);  
    });  
}  
  
// Ejecutar la demo  
main().catch(console.error);