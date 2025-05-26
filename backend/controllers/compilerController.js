const asyncHandler = require('express-async-handler');
const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const Problem = require('../models/Problem'); 
const baseTempDir = path.join(__dirname, 'temp_code');
fs.ensureDirSync(baseTempDir); 

const languageConfigs = {
    javascript: {
        extension: 'js',
        command: 'node',
        args: (filepath) => [filepath],
        compileCommand: null,
        compileArgs: null,
        needsSubdirectory: false,
    },
    python: {
        extension: 'py',
        command: 'python',
        args: (filepath) => [filepath],
        compileCommand: null,
        compileArgs: null,
        needsSubdirectory: false,
    },
    java: {
        extension: 'java',
        compileCommand: 'javac',
        compileArgs: (tempSubDirPath) => ['Main.java'],
        command: 'java',
        args: () => ['Main'],
        needsSubdirectory: true,
    },
    cpp: {
        extension: 'cpp',
        compileCommand: 'g++',
        compileArgs: (filepath, tempSubDirPath, filenameWithoutExt) => [
            filepath,
            '-o',
            path.join(tempSubDirPath, filenameWithoutExt + '.exe'),
            '-std=c++17',
            '-O2',
            '-Wall',
            '-Wextra',
        ],
        command: null, 
        needsSubdirectory: false,
    },
    c: {
        extension: 'c',
        compileCommand: 'gcc',
        compileArgs: (filepath, tempSubDirPath, filenameWithoutExt) => [
            filepath,
            '-o',
            path.join(tempSubDirPath, filenameWithoutExt + '.exe'),
            '-std=c11',
            '-O2',
            '-Wall',
            '-Wextra',
        ],
        command: null,
        args: null,
        needsSubdirectory: false,
    },
};

const executeCommand = (command, args, input, options = {}) => {
    return new Promise((resolve, reject) => {
        console.log(`[EXECUTE_CMD] Spawning: ${command} ${args.join(' ')}`);
        const proc = spawn(command, args, { ...options, shell: true });
        let stdout = '';
        let stderr = '';
        let timeoutId;

        if (options.timeout) {
            timeoutId = setTimeout(() => {
                proc.kill('SIGTERM');
                reject(new Error(`Execution timed out after ${options.timeout / 1000} seconds. (Time Limit Exceeded)`));
            }, options.timeout);
        }

        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        if (input !== null && input !== undefined) { 
            proc.stdin.write(input);
        }
        proc.stdin.end();

        proc.on('close', (code) => {
            if (timeoutId) clearTimeout(timeoutId);
            console.log(`[EXECUTE_CMD] Process closed with code: ${code}`); 
            console.log(`[EXECUTE_CMD] stdout: '${stdout.trim()}'`);
            console.log(`[EXECUTE_CMD] stderr: '${stderr.trim()}'`);
            if (code === 0) {
                resolve({ stdout, stderr: stderr.trim() });
            } else {
                reject(new Error(stderr.trim() || `Process exited with code ${code}`));
            }
        });

        proc.on('error', (err) => {
            if (timeoutId) clearTimeout(timeoutId);
            console.error(`[EXECUTE_CMD] Process spawn error:`, err.message);
            if (err.code === 'ENOENT') {
                reject(new Error(`Command not found: '${command}'. Please ensure the compiler/interpreter is installed and in your PATH.`));
            } else {
                reject(new Error(`Failed to start process: ${err.message}`));
            }
        });
    });
};

