export const getDataUri = (file) => {
    const base64 = file.buffer.toString("base64");
    const mimeType = file.mimetype;

    return `data:${mimeType};base64,${base64}`;
};

export default getDataUri;
