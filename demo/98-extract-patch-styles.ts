// demo/98-extract-patch-styles.ts  
import * as fs from "fs";  
import JSZip from "jszip";  
import xmljs from "xml-js";  
import xml from "xml";  
import { Formatter } from "../src/export/formatter.js";
import { IContext, XmlComponent } from "../src/file/xml-components/index.js";
import { Paragraph, HeadingLevel } from "docx";  
  
const { xml2js } = xmljs;  
  
interface StyleInfo {  
    id: string;  
    name: string;  
    type: 'paragraph' | 'character' | 'table';  
}  

/**  
 * StyleMapper adaptado de docxcompose-ts para mapeo bidireccional de estilos  
 * Sigue exactamente el mismo patrón ID→Nombre→ID  
 */  
class StyleMapper {  
    private styleIdToName: Map<string, string> = new Map();  
    private styleNameToId: Map<string, string> = new Map();  
  
    public createStyleIdMapping(sourceStyles: StyleInfo[], masterStyles: StyleInfo[]): void {  
        // Limpiar mapeos anteriores  
        this.styleIdToName.clear();  
        this.styleNameToId.clear();  
  
        // Mapear IDs de patch a nombres (exactamente como en docxcompose-ts)  
        sourceStyles.forEach(style => {  
            this.styleIdToName.set(style.id, style.name);  
        });  
  
        // Mapear nombres de documento maestro a IDs (exactamente como en docxcompose-ts)  
        masterStyles.forEach(style => {  
            this.styleNameToId.set(style.name, style.id);  
        });  
    }  
  
    public mappedStyleId(styleId: string): string {  
        // Implementación exacta de docxcompose-ts  
        if (!this.styleIdToName.has(styleId)) {  
            return styleId; // Mantiene el ID original si no está en el mapeo  
        }  
        const styleName = this.styleIdToName.get(styleId);  
        if (!styleName) {  
            return styleId;  
        }  
        return this.styleNameToId.get(styleName) || styleId; // Fallback al ID original  
    }  
  
    // Métodos de debug para inspeccionar el mapeo  
    public getStyleIdToName(): Map<string, string> {  
        return new Map(this.styleIdToName);  
    }  
  
    public getStyleNameToId(): Map<string, string> {  
        return new Map(this.styleNameToId);  
    }  
}

/**  
 * Convierte IDs de estilo de patches en StyleInfo completos  
 * Simula la información que tendría cada estilo del patch  
 */  
function createStyleInfoFromPatchIds(styleIds: string[]): StyleInfo[] {  
    return styleIds.map(id => {  
        // Mapeo de IDs conocidos a nombres (como los genera docx internamente)  
        const nameMapping: Record<string, string> = {  
            'Title': 'Title',  
            'Heading1': 'Heading 1',  
            'Heading2': 'Heading 2',  
            'Heading3': 'Heading 3',  
            'Normal': 'Normal'  
        };  
  
        return {  
            id,  
            name: nameMapping[id] || id, // Usar mapeo conocido o fallback al ID  
            type: 'paragraph' as const  
        };  
    });  
}
  
/**  
 * Extrae estilos de elementos de patch (no de documentos completos)  
 * Adaptado del enfoque de docxcompose-ts para trabajar con elementos individuales  
 */  
function extractStylesFromPatchElements(patchElements: any[], context: IContext): string[] {  
    const formatter = new Formatter();  
    const usedStyleIds: string[] = [];  
    const uniqueIds = new Set<string>();  
  
    for (const element of patchElements) {  
        try {  
            // Formatear el elemento a XML usando el formatter del proyecto docx  
            const xmlString = xml(formatter.format(element as XmlComponent, context));  
              
            // Parsear el XML generado  
            const xmlObj = xml2js(xmlString, { compact: false }) as any;  
              
            // Buscar referencias de estilo en el XML  
            const styleIds = findStyleReferencesInXml(xmlObj);  
              
            // Añadir IDs únicos a la lista  
            for (const styleId of styleIds) {  
                if (!uniqueIds.has(styleId)) {  
                    uniqueIds.add(styleId);  
                    usedStyleIds.push(styleId);  
                }  
            }  
        } catch (error) {  
            console.warn('Error processing patch element for style extraction:', error);  
        }  
    }  
  
    return usedStyleIds;  
}  
  
/**  
 * Busca referencias de estilo en un objeto XML parseado  
 * Equivalente a la función findUsedStyleIds de docxcompose-ts pero para xml-js  
 */  
function findStyleReferencesInXml(xmlObj: any): string[] {  
    const styleIds: string[] = [];  
      
    function traverseElement(element: any) {  
        if (!element) return;  
          
        // Buscar elementos de estilo: w:pStyle, w:rStyle, w:tblStyle  
        if (element.name && element.attributes) {  
            if (['w:pStyle', 'w:rStyle', 'w:tblStyle'].includes(element.name)) {  
                const styleId = element.attributes['w:val'];  
                if (styleId && typeof styleId === 'string') {  
                    styleIds.push(styleId);  
                }  
            }  
        }  
          
        // Recursivamente buscar en elementos hijos  
        if (element.elements) {  
            for (const child of element.elements) {  
                traverseElement(child);  
            }  
        }  
    }  
      
    traverseElement(xmlObj);  
    return styleIds;  
}  
  
/**  
 * Función de demostración que simula la extracción de estilos de patches  
 */  