const runCode = asyncHandler(async (req, res) => {
    const { code, language, input = '' } = req.body;

    if (!code) {
        res.status(400);
        throw new Error('No code provided for execution.');
    }
    if (!language || !languageConfigs[language]) {
        res.status(400);
        throw new Error('Unsupported language selected.');
    }

    const config = languageConfigs[language];
    const uniqueDirName = `${req.user._id}-${Date.now()}`;
    const tempSubDirPath = path.join(baseTempDir, uniqueDirName);

    await fs.ensureDir(tempSubDirPath);

    let filename;
    let filepath;
    let filenameWithoutExt = `${uniqueDirName}`;

    if (language === 'java') {
        filename = 'Main.java';
        filepath = path.join(tempSubDirPath, filename);
    } else {
        filename = `${filenameWithoutExt}.${config.extension}`;
        filepath = path.join(tempSubDirPath, filename);
    }

    let compilationError = '';
    let executionOutput = '';

    try {
        await fs.writeFile(filepath, code);
        if (config.compileCommand) {
            console.log(`[RunCode] Compiling ${language} code in ${tempSubDirPath}...`);
            let compileArgs;
            if (language === 'java') {
                compileArgs = config.compileArgs(tempSubDirPath);
            } else {
                compileArgs = config.compileArgs(filepath, tempSubDirPath, filenameWithoutExt);
            }

            try {
                const { stderr: compileStderr } = await executeCommand(config.compileCommand, compileArgs, null, { timeout: 10000, cwd: tempSubDirPath });
                if (compileStderr) {
                    compilationError = `Compilation Warnings/Diagnostics:\n${compileStderr}`;
                    if (compileStderr.toLowerCase().includes('error:') || compileStderr.toLowerCase().includes('fatal error')) {
                        console.error('[RunCode] Compilation failed:', compilationError);
                        return res.status(400).json({ error: compilationError });
                    }
                }
            } catch (err) {
                console.error('[RunCode] Compilation process failed to start or errored:', err.message);
                return res.status(400).json({ error: `Compilation Failed: ${err.message}` });
            }
        }

        console.log(`[RunCode] Executing ${language} code in ${tempSubDirPath}...`);
        let commandToRun;
        let executionArgs;
        let executionCwd = tempSubDirPath;

        if (language === 'cpp' || language === 'c') {
            commandToRun = path.join(tempSubDirPath, filenameWithoutExt + '.exe');
            executionArgs = [];
        } else {
            commandToRun = config.command;
            executionArgs = config.args(filepath);
        }

        const { stdout: runStdout, stderr: runStderr } = await executeCommand(
            commandToRun,
            executionArgs,
            input,
            { timeout: 5000, cwd: executionCwd }
        );

        executionOutput = runStdout.trim();

        if (runStderr) {
            executionOutput = `${executionOutput}\n\nRuntime Warnings/Errors:\n${runStderr.trim()}`;
        }

        if (compilationError) {
            executionOutput = `${compilationError}\n\n${executionOutput}`;
        }

        res.status(200).json({ output: executionOutput });

    } catch (executionError) {
        console.error(`[RunCode] Error during ${language} execution:`, executionError.message);
        let errorToReturn = executionError.message;
        if (compilationError && !errorToReturn.includes("Compilation Failed")) {
            errorToReturn = `${compilationError}\n\n${errorToReturn}`;
        }
        res.status(500).json({ error: errorToReturn });
    } finally {
        try {
            await fs.remove(tempSubDirPath);
            console.log(`[RunCode] Cleaned up directory: ${tempSubDirPath}`);
        } catch (cleanupError) {
            console.error(`[RunCode] Error during cleanup for directory ${tempSubDirPath}:`, cleanupError);
        }
    }
});

