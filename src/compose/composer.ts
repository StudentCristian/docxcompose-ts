import { File } from "../file/file";  
import { Packer } from "../export/packer/packer"; 
import JSZip from 'jszip';  
import { ImportedXmlComponent } from "../file/xml-components/imported-xml-component"; 
  
export interface StyleInfo {  
    id: string;  
    name: string;  
    type: 'paragraph' | 'character' | 'table';  
}  
  
export class Composer {  
    private styleIdToName: Map<string, string> = new Map();  
    private styleNameToId: Map<string, string> = new Map();  
      
    // Mapeos de referencia para numeración (equivalente a Python)  
    private numIdMapping: Map<number, number> = new Map();  
    private anumIdMapping: Map<number, number> = new Map();  
      
    constructor(private masterFile: File) {  
        this.resetReferenceMapping();  
    }  
      
    // ========== FUNCIONES DE MAPEO DE ESTILOS (YA IMPLEMENTADAS) ==========  
      
    public createStyleIdMapping(sourceFile: File): void {  
        const sourceStyles = this.extractStylesFromFile(sourceFile);  
        const masterStyles = this.extractStylesFromFile(this.masterFile);  
          
        this.styleIdToName.clear();  
        sourceStyles.forEach(style => {  
            this.styleIdToName.set(style.id, style.name);  
        });  
          
        this.styleNameToId.clear();  
        masterStyles.forEach(style => {  
            this.styleNameToId.set(style.name, style.id);  
        });  
    }  
      
    public getStyleIdToName(): Map<string, string> {  
        return new Map(this.styleIdToName);  
    }  
      
    public getStyleNameToId(): Map<string, string> {  
        return new Map(this.styleNameToId);  
    }  
      
    public extractStylesFromFile(file: File): StyleInfo[] {
        const styles: StyleInfo[] = [];  
          
        try {  
            const stylesObject = file.Styles;  
            const stylesRoot = (stylesObject as any).root;  
              
            if (stylesRoot && Array.isArray(stylesRoot)) {  
                for (const styleElement of stylesRoot) {  
                    const styleInfo = this.extractStyleInfo(styleElement);  
                    if (styleInfo) {  
                        styles.push(styleInfo);  
                    }  
                }  
            }  
        } catch (error) {  
            console.error("Error extracting styles:", error);  
        }  
          
        return styles;  
    }  
      
    private extractStyleInfo(styleElement: any): StyleInfo | null {  
        try {  
            if (styleElement && styleElement.rootKey === 'w:style') {  
                let styleId: string | undefined;  
                let styleName: string | undefined;  
                let styleType = 'paragraph';  
                
                // Manejar ImportedXmlComponent (elementos externos)  
                if (styleElement.constructor?.name === 'ImportedXmlComponent' && Array.isArray(styleElement.root)) {  
                    for (const child of styleElement.root) {  
                        // Los atributos en ImportedXmlComponent están en el primer elemento  
                        if (child.rootKey === '_attr' && child.root) {  
                            styleId = child.root['w:styleId'];  
                            styleType = child.root['w:type'] || 'paragraph';  
                        }  
                        
                        // Buscar el nombre del estilo  
                        if (child.rootKey === 'w:name' && Array.isArray(child.root)) {  
                            const nameAttr = child.root[0];  
                            if (nameAttr && nameAttr.rootKey === '_attr' && nameAttr.root) {  
                                styleName = nameAttr.root['w:val'];  
                            }  
                        }  
                    }  
                }  
                // Manejar elementos nativos (tu código original)  
                else if (Array.isArray(styleElement.root)) {  
                    for (const child of styleElement.root) {  
                        if (child.rootKey === '_attr' && child.root) {  
                            styleId = child.root.styleId;  
                            styleType = child.root.type || 'paragraph';  
                        }  
                        
                        if (child.rootKey === 'w:name' && child.root && Array.isArray(child.root)) {  
                            const nameAttr = child.root[0];  
                            if (nameAttr && nameAttr.rootKey === '_attr' && nameAttr.root) {  
                                styleName = nameAttr.root.val;  
                            }  
                        }  
                    }  
                }  
                
                if (styleId) {  
                    return {  
                        id: styleId,  
                        name: styleName || styleId,  
                        type: styleType as 'paragraph' | 'character' | 'table'  
                    };  
                }  
            }  
            
            return null;  
        } catch (error) {  
            console.error("Error extracting style info:", error);  
            return null;  
        }  
    }
  
