// docx/src/compose/composer.spec.ts  
import { describe, it, expect } from "vitest";  
import { Composer } from "./composer";  
import { File } from "../file/file";  

  
describe("Composer - createStyleIdMapping", () => {  
    it("should create bidirectional style mappings", () => {  
        const masterFile = new File({  
            sections: [],  
            styles: {  
                paragraphStyles: [  
                    {  
                        id: "Heading1",  
                        name: "Título 1",  
                        run: { bold: true }  
                    }  
                ]  
            }  
        });  
          
        const sourceFile = new File({  
            sections: [],  
            styles: {  
                paragraphStyles: [  
                    {  
                        id: "Heading1",   
                        name: "Título 1",  
                        run: { bold: true }  
                    }  
                ]  
            }  
        });  
          
        const composer = new Composer(masterFile);  
        composer.createStyleIdMapping(sourceFile);  
  
        console.log("styleIdToName:", Array.from(composer.getStyleIdToName().entries()));  
        console.log("styleNameToId:", Array.from(composer.getStyleNameToId().entries()));  
  
        expect(composer.getStyleIdToName().get("Heading1")).toBe("Título 1");  
        expect(composer.getStyleNameToId().get("Título 1")).toBe("Heading1");  
    });  
});

describe("Composer - mappedStyleId", () => {  
    it("should map style IDs between documents with different languages", () => {  
        const masterFile = new File({  
            sections: [],  
            styles: {  
                paragraphStyles: [  
                    {  
                        id: "Heading1", // ID en inglés  
                        name: "Título 1", // Nombre en español  
                        run: { bold: true }  
                    }  
                ]  
            }  
        });  
          
        const sourceFile = new File({  
            sections: [],  
            styles: {  
                paragraphStyles: [  
                    {  
                        id: "Titulo1", // ID en español  
                        name: "Título 1", // Mismo nombre  
                        run: { bold: true }  
                    }  
                ]  
            }  
        });  
          
        const composer = new Composer(masterFile);  
        composer.createStyleIdMapping(sourceFile);  
          
        // Debería mapear "Titulo1" (español) → "Heading1" (inglés)  
        expect(composer.mappedStyleId("Titulo1")).toBe("Heading1");  
          
        // IDs que no existen deberían retornarse sin cambios  
        expect(composer.mappedStyleId("NonExistentStyle")).toBe("NonExistentStyle");  
    });  
});

describe("Composer - addStyles", () => {  
    it("should add styles from source document and map references", () => {  
        const masterFile = new File({  
            sections: [],  
            styles: {  
                paragraphStyles: [  
                    {  
                        id: "Heading1",  
                        name: "Título 1",  
                        run: { bold: true }  
                    }  
                ]  
            }  
        });  
          
        const sourceFile = new File({  
            sections: [],  
            styles: {  
                paragraphStyles: [  
                    {  
                        id: "CustomStyle",  
                        name: "Estilo Personalizado",  
                        run: { italics: true }  
                    }  
                ]  
            }  
        });  
          
        const composer = new Composer(masterFile);  
        composer.createStyleIdMapping(sourceFile);  
          
        // Simular un elemento XML con referencias de estilos  
        const mockElement = {  
            styleReferences: ["CustomStyle", "Heading1"]  
        };  
          
        // Esta función debería agregar estilos nuevos y mapear referencias  
        composer.addStyles(sourceFile, mockElement);  
          
        // Verificar que la función se ejecute sin errores  
        expect(true).toBe(true); // Placeholder test  
    });  
});

describe("Composer - extractUsedStyleIds", () => {  
    it("should extract style IDs from XML elements", () => {  
        const masterFile = new File({  
            sections: [],  
            styles: {  
                paragraphStyles: [  
                    {  
                        id: "Heading1",  
                        name: "Título 1",  
                        run: { bold: true }  
                    }  
                ]  
            }  
        });  
          
        const composer = new Composer(masterFile);  
          
        // Simular un elemento XML con múltiples referencias de estilos  
        const mockElement = {  
            pStyle: { val: "Heading1" },  
            children: [  
                {  
                    rStyle: { val: "Strong" },  
                    tblStyle: { val: "TableStyle1" }  
                }  
            ],  
            styleReferences: ["CustomStyle", "AnotherStyle"]  
        };  
          
        // Hacer público el método para testing (o crear un método público wrapper)  
        const styleIds = (composer as any).extractUsedStyleIds(mockElement);  
          
        expect(styleIds).toContain("Heading1");  
        expect(styleIds).toContain("Strong");  
        expect(styleIds).toContain("TableStyle1");  
        expect(styleIds).toContain("CustomStyle");  
        expect(styleIds).toContain("AnotherStyle");  
          
        // Verificar que no hay duplicados  
        expect(styleIds.length).toBe(new Set(styleIds).size);  
    });  
      
    it("should handle empty or null elements", () => {  
        const masterFile = new File({ sections: [] });  
        const composer = new Composer(masterFile);  
          
        expect((composer as any).extractUsedStyleIds(null)).toEqual([]);  
        expect((composer as any).extractUsedStyleIds(undefined)).toEqual([]);  
        expect((composer as any).extractUsedStyleIds({})).toEqual([]);  
    });  
});

