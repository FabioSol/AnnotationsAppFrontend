export async function GET(req: Request) {
  return await handleProxy(req);
}

export async function POST(req: Request) {
  return await handleProxy(req);
}

export async function PUT(req: Request) {
  return await handleProxy(req);
}

export async function DELETE(req: Request) {
  return await handleProxy(req);
}

export async function PATCH(req: Request) {
  return await handleProxy(req);
}

export async function OPTIONS(req: Request) {
  return await handleProxy(req);
}

async function handleProxy(req: Request) {
  const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/${req.url.replace(/.*\/api\//, '')}`;
  console.log(backendUrl);
  const options: RequestInit = {
    method: req.method,
    headers: req.headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.blob() : undefined,
  };

  return await fetch(backendUrl, options);
}


