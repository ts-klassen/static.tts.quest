export const onRequest: PagesFunction = async ({ next }) => {
  const response = await next();
  response.headers.set('content-type', 'text/html; charset=UTF-8');
  return response;
};