    public mappedStyleId(styleId: string): string {  
        if (!this.styleIdToName.has(styleId)) {  
            return styleId;  
        }  
          
        const styleName = this.styleIdToName.get(styleId);  
        if (!styleName) {  
            return styleId;  
        }  
          
        return this.styleNameToId.get(styleName) || styleId;  
    }  
  
    public addStyles(sourceFile: File, element: any): void {  
        const masterStyleIds = this.getMasterStyleIds();  
        const usedStyleIds = this.extractUsedStyleIds(element);  
          
        for (const styleId of usedStyleIds) {  
            const mappedId = this.mappedStyleId(styleId);  
              
            if (!masterStyleIds.includes(mappedId)) {  
                this.addNewStyle(sourceFile, styleId);  
            }  
              
            if (mappedId !== styleId) {  
                this.replaceStyleReferences(element, styleId, mappedId);  
            }  
        }  
    }  
      
    private getMasterStyleIds(): string[] {  
        const styles = this.extractStylesFromFile(this.masterFile);  
        return styles.map(style => style.id);  
    }  
      
    private addNewStyle(sourceFile: File, styleId: string): void {  
        // Obtener el estilo del documento fuente  
        const sourceStyle = this.getStyleById(sourceFile, styleId);  
        if (!sourceStyle) {  
            console.log(`Style ${styleId} not found in source document`);  
            return;  
        }  
        
        // TODO: Implementar la adición real del estilo al documento maestro  
        // Esto requiere acceder a la estructura interna de estilos  
        console.log(`Adding new style: ${styleId} (${sourceStyle.name})`);  
    } 
      
    private replaceStyleReferences(element: any, oldId: string, newId: string): void {  
        if (!element || typeof element !== 'object') {  
            return;  
        }  
    
        const replaceInElement = (el: any) => {  
            if (!el || typeof el !== 'object') return;  
    
            // Manejar ImportedXmlComponent específicamente  
            if (el.constructor?.name === 'ImportedXmlComponent') {  
                this.replaceStyleReferencesInImportedXmlComponent(el, oldId, newId);  
                return;  
            }  
    
            // Lógica original para elementos nativos  
            if (el.pStyle && el.pStyle.val === oldId) {  
                el.pStyle.val = newId;  
            }  
    
            if (el.rStyle && el.rStyle.val === oldId) {  
                el.rStyle.val = newId;  
            }  
    
            if (el.tblStyle && el.tblStyle.val === oldId) {  
                el.tblStyle.val = newId;  
            }  
    
            if (el.styleReferences && Array.isArray(el.styleReferences)) {  
                for (let i = 0; i < el.styleReferences.length; i++) {  
                    if (el.styleReferences[i] === oldId) {  
                        el.styleReferences[i] = newId;  
                    }  
                }  
            }  
    
            if (el.children && Array.isArray(el.children)) {  
                el.children.forEach(replaceInElement);  
            }  
    
            Object.values(el).forEach(value => {  
                if (Array.isArray(value)) {  
                    value.forEach(replaceInElement);  
                } else if (typeof value === 'object' && value !== null) {  
                    replaceInElement(value);  
                }  
            });  
        };  
    
        replaceInElement(element);  
    }  
    
