const asyncHandler = require('express-async-handler');
const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { getAIResponse } = require('./geminiService');

const baseTempDir = path.join(__dirname, 'temp_code');
fs.ensureDirSync(baseTempDir);

const languageConfigs = {
    javascript: {
        extension: 'js',
        command: 'node',
        args: (filepath) => [filepath],
        compileCommand: null,
        compileArgs: () => [],
    },
    python: {
        extension: 'py',
        command: 'python',
        args: (filepath) => [filepath],
        compileCommand: null,
        compileArgs: () => [],
    },
    java: {
        extension: 'java',
        command: 'java',
        args: () => ['Main'],
        compileCommand: 'javac',
        compileArgs: (tempSubDirPath) => ['Main.java'],
    },
    cpp: {
        extension: 'cpp',
        command: './a.out',
        args: () => [],
        compileCommand: 'g++',
        compileArgs: (filepath, tempSubDirPath, filenameWithoutExt) => [filepath, '-o', path.join(tempSubDirPath, filenameWithoutExt)],
    },
    c: {
        extension: 'c',
        command: './a.out',
        args: () => [],
        compileCommand: 'gcc',
        compileArgs: (filepath, tempSubDirPath, filenameWithoutExt) => [filepath, '-o', path.join(tempSubDirPath, filenameWithoutExt)],
    },
};

