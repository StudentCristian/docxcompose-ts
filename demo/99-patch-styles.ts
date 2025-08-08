import * as fs from "fs";
import { Paragraph, HeadingLevel, TextRun, patchDocument, PatchType, patchDetector } from "docx";

async function detectPlaceholders() {
    const placeholders = await patchDetector({ data: fs.readFileSync("docs/heading_lang_es.docx") });
    console.log("Placeholders encontrados:", placeholders);
}

async function testStyleMapping() {
    // Detectar y mostrar placeholders antes de aplicar los patches
    await detectPlaceholders();

    const result = await patchDocument({
        outputType: "nodebuffer",
        data: fs.readFileSync("docs/heading_lang_es.docx"),
        patches: {
            test_title: {
                type: PatchType.PARAGRAPH,
                children: [new TextRun("Título Mapeado")],
            },
            test_heading: {
                type: PatchType.DOCUMENT,
                children: [
                    new Paragraph({
                        text: "Encabezado Nivel 1",
                        heading: HeadingLevel.HEADING_1,
                    }),
                ],
            },
        },
    });

    if (!fs.existsSync("output")) {
        fs.mkdirSync("output");
    }

    fs.writeFileSync("output/style-mapping.docx", result);
    console.log("Prueba de mapeo de estilos completada");
}

testStyleMapping().catch(console.error);