    /**  
     * Reemplazar referencias de estilo específicamente en ImportedXmlComponent - MEJORADO  
     */  
    private replaceStyleReferencesInImportedXmlComponent(element: any, oldId: string, newId: string): void {  
        if (!element.root || !Array.isArray(element.root)) return;  
    
        const replaceInImportedElement = (el: any) => {  
            if (!el || typeof el !== 'object') return;  
    
            // Buscar en propiedades de párrafo (w:pPr)  
            if (el.rootKey === 'w:pPr' && el.root && Array.isArray(el.root)) {  
                for (const child of el.root) {  
                    if (child.rootKey === 'w:pStyle' && child.root && Array.isArray(child.root)) {  
                        const attrElement = child.root[0];  
                        if (attrElement && attrElement.rootKey === '_attr' && attrElement.root) {  
                            if (attrElement.root['w:val'] === oldId) {  
                                // Crear una copia del objeto antes de modificar  
                                attrElement.root = { ...attrElement.root };  
                                attrElement.root['w:val'] = newId;  
                                console.log(`Replaced style reference: ${oldId} → ${newId}`);  
                            }  
                        }  
                    }  
                }  
            }  
    
            // Buscar en propiedades de run (w:rPr)  
            if (el.rootKey === 'w:rPr' && el.root && Array.isArray(el.root)) {  
                for (const child of el.root) {  
                    if (child.rootKey === 'w:rStyle' && child.root && Array.isArray(child.root)) {  
                        const attrElement = child.root[0];  
                        if (attrElement && attrElement.rootKey === '_attr' && attrElement.root) {  
                            if (attrElement.root['w:val'] === oldId) {  
                                // Crear una copia del objeto antes de modificar  
                                attrElement.root = { ...attrElement.root };  
                                attrElement.root['w:val'] = newId;  
                                console.log(`Replaced run style reference: ${oldId} → ${newId}`);  
                            }  
                        }  
                    }  
                }  
            }  
    
            // Recursión para elementos hijos  
            if (el.root && Array.isArray(el.root)) {  
                el.root.forEach(replaceInImportedElement);  
            }  
        };  
    
        element.root.forEach(replaceInImportedElement);  
    }
  
    private extractUsedStyleIds(element: any): string[] {  
        const styleIds: string[] = [];  
    
        if (!element) {  
            return styleIds;  
        }  
    
        const extractFromElement = (el: any) => {  
            if (!el || typeof el !== 'object') return;  
    
            // Manejar ImportedXmlComponent específicamente  
            if (el.constructor?.name === 'ImportedXmlComponent') {  
                this.extractStyleIdsFromImportedXmlComponent(el, styleIds);  
                return;  
            }  
    
            // Lógica original para elementos nativos  
            if (el.pStyle && el.pStyle.val) {  
                styleIds.push(el.pStyle.val);  
            }  
    
            if (el.rStyle && el.rStyle.val) {  
                styleIds.push(el.rStyle.val);  
            }  
    
            if (el.tblStyle && el.tblStyle.val) {  
                styleIds.push(el.tblStyle.val);  
            }  
    
            if (el.styleReferences && Array.isArray(el.styleReferences)) {  
                styleIds.push(...el.styleReferences);  
            }  
    
            if (el.children && Array.isArray(el.children)) {  
                el.children.forEach(extractFromElement);  
            }  
    
            Object.values(el).forEach(value => {  
                if (Array.isArray(value)) {  
                    value.forEach(extractFromElement);  
                } else if (typeof value === 'object' && value !== null) {  
                    extractFromElement(value);  
                }  
            });  
        };  
    
        extractFromElement(element);  
        return [...new Set(styleIds)];  
    }  
    