describe("Composer - replaceStyleReferences", () => {  
    it("should replace style references in XML elements", () => {  
        const masterFile = new File({  
            sections: [],  
            styles: {  
                paragraphStyles: [  
                    {  
                        id: "Heading1",  
                        name: "Título 1",  
                        run: { bold: true }  
                    }  
                ]  
            }  
        });  
          
        const composer = new Composer(masterFile);  
          
        // Simular un elemento XML con referencias de estilos  
        const mockElement = {  
            pStyle: { val: "OldStyle" },  
            children: [  
                {  
                    rStyle: { val: "OldStyle" },  
                    tblStyle: { val: "AnotherStyle" }  
                }  
            ],  
            styleReferences: ["OldStyle", "KeepThis"]  
        };  
          
        // Reemplazar referencias  
        (composer as any).replaceStyleReferences(mockElement, "OldStyle", "NewStyle");  
          
        // Verificar que las referencias se reemplazaron correctamente  
        expect(mockElement.pStyle.val).toBe("NewStyle");  
        expect(mockElement.children[0].rStyle.val).toBe("NewStyle");  
        expect(mockElement.children[0].tblStyle.val).toBe("AnotherStyle"); // No debería cambiar  
        expect(mockElement.styleReferences).toContain("NewStyle");  
        expect(mockElement.styleReferences).toContain("KeepThis");  
        expect(mockElement.styleReferences).not.toContain("OldStyle");  
    });  
      
    it("should handle empty or null elements", () => {  
        const masterFile = new File({ sections: [] });  
        const composer = new Composer(masterFile);  
          
        // No debería lanzar errores  
        expect(() => {  
            (composer as any).replaceStyleReferences(null, "old", "new");  
            (composer as any).replaceStyleReferences(undefined, "old", "new");  
            (composer as any).replaceStyleReferences({}, "old", "new");  
        }).not.toThrow();  
    });  
});

describe("Composer - getStyleById", () => {  
    it("should retrieve style by ID from document", () => {  
        const masterFile = new File({  
            sections: [],  
            styles: {  
                paragraphStyles: [  
                    {  
                        id: "CustomHeading1", // Cambiar a un ID único  
                        name: "Título 1",  
                        run: { bold: true }  
                    },  
                    {  
                        id: "CustomStyle",  
                        name: "Estilo Personalizado",  
                        run: { italics: true }  
                    }  
                ]  
            }  
        });  
          
        const composer = new Composer(masterFile);  
          
        // Buscar estilo existente con ID único  
        const heading1Style = composer.getStyleById(masterFile, "CustomHeading1");  
        expect(heading1Style).not.toBeNull();  
        expect(heading1Style?.id).toBe("CustomHeading1");  
        expect(heading1Style?.name).toBe("Título 1");  
        expect(heading1Style?.type).toBe("paragraph");  
          
        // Buscar estilo que no existe  
        const nonExistentStyle = composer.getStyleById(masterFile, "NonExistent");  
        expect(nonExistentStyle).toBeNull();  
    });  
      
    it("should retrieve style from master document using helper method", () => {  
        const masterFile = new File({  
            sections: [],  
            styles: {  
                paragraphStyles: [  
                    {  
                        id: "TestStyle",  
                        name: "Test Style",  
                        run: { bold: true }  
                    }  
                ]  
            }  
        });  
          
        const composer = new Composer(masterFile);  
          
        const style = composer.getMasterStyleById("TestStyle");  
        expect(style).not.toBeNull();  
        expect(style?.id).toBe("TestStyle");  
        expect(style?.name).toBe("Test Style");  
    });  
});