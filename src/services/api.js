const API_BASE_URL = "http://127.0.0.1:8000";

export const analyzeDocument = async (content) => {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input_type: "text",
      content,
    }),
  });

  if (!response.ok) {
    throw new Error(`Analysis failed with status: ${response.status}`);
  }

  return await response.json();
};

export const sendChatMessage = async (message, history = []) => {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, history }),
  });

  if (!response.ok) {
    throw new Error(`Chat failed with status: ${response.status}`);
  }

  return await response.json();
};

export const fetchHistory = async () => {
  const response = await fetch(`${API_BASE_URL}/history`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch history with status: ${response.status}`);
  }

  return await response.json();
};