    /**  
     * Extraer IDs de estilo específicamente de ImportedXmlComponent - MEJORADO  
     */  
    private extractStyleIdsFromImportedXmlComponent(element: any, styleIds: string[]): void {  
        if (!element.root || !Array.isArray(element.root)) return;  
    
        const extractFromImportedElement = (el: any) => {  
            if (!el || typeof el !== 'object') return;  
    
            if (el.rootKey === 'w:pPr' && el.root && Array.isArray(el.root)) {  
                for (const child of el.root) {  
                    if (child.rootKey === 'w:pStyle' && child.root && Array.isArray(child.root)) {  
                        const attrElement = child.root[0];  
                        if (attrElement && attrElement.rootKey === '_attr' && attrElement.root) {  
                            const styleId = attrElement.root['w:val'];  
                            if (styleId) {  
                                styleIds.push(styleId);  
                                // console.log(`Found paragraph style: ${styleId}`); // COMENTADO  
                            }  
                        }  
                    }  
                }  
            }  
    
            if (el.rootKey === 'w:rPr' && el.root && Array.isArray(el.root)) {  
                for (const child of el.root) {  
                    if (child.rootKey === 'w:rStyle' && child.root && Array.isArray(child.root)) {  
                        const attrElement = child.root[0];  
                        if (attrElement && attrElement.rootKey === '_attr' && attrElement.root) {  
                            const styleId = attrElement.root['w:val'];  
                            if (styleId) {  
                                styleIds.push(styleId);  
                                // console.log(`Found run style: ${styleId}`); // COMENTADO  
                            }  
                        }  
                    }  
                }  
            }  
    
            if (el.root && Array.isArray(el.root)) {  
                el.root.forEach(extractFromImportedElement);  
            }  
        };  
    
        element.root.forEach(extractFromImportedElement);  
    }
  
    public getUsedStyleIds(element: any): string[] {  
        return this.extractUsedStyleIds(element);  
    }  
  
    public replaceStyleReferencesInElement(element: any, oldId: string, newId: string): void {  
        this.replaceStyleReferences(element, oldId, newId);  
    }  
  
    public getStyleById(file: File, styleId: string): StyleInfo | null {  
        const styles = this.extractStylesFromFile(file);  
        return styles.find(style => style.id === styleId) || null;  
    }  
      
    public getMasterStyleById(styleId: string): StyleInfo | null {  
        return this.getStyleById(this.masterFile, styleId);  
    }  
  
    // ========== NUEVAS FUNCIONES DE COMPOSICIÓN ==========  
      
    /**  
     * Función principal append() basada en docxcompose/composer.py:50-109  
     */  
    public append(sourceFile: File): void {  
        // Resetear mapeos de referencia como en Python línea 57  
        this.resetReferenceMapping();  
          
        // Crear mapeo de estilos entre documentos  
        this.createStyleIdMapping(sourceFile);  
          
        // Obtener elementos del body del documento fuente  
        const sourceElements = this.getDocumentElements(sourceFile);  
          
        console.log(`Processing ${sourceElements.length} elements from source document`);  
          
        // Procesar cada elemento del documento fuente  
        for (let i = 0; i < sourceElements.length; i++) {  
            const element = sourceElements[i];  
              
            // Saltar propiedades de sección como en Python líneas 67-76  
            if (this.isSectionProperties(element)) {  
                console.log("Skipping section properties element");  
                continue;  
            }  
              
            // Hacer copia profunda del elemento  
            const elementCopy = this.deepCopyElement(element);  
              
            // Procesar el elemento con todas las funciones de mapeo  
            this.processElement(sourceFile, elementCopy);  
              
            // Agregar al documento maestro  
            this.addElementToMaster(elementCopy);  
        }  
          
        // Post-procesamiento  
        this.postProcessDocument();  
          
        console.log("Document append completed successfully");  
    }  
      
    /**  
     * Resetear mapeos de referencia como en Python línea 45-48  
     */  
    private resetReferenceMapping(): void {  
        this.numIdMapping.clear();  
        this.anumIdMapping.clear();  
        console.log("Reference mappings reset");  
    }  
      