async function demonstratePatchStyleExtraction() {  
    console.log("=== EXTRACCIÓN DE ESTILOS DE PATCHES ===");  
    console.log("");  
      
    // Simular patches con diferentes estilos (como se haría en la Patcher API)  
    const mockPatches = [  
        new Paragraph({  
            text: "Título Principal",  
            heading: HeadingLevel.TITLE,  
        }),  
        new Paragraph({  
            text: "Subtítulo",  
            heading: HeadingLevel.HEADING_1,  
        }),  
        new Paragraph({  
            text: "Texto normal",  
        }),  
    ];  
      
    // Crear un contexto mock (en la implementación real vendría de patchDocument)  
    const mockContext: IContext = {  
        file: {} as any,  
        viewWrapper: {} as any,  
        stack: [],  
    };  
      
    console.log(`Procesando ${mockPatches.length} elementos de patch...`);  
    console.log("");  
      
    // Extraer estilos de los elementos del patch  
    const usedStyleIds = extractStylesFromPatchElements(mockPatches, mockContext);  
      
    console.log("Estilos encontrados en los patches:");  
    usedStyleIds.forEach((styleId, index) => {  
        console.log(`${index + 1}. Style ID: "${styleId}"`);  
    });  
      
    console.log("");  
    console.log(`Total de estilos únicos en patches: ${usedStyleIds.length}`);  
      
    return usedStyleIds;  
}  
  
/**  
 * Función principal que combina extracción de documento maestro y patches  
 */  
async function main() {  
    // 1. Extraer estilos del documento maestro (ya funciona)  
    const documentPath = "docs/heading_lang_es.docx";  
    console.log("=== PASO 1: ESTILOS DEL DOCUMENTO MAESTRO ===");  
      
    const masterStyles = await extractStylesFromDocx(documentPath);  
    console.log(`Documento maestro tiene ${masterStyles.length} estilos definidos`);  
    console.log("");  
      
    // 2. Extraer estilos de patches (ya funciona)  
    console.log("=== PASO 2: ESTILOS EN PATCHES ===");  
    const patchStyleIds = await demonstratePatchStyleExtraction();  
    console.log("");  
      
    // 3. NUEVO: Crear StyleInfo completos para los patches  
    console.log("=== PASO 3: CREAR STYLEINFO DE PATCHES ===");  
    const patchStyles = createStyleInfoFromPatchIds(patchStyleIds);  
    console.log("StyleInfo creados para patches:");  
    patchStyles.forEach((style, index) => {  
        console.log(`${index + 1}. ID: "${style.id}" | Nombre: "${style.name}"`);  
    });  
    console.log("");  
      
    // 4. NUEVO: Crear y configurar StyleMapper  
    console.log("=== PASO 4: CREAR MAPEO DE ESTILOS ===");  
    const styleMapper = new StyleMapper();  
    styleMapper.createStyleIdMapping(patchStyles, masterStyles);  
      
    console.log("Mapeo ID→Nombre (patches):");  
    for (const [id, name] of styleMapper.getStyleIdToName()) {  
        console.log(`  "${id}" → "${name}"`);  
    }  
    console.log("");  
      
    console.log("Mapeo Nombre→ID (documento maestro):");  
    for (const [name, id] of styleMapper.getStyleNameToId()) {  
        console.log(`  "${name}" → "${id}"`);  
    }  
    console.log("");  
      
    // 5. NUEVO: Probar el mapeo completo  
    console.log("=== PASO 5: PROBAR MAPEO COMPLETO ===");  
    console.log("Resultados del mapeo:");  
      
    for (const patchStyleId of patchStyleIds) {  
        const mappedId = styleMapper.mappedStyleId(patchStyleId);  
        const wasMaped = mappedId !== patchStyleId;  
          
        if (wasMaped) {  
            const patchStyle = patchStyles.find(s => s.id === patchStyleId);  
            const masterStyle = masterStyles.find(s => s.id === mappedId);  
            console.log(`  ✅ "${patchStyleId}" → "${mappedId}" (${patchStyle?.name} → ${masterStyle?.name})`);  
        } else {  
            console.log(`  ❌ "${patchStyleId}" → sin mapeo (se mantiene original)`);  
        }  
    }  
}
  
// Función auxiliar del paso anterior (reutilizada)  
async function extractStylesFromDocx(filePath: string): Promise<StyleInfo[]> {  
    // ... (misma implementación que ya tienes)  
    try {  
        const docxBuffer = fs.readFileSync(filePath);  
        const zip = await JSZip.loadAsync(docxBuffer);  
        const stylesFile = zip.file("word/styles.xml");  
          
        if (!stylesFile) return [];  
          
        const stylesXmlContent = await stylesFile.async("text");  
        const xmlObj = xml2js(stylesXmlContent, { compact: false }) as any;  
          
        let stylesElement: any | undefined;  
        for (const xmlElm of xmlObj.elements || []) {  
            if (xmlElm.name === "w:styles") {  
                stylesElement = xmlElm;  
                break;  
            }  
        }  
          
        if (!stylesElement) return [];  
          
        const styles: StyleInfo[] = [];  
        const styleElements = stylesElement.elements || [];  
          
        for (const element of styleElements) {  
            if (element.name === "w:style" && element.attributes) {  
                const id = element.attributes["w:styleId"] as string || '';  
                const type = (element.attributes["w:type"] as string) || 'paragraph';  
                  
                let name = id;  
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
  
// Ejecutar la demo  
main().catch(console.error);