export const getAIResponse = async (prompt) => {
  try {
    const response = await fetch('http://localhost:5000/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    return data.reply; 
  } catch (error) {
    console.error("Frontend error calling AI:", error.message);
    throw new Error("Failed to get AI response from server.");
  }
};
