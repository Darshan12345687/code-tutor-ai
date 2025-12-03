import express from 'express';
import expressWs from 'express-ws';
import { protect } from '../middleware/auth.js';
import { hasPermission } from '../middleware/rbac.js';
import { createTerminalSession } from '../services/sandboxService.js';

const router = express.Router();

// WebSocket upgrade for terminal
expressWs(router);

// Store active terminal sessions
const terminalSessions = new Map();

// @route   POST /api/terminal/create
// @desc    Create a new terminal session
// @access  Private (requires execute_code permission)
router.post('/create',
  protect,
  hasPermission('execute_code'),
  async (req, res) => {
    try {
      const { language } = req.body;
      const session = await createTerminalSession(language || 'python');
      
      terminalSessions.set(session.sessionId, {
        ...session,
        userId: req.user._id.toString(),
        process: null
      });

      res.json(session);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   WS /api/terminal/:sessionId
// @desc    WebSocket connection for interactive terminal
// @access  Private
router.ws('/:sessionId', (ws, req) => {
  const { sessionId } = req.params;
  const session = terminalSessions.get(sessionId);

  if (!session) {
    ws.close(1008, 'Session not found');
    return;
  }

  // Verify user owns the session
  if (session.userId !== req.user?._id?.toString()) {
    ws.close(1008, 'Unauthorized');
    return;
  }

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'input') {
        // Handle terminal input
        if (session.process) {
          session.process.write(data.data);
        }
      } else if (data.type === 'resize') {
        // Handle terminal resize
        if (session.process) {
          session.process.resize(data.cols, data.rows);
        }
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });

  ws.on('close', () => {
    if (session.process) {
      session.process.kill();
    }
    terminalSessions.delete(sessionId);
  });

  // Send initial connection message
  ws.send(JSON.stringify({
    type: 'connected',
    sessionId,
    message: 'Terminal session connected'
  }));
});

// @route   DELETE /api/terminal/:sessionId
// @desc    Close terminal session
// @access  Private
router.delete('/:sessionId',
  protect,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = terminalSessions.get(sessionId);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (session.userId !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (session.process) {
        session.process.kill();
      }

      terminalSessions.delete(sessionId);
      res.json({ message: 'Session closed' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;

