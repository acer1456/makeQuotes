export const photoUrl = (url: string) => url.startsWith('/photos/') ? `${import.meta.env.BASE_URL}${url.slice(1)}` : url;
