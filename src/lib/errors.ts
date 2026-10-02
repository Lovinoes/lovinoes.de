// Same wording as https://github.com/Lovinoes/errors

export type HttpError = { title: string; message: string }

export const httpErrors: Record<number, HttpError> = {
  400: {
    title: "Bad Request",
    message:
      "Your browser sent a request that this server could not understand. Client sent malformed Host header.",
  },
  401: {
    title: "Authorization Required",
    message:
      "This server could not verify that you are authorized to access the document requested. Either you supplied the wrong credentials (e.g., bad password), or your browser doesn't understand how to supply the credentials required.",
  },
  403: {
    title: "Forbidden",
    message: "You do not have permission to access this document.",
  },
  404: {
    title: "Page Not Found",
    message: "This page either doesn't exist, or it moved somewhere else.",
  },
  405: {
    title: "Method Not Allowed",
    message: "The HTTP verb used to access this page is not allowed.",
  },
  406: {
    title: "Not Acceptable",
    message: "Client browser does not accept the MIME type of the requested page.",
  },
  407: {
    title: "Proxy Authentication Required",
    message: "You must be authenticated by a proxy server before the Web server can execute your request.",
  },
  408: {
    title: "Request Timeout",
    message:
      "The Web server closed the connection because the request was not completed within the time it allows. Please try again.",
  },
  412: {
    title: "Precondition Failed",
    message:
      "The request was not completed due to preconditions that are set in the request header. Preconditions prevent the requested method from being applied to a resource other than the one intended.",
  },
  413: {
    title: "Request Entity Too Large",
    message:
      "The Web server is refusing to service the request because the submitted content is larger than the server is configured to accept.",
  },
  414: {
    title: "Request-URI Too Long",
    message: "The Web server is refusing to service the request because the requested URL address is too long.",
  },
  415: {
    title: "Unsupported Media Type",
    message:
      "The Web server cannot service the request because the requested file is in a format that the server is configured not to download.",
  },
  429: {
    title: "Too Many Requests",
    message:
      "You have sent too many requests in a short period of time and have been rate limited. Please wait a moment before trying again.",
  },
  431: {
    title: "Request Header Fields Too Large",
    message:
      "The Web server is refusing to service the request because its headers are too large. Clearing this site's cookies usually resolves it.",
  },
  500: {
    title: "Internal Server Error",
    message:
      "The server encountered an internal error or misconfiguration and was unable to complete your request. Please contact the server administrator to inform of the time the error occurred and of anything you might have done that may have caused the error. More information about this error may be available in the server error log.",
  },
  501: {
    title: "Not Implemented",
    message:
      "The page you are looking for cannot be displayed because a header value in the request does not match certain configuration settings on the Web server.",
  },
  502: {
    title: "Bad Gateway",
    message: "Web server received an invalid response while acting as a gateway or proxy server.",
  },
  503: {
    title: "Service Temporarily Unavailable",
    message:
      "The server is temporarily unable to service your request due to maintenance downtime or capacity problems. Please try again later.",
  },
  504: {
    title: "Gateway Timeout",
    message: "Web server did not receive a timely response from an upstream server while acting as a gateway or proxy server.",
  },
}

export const fallbackError: HttpError = {
  title: "Error",
  message: "The server could not complete your request.",
}

/** The error code nginx put into index.html, if this page load is an error page. */
function readServerStatus(): number | null {
  // nginx's SSI fills this in (see INSTALLATION.md). Without SSI, e.g. in `npm run dev`,
  // the content stays a raw "<!--# ... -->" comment and is ignored.
  const raw = document.querySelector('meta[name="lovinoes-status"]')?.getAttribute("content")?.trim()
  if (!raw || !/^\d{3}$/.test(raw)) return null
  const code = Number(raw)
  return code >= 400 ? code : null
}

/** Set when nginx served this page as an error page, together with the URL it happened on. */
export const serverError = (() => {
  const code = readServerStatus()
  return code ? { code, path: location.pathname } : null
})()
