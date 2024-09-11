import punycodeHelper from "punycode/";

export const punycode = (str?: string | null) => {
  if (typeof str !== "string") return "";
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return punycodeHelper.toUnicode(str);
  } catch {
    return str;
  }
};

export const punyEncode = (str?: string | null) => {
  if (typeof str !== "string") return "";
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  return punycodeHelper.toASCII(str);
};
