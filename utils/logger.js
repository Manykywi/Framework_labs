function formatLog(data) {
  const parts = [];

  parts.push(`time="${new Date().toISOString()}"`);

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      const escapedValue = String(value).replace(/"/g, '\\"');
      parts.push(`${key}="${escapedValue}"`);
    }
  }

  return parts.join(" ");
}

function log(level, data) {
  const formatted = formatLog({ level, ...data });

  if (level === "ERROR") {
    console.error(formatted);
  } else {
    console.log(formatted);
  }
}

function logRequest(req, statusCode) {
  log("INFO", {
    method: req.method,
    url: req.url,
    status: statusCode
  });
}

function logInfo(message) {
  log("INFO", { message });
}

function logError(message) {
  log("ERROR", { message });
}

function logWarn(message) {
  log("WARN", { message });
}

module.exports = {
  logRequest,
  logInfo,
  logError,
  logWarn
};