    /**  
     * Obtener elementos del body del documento - CON LOGGING DETALLADO  
     */  
    private getDocumentElements(file: File): any[] {  
        try {  
            console.log(`[GET_ELEMENTS] Starting getDocumentElements`);  
            
            // Acceder correctamente al body a través de View  
            const body = file.Document.View.Body;  
            const elements = (body as any).root || [];  
            
            console.log(`[GET_ELEMENTS] Found ${elements.length} elements in document body`);  
            
            // LOGGING CRÍTICO: Verificar cada elemento antes de devolverlo  
            elements.forEach((element: any, index: number) => {  
                console.log(`[GET_ELEMENTS] Element ${index}:`, {  
                    type: element.constructor?.name,  
                    rootKey: (element as any).rootKey || 'unknown',  
                    hasRoot: !!element.root,  
                    rootLength: element.root?.length,  
                    prototype: Object.getPrototypeOf(element).constructor?.name  
                });  
                
                if (element.constructor?.name !== 'ImportedXmlComponent' &&   
                    element.constructor?.name !== 'Paragraph' &&  
                    element.constructor?.name !== 'Table') {  
                    console.error(`[GET_ELEMENTS] CORRUPTED ELEMENT DETECTED AT INDEX ${index}:`);  
                    console.error(`[GET_ELEMENTS] Type: ${element.constructor?.name}`);  
                    console.error(`[GET_ELEMENTS] This element will cause document corruption!`);  
                }  
            });  
            
            return elements;  
        } catch (error) {  
            console.error("Error getting document elements:", error);  
            return [];  
        }  
    }
      
    /**  
     * Hacer copia profunda del elemento - CORREGIDO para ImportedXmlComponent y Paragraph  
     */  
    private deepCopyElement(element: any): any {  
        try {  
            // No hacer copia profunda de ImportedXmlComponent - usar directamente  
            if (element.constructor?.name === 'ImportedXmlComponent') {  
                return element;  
            }  
            
            // No hacer copia profunda de Paragraph - usar directamente  
            if (element.constructor?.name === 'Paragraph') {  
                return element;  
            }  
            
            // No hacer copia profunda de Table - usar directamente  
            if (element.constructor?.name === 'Table') {  
                return element;  
            }  
            
            return JSON.parse(JSON.stringify(element));  
        } catch (error) {  
            console.error("Error deep copying element:", error);  
            return element;  
        }  
    }
      
    /**  
     * Procesar elemento con todas las transformaciones como en Python líneas 80-88  
     */  
    private processElement(sourceFile: File, element: any): void {  
        // Agregar estilos usados en este elemento  
        this.addStyles(sourceFile, element);  
          
        // TODO: Implementar otras funciones de procesamiento:  
        // - add_numberings()  
        // - add_images()  
        // - add_shapes()  
        // - add_footnotes()  
        // - etc.  
          
        console.log("Element processed");  
    }  
      
    /**  
     * Agregar elemento al documento maestro - CON LOGGING DETALLADO CORREGIDO  
     */  
    private addElementToMaster(element: any): void {  
        try {  
            console.log(`[DEBUG] Adding element to master:`, {  
                type: element.constructor?.name,  
                rootKey: (element as any).rootKey || 'unknown', // Acceso seguro  
                hasRoot: !!element.root,  
                rootLength: element.root?.length  
            });  
            
            // Validar que el elemento mantenga su integridad  
            if (element.constructor?.name !== 'ImportedXmlComponent' &&   
                element.constructor?.name !== 'Paragraph' &&  
                element.constructor?.name !== 'Table') {  
                console.warn(`[WARNING] Element has unexpected type: ${element.constructor?.name}`);  
                console.warn(`[WARNING] Element details:`, {  
                    type: element.constructor?.name,  
                    rootKey: (element as any).rootKey || 'unknown', // Acceso seguro  
                    hasRoot: !!element.root,  
                    prototype: Object.getPrototypeOf(element),  
                    constructor: element.constructor  
                });  
            }  
    
            this.masterFile.Document.View.Body.push(element);  
            console.log(`[DEBUG] Element added to master document successfully`);  
        } catch (error) {  
            console.error(`[ERROR] Error adding element to master:`, error);  
        }  
    }
      
    /**  
     * Post-procesamiento como en Python líneas 91-108  
     */  
    private postProcessDocument(): void {  
        // Implementar post-procesamiento basado en docxcompose/composer.py:91-108  
        this.renumberBookmarks();  
        this.renumberDocprIds();  
        
        // TODO: Implementar funciones adicionales:  
        // - fix_section_types()  
        // - fix_header_and_footers()  
        
        console.log("Post-processing completed");  
    }

