export const getSearchParams = (url: string) => {
  // Create a params object
  const params = {} as Record<string, string>;

  new URL(url).searchParams.forEach(function (val, key) {
    params[key] = val;
  });

  return params;
};

export const getSearchParamsWithArray = (url: string) => {
  const params = {} as Record<string, string | string[]>;

  new URL(url).searchParams.forEach((val, key) => {
    if (val) {
      if (key in params) {
        const param = params[key];
        if (Array.isArray(param)) {
          param.push(val);
        } else {
          params[key] = [param!, val];
        }
      } else {
        params[key] = val;
      }
    }
  });

  return params;
};
