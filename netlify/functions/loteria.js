exports.handler = async (event) => {
  const apiPath = event.path.replace('/api/loteria', '') || '/';
  const qs = event.rawQuery ? `?${event.rawQuery}` : '';
  const url = `https://servicebus2.caixa.gov.br/portaldeloterias/api${apiPath}${qs}`;

  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://loterias.caixa.gov.br/',
        'Origin': 'https://loterias.caixa.gov.br',
      },
    });

    const body = await res.text();

    return {
      statusCode: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body,
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
