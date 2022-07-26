type SessionQueryOptions = {
  apiKey: string;
  orgId: string;
  sessionId: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
};

type SessionQueryResponse = Record<string, unknown>;

export async function sessionQuery(
  options: SessionQueryOptions,
): Promise<SessionQueryResponse> {
  const requestBody: Record<string, string> = {
    output_format: "JSON",
    org_id: options.orgId,
    api_key: options.apiKey,
    session_id: options.sessionId,
    service_type: "All",
    event_type: "LOGIN",
    account_email: options.user.email,
    account_first_name: options.user.firstName,
    account_last_name: options.user.lastName,
  };

  const resp = await fetch(
    "https://h-api.online-metrix.net/api/session-query",
    {
      method: "POST",
      headers: {},
      body: new URLSearchParams(requestBody).toString(),
    },
  );

  const responseBody = await resp.text();

  if (!resp.ok) {
    console.log("%d %s", resp.status, responseBody);
    throw new Error(`${resp.status} ${responseBody}`);
  }

  const result = JSON.parse(responseBody);
  console.log("%d %o", resp.status, result);

  return result;
}
