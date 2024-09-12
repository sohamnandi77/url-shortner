export const DOMAIN_REGEX = new RegExp(
  /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
);

export const KEY_REGEX = new RegExp(
  /^[0-9A-Za-z_\u0080-\uFFFF\/\-\p{Emoji}]*$/u,
);

export const SLUG_REGEX = new RegExp(/^[a-zA-Z0-9\-]+$/);