    private renumberBookmarks(): void {    
        const body = this.masterFile.Document.View.Body;    
        const elements = (body as any).root;    
        
        let bookmarkId = 1;    
        
        const renumberInElement = (element: any) => {    
            if (!element || typeof element !== 'object') return;    
            
            // CORREGIDO: Acceso seguro a rootKey  
            if ((element as any).rootKey === 'w:bookmarkStart' && element.root) {    
                for (const attr of element.root) {    
                    if ((attr as any).rootKey === '_attr' && attr.root && attr.root.id) {    
                        attr.root.id = bookmarkId.toString();    
                        bookmarkId++;    
                    }    
                }    
            }    
            
            if (element.root && Array.isArray(element.root)) {    
                element.root.forEach(renumberInElement);    
            }    
        };    
        
        elements.forEach(renumberInElement);    
        console.log(`Renumbered ${bookmarkId - 1} bookmarks`);    
    }  

    private renumberDocprIds(): void {    
        const body = this.masterFile.Document.View.Body;    
        const elements = (body as any).root;    
        
        let docprId = 1;    
        
        const renumberInElement = (element: any) => {    
            if (!element || typeof element !== 'object') return;    
            
            // CORREGIDO: Acceso seguro a rootKey  
            if ((element as any).rootKey === 'wp:docPr' && element.root) {    
                for (const attr of element.root) {    
                    if ((attr as any).rootKey === '_attr' && attr.root && attr.root.id) {    
                        attr.root.id = docprId.toString();    
                        docprId++;    
                    }    
                }    
            }    
            
            if (element.root && Array.isArray(element.root)) {    
                element.root.forEach(renumberInElement);    
            }    
        };    
        
        elements.forEach(renumberInElement);    
        console.log(`Renumbered ${docprId - 1} docPr IDs`);    
    }
        
    /**  
     * Detectar si el elemento es de propiedades de sección - MEJORADO  
     */  
    private isSectionProperties(element: any): boolean {  
        if (!element) return false;  
        
        // Verificar rootKey directamente  
        if ((element as any).rootKey === 'w:sectPr') {
            return true;  
        }  
        
        // Verificar tagName como fallback  
        if (element.tagName === 'w:sectPr') {  
            return true;  
        }  
        
        // Verificar constructor name  
        if (element.constructor && element.constructor.name === 'CT_SectPr') {  
            return true;  
        }  
        
        return false;  
    } 

    private validateDocument(): boolean {    
        try {    
            // Verificar estructura básica del documento    
            const body = this.masterFile.Document.View.Body;    
            const elements = (body as any).root;    
            
            console.log("=== Document Validation ===");    
            console.log(`Total elements in body: ${elements.length}`);    
            
            // Verificar que cada elemento tenga la estructura correcta    
            for (let i = 0; i < elements.length; i++) {    
                const element = elements[i];    
                console.log(`Element ${i}:`, {    
                    type: element.constructor?.name,    
                    rootKey: (element as any).rootKey || 'unknown', // CORREGIDO: Acceso seguro  
                    hasRoot: !!element.root,    
                    rootLength: element.root?.length    
                });    
            }    
            
            return true;    
        } catch (error) {    
            console.error("Document validation failed:", error);    
            return false;    
        }    
    }
      
    /**  
     * Guardar el documento combinado  
     */  
    public async save(filename: string): Promise<void> {  
        try {  
            // Validar documento antes de guardar  
            if (!this.validateDocument()) {  
                throw new Error("Document validation failed");  
            }  
            
            const fs = require('fs');  
            const buffer = await Packer.toBuffer(this.masterFile);  
            fs.writeFileSync(filename, buffer);  
            console.log(`Document saved to: ${filename}`);  
        } catch (error) {  
            console.error("Error saving document:", error);  
            throw error;  
        }  
    }
      
    // ========== FUNCIONES ESTÁTICAS PARA CARGA DE ARCHIVOS ==========  
      
