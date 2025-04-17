export const decodeJWT = (token) => {
  const payloadBase64Url = token.split(".")[1];
  const payloadBase64 = payloadBase64Url.replace(/-/g, "+").replace(/_/g, "/");

  // Decode base64 string
  const payloadJson = decodeURIComponent(
    atob(payloadBase64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );

  return JSON.parse(payloadJson);
};

export const checkTokenValidity = (token) => {
  const decoded = decodeJWT(token);
  const currentTime = Math.floor(Date.now() / 1000);

  if (decoded.exp > currentTime) {
    return true;
  } else {
    return false;
  }
};
