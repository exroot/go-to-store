export const toBase64 = (text) => {
  const encoded = Buffer.from(text, "utf8").toString("base64");
  return encoded;
};

export const fromBase64 = (text) => {
  const decoded = Buffer.from(text, "base64").toString("utf8");
  return decoded;
};