    /**  
     * Cargar archivo DOCX desde buffer (placeholder para desarrollo futuro)  
     */  
    public static async fromBuffer(_buffer: Buffer): Promise<File> {  
        // TODO: Implementar la lógica inversa del Packer  
        // para convertir un buffer DOCX en un objeto File  
        throw new Error("fromBuffer not implemented yet - requires reverse engineering of Packer");  
    }  
      
    /**  
     * Cargar archivo DOCX desde ruta de archivo  
     */  
    public static async loadFromFile(filePath: string): Promise<File> {  
        const fs = require('fs');  
        const buffer = fs.readFileSync(filePath);  
        return this.fromBuffer(buffer);  
    }  

    /**  
     * Extraer estilos de un archivo DOCX real  
     */  
    public static async extractStylesFromDocx(filePath: string): Promise<string | null> {  
        try {  
            const fs = require('fs');  
            const buffer = fs.readFileSync(filePath);  
              
            // Cargar el archivo DOCX como ZIP  
            const zip = await JSZip.loadAsync(buffer);  
              
            // Extraer styles.xml  
            const stylesFile = zip.file('word/styles.xml');  
            if (!stylesFile) {  
                console.log(`No styles.xml found in ${filePath}`);  
                return null;  
            }  
              
            const stylesXml = await stylesFile.async('string');  
            console.log(`Extracted styles from ${filePath}`);  
            return stylesXml;  
              
        } catch (error) {  
            console.error(`Error extracting styles from ${filePath}:`, error);  
            return null;  
        }  
    }

