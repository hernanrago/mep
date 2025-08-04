const username = "hernanrago@msn.com";
const password = "Cendra.2025";

async function getToken() {
  const url = "https://api.invertironline.com/token";

  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);
  formData.append("grant_type", "password");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error("Failed to authenticate: " + response.statusText);
  }

  const data = await response.json();
  return data.access_token;
}

async function fetchQuote(token, ticker) {
  const url = `https://api.invertironline.com/api/v2/bCBA/Titulos/${ticker}/CotizacionDetalle`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${ticker}: ${response.statusText}`);
  }
  return await response.json();
}

function applyFees(value, commission = 0, market = 0, operation = "add") {
  const totalFee = value * (commission + market) / 100;
  return operation === "add" ? value + totalFee : value - totalFee;
}

async function calculateMEP() {
  const resultDiv = document.getElementById("result");
  resultDiv.textContent = "Authenticating...";

  try {
    const token = await getToken();
    resultDiv.textContent = "Fetching quotes...";

    const [al30d, al30] = await Promise.all([
      fetchQuote(token, "al30d"),
      fetchQuote(token, "al30")
    ]);

    const al30dSell = al30d.puntas[0].precioVenta;
    const al30Buy = al30.puntas[0].precioCompra;

    const al30dFinal = applyFees(al30dSell, 0.49, 0.01, "add");
    const al30Final = applyFees(al30Buy, 0, 0.01, "subtract");

    const mep = al30Final / al30dFinal;

    resultDiv.innerHTML = `
      <strong>AL30D sell (with fees):</strong> ${al30dFinal.toFixed(2)}<br>
      <strong>AL30 buy (with fee):</strong> ${al30Final.toFixed(2)}<br>
      <strong>MEP rate:</strong> ${mep.toFixed(4)}<br>
      <strong>MEP x 100:</strong> ${(mep * 100).toFixed(2)}
    `;
  } catch (error) {
    resultDiv.textContent = `Error: ${error.message}`;
  }
}