const submitCode = asyncHandler(async (req, res) => {
    const { code, language, problemId } = req.body;

    if (!code) {
        res.status(400);
        throw new Error('No code provided for submission.');
    }
    if (!language || !languageConfigs[language]) {
        res.status(400);
        throw new Error('Unsupported language selected.');
    }
    if (!problemId) {
        res.status(400);
        throw new Error('Problem ID is required for submission.');
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
        res.status(404);
        throw new Error('Problem not found.');
    }

    const testCases = problem.testCases || [];
    if (testCases.length === 0) {
        console.warn(`[SubmitCode] No test cases defined for problem ID: ${problemId}`);
        res.status(200).json({ testResults: [], message: 'No test cases defined for this problem yet.', verdict: 'No Test Cases' });
        return;
    }

    const executionTimeLimit = (typeof problem.timeLimit === 'number' && problem.timeLimit > 0) ? problem.timeLimit : 2000;

    const config = languageConfigs[language];
    const uniqueDirName = `${req.user._id}-${Date.now()}`;
    const tempSubDirPath = path.join(baseTempDir, uniqueDirName);

    await fs.ensureDir(tempSubDirPath);

    let filename;
    let filepath;
    let filenameWithoutExt = `${uniqueDirName}`;

    if (language === 'java') {
        filename = 'Main.java';
        filepath = path.join(tempSubDirPath, filename);
    } else {
        filename = `${filenameWithoutExt}.${config.extension}`;
        filepath = path.join(tempSubDirPath, filename);
    }

    const testResults = [];
    let overallVerdict = 'Accepted';

    try {
        await fs.writeFile(filepath, code);
        console.log(`[SubmitCode] Code written to: ${filepath}`);

        if (config.compileCommand) {
            console.log(`[SubmitCode] Compiling ${language} code in ${tempSubDirPath}...`);
            let compileArgs;
            if (language === 'java') {
                compileArgs = config.compileArgs(tempSubDirPath);
            } else {
                compileArgs = config.compileArgs(filepath, tempSubDirPath, filenameWithoutExt);
            }

            try {
                const { stderr: compileStderr } = await executeCommand(config.compileCommand, compileArgs, null, { timeout: 10000, cwd: tempSubDirPath });
                if (compileStderr) {
                    const compilationError = `Compilation Warnings/Diagnostics:\n${compileStderr}`;
                    if (compileStderr.toLowerCase().includes('error:') || compileStderr.toLowerCase().includes('fatal error')) {
                        console.error('[SubmitCode] Compilation failed:', compilationError);
                        testCases.forEach((_, index) => {
                            testResults.push({
                                testCaseId: index + 1,
                                passed: false,
                                message: `Compilation Error: ${compilationError}`,
                                expectedOutput: 'N/A',
                                userOutput: 'N/A',
                            });
                        });
                        return res.status(200).json({ testResults, verdict: 'Compilation Error' }); 
                    }
                }
            } catch (err) {
                console.error('[SubmitCode] Compilation process failed to start or errored:', err.message);
                testCases.forEach((_, index) => {
                    testResults.push({
                        testCaseId: index + 1,
                        passed: false,
                        message: `Compilation Failed: ${err.message}`,
                        expectedOutput: 'N/A',
                        userOutput: 'N/A',
                    });
                });
                return res.status(200).json({ testResults, verdict: 'Compilation Error' }); 
            }
        }

        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            let userOutput = '';
            let message = '';
            let passed = false;

            console.log(`[SubmitCode] Executing test case ${i + 1} for ${language} in ${tempSubDirPath}...`);
            let commandToRun;
            let executionArgs;
            let executionCwd = tempSubDirPath;

            if (language === 'cpp' || language === 'c') {
                commandToRun = path.join(tempSubDirPath, filenameWithoutExt + '.exe');
                executionArgs = []; 
            } else {
                commandToRun = config.command;
                executionArgs = config.args(filepath);
            }

            try {
                const { stdout, stderr } = await executeCommand(
                    commandToRun,
                    executionArgs,
                    testCase.input, 
                    { timeout: executionTimeLimit, cwd: executionCwd }
                );

                userOutput = stdout.trim();
                const expected = testCase.expectedOutput.trim();

                if (userOutput === expected) {
                    passed = true;
                    message = 'Accepted';
                } else {
                    passed = false;
                    message = 'Wrong Answer';
                    if (overallVerdict === 'Accepted') {
                        overallVerdict = 'Wrong Answer';
                    }
                }

                if (stderr) {
                    message += `\nRuntime Warnings/Errors:\n${stderr.trim()}`;
                    if (stderr.toLowerCase().includes('error:') && overallVerdict === 'Accepted') {
                        overallVerdict = 'Runtime Error';
                    }
                }

            } catch (execErr) {
                console.error(`[SubmitCode] Test Case ${i + 1} execution failed:`, execErr.message);
                userOutput = execErr.message;
                if (execErr.message.includes('Time Limit Exceeded')) {
                    message = 'Time Limit Exceeded';
                    overallVerdict = 'Time Limit Exceeded';
                } else {
                    message = `Runtime Error: ${execErr.message}`;
                    if (overallVerdict !== 'Time Limit Exceeded') {
                        overallVerdict = 'Runtime Error';
                    }
                }
                passed = false;
            }

            testResults.push({
                testCaseId: i + 1,
                passed: passed,
                message: message,
                expectedOutput: testCase.expectedOutput,
                userOutput: userOutput,
            });

            if (overallVerdict === 'Compilation Error' || overallVerdict === 'Time Limit Exceeded' || overallVerdict === 'Runtime Error') {
                break;
            }
        }

        res.status(200).json({ testResults, verdict: overallVerdict });

    } catch (overallError) {
        console.error(`[SubmitCode] Overall error during submission process:`, overallError.message);
        res.status(500).json({ error: 'An unexpected error occurred during submission.', verdict: 'Internal Error' });
    } finally {
        try {
            await fs.remove(tempSubDirPath);
            console.log(`[SubmitCode] Cleaned up directory: ${tempSubDirPath}`);
        } catch (cleanupError) {
            console.error(`[SubmitCode] Error during cleanup for directory ${tempSubDirPath}:`, cleanupError);
        }
    }
});

module.exports = { runCode, submitCode };