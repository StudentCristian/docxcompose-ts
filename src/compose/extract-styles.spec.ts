import { describe, it, expect } from "vitest";
import { Composer } from "./composer";

describe("Composer - Extract Styles from DOCX", () => {
    it("should extract styles from real DOCX file", async () => {
        const fs = require('fs');

        // Usar la ruta correcta
        if (!fs.existsSync("docs/test.docx")) {
            console.log("Skipping test - no test.docx file found");
            return;
        }

        const stylesXml = await Composer.extractStylesFromDocx("docs/test.docx");

        if (stylesXml) {
            expect(stylesXml).toContain('w:styles');
            expect(stylesXml).toContain('<?xml');
            console.log("Successfully extracted styles XML");
        } else {
            console.log("No styles found in test file");
        }
    });

it("should create File with external styles", async () => {  
    const fs = require('fs');  
    
    if (!fs.existsSync("docs/test.docx")) {  
        console.log("Skipping test - no test.docx file found");  
        return;  
    }  
    
    const file = await Composer.createFileWithExternalStyles("docs/test.docx");  
    
    expect(file).toBeDefined();  
    expect(file.Styles).toBeDefined();  
    
    // Debug: Ver la estructura de estilos  
    console.log("Styles object:", file.Styles);  
    console.log("Styles root:", (file.Styles as any).root);  
    
    const composer = new Composer(file);  
    const styles = composer.extractStylesFromFile(file);  
    
    console.log(`Loaded ${styles.length} styles from external DOCX`);  
    styles.forEach(style => {  
        console.log(`  ${style.id}: ${style.name} (${style.type})`);  
    });  
});

});