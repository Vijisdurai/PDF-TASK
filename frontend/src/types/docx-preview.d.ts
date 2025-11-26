declare module 'docx-preview' {
    export interface DocxPreviewOptions {
        className?: string;
        inWrapper?: boolean;
        ignoreWidth?: boolean;
        ignoreHeight?: boolean;
        ignoreFonts?: boolean;
        breakPages?: boolean;
        ignoreLastRenderedPageBreak?: boolean;
        experimental?: boolean;
        trimXmlDeclaration?: boolean;
        useBase64URL?: boolean;
        renderChanges?: boolean;
        debug?: boolean;
    }

    export function renderAsync(
        data: Blob | ArrayBuffer | Uint8Array,
        bodyContainer: HTMLElement,
        styleContainer?: HTMLElement,
        options?: DocxPreviewOptions
    ): Promise<any>;
}
