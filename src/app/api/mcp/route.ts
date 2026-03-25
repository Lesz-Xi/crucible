import { randomUUID } from "node:crypto";

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { NextRequest, NextResponse } from "next/server";

import { createUserScopedSupabaseClient, extractJwt } from "@/lib/mcp/auth";
import { createCrucibleMcpServer, getCrucibleMcpManifest } from "@/lib/mcp/server";

export const runtime = "nodejs";

type SessionContext = {
  jwt: string;
  transport: WebStandardStreamableHTTPServerTransport;
  server: ReturnType<typeof createCrucibleMcpServer>;
};

const sessions = new Map<string, SessionContext>();

async function authenticateRequest(request: NextRequest) {
  const jwt = extractJwt(request.headers.get("authorization"));

  if (!jwt) {
    return {
      jwt: null,
      supabase: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const supabase = createUserScopedSupabaseClient(jwt);
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      jwt: null,
      supabase: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    jwt,
    supabase,
    response: null,
  };
}

function getSessionContext(sessionId: string | null, jwt: string): SessionContext | null {
  if (!sessionId) {
    return null;
  }

  const session = sessions.get(sessionId);
  if (!session || session.jwt !== jwt) {
    return null;
  }

  return session;
}

async function getParsedBody(request: NextRequest): Promise<unknown | undefined> {
  if (request.method !== "POST") {
    return undefined;
  }

  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

async function handleMcp(request: NextRequest): Promise<Response> {
  const auth = await authenticateRequest(request);
  if (auth.response) {
    return auth.response;
  }

  const { jwt, supabase } = auth;
  const sessionId = request.headers.get("mcp-session-id");

  if (request.method === "GET" && !sessionId) {
    return NextResponse.json(getCrucibleMcpManifest());
  }

  const existingSession = getSessionContext(sessionId, jwt!);
  const parsedBody = await getParsedBody(request);

  if (existingSession) {
    return existingSession.transport.handleRequest(request, { parsedBody });
  }

  if (request.method !== "POST" || !parsedBody || !isInitializeRequest(parsedBody)) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: No valid session ID provided",
        },
        id: null,
      },
      { status: 400 }
    );
  }

  const server = createCrucibleMcpServer(supabase!);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (newSessionId) => {
      sessions.set(newSessionId, {
        jwt: jwt!,
        transport,
        server,
      });
    },
    onsessionclosed: (closedSessionId) => {
      sessions.delete(closedSessionId);
    },
  });

  transport.onclose = () => {
    if (transport.sessionId) {
      sessions.delete(transport.sessionId);
    }

    void server.close().catch(() => undefined);
  };

  await server.connect(transport);
  return transport.handleRequest(request, { parsedBody });
}

export async function GET(request: NextRequest): Promise<Response> {
  return handleMcp(request);
}

export async function POST(request: NextRequest): Promise<Response> {
  return handleMcp(request);
}

export async function DELETE(request: NextRequest): Promise<Response> {
  return handleMcp(request);
}
