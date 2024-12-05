const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.use(express.json());

app.post('/get-gpt-response', async (req, res) => {
  const userInput = req.body.userInput;

  try {
    const response = await axios.post('https://api.openai.com/v1/completions', {
      model: 'asst_xNSrXJ1z84W4Vc6Ipq3rZnY5',
      prompt: `Banco Sabadell Asistente: ${userInput}`,
      max_tokens: 150,
      temperature: 0.7,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer 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`, // Reemplaza con tu clave de API
      }
    });

    const gptResponse = response.data.choices[0]?.text.trim() || "Lo siento, no pude generar una respuesta.";
    res.json({ message: gptResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Hubo un error al procesar tu solicitud." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