    /**  
     * Extraer document.xml completo del DOCX  
     */  
    public static async extractDocumentXml(filePath: string): Promise<string> {  
        try {  
            const fs = require('fs');  
            const buffer = fs.readFileSync(filePath);  
              
            const zip = await JSZip.loadAsync(buffer);  
            const documentFile = zip.file('word/document.xml');  
              
            if (!documentFile) {  
                throw new Error(`No document.xml found in ${filePath}`);  
            }  
              
            const documentXml = await documentFile.async('string');  
            console.log(`Extracted document.xml from ${filePath}`);  
            return documentXml;  
              
        } catch (error) {  
            console.error(`Error extracting document.xml from ${filePath}:`, error);  
            throw error;  
        }  
    }  

/**  
 * Crear File con estilos y contenido extraídos de DOCX real - CON LOGGING EXHAUSTIVO  
 */  
public static async createFileWithExternalStyles(filePath: string): Promise<File> {  
    try {  
        console.log(`[DEBUG] Starting createFileWithExternalStyles for: ${filePath}`);  
          
        const stylesXml = await this.extractStylesFromDocx(filePath);  
        // console.log(`[DEBUG] Extracted styles XML length: ${stylesXml?.length || 0}`); // COMENTADO  
          
        const documentXml = await this.extractDocumentXml(filePath);  
        // console.log(`[DEBUG] Extracted document XML length: ${documentXml.length}`); // COMENTADO  
          
        const documentComponent = ImportedXmlComponent.fromXmlString(documentXml);  
        // console.log(`[DEBUG] Document component type: ${documentComponent.constructor?.name}`); // COMENTADO  
          
        const bodyElements = this.extractBodyFromImportedDocument(documentComponent);  
        console.log(`[DEBUG] Extracted ${bodyElements.length} body elements`);  
          
        // MANTENER SOLO LOGGING DE ELEMENTOS CORRUPTOS  
        bodyElements.forEach((element, index) => {  
            if (element.constructor?.name !== 'ImportedXmlComponent') {  
                console.error(`[ERROR] CORRUPTED ELEMENT FOUND AT INDEX ${index}:`);  
                console.error(`[ERROR] Type: ${element.constructor?.name}`);  
                console.error(`[ERROR] RootKey: ${(element as any).rootKey || 'unknown'}`);  
            }  
        });  
          
        const file = new File({  
            sections: [{  
                children: bodyElements  
            }],  
            externalStyles: stylesXml || undefined  
        });  
          
        console.log(`[DEBUG] Created File with external styles and imported content from ${filePath}`);  
        return file;  
          
    } catch (error) {  
        console.error(`[ERROR] Error creating File from ${filePath}:`, error);  
        throw error;  
    }  
}

/**  
 * Extraer elementos del body del documento importado - CON LOGGING EXHAUSTIVO CORREGIDO  
 */  
private static extractBodyFromImportedDocument(documentComponent: ImportedXmlComponent): any[] {  
    try {  
        console.log(`[DEBUG] Starting extractBodyFromImportedDocument`);  
        console.log(`[DEBUG] Document component type: ${documentComponent.constructor?.name}`);  
        console.log(`[DEBUG] Document component rootKey: ${(documentComponent as any).rootKey || 'unknown'}`);  
          
        const bodyElements: any[] = [];  
          
        const findBodyElements = (component: any, depth: number = 0) => {  
            const indent = '  '.repeat(depth);  
            console.log(`[DEBUG] ${indent}Processing component:`, {  
                type: component.constructor?.name,  
                rootKey: (component as any).rootKey || 'unknown', // Acceso seguro  
                hasRoot: !!component.root,  
                rootLength: component.root?.length  
            });  
              
            if ((component as any).rootKey === 'w:body' && component.root) {  
                console.log(`[DEBUG] ${indent}Found w:body with ${component.root.length} children`);  
                  
                for (let i = 0; i < component.root.length; i++) {  
                    const child = component.root[i];  
                    console.log(`[DEBUG] ${indent}  Child ${i}:`, {  
                        type: child.constructor?.name,  
                        rootKey: (child as any).rootKey || 'unknown', // Acceso seguro  
                        hasRoot: !!child.root  
                    });  
                      
                    if ((child as any).rootKey && (child as any).rootKey !== '_attr' && (child as any).rootKey !== 'w:sectPr') {  
                        // LOGGING CRÍTICO: Verificar el tipo antes de agregar  
                        if (child.constructor?.name !== 'ImportedXmlComponent') {  
                            console.error(`[ERROR] ${indent}  FOUND CORRUPTED CHILD AT INDEX ${i}:`);  
                            console.error(`[ERROR] ${indent}    Type: ${child.constructor?.name}`);  
                            console.error(`[ERROR] ${indent}    RootKey: ${(child as any).rootKey || 'unknown'}`);  
                            console.error(`[ERROR] ${indent}    Prototype:`, Object.getPrototypeOf(child));  
                            console.error(`[ERROR] ${indent}    Constructor:`, child.constructor);  
                              
                            // Recrear como ImportedXmlComponent válido  
                            console.log(`[FIX] ${indent}  Recreating as ImportedXmlComponent`);  
                            const recreatedElement = new ImportedXmlComponent((child as any).rootKey);  
                            if (Array.isArray(child.root)) {  
                                child.root.forEach((rootChild: any) => {  
                                    recreatedElement.push(rootChild);  
                                });  
                            }  
                            bodyElements.push(recreatedElement);  
                            console.log(`[FIX] ${indent}  Successfully recreated element`);  
                        } else {  
                            console.log(`[DEBUG] ${indent}  Adding valid ImportedXmlComponent`);  
                            bodyElements.push(child);  
                        }  
                    } else if ((child as any).rootKey === 'w:sectPr') {  
                        console.log(`[DEBUG] ${indent}  Skipping w:sectPr element`);  
                    } else if ((child as any).rootKey === '_attr') {  
                        console.log(`[DEBUG] ${indent}  Skipping _attr element`);  
                    } else {  
                        console.log(`[DEBUG] ${indent}  Skipping element with no rootKey`);  
                    }  
                }  
                return;  
            }  
              
            if (component.root && Array.isArray(component.root)) {  
                for (const child of component.root) {  
                    findBodyElements(child, depth + 1);  
                }  
            }  
        };  
          
        findBodyElements(documentComponent);  
          
        console.log(`[DEBUG] Extracted ${bodyElements.length} body elements total`);  
        return bodyElements;  
          
    } catch (error) {  
        console.error(`[ERROR] Error extracting body elements:`, error);  
        return [];  
    }  
}
}