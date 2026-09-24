const { getAIResponse } = require('../services/ai.service');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Process AI Chat Prompt
// @route   POST /api/ai/chat
// @access  Private
const processAIChat = async (req, res) => {
  try {
    const { prompt, message } = req.body;
    const textPrompt = prompt || message || 'Hello';

    const userRole = req.user ? req.user.role : 'DRIVER';
    const reply = await getAIResponse(textPrompt, userRole);

    return successResponse(res, 200, 'AI response generated', {
      prompt: textPrompt,
      reply,
      response: reply,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = { processAIChat };