const executeCommand = (command, args, input, options) => {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, options);

        let stdout = '';
        let stderr = '';

        if (input) {
            child.stdin.write(input);
            child.stdin.end();
        }

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        let timeoutId = setTimeout(() => {
            child.kill('SIGTERM');
            reject(new Error('Time Limit Exceeded'));
        }, options.timeout || 5000);

        child.on('close', (code) => {
            clearTimeout(timeoutId);
            if (code !== 0 && stderr) {
                resolve({ stdout, stderr });
            } else if (code !== 0) {
                reject(new Error(`Process exited with code ${code}.`));
            } else {
                resolve({ stdout, stderr });
            }
        });

        child.on('error', (err) => {
            clearTimeout(timeoutId);
            reject(new Error(`Failed to start process or command not found: ${err.message}`));
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
    const uniqueDirName = `run-${Date.now()}`; 
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
    let aiExplanation = '';

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
                        const prompt = `I encountered a compilation error in a ${language} program. Please explain the following error and suggest potential fixes.

                        Code:\n\`\`\`${language}\n${code}\n\`\`\`

                        Compilation Error:\n\`\`\`\n${compilationError}\n\`\`\`

                        Provide concise explanation and actionable steps.`;
                        aiExplanation = await getAIResponse(prompt);
                        return res.status(400).json({ error: compilationError, aiExplanation });
                    }
                }
            } catch (err) {
                console.error('[RunCode] Compilation process failed to start or errored:', err.message);

                const prompt = `I encountered an issue starting the compiler for a ${language} program, or the compilation process itself failed. The error message is: "${err.message}".

                Code:\n\`\`\`${language}\n${code}\n\`\`\`

                Please explain what might be causing this compiler setup/process error and suggest troubleshooting steps.`;
                aiExplanation = await getAIResponse(prompt);

                return res.status(400).json({ error: `Compilation Failed: ${err.message}`, aiExplanation });
            }
        }

        console.log(`[RunCode] Executing ${language} code in ${tempSubDirPath}...`);
        let commandToRun;
        let executionArgs;
        let executionCwd = tempSubDirPath;

        if (language === 'cpp' || language === 'c') {
            commandToRun = path.join(tempSubDirPath, filenameWithoutExt + (process.platform === 'win32' ? '.exe' : ''));
            executionArgs = [];
        } else {
            commandToRun = config.command;
            executionArgs = config.args(filepath);
        }

        const { stdout: runStdout, stderr: runStderr } = await executeCommand(
            commandToRun,
            executionArgs,
            input,
            { timeout: 2000, cwd: executionCwd }
        );

        executionOutput = runStdout.trim();

        if (runStderr) {
            executionOutput = `${executionOutput}\n\nRuntime Warnings/Errors:\n${runStderr.trim()}`;

            if (runStderr.toLowerCase().includes('error:') || runStderr.toLowerCase().includes('exception') || runStderr.toLowerCase().includes('traceback')) {
                const prompt = `I encountered a runtime error/warning in a ${language} program. Please explain the following output and suggest potential fixes.

                Code:\n\`\`\`${language}\n${code}\n\`\`\`

                Input:\n\`\`\`\n${input}\n\`\`\`

                Runtime Output (including errors/warnings):\n\`\`\`\n${runStderr.trim()}\n\`\`\`

                Provide concise explanation and actionable steps.`;
                aiExplanation = await getAIResponse(prompt);
            }
        }

        if (compilationError) {
            executionOutput = `${compilationError}\n\n${executionOutput}`;
        }

        res.status(200).json({ output: executionOutput, aiExplanation });

    } catch (executionError) {
        console.error(`[RunCode] Error during ${language} execution:`, executionError.message);
        let errorToReturn = executionError.message;
        if (compilationError && !errorToReturn.includes("Compilation Failed")) {
            errorToReturn = `${compilationError}\n\n${errorToReturn}`;
        }
        const prompt = `I encountered a runtime error during the execution of a ${language} program. Please explain the following error and suggest potential fixes.

        Code:\n\`\`\`${language}\n${code}\n\`\`\`

        Input:\n\`\`\`\n${input}\n\`\`\`

        Error message:\n\`\`\`\n${executionError.message}\n\`\`\`

        Provide concise explanation and actionable steps.`;
        aiExplanation = await getAIResponse(prompt);

        res.status(500).json({ error: errorToReturn, aiExplanation });
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
    const { code, language, problemId, testCases, userId, submissionId, problemTitle, problemDescription } = req.body; 

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

    if (!testCases || testCases.length === 0) {
        console.warn(`[SubmitCode] No test cases provided for problem ID: ${problemId}.`);
        return res.status(200).json({
            testResults: [],
            message: 'No test cases defined for this problem or provided.',
            verdict: 'No Test Cases',
        });
    }

    const executionTimeLimit = (typeof req.body.timeLimit === 'number' && req.body.timeLimit > 0) ? req.body.timeLimit : 2000;

    const config = languageConfigs[language];
    const uniqueDirName = `${userId}-${Date.now()}`; 
    const tempSubDirPath = path.join(baseTempDir, uniqueDirName);

    try {
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
        let compilationAIExplanation = '';
        let finalCompilerOutput = '';

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
                    const { stderr: compileStderr } = await executeCommand(config.compileCommand, compileArgs, null, { timeout: 3000, cwd: tempSubDirPath });
                    if (compileStderr) {
                        const compilationError = `Compilation Warnings/Diagnostics:\n${compileStderr}`;
                        finalCompilerOutput = compilationError;
                        if (compileStderr.toLowerCase().includes('error:') || compileStderr.toLowerCase().includes('fatal error')) {
                            console.error('[SubmitCode] Compilation failed:', compilationError);

                            const prompt = `I encountered a compilation error in a ${language} program during a code submission. Please explain the following error and suggest potential fixes.

                            Code:\n\`\`\`${language}\n${code}\n\`\`\`

                            Compilation Error:\n\`\`\`\n${compilationError}\n\`\`\`

                            Provide concise explanation and actionable steps.`;
                            compilationAIExplanation = await getAIResponse(prompt);

                            testCases.forEach((_, index) => {
                                testResults.push({
                                    testCase: index + 1,
                                    passed: false,
                                    message: `Compilation Error: ${compilationError}`,
                                    input: 'N/A',
                                    expectedOutput: 'N/A',
                                    userOutput: 'N/A',
                                    aiExplanation: compilationAIExplanation,
                                });
                            });
                            overallVerdict = 'Compilation Error';
                            return res.status(200).json({ testResults, verdict: overallVerdict, compilerOutput: finalCompilerOutput, aiExplanation: compilationAIExplanation, submissionId: submissionId }); // <-- MODIFIED: Return data, not save
                        }
                    }
                } catch (err) {
                    console.error('[SubmitCode] Compilation process failed to start or errored:', err.message);

                    const prompt = `I encountered an issue starting the compiler for a ${language} program, or the compilation process itself failed during a code submission. The error message is: "${err.message}".

                    Code:\n\`\`\`${language}\n${code}\n\`\`\`

                    Please explain what might be causing this compiler setup/process error and suggest troubleshooting steps.`;
                    compilationAIExplanation = await getAIResponse(prompt);

                    testCases.forEach((_, index) => {
                        testResults.push({
                            testCase: index + 1,
                            passed: false,
                            message: `Compilation Failed: ${err.message}`,
                            input: 'N/A',
                            expectedOutput: 'N/A',
                            userOutput: 'N/A',
                            aiExplanation: compilationAIExplanation,
                        });
                    });
                    overallVerdict = 'Compilation Error';
                    return res.status(200).json({ testResults, verdict: overallVerdict, compilerOutput: finalCompilerOutput, aiExplanation: compilationAIExplanation, submissionId: submissionId }); // <-- MODIFIED: Return data, not save
                }
            }

            for (let i = 0; i < testCases.length; i++) {
                const testCase = testCases[i];
                let userOutput = '';
                let message = '';
                let passed = false;
                let aiExplanationForTestCase = '';

                console.log(`[SubmitCode] Executing test case ${i + 1} for ${language} in ${tempSubDirPath}...`);
                let commandToRun;
                let executionArgs;
                let executionCwd = tempSubDirPath;

                if (language === 'cpp' || language === 'c') {
                    commandToRun = path.join(tempSubDirPath, filenameWithoutExt + (process.platform === 'win32' ? '.exe' : ''));
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
                       
                        const prompt = `Your code for a problem called "${problemTitle}" (Description: ${problemDescription}) failed a test case.

                        Problem Description: ${problemDescription}

                        Code:\n\`\`\`${language}\n${code}\n\`\`\`

                        Test Case Input:\n\`\`\`\n${testCase.input}\n\`\`\`

                        Expected Output:\n\`\`\`\n${expected}\n\`\`\`

                        Your Code's Output:\n\`\`\`\n${userOutput}\n\`\`\`

                        The test case failed with a "Wrong Answer". Please explain why the output might be incorrect and suggest common debugging strategies or potential logic errors to look for, specific to this problem and code if possible. Provide actionable advice.`;
                        aiExplanationForTestCase = await getAIResponse(prompt);
                    }

                    if (stderr) {
                        message += `\nRuntime Warnings/Errors:\n${stderr.trim()}`;

                        if ((stderr.toLowerCase().includes('error:') || stderr.toLowerCase().includes('exception') || stderr.toLowerCase().includes('traceback')) && overallVerdict === 'Accepted') {
                            overallVerdict = 'Runtime Error';
                        }

                        if (stderr.toLowerCase().includes('error:') || stderr.toLowerCase().includes('exception') || stderr.toLowerCase().includes('traceback')) {
                            const prompt = `Your ${language} code for a problem called "${problemTitle}" (Description: ${problemDescription}) produced a runtime error/warning during a test case execution.

                            Code:\n\`\`\`${language}\n${code}\n\`\`\`

                            Test Case Input:\n\`\`\`\n${testCase.input}\n\`\`\`

                            Runtime Error/Warnings Output:\n\`\`\`\n${stderr.trim()}\n\`\`\`

                            Please explain this runtime issue and suggest potential fixes. Provide actionable advice.`;
                            aiExplanationForTestCase = await getAIResponse(prompt);
                        }
                    }

                } catch (execErr) {
                    console.error(`[SubmitCode] Test Case ${i + 1} execution failed:`, execErr.message);
                    userOutput = execErr.message;
                    if (execErr.message.includes('Time Limit Exceeded')) {
                        message = 'Time Limit Exceeded';
                        overallVerdict = 'Time Limit Exceeded';

                        const prompt = `Your ${language} code for a problem called "${problemTitle}" (Description: ${problemDescription}) exceeded the time limit (${executionTimeLimit / 1000} seconds) on the following test case.

                        Code:\n\`\`\`${language}\n${code}\n\`\`\`

                        Test Case Input:\n\`\`\`\n${testCase.input}\n\`\`\`

                        Please explain common reasons for Time Limit Exceeded (TLE) in competitive programming for this problem type and suggest optimization strategies (e.g., algorithmic complexity, data structures) to resolve it.`;
                        aiExplanationForTestCase = await getAIResponse(prompt);

                    } else {
                        message = `Runtime Error: ${execErr.message}`;
                        if (overallVerdict !== 'Time Limit Exceeded') {
                            overallVerdict = 'Runtime Error';
                        }

                        const prompt = `Your ${language} code for a problem called "${problemTitle}" (Description: ${problemDescription}) failed with a runtime error during a test case execution. The error message is: "${execErr.message}".

                        Code:\n\`\`\`${language}\n${code}\n\`\`\`

                        Test Case Input:\n\`\`\`\n${testCase.input}\n\`\`\`

                        Please explain this runtime error and suggest potential fixes. Provide actionable advice.`;
                        aiExplanationForTestCase = await getAIResponse(prompt);
                    }
                    passed = false;
                }

                testResults.push({
                    testCase: i + 1,
                    passed: passed,
                    message: message,
                    input: testCase.input,
                    expectedOutput: testCase.expectedOutput,
                    userOutput: userOutput,
                    aiExplanation: aiExplanationForTestCase,
                });

                if (overallVerdict !== 'Accepted') {
                    break;
                }
            }

            let finalOutputForSubmission = '';
            if (overallVerdict !== 'Accepted') {
                const combinedOutput = testResults.map(tr => {
                    let output = `Test Case ${tr.testCase}: ${tr.message}`;
                    if (tr.message !== 'Accepted' && tr.userOutput && tr.userOutput !== 'N/A') {
                        output += `\nUser Output: ${tr.userOutput.substring(0, 200)}${tr.userOutput.length > 200 ? '...' : ''}`;
                    }
                    return output;
                }).join('\n\n');
                finalOutputForSubmission = combinedOutput;
            } else {
                finalOutputForSubmission = 'All test cases passed.';
            }

            let finalAIExplanation = '';
            if (overallVerdict === 'Wrong Answer' && !testResults.some(tr => tr.aiExplanation)) {
                const prompt = `Your submission for problem "${problemTitle}" (Description: ${problemDescription}) resulted in a "${overallVerdict}". Please provide a general explanation of why this verdict might occur for this problem type and suggest general debugging steps.

                Code:\n\`\`\`${language}\n${code}\n\`\`\`

                Test Results:\n\`\`\`\n${JSON.stringify(testResults, null, 2)}\n\`\`\`
                `;
                finalAIExplanation = await getAIResponse(prompt);
            } else if (compilationAIExplanation && overallVerdict === 'Compilation Error') {
                finalAIExplanation = compilationAIExplanation;
            } else if (testResults.some(tr => tr.aiExplanation)) {
        
                finalAIExplanation = testResults.filter(tr => tr.aiExplanation).map(tr => `Test Case ${tr.testCase} explanation:\n${tr.aiExplanation}`).join('\n\n---\n\n');
            }

            res.status(200).json({
                verdict: overallVerdict,
                testResults: testResults,
                compilerOutput: finalCompilerOutput,
                output: finalOutputForSubmission,
                aiExplanation: finalAIExplanation,
                submissionId: submissionId 
            });

        } catch (overallJudgingError) {
            console.error(`[SubmitCode] Error during judging process for submission ID ${submissionId}:`, overallJudgingError.message); // <-- MODIFIED
            let submissionOverallAIExplanation = '';
            const prompt = `An unexpected error occurred during the overall code submission judging process for a ${language} program for problem "${problemTitle}". The error message is: "${overallJudgingError.message}".

            Code:\n\`\`\`${language}\n${code}\n\`\`\`

            Please provide some general troubleshooting steps for an unexpected judging error.`;
            submissionOverallAIExplanation = await getAIResponse(prompt);

            res.status(500).json({
                error: 'An unexpected error occurred during submission judging.',
                verdict: 'Submission Failed',
                aiExplanation: submissionOverallAIExplanation,
                submissionId: submissionId 
            });
        }

    } catch (initialError) {
       
        console.error(`[SubmitCode] Error before initial setup (e.g., directory creation):`, initialError.message); 
        res.status(500).json({
            message: 'Server error during submission setup.',
            error: initialError.message,
            submissionId: submissionId 
        });
    } finally {
        try {
            if (tempSubDirPath) {
                await fs.remove(tempSubDirPath);
                console.log(`[SubmitCode] Cleaned up directory: ${tempSubDirPath}`);
            }
        } catch (cleanupError) {
            console.error(`[SubmitCode] Error during cleanup for directory ${tempSubDirPath}:`, cleanupError);
        }
    }
});

module.exports = {
    runCode,
    submitCode,
};