const asyncHandler = require('express-async-handler');
const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const tempDir = path.join(__dirname, 'temp_code');

fs.ensureDirSync(tempDir);

const runCode = asyncHandler(async (req, res) => {
    const { code, language = 'javascript' } = req.body;

    if (!code) {
        res.status(400);
        throw new Error('No code provided for compilation.');
    }

    if (language.toLowerCase() !== 'javascript') {
        res.status(400);
        throw new Error('Currently only JavaScript is supported for execution.');
    }

    const filename = `${req.user._id}-${Date.now()}.js`;
    const filepath = path.join(tempDir, filename);

    try {
        await fs.writeFile(filepath, code);
        const executionResult = await new Promise((resolve, reject) => {
            exec(`node ${filepath}`, { timeout: 5000, killSignal: 'SIGTERM' }, (error, stdout, stderr) => {
                if (error) {
                    let errorMessage = stderr || error.message;
                    if (error.signal === 'SIGTERM') {
                        errorMessage = 'Execution timed out (5 seconds limit). Your code might be in an infinite loop or too slow.';
                    }
                    reject(errorMessage);
                } else {
                    resolve(stdout);
                }
            });
        });
        res.status(200).json({ output: executionResult.trim() });

    } catch (executionError) {
        res.status(500).json({ error: executionError.toString() });
    } finally {
        try {
            await fs.remove(filepath);
        } catch (cleanupError) {
            console.error(`Error deleting temp file ${filepath}:`, cleanupError);
        }
    }
});

module.exports = { runCode };